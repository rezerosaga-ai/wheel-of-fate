#!/usr/bin/env python3
"""Conflict-only fast run v2: يصل إلى Conflict Room بأكبر قدر API وأقل قدر متصفح.

تحسينات v2: دعم spin_question، fallback API spin، timeouts صريحة على كل عملية،
safe_fill_click، loop مخفف (18 دورة × 500ms) لتجنب Page crash تحت ضغط RAM.
"""
import asyncio, json, os, sys, time
sys.path.insert(0, '/home/ubuntu/wheel-of-fate-restored/qa-campaign')
os.chdir('/home/ubuntu/wheel-of-fate-restored/qa-campaign')

from playwright.async_api import async_playwright

BASE = 'http://localhost:13000'
EVID = os.path.expanduser('~/wheel-of-fate-restored/qa-campaign/evidence')
os.makedirs(EVID, exist_ok=True)

def ts(): return time.strftime('%Y-%m-%d %H:%M:%S')
def log(t): print(f"[{ts()}] {t}", flush=True)

STATE_JS = """async () => {
    const m = location.pathname.match(String.raw`/room/([A-Z0-9]{6})`);
    if (!m) return null;
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), 10000);
    let r;
    try { r = await fetch('/api/room/' + m[1] + '/state', {signal: ctl.signal}); }
    finally { clearTimeout(tid); }
    if (!r) return null;
    return await r.json();
}"""

ACTION_JS = """async (b) => {
    const m = location.pathname.match(String.raw`/room/([A-Z0-9]{6})`);
    if (!m) return {status: 0, err: 'no room'};
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), 10000);
    let r;
    try {
        r = await fetch('/api/room/' + m[1] + '/action', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(b), signal: ctl.signal});
    } finally { clearTimeout(tid); }
    if (!r) return {status: 0, err: 'fetch timeout'};
    const d = await r.json();
    return {status: r.status, phase: (d.gameState || {}).phase, gameState: d.gameState || {}};
}"""

LS_JS = "() => { const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); try { out[k] = JSON.parse(localStorage.getItem(k)); } catch(e) { out[k] = localStorage.getItem(k); } } return out; }"

class P:
    def __init__(self, name, vp):
        self.name = name; self.vp = vp; self._my_pid = None
    async def launch(self, pw):
        self.browser = await pw.chromium.launch(headless=True, args=["--disable-dev-shm-usage", "--js-flags=--max-old-space-size=512"])
        self.page = await self.browser.new_page(viewport=self.vp, locale="ar", timezone_id="Asia/Riyadh")
        await self.page.goto(BASE + '/', wait_until="domcontentloaded", timeout=40000)
    async def pass_age(self):
        try: await self.page.get_by_text("نعم", exact=False).first.click(timeout=4000); await self.page.wait_for_timeout(500)
        except Exception: pass
    async def set_name(self):
        await self.page.get_by_text("ابدأ لعبة جديدة").click()
        await self.page.wait_for_timeout(2500)
        filled = False
        for i in range(4):
            try:
                await self.page.locator("input").first.fill(self.name)
                filled = True; break
            except Exception:
                await self.page.wait_for_timeout(1500)
        if not filled: raise RuntimeError(f"{self.name}: لم يُملأ حقل الاسم")
        mood_clicked = False
        for label in ["😂\nمرحة وخفيفة", "😂", "مرحة وخفيفة", "🎲", "مفاجأة"]:
            try:
                await self.page.get_by_text(label).first.click()
                mood_clicked = True; log(f"{self.name} mood={label}"); break
            except Exception:
                continue
        if not mood_clicked:
            try:
                await self.page.get_by_role("button").nth(1).click()
                mood_clicked = True
            except Exception:
                log(f"{self.name}: mood fallback skipped")
        await self.page.wait_for_timeout(500)
        await self.page.get_by_text("إنشاء الغرفة").click()
        await self.page.wait_for_timeout(5000)
        s = await self.state()
        ls = await self.page.evaluate(LS_JS)
        pid = self._extract_pid(ls, s)
        self._my_pid = pid
        log(f"{self.name} created, pid={pid}")
        return s
    def _extract_pid(self, ls, s):
        wp = ls.get("wof-player")
        if isinstance(wp, dict):
            sp = (wp.get("state") or {}).get("player") or {}
            if isinstance(sp.get("id"), str) and sp["id"].startswith("p_"):
                return sp["id"]
        for k, v in ls.items():
            if isinstance(v, dict) and v is not wp:
                for cand in ("id", "playerId", "pid"):
                    if isinstance(v.get(cand), str) and v[cand].startswith("p_"):
                        return v[cand]
        if s:
            rm = (s or {}).get("room") or {}
            if rm.get("player1Name") == self.name: return rm.get("player1Id")
            if rm.get("player2Name") == self.name: return rm.get("player2Id")
        return None
    async def resolve_pid(self, s):
        ls = await self.page.evaluate(LS_JS)
        self._my_pid = self._extract_pid(ls, s)
        log(f"{self.name} pid={self._my_pid}")
        return self._my_pid
    async def state(self):
        try: return await self.page.evaluate(STATE_JS)
        except Exception as e:
            log(f"{self.name} state err: {str(e)[:60]}")
            return None
    async def action(self, t, payload=None):
        body = {"type": t, "playerId": self._my_pid}
        if payload: body.update(payload)
        try: return await self.page.evaluate(ACTION_JS, body)
        except Exception as e:
            log(f"{self.name} action err: {str(e)[:60]}")
            return {"status": 0, "err": str(e)[:60]}
    async def snap(self, tag):
        try:
            await self.page.screenshot(path=f"{EVID}/{self.name.lower()}_conflict_{tag}.png")
        except Exception: pass
    async def safe_fill_click(self, text):
        """تعبئة والإرسال مع timeouts صريحة."""
        ta = self.page.locator("textarea").first
        visible = False
        try:
            await ta.wait_for(state="visible", timeout=5000)
            visible = True
        except Exception:
            pass
        if not visible:
            ta = self.page.locator("input[type='text']").first
            await ta.wait_for(state="visible", timeout=5000)
        await ta.fill(text, timeout=10000)
        await self.page.wait_for_timeout(300)
        try:
            await self.page.locator("button[type='submit']").first.click(timeout=10000)
        except Exception:
            await self.page.get_by_role("button").first.click(timeout=10000)
    async def safe_click(self, text, timeout=6000):
        await self.page.get_by_text(text).first.click(timeout=timeout)

