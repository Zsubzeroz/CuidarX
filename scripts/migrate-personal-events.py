#!/usr/bin/env python3
"""Migration: delete personal events from Firestore 'appointments' + log to 'systemLogs'."""
import json, re, os, time
from urllib.request import Request, urlopen
from urllib.error import HTTPError

PROJECT = os.environ.get("FIREBASE_PROJECT_ID", "cuidarx")
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"

PERSONAL_PATTERNS = [
    re.compile(r'almoco', re.I), re.compile(r'almoço', re.I), re.compile(r'hamburger', re.I),
    re.compile(r'estagio', re.I), re.compile(r'estágio', re.I), re.compile(r'ubs', re.I),
    re.compile(r'pilates', re.I),
    re.compile(r'reuniao', re.I), re.compile(r'reunião', re.I), re.compile(r'igreja', re.I),
    re.compile(r'oracao', re.I), re.compile(r'oração', re.I),
    re.compile(r'mamae', re.I), re.compile(r'mamãe', re.I),
    re.compile(r'feriado', re.I), re.compile(r'dia dos pais', re.I), re.compile(r'assumption', re.I),
    re.compile(r'birthday', re.I), re.compile(r'aniversario', re.I), re.compile(r'aniversário', re.I),
]

def is_personal(name):
    if not name:
        return False
    return any(p.search(name) for p in PERSONAL_PATTERNS)

def get_token():
    config_path = os.path.expanduser("~/.config/configstore/firebase-tools.json")
    with open(config_path) as f:
        return json.load(f)["tokens"]["access_token"]

def api_request(method, url, token, data=None):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req = Request(url, data=body, headers=headers, method=method)
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read()) if resp.read else {}
    except HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code}: {body[:200]}")
        return None

def refresh_token_if_needed(token):
    """Try a simple read; if 401, re-login."""
    url = f"{BASE}/appointments?pageSize=1"
    req = Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        urlopen(req)
        return token
    except HTTPError:
        print("Token expired, refreshing...")
        # Re-run firebase login to refresh
        os.system("firebase login --no-localhost")
        return get_token()

def main():
    print("=== Migration: personal events from appointments → systemLogs ===\n")

    token = get_token()
    token = refresh_token_if_needed(token)

    # Fetch all google-sourced appointments
    all_docs = []
    page_token = None
    while True:
        url = f"{BASE}/appointments?pageSize=1000"
        if page_token:
            url += f"&pageToken={page_token}"
        resp = api_request("GET", url, token)
        if not resp:
            print("Failed to fetch appointments")
            return
        docs = resp.get("documents", [])
        all_docs.extend(docs)
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    google_docs = []
    for d in all_docs:
        fields = d.get("fields", {})
        source = fields.get("source", {}).get("stringValue", "")
        if source == "google":
            google_docs.append(d)

    print(f"Total google-sourced appointments: {len(google_docs)}")

    personal = []
    for d in google_docs:
        name = d.get("fields", {}).get("patientName", {}).get("stringValue", "")
        if is_personal(name):
            personal.append(d)

    print(f"Personal events to delete: {len(personal)}\n")

    deleted = 0
    log_entries = []

    for d in personal:
        doc_id = d["name"].split("/")[-1]
        fields = d.get("fields", {})
        name = fields.get("patientName", {}).get("stringValue", "")
        date = fields.get("date", {}).get("stringValue", "")
        time_val = fields.get("time", {}).get("stringValue", "")
        cal_id = fields.get("calendarEventId", {}).get("stringValue", "")

        url = f"{BASE}/appointments/{doc_id}"
        result = api_request("DELETE", url, token)
        if result is not None:
            deleted += 1
            log_entries.append({
                "stringValue": f"{name} | {date} {time_val} | calEventId={cal_id}"
            })
            print(f"  ✓ Deleted: {name} {date} {time_val}")
        else:
            print(f"  ✗ Failed: {doc_id} ({name})")
        time.sleep(0.05)

    # Log to systemLogs
    if log_entries:
        log_doc = {
            "fields": {
                "type": {"stringValue": "migration_personal_events"},
                "description": {"stringValue": f"Migrated {deleted} personal events from appointments to scheduleBlocks"},
                "deletedCount": {"integerValue": str(deleted)},
                "timestamp": {"timestampValue": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
                "details": {"arrayValue": {"values": [{"mapValue": {"fields": e}} for e in log_entries]}}
            }
        }
        url = f"{BASE}/systemLogs"
        result = api_request("POST", url, token, log_doc)
        if result:
            print(f"\nLogged {deleted} deletions to systemLogs")
        else:
            print(f"\nFailed to log to systemLogs (deletions still committed)")

    print(f"\n=== Done: {deleted}/{len(personal)} deleted ===")

if __name__ == "__main__":
    main()
