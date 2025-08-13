from __future__ import annotations

import json
from typing import Any, Dict
from unittest import mock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.routes import scoring as scoring_route
from app.scoring.schemas import SCORING_JSON_SCHEMA
from jsonschema import validate


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(scoring_route.router)
    return TestClient(app)


def dummy_valid_json() -> Dict[str, Any]:
    return {
        "overall_score": 78.5,
        "breakdown": {
            "skills_match": 85,
            "experience_relevance": 75,
            "seniority_alignment": 70,
            "education_fit": 80,
            "domain_expertise": 75,
            "certifications": 60,
        },
        "explanations": {
            "top_matches": ["Python", "AWS"],
            "gaps": ["Django"],
            "risk_flags": ["Short tenure"],
            "suggested_improvements": ["Learn Django basics"],
        },
        "derived": {"computed_weights": {"skills_match": 0.4, "experience_relevance": 0.3, "seniority_alignment": 0.1, "education_fit": 0.05, "domain_expertise": 0.1, "certifications": 0.05}, "server_check_overall": 78.5},
    }


def test_schema_conformance():
    data = dummy_valid_json()
    validate(instance=data, schema=SCORING_JSON_SCHEMA)


def test_repair_pass_validates():
    from app.scoring.llm_client import LLMClient

    def fake_invoke(messages):
        # First call returns invalid JSON; second call returns valid
        if isinstance(messages, list) and messages and messages[0]["role"] == "system":
            return json.dumps(dummy_valid_json())
        return "{"  # invalid

    client = LLMClient()
    with mock.patch.object(client, "_invoke", side_effect=fake_invoke):
        data, obs = client.score({"skills": ["Python"]}, {"title": "Eng"}, {"skills_match": 1.0, "experience_relevance": 0.0, "seniority_alignment": 0.0, "education_fit": 0.0, "domain_expertise": 0.0, "certifications": 0.0})
        validate(instance=data, schema=SCORING_JSON_SCHEMA)


def test_weights_and_server_overall():
    from app.scoring.service import score_resume_against_job

    weights = {
        "skills_match": 0.45,
        "experience_relevance": 0.30,
        "seniority_alignment": 0.10,
        "education_fit": 0.05,
        "domain_expertise": 0.05,
        "certifications": 0.05,
    }
    # Mock LLMClient.score to return controlled breakdown
    with mock.patch("app.scoring.service.LLMClient.score") as m:
        breakdown = {
            "skills_match": 90,
            "experience_relevance": 70,
            "seniority_alignment": 60,
            "education_fit": 80,
            "domain_expertise": 50,
            "certifications": 40,
        }
        result = {
            "overall_score": 0,  # will not be used for server check
            "breakdown": breakdown,
            "explanations": {"top_matches": [], "gaps": [], "risk_flags": [], "suggested_improvements": []},
            "derived": {"computed_weights": {}, "server_check_overall": 0},
        }
        m.return_value = (result, {"cache_hit": False})

        out = score_resume_against_job({"skills": ["Python"]}, {"title": "Eng"}, weights)
        cw = out["derived"]["computed_weights"]
        assert abs(sum(cw.values()) - 1.0) < 1e-6
        # Expected weighted average
        expected = (
            90 * cw["skills_match"]
            + 70 * cw["experience_relevance"]
            + 60 * cw["seniority_alignment"]
            + 80 * cw["education_fit"]
            + 50 * cw["domain_expertise"]
            + 40 * cw["certifications"]
        )
        assert abs(out["derived"]["server_check_overall"] - expected) <= 0.5


def test_retry_and_cache():
    from app.scoring.llm_client import LLMClient, ProviderError

    calls = {"n": 0}

    def flaky_invoke(messages):
        calls["n"] += 1
        if calls["n"] < 3:
            raise ProviderError("503")
        return json.dumps(dummy_valid_json())

    client = LLMClient()
    with mock.patch.object(client, "_invoke", side_effect=flaky_invoke):
        data1, obs1 = client.score({"skills": ["Python"]}, {"title": "Eng"}, {"skills_match": 1.0, "experience_relevance": 0.0, "seniority_alignment": 0.0, "education_fit": 0.0, "domain_expertise": 0.0, "certifications": 0.0})
        assert calls["n"] == 3
        data2, obs2 = client.score({"skills": ["Python"]}, {"title": "Eng"}, {"skills_match": 1.0, "experience_relevance": 0.0, "seniority_alignment": 0.0, "education_fit": 0.0, "domain_expertise": 0.0, "certifications": 0.0})
        assert obs2["cache_hit"] is True
        assert data1 == data2


def test_provider_switch():
    from app.scoring.llm_client import LLMClient

    # Force provider via monkeypatching settings
    from app.core import config as cfg

    old_provider = getattr(cfg.settings, "PROVIDER", None)
    try:
        setattr(cfg.settings, "PROVIDER", "groq")
        client = LLMClient()
        assert client.cfg.provider == "groq"
    finally:
        if old_provider is not None:
            setattr(cfg.settings, "PROVIDER", old_provider)


def test_api_endpoint_success(client, monkeypatch):
    # Enable scoring flag
    from app.core import config as cfg

    setattr(cfg.settings, "ENABLE_SCORING", True)

    # Mock service
    from app.scoring import service as svc

    expected = dummy_valid_json()
    monkeypatch.setattr(svc, "score_resume_against_job", lambda a, b, c=None: expected)

    resp = client.post(
        "/v1/scoring/resume-vs-job",
        json={
            "parsed_resume": {"skills": ["Python"]},
            "job": {"title": "Eng"},
            "weights": {"skills_match": 1.0},
        },
    )
    assert resp.status_code == 200
    validate(instance=resp.json(), schema=SCORING_JSON_SCHEMA)


def test_api_endpoint_disabled(client):
    from app.core import config as cfg

    setattr(cfg.settings, "ENABLE_SCORING", False)

    resp = client.post(
        "/v1/scoring/resume-vs-job",
        json={"parsed_resume": {}, "job": {}},
    )
    assert resp.status_code == 503


def test_api_endpoint_422(client, monkeypatch):
    # Force service to raise ValueError (schema issue)
    from app.core import config as cfg

    setattr(cfg.settings, "ENABLE_SCORING", True)

    from app.scoring import service as svc

    def boom(*args, **kwargs):
        raise ValueError("bad input")

    monkeypatch.setattr(svc, "score_resume_against_job", boom)

    resp = client.post(
        "/v1/scoring/resume-vs-job",
        json={"parsed_resume": {}, "job": {}},
    )
    assert resp.status_code == 422

