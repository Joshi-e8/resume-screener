"""
Utilities for domain-agnostic resume parsing: PII masking, date parsing, tenure.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import re

_MONTHS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "sept": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}


def mask_pii(text: str) -> str:
    if not text:
        return text
    # mask emails
    text = re.sub(r"([A-Za-z0-9._%+-]{1,3})[A-Za-z0-9._%+-]*@", r"\1***@", text)
    # mask phones (naive)
    text = re.sub(r"(\+?\d{1,2}[-.\s]?)?(\(?\d{2,3}\)?[-.\s]?)\d{2,3}[-.\s]?\d{2,4}", "[redacted-phone]", text)
    return text


def parse_date_token(tok: str) -> Optional[Tuple[int, int]]:
    t = tok.strip().lower().replace(".", "")
    if t in ("present", "current", "now"):  # open range marker
        now = datetime.utcnow()
        return now.year, now.month
    # MM/YYYY or M/YYYY
    m1 = re.match(r"^(\d{1,2})[\-/](\d{4})$", t)
    if m1:
        m = max(1, min(12, int(m1.group(1))))
        y = int(m1.group(2))
        return y, m
    # YYYY only
    m2 = re.match(r"^(\d{4})$", t)
    if m2:
        return int(m2.group(1)), 1
    # Mon YYYY
    m3 = re.match(r"^([a-z]{3,9})\s+(\d{4})$", t)
    if m3:
        mon = _MONTHS.get(m3.group(1)[:3], 1)
        return int(m3.group(2)), mon
    return None


def parse_date_range(text: str) -> Optional[Tuple[Tuple[int, int], Tuple[int, int] | None]]:
    if not text:
        return None
    s = re.sub(r"\s+", " ", text).strip()
    # Try common separators
    for sep in ["-", "–", "—", "to", "until"]:
        if sep in s:
            parts = [p.strip(" •;:\u2013\u2014") for p in s.split(sep, 1)]
            if len(parts) == 2:
                a = parse_date_token(parts[0])
                b = parse_date_token(parts[1])
                if a:
                    return a, b
    # Single token as start
    a = parse_date_token(s)
    if a:
        return a, None
    return None


def months_between(a: Tuple[int, int], b: Tuple[int, int]) -> int:
    ay, am = a
    by, bm = b
    return max(0, (by - ay) * 12 + (bm - am))


def compute_overlap_safe_years(ranges: List[Tuple[Tuple[int, int], Tuple[int, int]]]) -> float:
    # normalize and merge month buckets
    buckets = set()
    for start, end in ranges:
        ey, em = end
        sy, sm = start
        y, m = sy, sm
        while (y < ey) or (y == ey and m <= em):
            buckets.add((y, m))
            m += 1
            if m > 12:
                m = 1
                y += 1
    total_months = len(buckets)
    return round(total_months / 12.0, 2)


def is_probable_location(token: str) -> bool:
    # heuristic: tokens with digits or containing @/# are not locations; tokens with comma state-like abbreviations could be
    if not token or any(c.isdigit() for c in token):
        return False
    tok = token.strip()
    if "," in tok:
        parts = [p.strip() for p in tok.split(",")]
        if len(parts) == 2 and re.match(r"^[A-Za-z\s]+$", parts[0]) and re.match(r"^[A-Za-z\s]{2,}$", parts[1]):
            return True
    # common words not skills
    if tok.lower() in {"remote", "onsite", "hybrid"}:
        return True
    return False

