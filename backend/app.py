from fastapi import FastAPI, HTTPException, Query, Header #type:ignore
from fastapi.middleware.cors import CORSMiddleware #type:ignore
import pandas as pd #type:ignore
import numpy as np #type:ignore
import os #type:ignore
import json #type:ignore
from typing import Optional, Any, Dict #type:ignore
import urllib.request #type:ignore
import urllib.parse #type:ignore
import urllib.error #type:ignore
import math #type:ignore
import time #type:ignore


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


PEXELS_BASE_URL = "https://api.pexels.com/v1"


def _resolve_pexels_api_key(
    header_key: Optional[str],
    query_key: Optional[str],
) -> str:
    """Resolve the Pexels API key with precedence: header -> query -> env.

    The environment variable name is `PEXELS_API_KEY`.
    """
    if header_key and header_key.strip():
        return header_key.strip()
    if query_key and query_key.strip():
        return query_key.strip()
    env_key = os.getenv("PEXELS_API_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
    raise HTTPException(status_code=500, detail="Missing Pexels API key. Set PEXELS_API_KEY env, send X-Pexels-Api-Key header, or api_key query param.")


def _pexels_search_request(query: str, per_page: int, page: int, api_key: str) -> Dict[str, Any]:
    params = {
        "query": query,
        "per_page": str(per_page),
        "page": str(page),
    }
    url = f"{PEXELS_BASE_URL}/search?{urllib.parse.urlencode(params)}"

    req = urllib.request.Request(url)
    req.add_header("Authorization", api_key)
    # Some providers (via Cloudflare) block requests without a UA; include a simple one
    # Emulate a common browser UA and language to reduce Cloudflare challenges
    req.add_header(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/129.0.0.0 Safari/537.36",
    )
    req.add_header("Accept", "application/json, text/plain, */*")
    req.add_header("Accept-Language", "en-US,en;q=0.9")

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body_bytes = resp.read()
            body_text = body_bytes.decode("utf-8", errors="ignore")
            if resp.status != 200:
                raise HTTPException(status_code=resp.status, detail=f"Pexels error: {body_text}")
            try:
                data = json.loads(body_text)
            except Exception:
                snippet = body_text[:300]
                raise HTTPException(status_code=502, detail=f"Invalid JSON from Pexels (status 200). Body starts: {snippet}")
            return data  # raw Pexels response
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore") if hasattr(e, "read") else str(e)
        raise HTTPException(status_code=e.code or 502, detail=f"Pexels HTTP error: {detail}")
    except urllib.error.URLError as e:
        raise HTTPException(status_code=502, detail=f"Pexels network error: {e.reason}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error contacting Pexels: {e}")


def _normalize_photos(raw: Dict[str, Any]) -> Dict[str, Any]:
    photos = raw.get("photos", []) or []
    normalized = []
    for p in photos:
        normalized.append(
            {
                "id": p.get("id"),
                "title": p.get("alt") or "",
                "alt": p.get("alt") or "",
                "url": p.get("url"),
                "publisher": {
                    "name": p.get("photographer"),
                    "url": p.get("photographer_url"),
                    "id": p.get("photographer_id"),
                },
                # Pexels search API does not provide publish date; keep null for consistency
                "published_at": None,
                "avg_color": p.get("avg_color"),
                "width": p.get("width"),
                "height": p.get("height"),
                "src": p.get("src"),
                "attribution": f"Photo by {p.get('photographer')} on Pexels",
            }
        )

    return {
        "source": "pexels",
        "total_results": raw.get("total_results", 0),
        "page": raw.get("page", 1),
        "per_page": raw.get("per_page", len(normalized)),
        "next_page": raw.get("next_page"),
        "photos": normalized,
    }


@app.get("/images/search")
def search_images(
    q: str = Query(..., min_length=1, description="Search keywords for images"),
    per_page: int = Query(24, ge=1, le=80, description="Results per page (max 80)"),
    page: int = Query(1, ge=1, description="Page number"),
    x_pexels_api_key: Optional[str] = Header(None, alias="X-Pexels-Api-Key"),
    api_key: Optional[str] = Query(None, description="Override API key (dev)"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    key = _resolve_pexels_api_key(x_pexels_api_key, api_key)
    raw = _pexels_search_request(q.strip(), per_page, page, key)
    return _normalize_photos(raw)


# --------------------- Suggestions (LLM + sentence-transformers) ---------------------

def _optional_sentence_model():
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore
        model_name = os.getenv("SENTENCE_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        return SentenceTransformer(model_name)
    except Exception:
        return None


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _jaccard(a: str, b: str) -> float:
    sa = set(a.lower().split())
    sb = set(b.lower().split())
    if not sa and not sb:
        return 0.0
    return len(sa & sb) / float(len(sa | sb))


def _llm_candidates(q: str, n: int = 10) -> Optional[list[str]]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    prompt = (
        "You are a helpful assistant for image search. Given a user query, propose concise,\n"
        "diverse related search terms (1-3 words each), focused on concepts/subjects/visual motifs.\n"
        f"Query: {q}\n"
        "Return 15 terms, comma-separated only."
    )
    try:
        data = json.dumps({
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.5,
            "max_tokens": 150,
        }).encode("utf-8")
        req = urllib.request.Request("https://api.openai.com/v1/chat/completions", data=data, method="POST")
        req.add_header("Authorization", f"Bearer {api_key}")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            content = body["choices"][0]["message"]["content"]
            parts = [p.strip() for p in content.replace("\n", ",").split(",") if p.strip()]
            # dedupe preserve order
            seen = set()
            out = []
            for p in parts:
                if p.lower() not in seen:
                    seen.add(p.lower())
                    out.append(p)
            return out[: max(n, 10)]
    except Exception:
        return None


def _datamuse_candidates(q: str, max_items: int = 25) -> list[str]:
    """Query Datamuse for semantically related words/phrases (no API key)."""
    try:
        url = f"https://api.datamuse.com/words?{urllib.parse.urlencode({'ml': q, 'max': str(max_items)})}"
        req = urllib.request.Request(url)
        # mimic browser headers
        req.add_header("User-Agent", "arttinder/1.0")
        req.add_header("Accept", "application/json")
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status != 200:
                return []
            arr = json.loads(resp.read().decode("utf-8"))
            terms: list[str] = []
            for it in arr:
                w = str(it.get("word", "")).strip()
                if not w:
                    continue
                # keep up to 2 words; avoid trivial suffix patterns
                if len(w.split()) <= 2 and all(b not in w.lower() for b in ["wallpaper", "aesthetic", "photography", "background", "landscape", "portrait"]):
                    terms.append(w)
            # dedupe while preserving order
            seen: set[str] = set()
            out: list[str] = []
            for t in terms:
                tl = t.lower()
                if tl not in seen:
                    seen.add(tl)
                    out.append(t)
            return out
    except Exception:
        return []


@app.get("/suggest")
def suggest_terms(
    q: str = Query(..., min_length=1, description="User search query"),
    limit: int = Query(3, ge=1, le=10, description="Number of suggestions to return"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    q = q.strip()
    # Step 1: get candidate terms from LLM if available; else simple expansions
    candidates = _llm_candidates(q, n=30) or []
    # complement with Datamuse and merge
    dm = _datamuse_candidates(q, max_items=40)
    combined = candidates + dm
    # filter and dedupe, prefer non-trivial terms
    banned = {"wallpaper", "aesthetic"}
    cleaned: list[str] = []
    seen: set[str] = set()
    for t in combined or [q]:
        s = t.strip()
        if not s:
            continue
        sl = s.lower()
        if any(b in sl for b in banned):
            continue
        if sl == q.lower():
            continue
        # keep <= 2 words
        if len(sl.split()) > 2:
            continue
        if sl not in seen:
            seen.add(sl)
            cleaned.append(s)
    candidates = cleaned or dm or candidates or []

    # Step 2: rank candidates by semantic similarity (sentence-transformers if present)
    model = _optional_sentence_model()
    ranked: list[tuple[str, float]] = []
    if model is not None:
        try:
            query_vec = model.encode([q])[0]
            cand_vecs = model.encode(candidates)
            for term, vec in zip(candidates, cand_vecs):
                ranked.append((term, _cosine(query_vec, vec)))
        except Exception:
            ranked = [(term, _jaccard(q, term)) for term in candidates]
    else:
        ranked = [(term, _jaccard(q, term)) for term in candidates]

    ranked.sort(key=lambda x: x[1], reverse=True)
    # remove the exact query from suggestions
    suggestions = [t for t, _ in ranked if t.lower() != q.lower()][:limit]
    return {"query": q, "suggestions": suggestions}


def _expand_preferences_to_terms(prefs: Dict[str, Any], llm_top: int = 20) -> list[str]:
    buckets: list[str] = []
    if not prefs:
        return []
    styles = str(prefs.get("styles", ""))
    subjects = str(prefs.get("subjects", ""))
    base = [s.strip() for s in (styles + "," + subjects).split(",") if s.strip()]
    # LLM expand from concatenated seed
    seed = ", ".join(base[:6]) or "inspiration"
    llm = _llm_candidates(seed, n=llm_top) or []
    dm: list[str] = []
    for t in base[:6]:
        dm.extend(_datamuse_candidates(t, max_items=10))
    merged = base + llm + dm
    # filter/limit
    seen: set[str] = set()
    out: list[str] = []
    for w in merged:
        wl = w.lower().strip()
        if not wl:
            continue
        if wl in seen:
            continue
        if len(wl.split()) > 3:
            continue
        seen.add(wl)
        out.append(w)
        if len(out) >= llm_top:
            break
    return out


@app.get("/images/recommend")
def recommend_images(
    per_page: int = Query(10, ge=1, le=30),
    page: int = Query(1, ge=1),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_pexels_api_key: Optional[str] = Header(None, alias="X-Pexels-Api-Key"),
    api_key: Optional[str] = Query(None),
):
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id")
    _ensure_data_files()
    prefs = _load_json(PREFS_PATH).get(x_user_id, {})
    terms = _expand_preferences_to_terms(prefs, llm_top=20)
    if not terms:
        # fallback generic
        terms = ["art", "abstract", "surreal", "nature", "portrait"]

    key = _resolve_pexels_api_key(x_pexels_api_key, api_key)
    # fetch first page for each term with small per_page, then merge
    merged: list[Dict[str, Any]] = []
    for t in terms:
        raw = _pexels_search_request(t, per_page=min(5, per_page), page=1, api_key=key)
        merged.extend(raw.get("photos", []))

    # simple dedupe by id while preserving order
    seen_ids: set[int] = set()
    unique: list[Dict[str, Any]] = []
    for p in merged:
        pid = p.get("id")
        if pid in seen_ids:
            continue
        seen_ids.add(pid)
        unique.append(p)

    # paginate the unique list
    start = (page - 1) * per_page
    end = start + per_page
    sliced = unique[start:end]
    return {
        "source": "pexels",
        "total_results": len(unique),
        "page": page,
        "per_page": per_page,
        "photos": sliced,
    }


# --------------------- Users and Preferences (JSON-backed) ---------------------

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
USERS_PATH = os.path.join(DATA_DIR, "users.json")
PREFS_PATH = os.path.join(DATA_DIR, "prefs.json")


def _ensure_data_files():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(USERS_PATH):
        with open(USERS_PATH, "w", encoding="utf-8") as f:
            json.dump({}, f)
    if not os.path.exists(PREFS_PATH):
        with open(PREFS_PATH, "w", encoding="utf-8") as f:
            json.dump({}, f)


def _load_json(path: str) -> Dict[str, Any]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_json(path: str, obj: Dict[str, Any]) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f)
    os.replace(tmp, path)


@app.get("/user/validate")
def validate_handle(handle: str = Query(..., min_length=1)):
    """Check if a handle exists and return its userId, or null if not found."""
    _ensure_data_files()
    users = _load_json(USERS_PATH)
    handle = handle.strip().lower()
    for uid, data in users.items():
        if data.get("handle", "").strip().lower() == handle:
            return {"exists": True, "userId": uid, "handle": data.get("handle")}
    return {"exists": False, "userId": None, "handle": None}


@app.post("/user/upsert")
def upsert_user(payload: Dict[str, Any]):
    _ensure_data_files()
    user_id = str(payload.get("userId", "")).strip()
    handle = str(payload.get("handle", "")).strip()
    if not user_id or not handle:
        raise HTTPException(status_code=400, detail="userId and handle required")
    users = _load_json(USERS_PATH)
    now = int(time.time())
    users[user_id] = {"handle": handle, "updatedAt": now, **users.get(user_id, {"createdAt": now})}
    _save_json(USERS_PATH, users)
    return {"ok": True}


@app.get("/prefs")
def get_prefs(x_user_id: Optional[str] = Header(None, alias="X-User-Id")):
    _ensure_data_files()
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id")
    prefs = _load_json(PREFS_PATH)
    return prefs.get(x_user_id, {})


@app.post("/prefs")
def set_prefs(payload: Dict[str, Any], x_user_id: Optional[str] = Header(None, alias="X-User-Id")):
    _ensure_data_files()
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id")
    prefs = _load_json(PREFS_PATH)
    prefs[x_user_id] = payload or {}
    _save_json(PREFS_PATH, prefs)
    return {"ok": True}