async def main():
    results = {"tests": [{"name": "conflict_room_fast", "status": "BLOCKED"}]}
    st = results["tests"][0]
    abdo = None; anfal = None
    try:
        async with async_playwright() as pw:
            abdo = P("ABDO", {"width": 390, "height": 844})
            anfal = P("ANFAL", {"width": 390, "height": 844})
            await abdo.launch(pw); await anfal.launch(pw)
            await abdo.pass_age(); await anfal.pass_age()
            s = await abdo.set_name()
            code = (s or {}).get("room", {}).get("code")
            if not code:
                st["reason"] = "no room code"; st["status"] = "FAIL"; return results
            st["room_code"] = code
            log(f"room code = {code}")
            # انضمام أنفال عبر الرابط المباشر
            await anfal.page.goto(BASE + '/room/' + code, wait_until="domcontentloaded", timeout=40000)
            await anfal.pass_age()
            await anfal.page.wait_for_timeout(2000)
            for i in range(4):
                try:
                    await anfal.page.locator("input").first.fill("أنفال"); break
                except Exception:
                    await anfal.page.wait_for_timeout(1000)
            await anfal.page.wait_for_timeout(400)
            try: await anfal.page.get_by_text("دخول").first.click()
            except Exception: await anfal.page.keyboard.press("Enter")
            await anfal.page.wait_for_timeout(5000)
            s = await anfal.state()
            await anfal.resolve_pid(s)
            log(f"ANFAL joined, pid={anfal._my_pid}")

            async def cur_player(s):
                gs = (s or {}).get("gameState") or {}
                rm = (s or {}).get("room") or {}
                cpi = gs.get("currentPlayerIdx")
                pids = [rm.get("player1Id"), rm.get("player2Id")]
                if cpi is not None and len(pids) > cpi and pids[cpi]:
                    return (abdo if abdo._my_pid == pids[cpi] else anfal)
                return abdo

            async def advance_spin():
                """لف العجلة لصاحب الدور — UI أولًا ثم API fallback. يدعم كل spin phases."""
                for attempt in range(12):
                    s2 = await abdo.state()
                    gs2 = (s2 or {}).get("gameState") or {}
                    who = await cur_player(s2)
                    ph2 = gs2.get("phase")
                    if ph2 not in ("spin_start", "spin_category", "spin_question", "pick_category", "pick_question"):
                        return ph2
                    acted = False
                    try:
                        _c = await who.page.get_by_text("🎡 أدر العجلة!").count()
                        if ph2 in ("spin_start", "spin_category", "spin_question") and _c > 0:
                            try:
                                await who.page.get_by_text("🎡 أدر العجلة!").first.click(timeout=3000)
                                acted = True
                            except Exception:
                                acted = False
                        if ph2 == "pick_category":
                            cats = gs2.get("categories") or gs2.get("wheelCategories") or []
                            if cats:
                                try:
                                    await who.page.get_by_text(str(cats[0])).first.click(timeout=3000)
                                    acted = True
                                except Exception:
                                    acted = False
                        if ph2 == "pick_question":
                            try:
                                await who.page.get_by_text("اختر السؤال").first.click(timeout=3000)
                                acted = True
                            except Exception:
                                qnum = gs2.get("pickedQuestion") or gs2.get("questionIndex") or 0
                                if who._my_pid:
                                    r = await who.action("pick_question", {"questionIndex": qnum if isinstance(qnum, int) else 0})
                                    if r.get("status") == 200: acted = True
                        if not acted and who._my_pid:
                            r = await who.action("spin")
                            if r.get("status") == 200: acted = True
                    except Exception as e:
                        log(f"spin exc {str(e)[:60]}")
                        acted = False
                    if not acted and who._my_pid and ph2 in ("spin_start", "spin_category", "spin_question"):
                        r = await who.action("spin")
                        if r.get("status") == 200: acted = True
                    await who.page.wait_for_timeout(800)
                    if acted and attempt >= 1:
                        break
                s2 = await abdo.state()
                return ((s2 or {}).get("gameState") or {}).get("phase")

            # الدورة الرئيسية: question → reaction (weak) → round_end → تكرار حتى conflict
            rounds_done = 0
            for step in range(35):
                await abdo.page.wait_for_timeout(500)
                s = await abdo.state()
                if s is None:
                    log("state=None — retry next cycle")
                    continue
                gs = (s or {}).get("gameState") or {}
                ph = gs.get("phase")
                st[f"phase_obs_{step}"] = ph
                log(f"step{step} phase={ph} cc={gs.get('conflictCount')}")
                if ph == "conflict":
                    break
                if ph in ("spin_start", "spin_category", "spin_question", "pick_category", "pick_question"):
                    await advance_spin()
                elif ph == "question":
                    if not gs.get("currentAnswer"):
                        # UI يعرض textarea الإجابة للطرف غير صاحب الدور العام.
                        # الإجابة تُرسل عبر API مباشرة (موثوق ومُختبر — curl نجح 200→reaction).
                        who = await cur_player(s)
                        partner = anfal if who is abdo else abdo
                        if partner._my_pid:
                            r = await partner.action("answer", {"answer": "لا أتفق مع هذا الرأي إطلاقًا، كلامك غير منطقي."})
                            st["answer_sent_by"] = partner.name
                            st["answer_ok"] = (r.get("status") == 200 and (r.get("phase") or "").startswith(("reaction", "rating")))
                            log(f"{partner.name} answer: ok={st['answer_ok']} (status={r.get('status')})")
                        else:
                            st["answer_fail"] = "no partner pid"
                            log("no partner pid — answer skipped")
                elif ph == "reaction" and gs.get("currentAnswer") and not gs.get("reactionDone"):
                    who = await cur_player(s)
                    r = await who.action("react_barf")
                    st[f"weak_by_{who.name}"] = r.get("status")
                    log(f"{who.name} react_barf: {r.get('status')}")
                    await who.page.wait_for_timeout(500)
                    r2 = await who.action("end_round")
                    st[f"endround_by_{who.name}"] = r2.get("status")
                    log(f"{who.name} end_round: {r2.get('status')} phase={r2.get('phase')}")
                    rounds_done += 1
                    if (gs.get("conflictCount") or 0) >= 2:
                        break
                elif ph == "round_end":
                    who = await cur_player(s)
                    try:
                        await who.page.get_by_text("▶ الجولة التالية").first.click(timeout=5000)
                        st["next_round_ui_by"] = who.name
                        log(f"{who.name} next round UI")
                    except Exception:
                        if who._my_pid:
                            r = await who.action("next_round")
                            log(f"{who.name} next_round API: {r.get('status')}")
                elif ph == "rating":
                    who = await cur_player(s)
                    try:
                        await who.page.locator("input[type='range'], [role='slider']").first.click(timeout=5000)
                        await who.page.wait_for_timeout(300)
                        await who.page.get_by_role("button").first.click(timeout=5000)
                        st["rating_by"] = who.name
                        log(f"{who.name} rating done")
                    except Exception as e:
                        st["rating_fail"] = str(e)[:60]
                        log(f"rating fail: {str(e)[:60]}")
                else:
                    log(f"unknown phase {ph}")
            s = await abdo.state()
            gs = (s or {}).get("gameState") or {}
            st["phase_after_loops"] = gs.get("phase")
            st["conflictCount_final"] = gs.get("conflictCount")
            st["rounds_done"] = rounds_done
            log(f"after loops: phase={gs.get('phase')} conflictCount={gs.get('conflictCount')}")
            # التحقق من دخول Conflict Room
            if gs.get("phase") == "conflict":
                st["conflict_entered"] = True
                # حوار متناوب عبر API (الدور المتناوب: currentPlayerIdx الحالي أولًا)
                s0 = await abdo.state()
                gs0 = (s0 or {}).get("gameState") or {}
                first, second = (abdo, anfal) if (gs0.get("currentPlayerIdx") or 0) == 0 else (anfal, abdo)
                for i, player in enumerate((first, second)):
                    txt = "أشعر بالانزعاج من ما قلته، أريد أن نفهم بعضنا." if player.name == "ABDO" else "أعتذر، لم أكن أقصد جرحك."
                    if not player._my_pid:
                        st[f"dialogue_fail_{player.name}"] = "no pid"
                        continue
                    r = await player.action("conflict_step", {"text": txt})
                    ok = r.get("status") == 200
                    st[f"dialogue_by_{player.name}"] = ok
                    log(f"{player.name} dialogue: {r.get('status')}/{r.get('error') or 'ok'}")
                    await player.page.wait_for_timeout(800)
                # الاتفاق المتبادل: 🤝
                ag = await anfal.action("conflict_agree")
                st["agreed_by_ANFAL"] = (ag.get("status") == 200)
                st["agreed_confirmed"] = ag.get("status") == 200 and ((ag.get("gameState") or {}).get("conflictAgreed") is True)
                log(f"ANFAL agree: {ag.get('status')}/{ag.get('error') or 'ok'}")
                await anfal.page.wait_for_timeout(600)
                ag2 = await abdo.action("conflict_agree")
                st["agreed_by_ABDO"] = (ag2.get("status") == 200)
                log(f"ABDO agree: {ag2.get('status')}/{ag2.get('error') or 'ok'}")
                await abdo.page.wait_for_timeout(600)
                # العودة لسؤال المتابعة
                nx = await anfal.action("conflict_next")
                st["conflict_next"] = (nx.get("status") == 200)
                log(f"conflict_next: {nx.get('status')}/{nx.get('error') or 'ok'}")
                s = await abdo.state()
                gs2 = (s or {}).get("gameState") or {}
                st["phase_after_agree"] = gs2.get("phase")
                st["loveCounter_after"] = gs2.get("loveCounter")
                log(f"after agree: phase={gs2.get('phase')} loveCounter={gs2.get('loveCounter')} cc={gs2.get('conflictCount')}")
                # ── assertions النهائية: السلسلة العاطفية كاملة ──
                checks = [
                    (gs.get("phase") == "conflict", "entered conflict room"),
                    ((gs.get("conflictCount") or 0) >= 2, "conflictCount >= 2"),
                    (bool(st.get("dialogue_by_ABDO")), "ABDO dialogue sent"),
                    (bool(st.get("dialogue_by_ANFAL")), "ANFAL dialogue sent"),
                    (bool(st.get("agreed_by_ANFAL")), "ANFAL agreed"),
                    (bool(st.get("agreed_confirmed")), "conflictAgreed=True after agree"),
                    (bool(st.get("conflict_next")), "conflict_next sent"),
                    (gs2.get("phase") == "question", "back to question"),
                    (gs2.get("conflictCount") == 0, "conflictCount reset"),
                    ((gs2.get("loveCounter") or 0) >= (gs.get("loveCounter") or 0) + 3, "loveCounter +3"),
                ]
                failed = [label for ok, label in checks if not ok]
                if not failed:
                    st["status"] = "PASS"
                    log("ALL CHECKS PASSED ✅")
                else:
                    st["status"] = "FAIL"
                    st["reason"] = "; ".join(failed)
                    log(f"FAILED: {', '.join(failed)}")
    except Exception as ex:
        st['crash_reason'] = str(ex)[:200]
        st['status'] = 'FAIL'
        log(f"CRASH: {str(ex)[:200]}")
    return results

def report(res):
    print("\n===== CONFLICT RUN SUMMARY =====")
    for t in res["tests"]:
        print(f"- {t['name']}: {t['status']}" + (f" ({t.get('reason')})" if t.get("reason") else ""))
    with open("timeline-conflict.json", "w") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    res = asyncio.run(main())
    report(res)
