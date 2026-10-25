"""Minimal Semantic Scholar Graph API client with retry/backoff (no API key needed)."""
import json
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.semanticscholar.org/graph/v1"
FIELDS = ("title,authors,year,venue,journal,externalIds,citationCount,"
          "influentialCitationCount,abstract,publicationDate,openAccessPdf,"
          "publicationTypes,url")


def _request(url, data=None, tries=40):
    delay = 3
    for _ in range(tries):
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code not in (429, 500, 502, 503, 504):
                raise
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(delay)
        delay = min(delay * 1.5, 60)
    raise RuntimeError(f"gave up on {url}")


def match(title):
    q = urllib.parse.urlencode({"query": title, "fields": FIELDS})
    res = _request(f"{API}/paper/search/match?{q}")
    return res["data"][0] if res and res.get("data") else None


def batch(ids, fields=FIELDS, chunk=50):
    """Yield (id, record-or-None) pairs, one request per chunk."""
    for i in range(0, len(ids), chunk):
        part = ids[i:i + chunk]
        body = json.dumps({"ids": part}).encode()
        yield from zip(part, _request(f"{API}/paper/batch?fields={fields}", data=body))


def bulk_search(query, year=None, limit=100, fields=FIELDS):
    params = {"query": query, "fields": fields, "sort": "citationCount:desc"}
    if year:
        params["year"] = year
    res = _request(f"{API}/paper/search/bulk?{urllib.parse.urlencode(params)}")
    return (res or {}).get("data", [])[:limit]
