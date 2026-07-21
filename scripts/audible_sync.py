#!/usr/bin/env python3
"""Sync Trey's Audible library into content/library/books.json.

Design + review record: docs/plans/2026-07-21-audible-sync-plan.md.
Stdlib only. Invoked weekly by scripts/audible-sync.sh (launchd), or by hand:

    python3 scripts/audible_sync.py --dry-run
    python3 scripts/audible_sync.py --export-file test/fixtures/audible-export.sample.json --dry-run
    python3 scripts/audible_sync.py --self-test

Never mutates hand-curated entries except promoting status to "read" when
Audible reports the book finished. Never invents ratings or whyILoveIt.
Exit 0 with "no changes" is the normal weekly outcome.
"""

from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
from datetime import date

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOOKS_PATH = os.path.join(REPO, "content", "library", "books.json")
IGNORE_PATH = os.path.join(REPO, "content", "library", "audible-ignore.json")
AUDIBLE_BIN = os.environ.get("AUDIBLE_BIN", os.path.expanduser("~/.local/bin/audible"))
CLAUDE_BIN = os.environ.get("CLAUDE_BIN", os.path.expanduser("~/.local/bin/claude"))
ENRICH_MODEL = os.environ.get("AUDIBLE_SYNC_MODEL", "claude-sonnet-5")

ARTICLES = ("the ", "a ", "an ")
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def norm_title(title: str) -> str:
    t = re.split(r"[:–—]", title)[0]  # split subtitles BEFORE ascii-folding eats the dashes
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"[^a-z0-9 ]", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    for a in ARTICLES:
        if t.startswith(a):
            t = t[len(a):]
            break
    return t


def norm_author(author: str) -> str:
    """Order-insensitive key for the primary author.

    Audible emits both "J.R.R. Tolkien" and "Tolkien, J.R.R." shapes, and
    multi-author lists are comma-joined — so take the first two comma parts
    when the second looks like a continuation of one name (short, no space
    before another full name), then compare as a sorted token set.
    """
    parts = [p.strip() for p in author.split(",") if p.strip()]
    # "Last, First" inversion only when the second part looks like a given
    # name fragment (initials with dots, or a single word) — a second full
    # name after the comma is a co-author, not an inversion.
    if len(parts) >= 2 and ("." in parts[1] or len(parts[1].split()) == 1):
        candidate = f"{parts[1]} {parts[0]}"  # "Tolkien, J.R.R." -> "J.R.R. Tolkien"
    else:
        candidate = parts[0] if parts else author
    a = unicodedata.normalize("NFKD", candidate).encode("ascii", "ignore").decode().lower()
    a = re.sub(r"[^a-z ]", " ", a)
    return " ".join(sorted(a.split()))


def slugify(title: str) -> str:
    s = norm_title(title)
    return re.sub(r"\s+", "-", s) or "untitled"


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def is_podcast(item: dict) -> bool:
    return "podcast" in str(item.get("genres", "")).lower()


def filter_items(items: list[dict], ignore_asins: set[str], report: dict) -> list[dict]:
    kept = []
    for it in items:
        asin = it.get("asin", "?")
        if asin in ignore_asins:
            report["skipped"].append(f"{asin} ignored ({it.get('title', '?')})")
        elif is_podcast(it):
            report["skipped"].append(f"{asin} podcast ({it.get('title', '?')})")
        elif not it.get("is_finished") and not (it.get("percent_complete") or 0) > 0:
            report["skipped"].append(f"{asin} unstarted ({it.get('title', '?')})")
        elif not it.get("title") or not it.get("authors"):
            report["skipped"].append(f"{asin} missing title/authors")
        else:
            kept.append(it)
    return kept


def match_items(items: list[dict], books: list[dict], report: dict):
    """Split filtered Audible items into (matched pairs, unmatched items).

    Match key = (normalized title sans subtitle, normalized primary author).
    A title-only collision with a different author is reported for review
    and NOT auto-inserted (review finding 5).
    """
    by_key = {}
    by_title = {}
    for b in books:
        by_key[(norm_title(b["title"]), norm_author(b["author"]))] = b
        by_title.setdefault(norm_title(b["title"]), []).append(b)

    matched, unmatched = [], []
    for it in items:
        key = (norm_title(it["title"]), norm_author(it["authors"]))
        if key in by_key:
            matched.append((it, by_key[key]))
        elif key[0] in by_title:
            others = ", ".join(b["id"] for b in by_title[key[0]])
            report["review"].append(
                f"{it.get('asin', '?')} \"{it['title']}\" by {it['authors']}: title matches "
                f"existing [{others}] with different author — possible duplicate, not inserted"
            )
        else:
            unmatched.append(it)
    return matched, unmatched


