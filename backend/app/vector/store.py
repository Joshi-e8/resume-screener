from __future__ import annotations

from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from loguru import logger
from uuid import uuid4

try:
    from qdrant_client import QdrantClient as _QdrantClient
    from qdrant_client.http import models as qmodels
except Exception:  # pragma: no cover - optional dependency until installed
    _QdrantClient = None  # type: ignore
    qmodels = None  # type: ignore

from app.core.config import settings
from app.vector.embeddings import embed_texts


DEFAULT_COLLECTION = getattr(settings, "QDRANT_COLLECTION", "resume_chunks")
DEFAULT_PATH = getattr(settings, "QDRANT_PATH", "qdrant_db")
DEFAULT_URL = getattr(settings, "QDRANT_URL", None)
DEFAULT_API_KEY = getattr(settings, "QDRANT_API_KEY", None)
EMBED_DIM = int(getattr(settings, "EMBEDDING_DIM", 1536) or 1536)


# Runtime mode tracking for logging
_MODE: Optional[str] = None  # 'remote' | 'embedded' | None
_MODE_LOGGED = False

def get_mode() -> str:
    return _MODE or "unknown"


@dataclass
class Chunk:
    text: str
    section: str
    chunk_index: int


def _client():
    global _MODE
    if _QdrantClient is None:
        logger.warning("[vector] Qdrant client not installed; skipping vector ops")
        return None
    try:
        if DEFAULT_URL:
            _MODE = "remote"
            logger.info(f"[vector] Using remote Qdrant url={DEFAULT_URL}")
            client = _QdrantClient(url=DEFAULT_URL, api_key=DEFAULT_API_KEY)
        else:
            _MODE = "embedded"
            logger.info(f"[vector] Using embedded Qdrant path={DEFAULT_PATH}")
            client = _QdrantClient(path=DEFAULT_PATH)
        return client
    except Exception as e:  # pragma: no cover
        logger.warning(f"[vector] Qdrant init failed: {e}")
        return None


def ensure_collection(client, collection: str = DEFAULT_COLLECTION, dim: int = EMBED_DIM) -> None:
    exists = False
    try:
        client.get_collection(collection_name=collection)
        exists = True
        logger.info(f"[vector] Collection exists: {collection}")
    except Exception:
        logger.info(f"[vector] Creating collection: {collection} size={dim}")
        client.recreate_collection(
            collection_name=collection,
            vectors_config=qmodels.VectorParams(size=dim, distance=qmodels.Distance.COSINE),
        )
    # Ensure full-text index on payload 'text' for text-mode retrieval
    try:
        client.create_payload_index(
            collection_name=collection,
            field_name="text",
            field_schema=qmodels.PayloadSchemaType.TEXT,
        )
        logger.info("[vector] Ensured full-text index on payload field 'text'")
    except Exception:
        # Index may already exist; ignore
        pass


def upsert_resume_chunks(
    resume_key: str,
    chunks: List[Chunk],
    user_id: Optional[str] = None,
    collection: str = DEFAULT_COLLECTION,
) -> int:
    client = _client()
    if client is None or qmodels is None:
        return 0
    ensure_collection(client, collection)
    texts = [c.text for c in chunks]
    vectors = embed_texts(texts)
    if not vectors:
        # Fallback: upsert with dummy zero vectors so we can use text-mode search via payload
        logger.warning("[vector] Embeddings unavailable; upserting chunks with zero vectors for text-mode search")
        vectors = [[0.0] * EMBED_DIM for _ in texts]
    points = []
    for vec, ch in zip(vectors, chunks):
        points.append(
            qmodels.PointStruct(
                id=str(uuid4()),
                vector=vec,
                payload={
                    "resume_key": resume_key,
                    "chunk_index": ch.chunk_index,
                    "section": ch.section,
                    "text": ch.text,
                    "user_id": user_id,
                },
            )
        )
    client.upsert(collection_name=collection, points=points)
    return len(points)


def search_resume_chunks(
    resume_key: str,
    query_text: str,
    top_k: int = 6,
    collection: str = DEFAULT_COLLECTION,
) -> List[Dict[str, Any]]:
    client = _client()
    if client is None or qmodels is None:
        return []
    ensure_collection(client, collection)

    # Try vector search first
    qvecs = embed_texts([query_text])
    res = None
    if qvecs:
        qvec = qvecs[0]
        try:
            res = client.search(
                collection_name=collection,
                query_vector=qvec,
                limit=top_k,
                query_filter=qmodels.Filter(must=[qmodels.FieldCondition(key="resume_key", match=qmodels.MatchValue(value=resume_key))]),
            )
        except Exception as e:
            logger.warning(f"Qdrant vector search failed: {e}")
            res = None

    # Fallback: text filter search without embeddings (BM25-like scoring via full-text index)
    if res is None:
        try:
            # Qdrant supports text index + 'search' with query vector. For pure text, we simulate via filter + payload full-text match
            # Use recommend as a workaround: filter by resume_key and set a text condition
            res = client.scroll(
                collection_name=collection,
                scroll_filter=qmodels.Filter(must=[
                    qmodels.FieldCondition(key="resume_key", match=qmodels.MatchValue(value=resume_key)),
                    qmodels.FieldCondition(key="text", match=qmodels.MatchText(text=query_text)),
                ]),
                limit=top_k,
            )
            # scroll returns (points, next_page_offset). Normalize to points list
            if isinstance(res, tuple):
                res = res[0]
        except Exception as e:
            logger.warning(f"Qdrant text-mode search failed: {e}")
            return []

    out: List[Dict[str, Any]] = []
    for pt in res:
        out.append({
            "chunk_index": pt.payload.get("chunk_index"),
            "section": pt.payload.get("section"),
            "score": float(getattr(pt, "score", 0.0) or 0.0),
            "text": pt.payload.get("text") or "",
            "id": pt.id,
        })
    return out

