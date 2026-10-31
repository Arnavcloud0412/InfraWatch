from __future__ import annotations

import hashlib
import ipaddress
import re
import socket
from urllib.parse import urlparse

DEVANAGARI = re.compile(r"[\u0900-\u097F]")


def detect_language(text: str, hinted: str | None = None) -> str:
    if hinted and hinted.lower() in {"mr", "hi", "en", "marathi", "hindi", "english"}:
        mapping = {"marathi": "mr", "hindi": "hi", "english": "en"}
        return mapping.get(hinted.lower(), hinted.lower())
    letters = DEVANAGARI.findall(text or "")
    if len(letters) >= 8:
        return "mr"
    return "en"


def content_hash(url: str | None, text: str) -> str:
    basis = (url or "").strip().lower()
    if not basis:
        basis = re.sub(r"\s+", " ", (text or "").lower())[:4000]
    return hashlib.sha256(basis.encode("utf-8")).hexdigest()


def html_to_text(raw: str) -> str:
    without_scripts = re.sub(r"(?is)<script.*?>.*?</script>", " ", raw)
    without_styles = re.sub(r"(?is)<style.*?>.*?</style>", " ", without_scripts)
    text = re.sub(r"(?is)<[^>]+>", " ", without_styles)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:8000]


def is_public_url(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    host = parsed.hostname.lower()
    if host in {"localhost", "metadata.google.internal"} or host.endswith(".local"):
        return False
    try:
        addresses = socket.getaddrinfo(host, None)
    except socket.gaierror:
        return False
    for info in addresses:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except ValueError:
            return False
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False
    return True
