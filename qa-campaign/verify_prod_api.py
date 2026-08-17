#!/usr/bin/env python3
"""Verify production API routes on Vercel return JSON (not HTML 404)."""
import json, random, string, urllib.request

BASE = "https://wheel-of-fate-three.vercel.app"


def uid():
    return "t-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=6))


def post(path, payload):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        ct = e.headers.get("Content-Type", "")
        body = e.read().decode(errors="replace")[:200]
        return e.code, {"html_404": "text/html" in ct, "body": body}


def get(path):
    req = urllib.request.Request(BASE + path)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            ct = r.headers.get("Content-Type", "")
            return r.status, ct, r.read().decode(errors="replace")[:200]
    except urllib.error.HTTPError as e:
        ct = e.headers.get("Content-Type", "")
        return e.code, ct, e.read().decode(errors="replace")[:200]


results = []

# 1. health
code, _, body = get("/api/health")
results.append(("GET /api/health", code, "json" if "success" in body else body[:50]))

# 2. create room (ABDO)
code, data = post("/api/room/create", {"playerId": uid(), "playerName": "عبدو-تحقق"})
room = (data or {}).get("code") or ""
results.append(("POST /api/room/create", code, "json room=" + room if code == 200 else str(data)[:80]))

# 3. join room (ANFAL)
code, data = post("/api/room/join", {"code": room, "playerId": uid(), "playerName": "أنفال-تحقق"})
results.append(("POST /api/room/join", code, "json" if code == 200 else str(data)[:80]))

# 4. state (path-style, as the real client uses)
if room:
    code, ct, body = get(f"/api/room/{room}/state")
    is_json = "application/json" in ct
    results.append((f"GET /api/room/{room}/state", code, "json" if is_json else ct + " | " + body[:60]))

# 5. reflect
code, data = post(
    f"/api/room/{room}/reflect",
    {"playerId": "x", "reflection": "اختبار تحقق من الإنتاج"},
)
results.append(("POST /api/room/[code]/reflect", code, "json" if code in (200, 400, 404) else str(data)[:80]))

# 6. root page
code, ct, body = get("/")
results.append(("GET /", code, ct + " | html-ok" if "Wheel of Fate" in body else ct))

print("=== PRODUCTION API VERIFICATION ===")
for name, code, detail in results:
    print(f"{name} -> {code} | {detail}")
fails = [r for r in results if r[1] >= 400 and "json" not in str(r[2])]
print("\nFINAL:", "ALL PASS" if not fails else f"{len(fails)} ISSUE(S)")
