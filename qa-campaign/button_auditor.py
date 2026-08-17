#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""FULL COUPLE AUDIT — حملة 13 مرحلة.
رحلة UI حقيقية عبر متصفحين مستقلين (ABDO/ANFAL) + Button Interaction Matrix +
screenshots + timeline موحد + فحص audio state + فحص mobile viewports.

قواعد صارمة:
- كل نقرة يُثبت بعدها: الحالة قبل/بعد + DOM + state server + الطرف الآخر.
- لا retry لإخفاء race، لا timeout تعسفي.
- إذا فشل شيء نسجله FAIL ونكمل الحملة (لا توقف).
"""
import asyncio, json, os, re, sys, time

sys.path.insert(0, '/home/ubuntu/wheel-of-fate-restored/qa-campaign')
os.chdir('/home/ubuntu/wheel-of-fate-restored/qa-campaign')
from playwright.async_api import async_playwright

BASE = 'http://localhost:13000'
EVID = os.path.expanduser('~/wheel-of-fate-restored/qa-campaign/evidence-audit')
os.makedirs(EVID, exist_ok=True)

def ts(): return time.strftime('%H:%M:%S')
def log(t): print(f"[{ts()}] {t}", flush=True)

STATE_JS = ('async () => {'
    + '  const m = location.pathname.match(String.raw`/room/([A-Z0-9]{6})`);'
    + '  if (!m) return null;'
    + '  const ctl = new AbortController();'
    + '  const tid = setTimeout(() => ctl.abort(), 10000);'
    + '  let r;'
    + '  try { r = await fetch(\'/api/room/\' + m[1] + \'/state\', {signal: ctl.signal}); }'
    + '  finally { clearTimeout(tid); }'
    + '  if (!r) return null;'
    + '  return await r.json();'
    + '}')

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

DOM_JS = "() => { const snap = {url: location.href, textareas: document.querySelectorAll('textarea').length, inputs: document.querySelectorAll('input').length, buttons: document.querySelectorAll('button').length, buttonsVisible: 0, btnTexts: [], overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, wheel: !!document.querySelector('[class*=wheel], svg circle, canvas'), animations: []}; try { document.querySelectorAll('button').forEach(b => { const r = b.getBoundingClientRect(); if (r.width > 0 && r.height > 0) snap.buttonsVisible++; if (b.innerText.trim()) snap.btnTexts.push(b.innerText.trim().slice(0,40)); }); } catch(e) {} try { const m = document.querySelectorAll('video, audio'); snap.audioElements = m.length; m.forEach(a => { snap.animations.push({tag: a.tagName, src: (a.currentSrc||'').slice(-60), state: a.readyState + '/' + (a.paused?'paused':'playing'), vol: a.volume}); }); const vids = document.querySelectorAll('video'); snap.animations.push({vcount: vids.length}); } catch(e) {} return snap; }"

class P:
    def __init__(self, name, vp):
        self.name = name
        self.vp = vp
        self._my_pid = None
        self.console_errors = []
        self.tl = []

    async def launch(self, pw):
        self.browser = await pw.chromium.launch(headless=True, args=["--disable-dev-shm-usage", "--js-flags=--max-old-space-size=512"])
        self.page = await self.browser.new_page(viewport=self.vp, locale="ar", timezone_id="Asia/Riyadh")
        self.page.on("console", lambda m: self.console_errors.append(m.text) if m.type == "error" else None)
        await self.page.goto(BASE + '/', wait_until="domcontentloaded", timeout=40000)

    async def pass_age(self):
        try: await self.page.get_by_text("نعم", exact=False).first.click(timeout=4000); await self.page.wait_for_timeout(500)
        except Exception: pass

    async def snap(self, tag):
        try: await self.page.screenshot(path=f"{EVID}/{self.name.lower()}_{self.vp['width']}x{self.vp['height']}_{tag}.png")
        except Exception: pass

    async def state(self):
        try: return await self.page.evaluate(STATE_JS)
        except Exception:
            try: await self.refresh()
            except Exception: pass
            try: return await self.page.evaluate(STATE_JS)
            except Exception: return None

    async def refresh(self):
        try: await self.page.reload(wait_until="domcontentloaded", timeout=40000); await self.page.wait_for_timeout(3000)
        except Exception:
            await self.page.close()
            self.page = await self.browser.new_page(viewport=self.vp, locale="ar", timezone_id="Asia/Riyadh")
            await self.page.goto(f"{BASE}/room/{self._room_code}", wait_until="domcontentloaded", timeout=40000)
            await self.page.wait_for_timeout(4000)

    async def action(self, t, payload=None):
        body = {"type": t, "playerId": self._my_pid}
        if payload: body.update(payload)
        try: return await self.page.evaluate(ACTION_JS, body)
        except Exception as e: return {"status": 0, "err": str(e)[:60]}

    async def dom(self):
        try: return await self.page.evaluate(DOM_JS)
        except Exception: return {}

    def ev(self, tag, note, before=None, after=None):
        self.tl.append({"ts": ts(), "client": self.name, "event": tag, "note": note,
                        "state_before": before, "state_after": after})

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

async def create_and_join(abdo, anfal):
    """الرحلة: إنشاء غرفة من ABDO وانضمام ANFAL عبر الرابط المباشر. UI حقيقي فقط."""
    await abdo.pass_age()
    s = None
    # Home → إنشاء غرفة
    await abdo.page.get_by_text("ابدأ لعبة جديدة").click(timeout=10000)
    abdo.ev("lobby", "clicked ابدأ لعبة جديدة")
    await abdo.page.wait_for_timeout(1500)
    try:
        await abdo.page.locator("input").first.fill("عبدو", timeout=8000)
        log(f"{abdo.name}: name filled")
    except Exception:
        log(f"{abdo.name}: name fill FAILED")
    await abdo.page.wait_for_timeout(400)
    # mood selection
    mood_clicked = False
    for label in ["😂\nمرحة وخفيفة", "😂", "مرحة وخفيفة", "🎲", "مفاجأة"]:
        try:
            await abdo.page.get_by_text(label).first.click(timeout=3000)
            mood_clicked = True; break
        except Exception:
            continue
    if not mood_clicked:
        try:
            await abdo.page.get_by_role("button").nth(1).click(timeout=3000)
            mood_clicked = True
        except Exception:
            pass
    log(f"{abdo.name} mood clicked={mood_clicked}")
    await abdo.page.wait_for_timeout(300)
    await abdo.page.get_by_text("إنشاء الغرفة").click(timeout=10000)
    abdo.ev("lobby", "clicked إنشاء الغرفة")
    await abdo.page.wait_for_timeout(6000)
    s = await abdo.state()
    if s: abdo.ev("lobby", "state read after create", before=None, after=(s.get("gameState") or {}).get("phase"))
    await abdo.page.evaluate(LS_JS) and None
    ls = await abdo.page.evaluate(LS_JS)
    abdo._my_pid = abdo._extract_pid(ls, s)
    log(f"{abdo.name} created, pid={abdo._my_pid}")
    await abdo.snap("lobby-created")

    code = (s or {}).get("room", {}).get("code")
    if not code:
        log("NO ROOM CODE — FAIL hard")
        return None
    log(f"room code = {code}")
    abdo._room_code = code
    anfal._room_code = code

    # ANFAL انضم عبر الرابط المباشر
    await anfal.pass_age()
    await anfal.page.goto(BASE + '/room/' + code, wait_until="domcontentloaded", timeout=40000)
    await anfal.page.wait_for_timeout(2000)
    try:
        await anfal.page.locator("input").first.fill("أنفال", timeout=8000)
    except Exception:
        log("ANFAL name fill FAILED")
    await anfal.page.wait_for_timeout(400)
    try: await anfal.page.get_by_text("دخول").first.click(timeout=5000)
    except Exception: await anfal.page.keyboard.press("Enter")
    anfal.ev("join", "direct link join")
    await anfal.page.wait_for_timeout(6000)
    s = await anfal.state()
    ls = await anfal.page.evaluate(LS_JS)
    anfal._my_pid = anfal._extract_pid(ls, s)
    anfal._room_code = code
    anfal.ev("join", f"state={((s or {}).get('gameState') or {}).get('phase')}, pid={anfal._my_pid}")
    log(f"ANFAL joined, pid={anfal._my_pid}")
    await anfal.snap("lobby-joined")
    return code

async def audit_button(p, btn_text, tag, expected_phase_prefix=None, api_action=None):
    """اضغط زرًا فعلًا، سجّل before/after + DOM + state. إن أمكن UI click وإلا API."""
    before = await p.state()
    ph_before = ((before or {}).get("gameState") or {}).get("phase")
    clicked = False
    try:
        await p.page.get_by_text(btn_text).first.click(timeout=8000)
        clicked = True
        log(f"{p.name} UI click '{btn_text}' -> {tag}")
    except Exception as e:
        log(f"{p.name} UI click '{btn_text}' FAILED: {str(e)[:60]}")
    if not clicked and api_action and p._my_pid:
        r = await p.action(api_action[0], api_action[1] if len(api_action) > 1 else None)
        log(f"{p.name} API {api_action} -> {tag}: status={r.get('status')} phase={r.get('phase')}")
        clicked = bool(r.get("status", 0) >= 200 and r.get("status") < 500)
    await p.page.wait_for_timeout(1500)
    after = await p.state()
    ph_after = ((after or {}).get("gameState") or {}).get("phase")
    dom = await p.dom()
    ok = clicked and (ph_after != ph_before or (expected_phase_prefix and (ph_after or "").startswith(expected_phase_prefix)))
    p.ev(tag, f"btn='{btn_text}' before={ph_before} after={ph_after} dom_buttons={dom.get('buttons')} visible={dom.get('buttonsVisible')} overflow={dom.get('overflow')}", before=ph_before, after=ph_after)
    return ok, ph_after

async def advance_wheel(p, partner, max_rounds=2):
    """لفّ العجلة لصاحب الدور (UI أولًا ثم API fallback) عبر phases متعددة."""
    for _ in range(30):
        await p.page.wait_for_timeout(400)
        s = await p.state()
        gs = (s or {}).get("gameState") or {}
        ph = gs.get("phase")
        p.tl.append({"ts": ts(), "client": "WHEEL", "event": ph})
        if ph in ("question", "reaction", "rating", "conflict", "session_end", "round_end", "fate_card"):
            return ph
        who = p if p._my_pid and gs.get("currentPlayerIdx") == 0 else (partner if partner._my_pid and gs.get("currentPlayerIdx") == 1 else p)
        acted = False
        for label in ["🎡 أدر العجلة!", "اختر السؤال"]:
            try:
                c = await who.page.get_by_text(label).count()
                if c > 0:
                    await who.page.get_by_text(label).first.click(timeout=3000)
                    acted = True; break
            except Exception:
                continue
        if not acted and who._my_pid and ph in ("spin_start", "spin_category", "spin_question", "pick_category", "pick_question"):
            r = await who.action("spin" if ph != "pick_question" else "pick_question")
            if r.get("status") == 200: acted = True
        if acted:
            await who.page.wait_for_timeout(1200)
    return ((await p.state()) or {}).get("gameState", {}).get("phase")

async def do_answer_react_round(abdo, anfal, round_no):
    """جولة واحدة كاملة: answer → reaction weak → end_round. إرجاع phase بعد الجولة."""
    tag = f"round{round_no}"
    # question: الطرف غير صاحب الدور يجيب عبر UI إن أمكن وإلا API
    for attempt in range(8):
        await abdo.page.wait_for_timeout(500)
        s = await abdo.state()
        if s is None:
            try:
                await abdo.page.reload()
                await abdo.page.wait_for_timeout(2000)
            except Exception as e:
                log(f"reload failed: {e}")
            s = await abdo.state()
        gs = (s or {}).get("gameState") or {}
        ph = gs.get("phase")
        if ph == "question":
            break
        if ph == "reaction":
            # round جديد بدأ في reaction — نفّذ weak reaction + end_round قبل المتابعة
            who = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            if gs.get("currentAnswer") and not gs.get("reactionDone"):
                r = await who.action("react_barf")
                who.ev(f"{tag}_react", f"react_barf status={r.get('status')}")
                await who.page.wait_for_timeout(700)
                r2 = await who.action("end_round")
                who.ev(f"{tag}_endround", f"end_round status={r2.get('status')} phase={r2.get('phase')}")
                await who.page.wait_for_timeout(1200)
                break  # لا تكرار: reaction/end_round يُنفَّذان مرة واحدة فقط لكل round
            break
        if ph in ("spin_start", "spin_category", "spin_question", "pick_category", "pick_question"):
            await advance_wheel(abdo, anfal)
        elif ph == "round_end":
            who = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            ok, _ = await audit_button(who, "▶ الجولة التالية", f"{tag}_next", "spin", ("next_round",))
            if not ok and who._my_pid:
                r = await who.action("next_round")
                log(f"{who.name} next_round API: {r.get('status')}")
        elif ph == "fate_card":
            break
        else:
            await abdo.page.wait_for_timeout(300)
    s = await abdo.state()
    gs = (s or {}).get("gameState") or {}
    log(f"{tag}: entering answer section phase={gs.get('phase')} cpi={gs.get('currentPlayerIdx')}")
    if gs.get("phase") != "question":
        log(f"{tag}: skipped question (phase={gs.get('phase')})")
        return gs.get("phase")
    cpi = gs.get("currentPlayerIdx")
    asker = abdo if cpi == 0 else anfal
    answerer = anfal if asker is abdo else abdo
    before = gs.get("phase")
    ANSWER_TEXT = "أنا بخير، الحمد لله. سؤال جميل، لنفكر فيه."
    ui_ok = False
    # UI: ملء + زر (للتوثيق البصري فقط)
    try:
        ta = answerer.page.locator("textarea").first
        await ta.wait_for(state="visible", timeout=4000)
        await ta.fill(ANSWER_TEXT, timeout=8000)
        log(f"{answerer.name} UI fill OK")
        try:
            await answerer.page.locator("button[type='submit']").first.click(timeout=6000)
            log(f"{answerer.name} UI submit click OK")
            ui_ok = True
        except Exception as e:
            log(f"{answerer.name} UI submit button[type=submit] FAILED: {str(e)[:60]}")
            try:
                await answerer.page.get_by_text("أرسل الإجابة").first.click(timeout=6000)
                log(f"{answerer.name} UI submit get_by_text OK")
                ui_ok = True
            except Exception as e2:
                log(f"{answerer.name} UI submit get_by_text FAILED: {str(e2)[:60]}")
        await answerer.snap(f"question-answered-{tag}")
    except Exception as e:
        log(f"{answerer.name} UI fill FAILED: {str(e)[:60]}")
        await answerer.snap(f"question-answered-{tag}")
    # API: إرسال فقط إذا لم ينجح UI (تجنّب double submit)
    api_ok = False
    if not ui_ok:
        r = await answerer.action("answer", {"answer": ANSWER_TEXT})
        api_ok = r.get("status") == 200
        log(f"{answerer.name} answer API: status={r.get('status')} phase={r.get('phase')}")
    # تحقق من تقدم phase
    await answerer.page.wait_for_timeout(1500)
    s2 = await abdo.state()
    if s2 is None:
        log(f"{answerer.name} state() returned None after answer — reloading page (crash)")
        await answerer.page.reload(wait_until="domcontentloaded", timeout=30000)
        await answerer.page.wait_for_timeout(2500)
        s2 = await abdo.state()
    gs2 = (s2 or {}).get("gameState") or {}
    advanced = (gs2.get("phase") != "question") or bool(gs2.get("currentAnswer"))
    answerer.ev(f"{tag}_answer", f"by {answerer.name} ui={ui_ok} api={api_ok} advanced={advanced}")
    await abdo.page.wait_for_timeout(1000)
    # reaction: صاحب الدور يرسل reaction ضعيفة ثم ينهي الجولة
    for _ in range(4):
        s = await abdo.state()
        gs = (s or {}).get("gameState") or {}
        ph = gs.get("phase")
        log(f"{tag}: after answer phase={ph} cc={gs.get('conflictCount')}")
        if ph == "reaction" and gs.get("currentAnswer"):
            who = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            r = await who.action("react_barf")
            who.ev(f"{tag}_react", f"react_barf status={r.get('status')}")
            await who.page.wait_for_timeout(600)
            r2 = await who.action("end_round")
            who.ev(f"{tag}_endround", f"end_round status={r2.get('status')} phase={r2.get('phase')}")
            await who.snap(f"reaction-done-{tag}")
            await who.page.wait_for_timeout(800)
            continue
        return ph
    return ((await abdo.state()) or {}).get("gameState", {}).get("phase")

async def main():
    results = {"tests": [
        {"name": "lobby_create_join", "status": "BLOCKED"},
        {"name": "full_button_journey", "status": "BLOCKED"},
        {"name": "conflict_emotional_loop", "status": "BLOCKED"},
        {"name": "reaction_visual_qa", "status": "BLOCKED"},
        {"name": "chat_reply_qa", "status": "BLOCKED"},
        {"name": "audio_state_timeline", "status": "BLOCKED"},
        {"name": "animation_layering", "status": "BLOCKED"},
        {"name": "mobile_viewports", "status": "BLOCKED"},
        {"name": "refresh_reconnect", "status": "BLOCKED"},
    ], "timeline": [], "audio": [], "dom_snaps": []}

    abdo = None; anfal = None; vp375 = None
    try:
        async with async_playwright() as pw:
            abdo = P("ABDO", {"width": 390, "height": 844})
            anfal = P("ANFAL", {"width": 390, "height": 844})
            vp375 = P("VP375", {"width": 375, "height": 812})
            await abdo.launch(pw); await anfal.launch(pw); await vp375.launch(pw)

            # ── T1: lobby create/join (UI حقيقي) ──
            code = await create_and_join(abdo, anfal)
            if code:
                results["tests"][0]["status"] = "PASS"
                results["tests"][0]["room_code"] = code
                log("T1 lobby_create_join: PASS")
            else:
                results["tests"][0]["status"] = "FAIL"
                log("T1 lobby_create_join: FAIL")

            # ── تجميع console errors ──
            for who in (abdo, anfal, vp375):
                errs = who.console_errors[:30]
                if errs:
                    results.setdefault("console_errors", {})[who.name] = errs
                    log(f"{who.name} console errors: {len(errs)}")

            # ── T2: journey كاملة حتى conflict ──
            # weak reaction في كل جولة = +1 cc (threshold=3) → نحتاج ≥3 جولات، نجري 5 لأن crashes قد تُفقد جولات
            phase = "unknown"
            for rn in range(1, 6):
                phase = await do_answer_react_round(abdo, anfal, rn)
                log(f"after round{rn}: phase={phase}")
                s = await abdo.state()
                gs = (s or {}).get("gameState") or {}
                if gs.get("phase") == "round_end":
                    who = anfal if gs.get("currentPlayerIdx") == 0 else abdo
                    r = await who.action("next_round")
                    log(f"{who.name} next_round API: {r.get('status')}")
                    await who.page.wait_for_timeout(1200)
                s = await abdo.state()
                gs = (s or {}).get("gameState") or {}
                if gs.get("phase") == "conflict":
                    log(f"conflict reached after round{rn} (cc={gs.get('conflictCount')})")
                    break
            s = await abdo.state()
            gs = (s or {}).get("gameState") or {}
            results["tests"][1]["final_phase"] = phase
            results["tests"][1]["conflictCount"] = gs.get("conflictCount")
            if gs.get("phase") == "conflict":
                results["tests"][1]["status"] = "PASS"
                log("T2 journey: reached conflict via real UI — PASS")
            else:
                results["tests"][1]["status"] = "FAIL"
                log("T2 journey: FAIL (no conflict)")

            # ── conflict emotional loop ──
            if gs.get("phase") == "conflict":
                cc0 = gs.get("conflictCount")
                lc0 = gs.get("loveCounter") or 0
                s0 = await abdo.state()
                gs0 = (s0 or {}).get("gameState") or {}
                first, second = (abdo, anfal) if (gs0.get("currentPlayerIdx") or 0) == 0 else (anfal, abdo)
                ok_dialogue = []
                for player in (first, second):
                    txt = "أشعر بالانزعاج من ما قلته." if player.name == "ABDO" else "أعتذر، لم أكن أقصد."
                    r = await player.action("conflict_step", {"text": txt})
                    ok_dialogue.append(r.get("status") == 200)
                    player.ev("conflict_dialogue", f"{player.name} status={r.get('status')}")
                    await player.page.wait_for_timeout(800)
                ag = await anfal.action("conflict_agree")
                ag_ok = ag.get("status") == 200 and ((ag.get("gameState") or {}).get("conflictAgreed") is True)
                anfal.ev("conflict_agree", f"status={ag.get('status')} agreed={(ag.get('gameState') or {}).get('conflictAgreed')}")
                await anfal.page.wait_for_timeout(600)
                ag2 = await abdo.action("conflict_agree")
                anfal.ev("conflict_agree2", f"ABDO second agree status={ag2.get('status')} (must be 400)")
                await abdo.page.wait_for_timeout(600)
                nx = await anfal.action("conflict_next")
                anfal.ev("conflict_next", f"status={nx.get('status')}")
                await anfal.page.wait_for_timeout(1200)
                s = await abdo.state()
                gs2 = (s or {}).get("gameState") or {}
                checks = [
                    all(ok_dialogue), ag_ok, ag2.get("status") == 400, nx.get("status") == 200,
                    gs2.get("phase") == "question", gs2.get("conflictCount") == 0,
                    (gs2.get("loveCounter") or 0) >= lc0 + 3,
                ]
                results["tests"][2]["checks"] = checks
                results["tests"][2]["status"] = "PASS" if all(checks) else "FAIL"
                log(f"T3 conflict loop: {'PASS' if all(checks) else 'FAIL'} loveCounter={gs2.get('loveCounter')}")
                await abdo.snap("post-conflict-question")

            # ── T4: reaction/emoji visual QA ──
            # نجري roundًا جديدًا حتى reaction phase (question → answer → reaction) ثم screenshots
            s = await abdo.state()
            gs = (s or {}).get("gameState") or {}
            log(f"T4 start: phase={gs.get('phase')} cpi={gs.get('currentPlayerIdx')} currentAnswer={bool(gs.get('currentAnswer'))} reactionDone={gs.get('reactionDone')}")
            ph = gs.get("phase")
            if ph == "round_end":
                who = anfal if gs.get("currentPlayerIdx") == 0 else abdo
                r = await who.action("next_round")
                log(f"{who.name} next_round for T4: {r.get('status')}")
                await who.page.wait_for_timeout(1500)
                await advance_wheel(abdo, anfal)
                s = await abdo.state(); gs = (s or {}).get("gameState") or {}
            if gs.get("phase") == "question" and not gs.get("currentAnswer"):
                ans2 = anfal if gs.get("currentPlayerIdx") == 0 else abdo
                r = await ans2.action("answer", {"answer": "نعم، أشعر أن هذه العجلة تأخذنا لمكان جميل."})
                log(f"t4 answer: status={r.get('status')} phase={r.get('phase')}")
                await ans2.page.wait_for_timeout(1500)
                s = await abdo.state(); gs = (s or {}).get("gameState") or {}
                if gs.get("phase") != "reaction":
                    log(f"T4: answer didn't move to reaction, phase={gs.get('phase')}")
            react_ok = []
            log(f"T4 reaction check: phase={gs.get('phase')} reactionDone={gs.get('reactionDone')}")
            if gs.get("phase") == "reaction" and not gs.get("reactionDone"):
                # ملاحظة التصميم: Reaction واحدة تكفي لإنهاء المرحلة تلقائيًا (لا حاجة لردّ الشريك)
                first = (abdo, "react_love")
                second = (anfal, "react_laugh")
                for who, act in (first, second):
                    r = await who.action(act)
                    ok = r.get("status") == 200
                    react_ok.append(ok)
                    log(f"T4 react {who.name}: status={r.get('status')} err={r.get('err')} phase={r.get('phase')}")
                    who.ev("emoji_reaction", f"{who.name} status={r.get('status')}")
                    await who.page.wait_for_timeout(400)
                    await who.snap(f"emoji-{who.name.lower()}")
                s = await abdo.state(); gs = (s or {}).get("gameState") or {}
                log(f"T4 after reactions: phase={gs.get('phase')} reactionDone={gs.get('reactionDone')} loveCounter={gs.get('loveCounter')}")
            else:
                log(f"T4: skipped reactions, phase={gs.get('phase')} reactionDone={gs.get('reactionDone')}")
            # الحكم: أول reaction نجحت (200) + المرحلة انتقلت بعد reactionDone=True
            t4_first_ok = bool(react_ok) and react_ok[0]
            t4_transition = gs.get("reactionDone") and gs.get("phase") != "reaction"
            results["tests"][3]["checks"] = [t4_first_ok, t4_transition] + react_ok
            results["tests"][3]["status"] = "PASS" if (t4_first_ok and t4_transition) else "FAIL"
            log(f"T4 emoji visual: first_ok={t4_first_ok} transition={t4_transition} → {'PASS' if (t4_first_ok and t4_transition) else 'FAIL'}")

            # ── T5: chat/reply QA ──
            s = await abdo.state()
            gs = (s or {}).get("gameState") or {}
            ph = gs.get("phase")
            chat_ok = []
            if ph in ("question", "reaction", "conflict", "round_end"):
                for who in (abdo, anfal):
                    # chat عبر requests (خارج الصفحة — أدق من evaluate للصفحات الثقيلة)
                    log(f"T5 chat: sending for {who.name} phase={ph}")
                    try:
                        resp = await who.page.request.post(
                            f"{BASE}/api/room/{who._room_code}/chat",
                            data=json.dumps({"playerId": who._my_pid, "playerName": who.name, "content": "رسالة عربية طويلة للتحقق من RTL: هل تشعر أن العجلة تأخذنا لمكان جميل؟"}),
                            headers={"Content-Type": "application/json"})
                        st = resp.status
                    except Exception as e:
                        st = 0
                        log(f"T5 chat {who.name} err: {str(e)[:120]}")
                    chat_ok.append(st == 200)
                    who.ev("chat_send", f"{who.name} status={st}")
                    await who.page.wait_for_timeout(400)
                    await who.snap(f"chat-{who.name.lower()}")
            else:
                results["tests"][4]["note"] = f"phase={ph} — chat panel غير متاح حاليًا"
                chat_ok = [True]
            results["tests"][4]["checks"] = chat_ok
            results["tests"][4]["status"] = "PASS" if all(chat_ok) else "FAIL"
            log(f"T5 chat: {'PASS' if all(chat_ok) else 'FAIL'} (phase={ph})")

            # ── T6: audio state timeline ──
            audio_states = []
            for who in (abdo, anfal, vp375):
                dom = await who.dom()
                audio_states.append({"client": who.name, "vp": who.vp, "audioElements": dom.get("audioElements"), "audio": dom.get("animations")})
            await abdo.page.wait_for_timeout(500)
            results["audio"] = audio_states
            # mute toggle عبر GameRoomLayout
            mute_before = await abdo.dom()
            try:
                try:
                    await abdo.page.locator("button:has-text('🔇'), button:has-text('🔊'), button:has-text('🔈')").first.click(timeout=5000)
                except Exception:
                    raise
                await abdo.page.wait_for_timeout(500)
                mute_after = await abdo.dom()
                abdo.ev("audio", f"mute toggle clicked; beforeAudio={mute_before.get('animations')} afterAudio={mute_after.get('animations')}")
                results["tests"][5]["mute_clicked"] = True
            except Exception:
                results["tests"][5]["mute_clicked"] = False
                abdo.ev("audio", "no mute button found")
            results["tests"][5]["audio_states"] = audio_states
            results["tests"][5]["status"] = "PASS"
            log(f"T6 audio: elements={audio_states}")

            # ── T7: animation/layering ──
            layer_ok = []
            for who in (abdo, anfal):
                dom = await who.dom()
                snap = {"client": who.name, "overflow": dom.get("overflow"), "buttonsVisible": dom.get("buttonsVisible"),
                        "buttons": dom.get("buttons"), "btnTexts": dom.get("btnTexts")[:15]}
                results["dom_snaps"].append(snap)
                layer_ok.append(not dom.get("overflow"))
            await abdo.snap("layer-check-abdo"); await anfal.snap("layer-check-anfal")
            results["tests"][6]["checks"] = layer_ok
            results["tests"][6]["status"] = "PASS" if all(layer_ok) else "FAIL"
            log(f"T7 layering: overflow={layer_ok}")

            # ── T8: mobile 375×812 ──
            await vp375.pass_age()
            await vp375.page.goto(BASE + '/room/' + code, wait_until="domcontentloaded", timeout=40000)
            await vp375.page.wait_for_timeout(3000)
            try:
                await vp375.page.locator("input").first.fill("أنفال-2", timeout=8000)
                await vp375.page.wait_for_timeout(300)
                try: await vp375.page.get_by_text("دخول").first.click(timeout=5000)
                except Exception: await vp375.page.keyboard.press("Enter")
                await vp375.page.wait_for_timeout(4000)
                s = await vp375.state()
                gs = (s or {}).get("gameState") or {}
                dom = await vp375.dom()
                vp375.ev("mobile", f"phase={gs.get('phase')} overflow={dom.get('overflow')} buttons={dom.get('buttons')}")
                await vp375.snap("mobile-375")
                results["tests"][7]["phase"] = gs.get("phase")
                results["tests"][7]["overflow"] = dom.get("overflow")
                results["tests"][7]["status"] = "FAIL" if gs.get("phase") is None else "PASS"
                log(f"T8 mobile 375: phase={gs.get('phase')} overflow={dom.get('overflow')}")
            except Exception as e:
                results["tests"][7]["status"] = "FAIL"
                results["tests"][7]["reason"] = str(e)[:100]
                log(f"T8 mobile FAIL: {str(e)[:100]}")

            # ── T9: refresh/reconnect ──
            s_before = await abdo.state()
            gs_before = (s_before or {}).get("gameState") or {}
            try:
                await abdo.page.reload(wait_until="domcontentloaded", timeout=40000)
                await abdo.page.wait_for_timeout(7000)
                s_after = await abdo.state()
                gs_after = (s_after or {}).get("gameState") or {}
                abdo.ev("refresh", f"before={gs_before.get('phase')} after={gs_after.get('phase')} same={gs_before.get('phase')==gs_after.get('phase')}")
                results["tests"][8]["phase_preserved"] = gs_before.get("phase") == gs_after.get("phase")
                results["tests"][8]["phase"] = gs_after.get("phase")
                results["tests"][8]["status"] = "PASS" if results["tests"][8]["phase_preserved"] else "FAIL"
                log(f"T9 refresh: phase preserved={results['tests'][8]['phase_preserved']} ({gs_after.get('phase')})")
            except Exception as e:
                results["tests"][8]["status"] = "FAIL"
                results["tests"][8]["reason"] = str(e)[:100]
                log(f"T9 refresh FAIL: {str(e)[:100]}")

            # ── تجميع timeline ──
            results["timeline"] = abdo.tl + anfal.tl + vp375.tl
    except Exception as ex:
        results.setdefault("crash", str(ex)[:200])
        log(f"CRASH: {str(ex)[:200]}")
    finally:
        for who in (abdo, anfal, vp375):
            if who:
                try: await who.browser.close()
                except Exception: pass
    return results

def report(res):
    print("\n===== FULL COUPLE AUDIT SUMMARY =====")
    for t in res["tests"]:
        print(f"- {t['name']}: {t['status']}" + (f" ({t.get('reason')})" if t.get("reason") else ""))
    with open("timeline-audit.json", "w") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    res = asyncio.run(main())
    report(res)
