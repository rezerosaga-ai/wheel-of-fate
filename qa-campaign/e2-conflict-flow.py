"""
E2 Conflict Room verification — سيناريو مخصص لمرحلة E (Conflict Room UI).
يتبع منهجية Repair Lab: محاكاة قبل اللمس الحقيقي.
الخطوات:
  1) ABDO ينشئ غرفة، ANFAL تنضم (عبر harness Player).
  2) محاولة إجبار الحالة إلى conflict عبر debug endpoint (لا يعدّل feature — فقط حالة غرفة اختبار).
  3) التحقق من: شاشة «غرفة التفاهم»، textarea، تناوب الأدوار، اتفاق +3 Love، العودة للسؤال.
  4) refresh أثناء conflict.
التقرير: E2-CONFLICT-VERIFICATION.json (+ screenshots في evidence-e2/)
"""
import asyncio
import json
import os
import sys

import aiohttp

sys.path.insert(0, os.path.dirname(__file__))
import importlib.util
_spec = importlib.util.spec_from_file_location("harness_local", os.path.join(os.path.dirname(__file__), "harness-local.py"))
hl = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(hl)
Player, ts, norm, BASE = hl.Player, hl.ts, hl.norm, hl.BASE  # noqa: E402

EVID = os.path.join(os.path.dirname(__file__), "evidence-e2")
os.makedirs(EVID, exist_ok=True)
REPORT = []


def check(tc, client, expected, actual, status):
    entry = {"test_id": tc, "client": client, "expected": expected,
             "actual": actual, "status": status, "ts": ts()}
    REPORT.append(entry)
    print(f"[{tc}] {client}: {status} — expected={expected} | actual={actual}")
    return status == "PASS"


async def fetch_gs(code):
    async with aiohttp.ClientSession() as s:
        async with s.get(BASE + f"/api/room/{code}/state") as r:
            return (await r.json()).get("gameState", {})


async def send_conflict_step(code, player_id, text):
    async with aiohttp.ClientSession() as s:
        async with s.post(BASE + f"/api/room/{code}/action", json={
            "type": "conflict_step", "playerId": player_id, "text": text}) as r:
            return r.status, await r.json()


async def fetch_players(code):
    """جلب معرفي اللاعبين: debug-state POST بجسم فارغ يعيد room + gameState."""
    async with aiohttp.ClientSession() as s:
        async with s.post(BASE + f"/api/room/{code}/debug-state", json={}) as r:
            data = await r.json()
        return data.get("room") or {}


async def force_conflict(code):
    """تحديث حالة الغرفة الاختبارية مباشرة إلى phase=conflict (مراقبة/اختبار فقط)."""
    payload = {
        "phase": "conflict",
        "currentPlayerIdx": 0,
        "conflictCount": 2,
        "conflictDialogueCount": 0,
        "conflictAgreed": False,
        "conflictReplyText": None,
        "conflictTopics": ["التوتر"],
    }
    async with aiohttp.ClientSession() as s:
        async with s.post(BASE + f"/api/room/{code}/debug-state", json=payload) as r:
            return r.status, await r.json()