def apply_promotions(matched, report: dict) -> bool:
    changed = False
    for it, book in matched:
        if it.get("is_finished") and book.get("status") in ("reading", "want"):
            report["promoted"].append(f"{book['id']}: {book['status']} -> read")
            book["status"] = "read"
            changed = True
        else:
            report["matched"].append(f"{it.get('asin', '?')} -> {book['id']} (no change)")
    return changed


def build_enrich_prompt(items: list[dict], books: list[dict]) -> str:
    genres = sorted({b["genre"] for b in books})
    topics = sorted({t for b in books for t in b.get("topics", [])})
    examples = [
        {k: b[k] for k in ("id", "title", "author", "year", "status", "topics", "genre")}
        for b in books[:3] + books[len(books) // 2 : len(books) // 2 + 2]
    ]
    norm_map = {norm_title(b["title"]): b["id"] for b in books}
    payload = []
    for it in items:
        nt = norm_title(it["title"])
        near = difflib.get_close_matches(nt, norm_map.keys(), n=5, cutoff=0.6)
        # prefix containment catches subtitle shapes difflib scores poorly
        # ("hobbit or there and back again" vs "hobbit")
        near += [k for k in norm_map if k not in near and (nt.startswith(k + " ") or k.startswith(nt + " ") or k == nt)]
        it["_near_ids"] = [norm_map[n] for n in near[:8]]
        payload.append(
            {
                "asin": it["asin"],
                "title": it["title"],
                "subtitle": it.get("subtitle"),
                "authors": it["authors"],
                "audible_genres": it.get("genres"),
                "release_date": it.get("release_date"),
                "status": "read" if it.get("is_finished") else "reading",
                "possible_existing_matches": it["_near_ids"],
            }
        )
    return f"""You are adding audiobooks from Trey Goff's Audible library to the hand-curated book list on treygoff.com. Match the existing curation style exactly.

Existing genres (genre MUST be one of these): {json.dumps(genres)}

Existing topics vocabulary (prefer these; invent a new kebab-case topic only when nothing fits): {json.dumps(topics)}

Style examples from the existing list: {json.dumps(examples, indent=1)}

For EACH input item output one object with exactly these keys:
- "asin": copied verbatim from the input
- "match_existing_id": if this audiobook is actually one of the possible_existing_matches (same work, e.g. subtitle or edition variance), that existing id; otherwise null
- "id": kebab-case slug from the cleaned title (ignored when match_existing_id is set)
- "title": cleaned display title — drop marketing subtitles ("A Novel", series taglines) unless load-bearing
- "author": primary author only, "First Last"
- "year": the ORIGINAL print publication year of the work (from your knowledge), NOT the audiobook release date
- "topics": 2-5 topics, drawn from the vocabulary above wherever possible
- "genre": one of the existing genres
- "status": copied verbatim from the input item's "status"
Never include a rating and never include whyILoveIt.

Output ONLY a JSON array of these objects — no markdown fences, no prose.

Input items: {json.dumps(payload, indent=1)}"""


def run_enrichment(prompt: str) -> list[dict]:
    proc = subprocess.run(
        [CLAUDE_BIN, "-p", prompt, "--model", ENRICH_MODEL, "--output-format", "json"],
        capture_output=True, text=True, timeout=600,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"claude enrichment failed rc={proc.returncode}: {proc.stderr[-500:]}")
    envelope = json.loads(proc.stdout)
    if isinstance(envelope, list):  # newer CLIs emit an event array; the answer is the "result" event
        envelope = next((e for e in envelope if isinstance(e, dict) and e.get("type") == "result"), {})
    text = envelope.get("result", "") if isinstance(envelope, dict) else ""
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    parsed = json.loads(text)
    if not isinstance(parsed, list):
        raise RuntimeError("enrichment output is not a JSON array")
    return parsed


def validate_entry(entry: dict, input_by_asin: dict, existing_ids: set[str], genres: set[str]):
    """Return (clean_book_dict | None, error | None, match_existing_id | None)."""
    if not isinstance(entry, dict):
        return None, "not an object", None
    asin = entry.get("asin")
    if asin not in input_by_asin:
        return None, f"unknown asin {asin!r}", None
    src = input_by_asin[asin]
    match_id = entry.get("match_existing_id")
    if match_id is not None:
        # Only honor a match the model was actually offered for THIS item —
        # a bare existing id must never promote an unrelated curated book.
        if match_id in src.get("_near_ids", ()):
            return None, None, match_id
        return None, f"{asin}: match_existing_id {match_id!r} not among offered candidates", None
    if "rating" in entry or "whyILoveIt" in entry:
        return None, f"{asin}: model emitted a forbidden field", None
    year = entry.get("year")
    status = entry.get("status")
    topics = entry.get("topics")
    genre = entry.get("genre")
    slug = entry.get("id", "")
    problems = []
    if not isinstance(year, int) or not 1000 <= year <= date.today().year + 1:
        problems.append(f"bad year {year!r}")
    if status != ("read" if src.get("is_finished") else "reading"):
        problems.append(f"status {status!r} contradicts export")
    if not isinstance(topics, list) or not 1 <= len(topics) <= 6 or not all(
        isinstance(t, str) and SLUG_RE.match(t) for t in topics
    ):
        problems.append(f"bad topics {topics!r}")
    if genre not in genres:
        problems.append(f"genre {genre!r} not in existing set")
    if not entry.get("title") or not entry.get("author"):
        problems.append("missing title/author")
    if not SLUG_RE.match(slug):
        slug = slugify(entry.get("title") or src["title"])
    if problems:
        return None, f"{asin}: " + "; ".join(problems), None
    base, n = slug, 2
    while slug in existing_ids:
        slug = f"{base}-{n}"  # review finding 6: disambiguate, never drop
        n += 1
    return (
        {
            "id": slug,
            "title": entry["title"],
            "author": entry["author"],
            "year": year,
            "status": status,
            "topics": topics,
            "genre": genre,
        },
        None,
        None,
    )


def fetch_export(export_file: str | None) -> list[dict]:
    if export_file:
        return load_json(export_file)
    tmp = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
    tmp.close()
    try:
        proc = subprocess.run(
            [AUDIBLE_BIN, "library", "export", "-f", "json", "-o", tmp.name, "--timeout", "30"],
            capture_output=True, text=True, timeout=300,
        )
        if proc.returncode != 0:
            hint = ""
            if "401" in proc.stderr or "Unauthorized" in proc.stderr:
                hint = " — auth expired; re-run `audible quickstart` (external browser login)"
            raise RuntimeError(f"audible export failed rc={proc.returncode}{hint}: {proc.stderr[-500:]}")
        return load_json(tmp.name)
    finally:
        os.unlink(tmp.name)


def sync(export_file=None, dry_run=False, books_path=BOOKS_PATH, ignore_path=IGNORE_PATH,
         enrich=run_enrichment, msg_file=None):
    report = {"matched": [], "promoted": [], "inserted": [], "skipped": [], "review": [], "rejected": []}
    data = load_json(books_path)
    books = data["books"]
    ignore_asins = set(load_json(ignore_path)["asins"]) if os.path.exists(ignore_path) else set()

    items = filter_items(fetch_export(export_file), ignore_asins, report)
    matched, unmatched = match_items(items, books, report)
    changed = apply_promotions(matched, report)

    if unmatched:
        genres = {b["genre"] for b in books}
        existing_ids = {b["id"] for b in books}
        input_by_asin = {it["asin"]: it for it in unmatched}
        entries = enrich(build_enrich_prompt(unmatched, books))
        by_id = {b["id"]: b for b in books}
        for entry in entries:
            book, err, match_id = validate_entry(entry, input_by_asin, existing_ids, genres)
            if err:
                report["rejected"].append(err)
            elif match_id:
                src = input_by_asin[entry["asin"]]
                target = by_id[match_id]
                if src.get("is_finished") and target.get("status") in ("reading", "want"):
                    report["promoted"].append(f"{match_id}: {target['status']} -> read (LLM match)")
                    target["status"] = "read"
                    changed = True
                else:
                    report["matched"].append(f"{entry['asin']} -> {match_id} (LLM match, no change)")
            else:
                report["inserted"].append(f"{book['id']}: {book['title']} ({book['author']}, {book['year']}) [{book['status']}]")
                books.append(book)
                existing_ids.add(book["id"])
                changed = True
        accounted = {e.get("asin") for e in entries if isinstance(e, dict)}
        for asin in input_by_asin:
            if asin not in accounted:
                report["rejected"].append(f"{asin}: enrichment returned no entry for this item")

    if changed and not dry_run:
        data["lastUpdated"] = date.today().isoformat()
        # atomic replace: a crash mid-write must never truncate the library
        fd, tmp_path = tempfile.mkstemp(dir=os.path.dirname(books_path), suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp_path, books_path)
        except BaseException:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise
    if msg_file and changed and not dry_run:
        lines = ["Sync Audible library into books.json", ""]
        for k in ("inserted", "promoted", "review", "rejected"):
            for entry in report[k]:
                lines.append(f"{k}: {entry}")
        with open(msg_file, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
    return changed, report


def self_test():
    fixture = os.path.join(REPO, "test", "fixtures", "audible-export.sample.json")
    seed = {
        "lastUpdated": "2026-01-01",
        "books": [
            {"id": "progress-and-poverty", "title": "Progress and Poverty", "author": "Henry George",
             "year": 1879, "status": "read", "topics": ["economics"], "genre": "economics"},
            {"id": "the-hobbit", "title": "The Hobbit", "author": "J.R.R. Tolkien",
             "year": 1937, "status": "want", "topics": ["fantasy"], "genre": "fantasy"},
        ],
    }
    fake_enrichment = [
        {"asin": "NEW1", "match_existing_id": None, "id": "seeing-like-a-state",
         "title": "Seeing Like a State", "author": "James C. Scott", "year": 1998,
         "topics": ["governance", "economics"], "genre": "economics", "status": "read"},
        {"asin": "BADYEAR", "match_existing_id": None, "id": "bad-year-book", "title": "Bad Year",
         "author": "Nobody", "year": 99, "topics": ["economics"], "genre": "economics", "status": "read"},
        {"asin": "LLMMATCH", "match_existing_id": "the-hobbit"},
    ]
    with tempfile.TemporaryDirectory() as td:
        bp = os.path.join(td, "books.json")
        with open(bp, "w") as f:
            json.dump(seed, f)
        changed, report = sync(
            export_file=fixture, books_path=bp, ignore_path=os.path.join(td, "none.json"),
            enrich=lambda prompt: fake_enrichment,
        )
        out = load_json(bp)
        ids = [b["id"] for b in out["books"]]
        by_id = {b["id"]: b for b in out["books"]}
        assert changed, "fixture run must produce changes"
        assert "seeing-like-a-state" in ids, "valid new book inserted"
        assert "bad-year-book" not in ids, "invalid year rejected"
        assert any("BADYEAR" in r for r in report["rejected"]), "rejection reported"
        assert by_id["the-hobbit"]["status"] == "read", "LLM-matched finished book promoted"
        assert by_id["progress-and-poverty"]["status"] == "read", "existing entry untouched"
        assert not any("rating" in b for b in out["books"]), "no ratings ever"
        assert any("podcast" in s for s in report["skipped"]), "podcast filtered"
        assert any("unstarted" in s for s in report["skipped"]), "unstarted filtered"
        assert any("possible duplicate" in r for r in report["review"]), "title collision flagged for review"
        assert out["lastUpdated"] != "2026-01-01", "lastUpdated bumped"
        # idempotence: second run with same fixture changes nothing new
        changed2, report2 = sync(
            export_file=fixture, books_path=bp, ignore_path=os.path.join(td, "none.json"),
            enrich=lambda prompt: [{"asin": "NEW1", "match_existing_id": "seeing-like-a-state"},
                                   {"asin": "BADYEAR", "match_existing_id": None, "id": "bad-year-book",
                                    "title": "Bad Year", "author": "Nobody", "year": 99,
                                    "topics": ["economics"], "genre": "economics", "status": "read"},
                                   {"asin": "LLMMATCH", "match_existing_id": "the-hobbit"}],
        )
        assert not changed2, f"second run must be a no-op, got {report2}"
    assert norm_title("The Dispossessed: An Ambiguous Utopia") == "dispossessed"
    assert norm_title("Sapiens – A Brief History of Humankind") == "sapiens"
    assert norm_author("James C. Scott, Foreword Person") == norm_author("James C. Scott")
    assert norm_author("Tolkien, J.R.R.") == norm_author("J.R.R. Tolkien")
    assert norm_author("Le Guin, Ursula K.") == norm_author("Ursula K. Le Guin")
    assert slugify("Gödel, Escher, Bach") == "godel-escher-bach"
    print("self-test OK")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--export-file", help="use a saved export JSON instead of calling audible")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--commit-msg-file", help="write a commit message here when changes land")
    args = ap.parse_args()
    if args.self_test:
        self_test()
        return
    changed, report = sync(export_file=args.export_file, dry_run=args.dry_run,
                           msg_file=args.commit_msg_file)
    print(json.dumps(report, indent=1))
    print("CHANGED" if changed else "no changes")


if __name__ == "__main__":
    main()
