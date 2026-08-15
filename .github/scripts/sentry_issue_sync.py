#!/usr/bin/env python3
"""Sentry → GitHub Issue Sync.

للاستخدام داخل GitHub Action فقط (يتصل بسنترى + GitHub APIs).
المنطق:
1. يجلب آخر Issues من Sentry للمشروع (مرتبة بمعدل التكرار desc).
2. يتجاهل أي Issue مُعلَّم ignored/resolved في Sentry (status != unresolved فقط — نتجاهل muted أيضاً).
3. يتحقق:
   a. أن التكرارات (times_seen) >= ALERT_THRESHOLD.
   b. أن GitHub Issue مناظر لا يوجد (بحث بعنوان Sentry Issue URL / fingerprint).
4. ينشئ GitHub Issue بعنوان عربي/إنجليزي واضح + body يحتوي:
   - رابط Sentry المباشر
   - عدد مرات التكرار ووقت آخر ظهور
   - أول 15 سطرًا من stacktrace (إن وُجد)
5. يوسم الـ GitHub Issue بوسم "sentry" لسهولة التصفية.
"""
import json
import os
import re
import sys

import requests

SENTRY_BASE = "https://sentry.io/api/0"
GITHUB_API = "https://api.github.com"

ORG = os.environ["SENTRY_ORG"]
PROJECT = os.environ["SENTRY_PROJECT"]
THRESHOLD = int(os.environ.get("ALERT_THRESHOLD", "10"))
DRY_RUN = os.environ.get("DRY_RUN", "false").lower() == "true"

SENTRY_TOKEN = os.environ.get("SENTRY_AUTH_TOKEN")
GH_TOKEN = os.environ.get("GH_TOKEN")

HEADERS_SENTRY = {"Authorization": f"Bearer {SENTRY_TOKEN}"}
HEADERS_GH = {"Authorization": f"Bearer {GH_TOKEN}", "Accept": "application/vnd.github+json"}

REPO = f"rezerosaga-ai/{PROJECT}"

LABEL_NAME = "sentry"


def sentry_get(path):
    r = requests.get(f"{SENTRY_BASE}{path}", headers=HEADERS_SENTRY, timeout=30)
    if r.status_code != 200:
        print(f"ERROR sentry GET {path}: {r.status_code} {r.text[:200]}")
        sys.exit(1)
    return r.json()


def github_get(path):
    r = requests.get(f"{GITHUB_API}{path}", headers=HEADERS_GH, timeout=30)
    return r


def github_post(path, payload):
    r = requests.post(f"{GITHUB_API}{path}", headers=HEADERS_GH, json=payload, timeout=30)
    return r


def ensure_label():
    """إنشاء وسم sentry إذا لم يوجد (يتجاهل الأخطاء غير الحرجة — الوسم اختياري)."""
    r = github_get(f"/repos/{REPO}/labels/{LABEL_NAME}")
    if r.status_code == 200:
        return
    r = github_post(
        f"/repos/{REPO}/labels",
        {
            "name": LABEL_NAME,
            "color": "9b59b6",
            "description": "Issue منشأ تلقائيًا من Sentry (خطأ إنتاج)",
        },
    )
    if r.status_code != 201:
        print(f"WARN label creation skipped: {r.status_code} {r.text[:120]}")


def existing_gh_issues():
    """إرجاع {sentry_url: gh_issue_number} من Issues مفتوحة موسومة sentry."""
    out = {}
    for page in range(1, 4):
        r = github_get(
            f"/repos/{REPO}/issues?labels={LABEL_NAME}&state=open&per_page=100&page={page}"
        )
        if r.status_code != 200:
            print(f"WARN github list issues: {r.status_code}")
            break
        data = r.json()
        if not data:
            break
        for issue in data:
            body = issue.get("body") or ""
            m = re.search(r"https://sentry\.io[^ \n]+", body)
            if m:
                out[m.group(0)] = issue["number"]
    return out


def sentry_issues_list():
    """آخر 25 Issue من Sentry مرتبة بـ frequency desc."""
    path = (
        f"/projects/{ORG}/{PROJECT}/issues/"
        "?sort=freq&query=is%3Aunresolved&limit=25&statsPeriod=14d"
    )
    return sentry_get(path)


def build_gh_body(issue, events):
    lines = [
        f"> هذا الـ Issue أُنشئ تلقائيًا بواسطة Action المزامنة `sentry-issue-sync.yml` "
        f"لأن الخطأ تكرر أكثر من {THRESHOLD} مرات في Sentry.",
        "",
        f"**Sentry Issue:** {issue['title']}",
        f"**العدد:** {issue['count']} تكرارًا",
        f"**آخر ظهور:** {issue.get('lastSeen', 'غير معروف')}",
        f"**الرابط المباشر:** {issue['permalink']}",
        "",
    ]
    # أول حدث يحتوي على stacktrace
    for ev in events:
        excs = ev.get("entries", [])
        for e in excs:
            if e.get("type") == "exception" and e.get("data", {}).get("values"):
                for val in e["data"]["values"]:
                    frames = (val.get("stacktrace") or {}).get("frames") or []
                    if frames:
                        lines.append("**Stacktrace (آخر إطارات):**")
                        lines.append("```")
                        for f in frames[-15:]:
                            fn = f.get("function") or "?"
                            mod = f.get("module") or f.get("filename") or ""
                            lineno = f.get("lineNo") or "?"
                            lines.append(f"  {mod}:{lineno} in {fn}")
                        lines.append("```")
                        return "\n".join(lines)
    return "\n".join(lines)


def main():
    if not SENTRY_TOKEN or not GH_TOKEN:
        print("FATAL: missing SENTRY_AUTH_TOKEN or GH_TOKEN env vars")
        sys.exit(1)

    print(f"Threshold: {THRESHOLD} | Dry-run: {DRY_RUN} | Org/Project: {ORG}/{PROJECT}")
    ensure_label()

    issues = sentry_issues_list()
    if not issues:
        print("No unresolved Sentry issues found. Nothing to sync.")
        return

    mapped = existing_gh_issues()

    created, skipped = 0, 0
    for issue in issues:
        url = issue["permalink"]
        count = int(issue.get("count", 0))
        if count < THRESHOLD:
            continue
        if url in mapped:
            print(f"SKIP (gh issue #{mapped[url]} exists): {issue['title']} (x{count})")
            skipped += 1
            continue

        # جلب أول حدث للحصول على stacktrace
        events = sentry_get(f"/issues/{issue['id']}/events/?limit=1") or []
        body = build_gh_body(issue, events)
        title = f"[Sentry x{count}] {issue['title'][:200]}"

        if DRY_RUN:
            print(f"WOULD CREATE: #{title} — count={count}")
            continue

        r = github_post(
            f"/repos/{REPO}/issues",
            {"title": title, "body": body, "labels": [LABEL_NAME]},
        )
        if r.status_code == 201:
            num = r.json()["number"]
            print(f"CREATED GitHub #{num}: {title}")
            created += 1
        else:
            print(f"ERROR creating issue: {r.status_code} {r.text[:300]}")

    print(f"\nDone: created={created}, skipped(existing)={skipped}")


if __name__ == "__main__":
    main()
