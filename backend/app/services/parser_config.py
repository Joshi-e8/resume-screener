"""
Runtime configuration providers for parser components with TTL caching.
No hardcoded skills/sections; loads from configured sources and caches.
Degrades gracefully to empty sets and logs warnings without PII.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import time
from loguru import logger

try:
    from cachetools import TTLCache
except Exception:  # pragma: no cover
    TTLCache = None  # type: ignore

try:
    # requests is optional; if unavailable we skip remote fetch
    import requests  # type: ignore
except Exception:  # pragma: no cover
    requests = None  # type: ignore


@dataclass
class CachedValue:
    value: Any
    last_refresh_ts: float
    source: str


class ParserConfigProvider:
    """
    Provides runtime-loaded config objects for parser: gazetteers, aliases, section rules, domain packs.
    Uses TTL cache and fails open to last-good values. No PII stored or logged.
    """

    def __init__(self, ttl_seconds: Optional[int] = None) -> None:
        try:
            from app.core.config import settings  # local import to avoid hard dependency at import time
            default_ttl = int(getattr(settings, "CACHE_TTL_SECONDS", 300) or 300)
        except Exception:
            default_ttl = 300
        self.ttl = int(ttl_seconds or default_ttl)

        # Set up in-process caches (fallback to simple dict if cachetools missing)
        if TTLCache is not None:
            self._cache = TTLCache(maxsize=32, ttl=self.ttl)
        else:  # pragma: no cover
            self._cache = {}

        self._last_good: Dict[str, CachedValue] = {}

        # Endpoints/keys are read from env via settings when used
        self._sources = {
            "skills_gazetteer": None,
            "aliases": None,
            "section_rules": None,
            "domain_pack": None,
        }

    def _get_source(self, key: str) -> Optional[str]:
        try:
            from app.core.config import settings
            mapping = {
                "skills_gazetteer": getattr(settings, "PARSER_SKILLS_GAZETTEER_URL", None),
                "aliases": getattr(settings, "PARSER_ALIASES_URL", None),
                "section_rules": getattr(settings, "PARSER_SECTION_RULES_URL", None),
                "domain_pack": getattr(settings, "PARSER_DOMAIN_PACK_URL", None),
            }
            return mapping.get(key)
        except Exception:
            return None

    def _fetch_remote_json(self, url: str) -> Any:
        if not url or requests is None:
            raise RuntimeError("remote fetch not configured or requests unavailable")
        try:
            resp = requests.get(url, timeout=3)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:  # no PII
            raise RuntimeError(f"fetch failed: {type(e).__name__}")

    def _get_or_load(self, key: str, default_value: Any) -> Tuple[Any, float, str]:
        # Try in-process TTL cache
        if hasattr(self._cache, "__contains__") and key in self._cache:  # type: ignore
            cv: CachedValue = self._cache[key]  # type: ignore
            return cv.value, cv.last_refresh_ts, cv.source

        # Try to refresh from source
        url = self._get_source(key)
        value: Any = default_value
        source = "default"
        ts = time.time()
        try:
            if url:
                data = self._fetch_remote_json(url)
                if isinstance(data, dict) or isinstance(data, list):
                    value = data
                    source = "remote"
                    ts = time.time()
        except Exception as e:
            # Fail open: use last-good if present
            if key in self._last_good:
                lg = self._last_good[key]
                value, ts, source = lg.value, lg.last_refresh_ts, lg.source
                logger.warning(f"[parser.config] using last-good for {key}; reason={e}")
            else:
                logger.warning(f"[parser.config] using empty default for {key}; reason={e}")

        # Save in caches
        cv = CachedValue(value=value, last_refresh_ts=ts, source=source)
        if hasattr(self._cache, "__setitem__"):
            self._cache[key] = cv  # type: ignore
        self._last_good[key] = cv
        return value, ts, source

    # Public getters
    def get_skills_gazetteer(self) -> Dict[str, Dict[str, Any]]:
        value, _, _ = self._get_or_load("skills_gazetteer", default_value={})
        return value if isinstance(value, dict) else {}

    def get_aliases(self) -> Dict[str, str]:
        value, _, _ = self._get_or_load("aliases", default_value={})
        return value if isinstance(value, dict) else {}

    def get_section_rules(self) -> Dict[str, List[str]]:
        value, _, _ = self._get_or_load("section_rules", default_value={})
        return value if isinstance(value, dict) else {}

    def get_domain_pack(self) -> Dict[str, Any]:
        value, _, _ = self._get_or_load("domain_pack", default_value={})
        return value if isinstance(value, dict) else {}

    def get_status(self) -> Dict[str, Any]:
        # Exposes TTL and last refresh timestamps without PII
        status: Dict[str, Any] = {"ttl_seconds": self.ttl, "items": {}}
        for key in ["skills_gazetteer", "aliases", "section_rules", "domain_pack"]:
            cv = self._last_good.get(key)
            status["items"][key] = {
                "last_refresh_ts": cv.last_refresh_ts if cv else None,
                "source": cv.source if cv else None,
                "cached": (hasattr(self._cache, "__contains__") and key in self._cache),
            }
        return status


# Singleton-like access
_provider_singleton: Optional[ParserConfigProvider] = None


def get_parser_config_provider() -> ParserConfigProvider:
    global _provider_singleton
    if _provider_singleton is None:
        _provider_singleton = ParserConfigProvider()
    return _provider_singleton