async def main():
    from playwright.async_api import async_playwright
    abdo = Player("ABDO", "😂\nمرحة وخفيفة", {"width": 390, "height": 844})
    anf = Player("ANFAL", "🥹\nهادئة وعاطفية", {"width": 375, "height": 812})
    abdo.player_id = None
    anf.player_id = None
    async with async_playwright() as pw:
        await abdo.launch(pw)
        await anf.launch(pw)
        await abdo.goto("/")
        await abdo.pass_age_gate()
        await anf.goto("/")
        await anf.pass_age_gate()

        # ---------- غرفة جديدة ----------
        s = await abdo.set_name_and_mood()
        code = s["room"]["code"]
        print("ROOM CODE:", code)
        await anf.join_room(code)
        await abdo.wait_for("ابدأ اللعبة", timeout_ms=40000)
        ok1 = await abdo.wait_for("ABDO", timeout_ms=10000)
        ok2 = await anf.wait_for("أنفال", timeout_ms=10000)
        check("E2-01-room", "both", "غرفة ثنائية نشطة",
              f"ABDO={ok1}, ANFAL={ok2}", "PASS" if (ok1 and ok2) else "FAIL")

        # ---------- إجبار حالة conflict ----------
        dbg_status, dbg = await force_conflict(code)
        print("debug-state:", dbg_status, dbg)
        # معرفا اللاعبين (لخطوة E2-10 عبر API)
        try:
            pids = await fetch_players(code)
            abdo.player_id = pids.get("player1Id") or abdo.player_id
            anf.player_id = pids.get("player2Id") or anf.player_id
        except Exception as ex:
            print("warn: fetch_players failed", ex)

        await abdo.page.wait_for_timeout(5000)
        abdo_txt = await abdo.visible_text()
        anf_txt = await anf.visible_text()
        check("E2-02-conflict-ui-abdo", "ABDO",
              "شاشة غرفة التفاهم + مربع الرد",
              f"conflict={'غرفة التفاهم' in abdo_txt}, replybox={'اكتب ما في قلبك' in abdo_txt}",
              "PASS" if "غرفة التفاهم" in abdo_txt else "FAIL")
        check("E2-03-conflict-ui-anfal", "ANFAL",
              "نفس الشاشة للطرف الآخر",
              f"visible={'غرفة التفاهم' in anf_txt}",
              "PASS" if "غرفة التفاهم" in anf_txt else "FAIL")
        await abdo.snapshot("conflict-abdo")
        await anf.snapshot("conflict-anfal")

        # ---------- رد ABDO ----------
        ta = abdo.page.locator("textarea").last
        await ta.fill("أشعر أن أسئلتنا الأخيرة كانت قاسية، أريد أن نفهم بعضنا أكثر.")
        await abdo.click_text("أرسل الرد", wait_after=4000)
        gs1 = await fetch_gs(code)
        check("E2-04-reply-swaps-turn", "ABDO",
              "conflictDialogueCount=1، دور ANFAL (idx=1)",
              f"count={gs1.get('conflictDialogueCount')}, idx={gs1.get('currentPlayerIdx')}",
              "PASS" if gs1.get("conflictDialogueCount") == 1 and gs1.get("currentPlayerIdx") == 1 else "FAIL")

        # ---------- رد ANFAL ----------
        await anf.page.wait_for_timeout(2500)
        ta2 = anf.page.locator("textarea").last
        await ta2.fill("أوافقك، دعنا نتكلم بصراحة ثم نكمل.")
        await anf.page.get_by_text("أرسل الرد").first.click()
        await anf.page.wait_for_timeout(4000)
        gs2 = await fetch_gs(code)
        check("E2-05-anfal-replies", "ANFAL",
              "conflictDialogueCount=2",
              f"count={gs2.get('conflictDialogueCount')}",
              "PASS" if gs2.get("conflictDialogueCount") == 2 else "FAIL")

        # ---------- زر الاتفاق ----------
        await anf.page.wait_for_timeout(1500)
        agree_anf = await anf.page.get_by_text("فهمنا بعضنا").count() > 0
        await abdo.page.wait_for_timeout(1500)
        agree_abd = await abdo.page.get_by_text("فهمنا بعضنا").count() > 0
        check("E2-06-agree-button", "both",
              "زر «فهمنا بعضنا» بعد حوار الطرفين",
              f"ABDO={agree_abd}, ANFAL={agree_anf}",
              "PASS" if (agree_abd and agree_anf) else "FAIL")

        # ---------- الاتفاق: +3 Love Counter ----------
        lc_before = gs2.get("loveCounter") or 0
        await anf.page.get_by_text("فهمنا بعضنا").first.click()
        await anf.page.wait_for_timeout(4000)
        gs3 = await fetch_gs(code)
        check("E2-07-agree-love", "ANFAL",
              "conflictAgreed=true و loveCounter=+3",
              f"agreed={gs3.get('conflictAgreed')}, love={lc_before}->{gs3.get('loveCounter')}",
              "PASS" if gs3.get("conflictAgreed") and gs3.get("loveCounter") == lc_before + 3 else "FAIL")

        # ---------- متابعة السؤال ----------
        await anf.page.get_by_text("متابعة السؤال").first.click()
        await anf.page.wait_for_timeout(6000)
        gs4 = await fetch_gs(code)
        check("E2-08-conflict-next", "ANFAL",
              "العودة إلى question مع نفس السؤال",
              f"phase={gs4.get('phase')}, qid={gs4.get('currentQuestionId')}",
              "PASS" if gs4.get("phase") == "question" else "FAIL")

        # ---------- refresh أثناء conflict ----------
        # نعيد الحالة إلى conflict للتحقق من refresh/reconnect
        await force_conflict(code)
        await abdo.page.wait_for_timeout(4000)
        t9 = await abdo.visible_text()
        await abdo.refresh("during-conflict")
        t10 = await abdo.visible_text()
        check("E2-09-refresh-conflict", "ABDO",
              "غرفة التفاهم تبقى ظاهرة بعد refresh",
              f"before={'غرفة التفاهم' in t9}, after={'غرفة التفاهم' in t10}",
              "PASS" if ("غرفة التفاهم" in t10) else "FAIL")

        # ---------- إكمال الجولة بعد refresh (إعادة بناء agreed state) ----------
        try:
            # حوار ABDO ثم ANFAL عبر API (UI محجوز — السيناريو اختبر التناوب سابقًا)
            st1, _ = await send_conflict_step(code, abdo.player_id, "بعد الراحة أريد أن أؤكد أنني هنا معك.")
            await abdo.page.wait_for_timeout(2000)
            st2, _ = await send_conflict_step(code, anf.player_id, "وأنا معك أيضًا، شكرًا لصدقك.")
            await abdo.page.wait_for_timeout(2500)
            # زر الاتفاق + متابعة
            await abdo.page.get_by_text("فهمنا بعضنا").first.click()
            await abdo.page.wait_for_timeout(3000)
            await abdo.page.get_by_text("متابعة السؤال").first.click()
            await abdo.page.wait_for_timeout(5000)
            gs5 = await fetch_gs(code)
            check("E2-10-back-to-game", "ABDO",
                  "العودة للجولة بعد refresh",
                  f"phase={gs5.get('phase')}",
                  "PASS" if gs5.get('phase') == "question" else "FAIL")
        except Exception as e:
            check("E2-10-back-to-game", "ABDO", "العودة للجولة بعد refresh",
                  f"err={str(e)[:80]}", "FAIL")

        # ---------- التقرير ----------
        summary = {
            "title": "E2 CONFLICT ROOM VERIFICATION",
            "run_at": ts(),
            "room_code": code,
            "dbg_endpoint": {"status": dbg_status, "response": dbg},
            "checks": REPORT,
            "critical_failures": [r["test_id"] for r in REPORT if r["status"] == "FAIL"],
            "final_status": "VERIFIED" if all(r["status"] == "PASS" for r in REPORT) else "NOT_VERIFIED",
        }
        out = os.path.join(os.path.dirname(__file__), "E2-CONFLICT-VERIFICATION.json")
        with open(out, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        print("\nFINAL:", summary["final_status"], "— critical:", summary["critical_failures"])
        print("Report:", out)

        await abdo.close()
        await anf.close()


if __name__ == "__main__":
    asyncio.run(main())
