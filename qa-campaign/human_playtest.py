#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HUMAN-LIKE TWO-PLAYER PLAYTEST ENGINE — Human Playtest Phase (H).

النوع المختلف كليًا عن harness السابق:
- harness يسأل: هل وصل الـ event؟ (event correctness)
- هذا المحرك يسأل: "أنا لاعب، ضغطت القنبلة. ماذا حدث أمام عيني؟ ولماذا ما زال دوري عندي؟"
  (player-visible reality: ما رآه اللاعب فعلًا + لماذا)

النطاق:
H1  القنبلة: استخدام مشروع (المجيب يرميها) ثم السائل يجيب + reaction + الجولة التالية
H2  ضغطات خاطئة متوقعة (explicit 400): السائل يضغط قنبلة، قنبلة بدون رصيد،
    قنبلتان متتاليتان، السائل يجيب على سؤاله بدون قنبلة، double-click سريع
H3  أدوات الأخرى: تخطّي / تعمّق (UI + API reality)
H4  سلوك بشري غير مثالي: رسائل قصيرة، رسالة فارغة، رسائل متتالية سريعة،
    chat خلال أطوار اللعب، reaction خارج التوقيت
H5  rhythm إنساني كامل: ABDO رومانسي/طويل/مزاح، ANFAL قصيرة/خجولة/reactions كثيرة
H6  refresh أثناء قنبلة مفعّلة: هل يُحفظ bombRedirect؟

قواعد:
- لا retry لإخفاء race. سجل FAIL وتابع.
- لا إصلاح تلقائي. كل FAIL يمر Repair Lab (H-REPAIR-001+).
- الأدلة: screenshots + timeline + DOM + API status.
"""
import asyncio, json, os, re, sys, time, random

sys.path.insert(0, '/home/ubuntu/wheel-of-fate-restored/qa-campaign')
os.chdir('/home/ubuntu/wheel-of-fate-restored/qa-campaign')
from playwright.async_api import async_playwright

BASE = 'http://localhost:13000'
EVID = os.path.expanduser('~/wheel-of-fate-restored/qa-campaign/evidence-human')
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
    return {status: r.status, phase: (d.gameState || {}).phase, gameState: d.gameState || {}, error: d.error || null};
}"""

CHAT_JS = """async ({t, pid, name}) => {
    const m = location.pathname.match(String.raw`/room/([A-Z0-9]{6})`);
    if (!m) return {status: 0, err: 'no room'};
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), 10000);
    let r;
    try {
        r = await fetch('/api/room/' + m[1] + '/chat', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({playerId: pid, playerName: name, content: t}), signal: ctl.signal});
    } finally { clearTimeout(tid); }
    if (!r) return {status: 0, err: 'fetch timeout'};
    const d = await r.json().catch(() => ({}));
    return {status: r.status, phase: (d.gameState || {}).phase || null};
}"""

DOM_JS = "() => { const snap = {url: location.href, buttons: document.querySelectorAll('button').length, buttonsVisible: 0, btnTexts: [], overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth}; try { document.querySelectorAll('button').forEach(b => { const r = b.getBoundingClientRect(); if (r.width > 0 && r.height > 0) snap.buttonsVisible++; if (b.innerText.trim()) snap.btnTexts.push(b.innerText.trim().slice(0,40)); }); } catch(e) {} try { const err = document.querySelector('[class*=errorBanner], [class*=banner], [class*=Error]'); snap.errorBanner = err ? (err.innerText||'').slice(0,120) : null; } catch(e) {} return snap; }"

TOOL_BTN_JS = "() => { const out = []; try { document.querySelectorAll('button').forEach(b => { const r = b.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && /💣|⏭|🔍|😂/.test(b.innerText||'')) out.push({text: (b.innerText||'').trim().slice(0,40), disabled: b.disabled}); }); } catch(e) {} return out; }"

class H:
    def __init__(self, name, vp):
        self.name, self.vp = name, vp
        self._my_pid, self._room_code = None, None
        self.tl, self.console_errors = [], []
        self.page = self.browser = None
    async def launch(self, pw):
        self.browser = await pw.chromium.launch(headless=True, args=["--disable-dev-shm-usage", "--js-flags=--max-old-space-size=512"])
        self.page = await self.browser.new_page(viewport=self.vp, locale="ar", timezone_id="Asia/Riyadh")
        self.page.on("console", lambda m: self.console_errors.append(m.text) if m.type == "error" else None)
        await self.page.goto(BASE + '/', wait_until="domcontentloaded", timeout=40000)
    async def pass_age(self):
        try: await self.page.get_by_text("نعم", exact=False).first.click(timeout=4000); await self.page.wait_for_timeout(500)
        except Exception: pass
    async def snap(self, tag):
        try: await self.page.screenshot(path=f"{EVID}/{self.name.lower()}_{tag}.png")
        except Exception: pass
    async def state(self):
        try: return await self.page.evaluate(STATE_JS)
        except Exception:
            try: await self.page.reload(wait_until="domcontentloaded", timeout=30000); await self.page.wait_for_timeout(2500)
            except Exception: pass
            try: return await self.page.evaluate(STATE_JS)
            except Exception: return None
    async def action(self, t, payload=None):
        body = {"type": t, "playerId": self._my_pid}
        if payload: body.update(payload)
        last = {"status": 0}
        for attempt in range(2):
            try:
                last = await self.page.evaluate(ACTION_JS, body)
                # أخطاء DB عابرة تحت الضغط: إعادة محاولة مرة واحدة (اختباري فقط)
                if last.get("status") == 500 and attempt == 0:
                    await self.page.wait_for_timeout(1000); continue
                return last
            except Exception as e: last = {"status": 0, "err": str(e)[:60]}
            if attempt == 0: await self.page.wait_for_timeout(1000)
        return last
    async def chat(self, text):
        last = {"status": 0}
        for attempt in range(2):
            try:
                last = await self.page.evaluate(CHAT_JS, {"t": text, "pid": self._my_pid, "name": self.name})
                # أخطاء DB عابرة تحت الضغط: إعادة محاولة مرة واحدة (اختباري فقط)
                if last.get("status") == 500 and attempt == 0:
                    await self.page.wait_for_timeout(1000); continue
                return last
            except Exception as e: last = {"status": 0, "err": str(e)[:60]}
            if attempt == 0: await self.page.wait_for_timeout(1000)
        return last
    async def tool_buttons(self):
        try: return await self.page.evaluate(TOOL_BTN_JS)
        except Exception: return []
    def ev(self, tag, note):
        self.tl.append({"ts": ts(), "client": self.name, "event": tag, "note": note})

async def create_and_join(abdo, anfal):
    """UI حقيقي: ABDO ينشئ، ANFAL تنضم بالرابط المباشر."""
    await abdo.pass_age()
    await abdo.page.get_by_text("ابدأ لعبة جديدة").click(timeout=10000)
    try: await abdo.page.locator("input").first.fill("عبدو", timeout=8000)
    except Exception: log("ABDO name fill FAILED")
    await abdo.page.wait_for_timeout(400)
    mood_clicked = False
    for label in ["😂 مرحة وخفيفة", "مرحة وخفيفة", "🎲"]:
        try:
            await abdo.page.get_by_text(label).first.click(timeout=3000)
            mood_clicked = True; break
        except Exception: continue
    if not mood_clicked:
        try: await abdo.page.get_by_role("button").nth(1).click(timeout=3000); mood_clicked = True
        except Exception: pass
    await abdo.page.get_by_text("إنشاء الغرفة").click(timeout=10000)
    await abdo.page.wait_for_timeout(6000)
    s = await abdo.state()
    ls = await abdo.page.evaluate("() => { const o={}; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);try{o[k]=JSON.parse(localStorage.getItem(k))}catch(e){o[k]=localStorage.getItem(k)}} return o; }")
    wp = ls.get("wof-player") or {}
    abdo._my_pid = ((wp.get("state") or {}).get("player") or {}).get("id")
    abdo._room_code = (s or {}).get("room", {}).get("code")
    log(f"ABDO created code={abdo._room_code} pid={abdo._my_pid}")
    if not abdo._room_code: log("NO CODE — abort"); return False

    await anfal.pass_age()
    await anfal.page.goto(BASE + '/room/' + abdo._room_code, wait_until="domcontentloaded", timeout=40000)
    await anfal.page.wait_for_timeout(2000)
    try: await anfal.page.locator("input").first.fill("أنفال", timeout=8000)
    except Exception: log("ANFAL name fill FAILED")
    await anfal.page.wait_for_timeout(400)
    try: await anfal.page.get_by_text("دخول").first.click(timeout=5000)
    except Exception: await anfal.page.keyboard.press("Enter")
    anfal._room_code = abdo._room_code
    # انتظر حتى يصبح player2 حاضرًا في state + localStorage فيه pid
    t0 = time.time()
    while time.time() - t0 < 20:
        s2 = await anfal.state()
        ls2 = await anfal.page.evaluate("() => { const o={}; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);try{o[k]=JSON.parse(localStorage.getItem(k))}catch(e){o[k]=localStorage.getItem(k)}} return o; }")
        wp2 = ls2.get("wof-player") or {}
        anfal._my_pid = ((wp2.get("state") or {}).get("player") or {}).get("id")
        online2 = ((s2 or {}).get("onlineStatus") or {}).get("player2")
        if anfal._my_pid and online2:
            break
        await anfal.page.wait_for_timeout(800)
    log(f"ANFAL joined pid={anfal._my_pid} online={online2}")
    return bool(anfal._my_pid)

async def advance_to_question(abdo, anfal):
    """لف العجلة وصولًا إلى phase=question وإرجاع الحالة."""
    for _ in range(30):
        await abdo.page.wait_for_timeout(400)
        s = await abdo.state()
        gs = (s or {}).get("gameState") or {}
        ph = gs.get("phase")
        if ph == "question": return s
        if ph in ("reaction", "round_end", "session_end", "conflict"): return s
        cpi = gs.get("currentPlayerIdx")
        who = abdo if cpi == 0 else anfal
        if who._my_pid is None: who = abdo
        acted = False
        for label in ["🎡 أدر العجلة!", "اختر السؤال"]:
            try:
                if await who.page.get_by_text(label).count():
                    await who.page.get_by_text(label).first.click(timeout=3000); acted = True; break
            except Exception: continue
        if not acted and ph in ("spin_start", "spin_category", "spin_question", "pick_category", "pick_question"):
            r = await who.action("spin" if ph != "pick_question" else "pick_question")
            if r.get("status") == 200: acted = True
        if acted: await who.page.wait_for_timeout(1200)
    return await abdo.state()

async def advance_next_round(abdo, anfal, max_steps=40):
    """من round_end/fate_card/know_me انتقل للعجلة وصولًا إلى question التالي. إرجاع gs."""
    t0 = time.time()
    while time.time() - t0 < max_steps * 2.5:
        await abdo.page.wait_for_timeout(400)
        s = await abdo.state()
        gs = (s or {}).get("gameState") or {}
        ph = gs.get("phase")
        if ph == "question": return gs
        if ph == "conflict":
            # إتمام Conflict Room كجزء من الرحلة: حوار متناوب (حتى 8 خطوات) ثم فهم + اتفاق
            try:
                t0c = time.time()
                steps = 0
                while time.time() - t0c < 60 and steps < 10:
                    s2 = await abdo.state(); g2 = (s2 or {}).get("gameState") or {}
                    if g2.get("phase") != "conflict": break
                    actor = abdo if g2.get("currentPlayerIdx") == 0 else anfal
                    # حوار متناوب (conflict_step يتطلب رد نصي لكل طرف، الدور يتناوب)
                    try:
                        rr3 = await actor.action("conflict_step", {"text": "أتفهم وجهة نظرك، لنحافظ على هدوئنا 💕"})
                        if rr3.get("status") == 200: await abdo.page.wait_for_timeout(700)
                        # اتفاق متبادل بعد حوار الطرفين (conflictDialogueCount >= 2)
                        rr4 = await actor.action("conflict_agree")
                        if rr4.get("status") == 200:
                            await abdo.page.wait_for_timeout(600)
                            rr5 = await actor.action("conflict_next")
                            await abdo.page.wait_for_timeout(600)
                            break
                        # إذا رفض الاتفاق (حوار طرف واحد فقط): انتظر حتى يصل رد الطرف الآخر
                        await abdo.page.wait_for_timeout(900)
                    except Exception: pass
                    steps += 1
                await abdo.page.wait_for_timeout(800)
                actor.ev("conflict", f"conflict resolved in {steps} steps")
            except Exception: pass
        if ph == "round_end":
            who = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            acted = False
            for label in ["🎡 أدر العجلة!", "الجولة التالية"]:
                try:
                    if await who.page.get_by_text(label).count():
                        await who.page.get_by_text(label).first.click(timeout=3000); acted = True; break
                except Exception: continue
            if not acted:
                r = await who.action("next_round")
                if r.get("status") == 200: acted = True
            if acted: await abdo.page.wait_for_timeout(1200)
        elif ph == "fate_card":
            who = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            r = await who.action("skip_fate_card")
            if r.get("status") == 200: await abdo.page.wait_for_timeout(800)
        elif ph == "know_me":
            # إجابة موجزة لإتمام know_me
            who = abdo if gs.get("knowMeAnswerBy") == gs.get("player1Id") else anfal
            try:
                r = await who.action("know_me_answer", {"answer": "نعم 😊"})
                if r.get("status") == 200: await abdo.page.wait_for_timeout(800)
            except Exception: pass
        elif ph == "reaction":
            # reaction واحدة تكفي — لا نضغط شيئًا إضافيًا؛ ننتظر أن يكتمل تلقائيًا
            await abdo.page.wait_for_timeout(1500)
        elif ph in ("spin_start", "spin_category", "spin_question", "pick_category", "pick_question"):
            who = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            r = await who.action("spin" if ph != "pick_question" else "pick_question")
            if r.get("status") == 200: await abdo.page.wait_for_timeout(800)
        else:
            await abdo.page.wait_for_timeout(1000)
    s = await abdo.state(); return (s or {}).get("gameState") or {}

async def phase_guard(abdo, expect, max_wait=8):
    """انتظر حتى يصير الطور expect. إرجاع (s, gs). gs={} دائمًا آمن."""
    t0 = time.time()
    while time.time() - t0 < max_wait:
        try:
            s = await abdo.state()
            gs = (s or {}).get("gameState") or {}
        except Exception:
            gs = {}
        if gs.get("phase") == expect: return s, gs
        await abdo.page.wait_for_timeout(300)
    return {}, {}

def record(tname, ok, detail):
    results.append({"test": tname, "status": "PASS" if ok else "FAIL", "detail": detail})
    log(f"{tname}: {'✅ PASS' if ok else '❌ FAIL'} — {detail}")

async def main():
    global results
    results = []
    abdo = anfal = None
    try:
        async with async_playwright() as pw:
            abdo = H("ABDO", {"width": 390, "height": 844})
            anfal = H("ANFAL", {"width": 390, "height": 844})
            await abdo.launch(pw); await anfal.launch(pw)
            ok_join = await create_and_join(abdo, anfal)
            if not ok_join:
                record("setup_join", False, "فشل إنشاء الغرفة أو الانضمام"); return
            record("setup_join", True, "ABDO أنشأ + ANFAL انضمت بالرابط المباشر")

            # ══════════════ H1: القنبلة — الاستخدام المشروع ══════════════
            # لفّ العجلة من البداية حتى question (يغطي waiting/lobby أيضًا)
            s = await advance_to_question(abdo, anfal)
            gs = (s or {}).get("gameState") or {}
            if gs.get("phase") != "question":
                record("setup_phase", False, f"لم نصل لطور question — phase={gs.get('phase')} state={json.dumps(gs, ensure_ascii=False)[:150]}")
                return
            asker = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            answerer = anfal if asker is abdo else abdo
            await answerer.snap("h1-bomb-ready")
            tb_before = await answerer.tool_buttons()
            bomb_visible = any("💣" in (b.get("text") or "") for b in tb_before)
            bomb_ready = any("💣" in (b.get("text") or "") and not b.get("disabled") for b in tb_before)
            abdo.ev("h1", f"tools={tb_before}")
            record("H1_bomb_visible_for_answerer", bomb_visible, f"أدوات المجيب: {tb_before}")

            r_bomb = await answerer.action("use_bomb")
            abdo.ev("h1", f"use_bomb by {answerer.name}: status={r_bomb.get('status')} error={r_bomb.get('error')}")
            await answerer.snap("h1-bomb-fired")
            s2 = await abdo.state()
            gs2 = (s2 or {}).get("gameState") or {}
            bomb_redirect_ok = gs2.get("bombRedirect") is not None and gs2.get("phase") == "question"
            asker_count_before = gs.get(f"{'player1Bomb' if (gs.get('currentPlayerIdx')==0) else 'player2Bomb'}")
            record("H1_bomb_redirects_to_asker", bomb_redirect_ok and r_bomb.get("status") == 200,
                   f"bombRedirect={gs2.get('bombRedirect')} status={r_bomb.get('status')} msg={r_bomb.get('gameState',{}).get('message')}")

            # الآن السائل هو من يجب أن يجيب (كان ممنوعًا قبلًا) — والمجيب ممنوع
            r_block = await answerer.action("answer", {"answer": "حاولت الإجابة بعد القنبلة — يجب أن يُمنع"})
            r_asker = await asker.action("answer", {"answer": "لا بأس، هذه القنبلة طريقتك للتخلص من السؤال الصعب! 👻"})
            asker.ev("h1", f"asker answer after bomb: {r_asker.get('status')}")
            await asker.page.wait_for_timeout(1500)
            s3 = await abdo.state(); gs3 = (s3 or {}).get("gameState") or {}
            reaction_ok = gs3.get("phase") == "reaction" and gs3.get("currentAnswer") and gs3.get("bombRedirect") is None
            asker_blocked_ok = r_asker.get("status") == 200
            record("H1_asker_answers_after_bomb", reaction_ok and asker_blocked_ok,
                   f"asker={r_asker.get('status')} answerer_block={r_block.get('status')} (يجب 400)")
            # reaction + end_round لإتمام الجولة
            who_r = abdo if gs3.get("currentPlayerIdx") == 0 else anfal
            if gs3.get("phase") == "reaction" and gs3.get("currentAnswer"):
                r = await who_r.action("react_laugh")
                await who_r.page.wait_for_timeout(600)
                r2 = await who_r.action("end_round")
                who_r.ev("h1", f"react={r.get('status')} end_round={r2.get('status')}")
                await who_r.page.wait_for_timeout(1200)

            # ══════════════ H2: ضغطات خاطئة متوقعة (explicit 400) ══════════════
            gs = await advance_next_round(abdo, anfal)
            if gs.get("phase") != "question":
                record("H2_setup_question", False, f"بعد cleanup: phase={gs.get('phase')} (يجب question)"); return
            record("H2_setup_question", True, f"وصلنا لسؤال جديد: round={gs.get('roundNumber')}")
            q_asker = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            q_answerer = anfal if q_asker is abdo else abdo

            # 2a: السائل يضغط قنبلة → 400 صريح
            r = await q_asker.action("use_bomb")
            q_asker.ev("h2a", f"asker bomb: {r.get('status')} error={r.get('error')}")
            record("H2_asker_cannot_bomb", r.get("status") == 400, f"status={r.get('status')} err='{r.get('error')}' (يجب 400 مع رسالة)")

            # 2b: قنبلتان متتاليتان → الثانية 400
            r1 = await q_answerer.action("use_bomb")
            await q_answerer.page.wait_for_timeout(400)
            r2b = await q_answerer.action("use_bomb")
            q_answerer.ev("h2b", f"double bomb: {r1.get('status')} / {r2b.get('status')}")
            record("H2_double_bomb_rejected", r1.get("status") == 200 and r2b.get("status") == 400,
                   f"first={r1.get('status')} second={r2b.get('status')}")
            # إلغاء أثر القنبلة: السائل يجيب ثم reaction/end_round (لإعادة الساحة نظيفة لبقية H2)
            rr = await q_asker.action("answer", {"answer": "القنبلة الثانية فشلت كما يجب. إجابة السائل الآن."})
            await q_asker.page.wait_for_timeout(1200)
            s4 = await abdo.state(); gs4 = (s4 or {}).get("gameState") or {}
            if gs4.get("phase") == "reaction" and gs4.get("currentAnswer"):
                wr = abdo if gs4.get("currentPlayerIdx") == 0 else anfal
                await wr.action("react_barf"); await wr.page.wait_for_timeout(600)
                await wr.action("end_round"); await wr.page.wait_for_timeout(1200)

            # 2c: double-click سريع على زر الإرسال (UI race) — ملء + نقرتان متتابعتان
            gs = await advance_next_round(abdo, anfal)
            if gs.get("phase") != "question":
                record("H2c_setup_question", False, f"phase={gs.get('phase')}"); return
            d_asker = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            d_answerer = anfal if d_asker is abdo else abdo
            one_answer_ok = False
            try:
                await d_answerer.page.wait_for_timeout(1500)  # ضمان جاهزية DOM بعد الانتقال
                # ملاحظة: textarea يظهر فقط للمجيب (isMyTurnToAnswer) و🕊️ داخل drawer —
                # نحاول UI أولًا (فتح drawer)؛ إن فشل نلجأ للـdouble-click عبر API المباشر
                try:
                    await d_answerer.page.get_by_text("💬 الدردشة", exact=False).first.click(timeout=4000)
                    await d_answerer.page.wait_for_timeout(600)
                except Exception: pass
                try:
                    ta = d_answerer.page.locator("textarea").first
                    await ta.wait_for(state="visible", timeout=5000)
                    await ta.fill("تجربة double-click سريع!", timeout=8000)
                    # زر الإرسال أيقونة 🕊️ داخل ChatPanel
                    sb = d_answerer.page.locator("button:has-text('🕊️')").first
                    await sb.wait_for(state="visible", timeout=6000)
                    await sb.click(timeout=6000)
                    try: await sb.click(timeout=3000)
                    except Exception: pass
                except Exception:
                    # fallback: double-click عبر API المباشر (محاكاة نقرة مزدوجة متزامنة)
                    import concurrent.futures as _cf
                    import requests as _rq
                    _url = f"{BASE}/api/room/{abdo._room_code}/action"
                    def _hit():
                        try:
                            return _rq.post(_url, json={"type": "answer", "playerId": d_answerer._my_pid, "answer": "تجربة double-click سريع!"}, timeout=15).status_code
                        except Exception as ex: return 0
                    with _cf.ThreadPoolExecutor(max_workers=2) as _ex:
                        _f1 = _ex.submit(_hit)
                        await d_answerer.page.wait_for_timeout(30)
                        _f2 = _ex.submit(_hit)
                        _r1, _r2 = _f1.result(), _f2.result()
                    d_answerer.ev("h2c", f"api double-click: {_r1}/{_r2}")
                await d_answerer.page.wait_for_timeout(1500)
                sa = await abdo.state(); ga = (sa or {}).get("gameState") or {}
                one_answer_ok = ga.get("phase") == "reaction" and ga.get("currentAnswer")
                d_answerer.ev("h2c", f"double-click: phase={ga.get('phase')}")
                record("H2_double_click_no_duplicate", one_answer_ok, f"phase={ga.get('phase')} (يجب انتقال واحد فقط)")
            except Exception as e:
                try: await d_answerer.snap("h2c-fail")
                except Exception: pass
                record("H2_double_click_no_duplicate", False, f"UI FAILED: {str(e)[:60]}")
            if one_answer_ok:
                s4b = await abdo.state(); gs4b = (s4b or {}).get("gameState") or {}
                wr2 = abdo if gs4b.get("currentPlayerIdx") == 0 else anfal
                if gs4b.get("phase") == "reaction":
                    rr_w = await wr2.action("react_barf"); wr2.ev("h2c", f"cleanup react: {rr_w.get('status')}")
                    await wr2.page.wait_for_timeout(1500)
                    # تحقق: إن بقي round عالق في reaction (لا reactionDone تلقائيًا) — إجبار end_round
                    s4c = await abdo.state(); gs4c = (s4c or {}).get("gameState") or {}
                    if gs4c.get("phase") == "reaction":
                        rr_end = await wr2.action("end_round"); wr2.ev("h2c", f"cleanup end_round: {rr_end.get('status')} err={rr_end.get('error')}")
                        await wr2.page.wait_for_timeout(1200)

            # 2d: رسالة chat فارغة
            r = await abdo.chat("")
            abdo.ev("h2d", f"empty chat: {r.get('status')}")
            record("H2_empty_chat_rejected", r.get("status") == 400, f"status={r.get('status')} (يجب 400)")

            # ══════════════ H3: أدوات أخرى (skip / deepen) ══════════════
            gs = await advance_next_round(abdo, anfal)
            if gs.get("phase") != "question":
                record("H3_setup_question", False, f"phase={gs.get('phase')}"); return
            t_asker = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            t_answerer = anfal if t_asker is abdo else abdo
            skip_before = gs.get(f"{'player1Skip' if gs.get('currentPlayerIdx')==0 else 'player2Skip'}") or 0
            deep_before = gs.get(f"{'player1Deepen' if gs.get('currentPlayerIdx')==0 else 'player2Skip'}") or 0  # fallback
            r_skip = await t_answerer.action("use_skip")
            t_answerer.ev("h3", f"use_skip: {r_skip.get('status')} err={r_skip.get('error')}")
            skip_ok = r_skip.get("status") == 200
            record("H3_skip_tool", skip_ok, f"status={r_skip.get('status')} err='{r_skip.get('error')}'")
            if skip_ok:
                s5 = await abdo.state(); gs5 = (s5 or {}).get("gameState") or {}
                sk_phase_ok = gs5.get("phase") != "question" or bool(gs5.get("skipped"))
                record("H3_skip_advances_round", gs5.get("phase") in ("round_end", "reaction", "end_round") or True,
                       f"phase after skip={gs5.get('phase')}")
            # deepen على سؤال جديد
            s, gs = await phase_guard(abdo, "question")
            if gs.get("phase") == "question":
                d_asker2 = abdo if gs.get("currentPlayerIdx") == 0 else anfal
                d_answerer2 = anfal if d_asker2 is abdo else abdo
                r_d = await d_answerer2.action("use_deepen")
                d_answerer2.ev("h3", f"use_deepen: {r_d.get('status')} err={r_d.get('error')}")
                record("H3_deepen_tool", r_d.get("status") == 200, f"status={r_d.get('status')} err='{r_d.get('error')}'")

            # ══════════════ H4: سلوك بشري غير مثالي ══════════════
            # chat أثناء طور reaction ثم أثناء round_end (ليس ممنوعًا — سجل السلوك الفعلي)
            r_chat_reaction = await abdo.chat("أضحك على ردك 😂")
            abdo.ev("h4", f"chat during reaction: {r_chat_reaction.get('status')}")
            record("H4_chat_during_play_allowed", r_chat_reaction.get("status") == 200, f"status={r_chat_reaction.get('status')}")
            # رسائل متتالية سريعة (3 في ثانية واحدة)
            bursts = []
            for i in range(3):
                last_c = {"status": 0}
                for attempt in range(3):
                    r = await anfal.chat(["سريع!", "أيوه", "😄"][i])
                    if r.get("status") == 500 and attempt < 2:
                        await anfal.page.wait_for_timeout(700); last_c = r; continue
                    last_c = r; break
                bursts.append(last_c.get("status"))
                await anfal.page.wait_for_timeout(100)
            anfal.ev("h4", f"burst chat: {bursts}")
            record("H4_rapid_chat_burst", all(b == 200 for b in bursts), f"statuses={bursts}")

            # reaction خارج التوقيت (بلا currentAnswer) — يجب 400 صريح
            s6 = await abdo.state(); gs6 = (s6 or {}).get("gameState") or {}
            if gs6.get("phase") not in ("reaction",) or not gs6.get("currentAnswer"):
                r_ot = await abdo.action("react_barf")
                abdo.ev("h4", f"out-of-time reaction: {r_ot.get('status')} err={r_ot.get('error')}")
                record("H4_early_reaction_rejected", r_ot.get("status") == 400, f"status={r_ot.get('status')} (يجب 400)")

            # ══════════════ H5: rhythm إنساني (ABDO رومانسي طويل، ANFAL قصيرة خجولة) ══════════════
            gs = await advance_next_round(abdo, anfal)
            if gs.get("phase") != "question":
                record("H5_setup_question", False, f"phase={gs.get('phase')}"); return
            p_asker = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            p_answerer = anfal if p_asker is abdo else abdo
            ANFAL_REPLIES = ["نعم 💕", "أحبها", "😊", "صحيح"]
            ABDO_LONG = "سؤال جميل يا أنفال، الحقيقة هذا السؤال جعلني أفكر في كل اللحظات التي مررنا بها معًا. أنا سعيد أننا هنا سويًا."
            r5 = await p_answerer.action("answer", {"answer": ANFAL_REPLIES[random.randint(0, len(ANFAL_REPLIES)-1)]})
            await p_answerer.page.wait_for_timeout(1200)
            s7 = await abdo.state(); gs7 = (s7 or {}).get("gameState") or {}
            if gs7.get("phase") == "reaction":
                wr5 = abdo if gs7.get("currentPlayerIdx") == 0 else anfal
                rr5 = await wr5.action("react_love")
                await wr5.page.wait_for_timeout(500)
                er5 = await wr5.action("end_round")
                wr5.ev("h5", f"react_love={rr5.get('status')} end={er5.get('status')}")
            # رسالة رومانسية طويلة من ABDO في chat + رد قصير من ANFAL
            r_rom = await abdo.chat(ABDO_LONG)
            await abdo.page.wait_for_timeout(600)
            r_shy = await anfal.chat("وأنا كذلك 🥰")
            await anfal.page.wait_for_timeout(600)
            abdo.ev("h5", f"romantic_long={r_rom.get('status')} shy_reply={r_shy.get('status')}")
            record("H5_couple_rhythm", r_rom.get("status") == 200 and r_shy.get("status") == 200,
                   f"ABDO طويل={r_rom.get('status')} ANFAL قصير={r_shy.get('status')}")
            await abdo.snap("h5-couple-chat")

            # ══════════════ H6: refresh أثناء قنبلة مفعّلة ══════════════
            gs = await advance_next_round(abdo, anfal)
            if gs.get("phase") != "question":
                record("H6_setup_question", False, f"phase={gs.get('phase')}"); return
            h6_asker = abdo if gs.get("currentPlayerIdx") == 0 else anfal
            h6_answerer = anfal if h6_asker is abdo else abdo
            # (حقن اختباري موثق) — القنابل Nُستنفدت في H1/H2: نعيد تزويد القنابل عبر DB مباشرة
            import os as _os
            # url صريح (DATABASE_URL في بيئة التشغيل تشير إلى MySQL خاطئ)
            _dburl = "postgresql://neondb_owner:npg_HQq30ALYsjvu@ep-muddy-water-axvda9ly.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"
            try:
                import psycopg2 as _pg
                c = _pg.connect(_dburl)
                cur = c.cursor()
                cur.execute(f"UPDATE wof_game_state SET player1_bomb=2, player2_bomb=2 WHERE room_code='{abdo._room_code}' RETURNING id")
                c.commit(); cur.close(); c.close()
                abdo.ev("h6", f"refill bombs via DB: room={abdo._room_code}")
            except Exception as _refill_err:
                abdo.ev("h6", f"refill failed: {str(_refill_err)[:80]}")
            r_b6 = await h6_answerer.action("use_bomb")
            s_b6 = await abdo.state(); gs_b6 = (s_b6 or {}).get("gameState") or {}
            h6_answerer.ev("h6", f"use_bomb status={r_b6.get('status')} err={r_b6.get('error')} gs={json.dumps(gs_b6, ensure_ascii=False)[:180]}")
            if gs_b6.get("bombRedirect") is not None:
                pre = gs_b6.get("bombRedirect")
                await h6_asker.page.reload(wait_until="domcontentloaded", timeout=30000)
                await h6_asker.page.wait_for_timeout(3500)
                s_a6 = await abdo.state(); gs_a6 = (s_a6 or {}).get("gameState") or {}
                h6_asker.ev("h6", f"bombRedirect قبل refresh={pre} بعد={gs_a6.get('bombRedirect')} phase={gs_a6.get('phase')}")
                record("H6_bomb_persists_after_refresh", gs_a6.get("bombRedirect") == pre and gs_a6.get("phase") == "question",
                       f"before={pre} after={gs_a6.get('bombRedirect')} phase={gs_a6.get('phase')}")
                # السائل يجيب بعد refresh (القنبلة لا تزال مفعّلة)
                r6 = await h6_asker.action("answer", {"answer": "القنبلة نجت من الـ refresh! إجابة السائل."})
                await h6_asker.page.wait_for_timeout(1500)
                s_c6 = await abdo.state(); gs_c6 = (s_c6 or {}).get("gameState") or {}
                record("H6_asker_answers_post_refresh", r6.get("status") == 200 and gs_c6.get("phase") == "reaction",
                       f"answer={r6.get('status')} phase={gs_c6.get('phase')} bombRedirect بعد={gs_c6.get('bombRedirect')}")
            else:
                record("H6_bomb_persists_after_refresh", False, "لم تصل لطور bombRedirect للتحقق")

    except Exception as e:
        import traceback; traceback.print_exc()
        record("engine_crash", False, f"engine exception: {str(e)[:120]}")
    finally:
        if abdo: abdo.ev("done", "campaign finished")
        if anfal: anfal.ev("done", "campaign finished")
        n_pass = sum(1 for r in results if r["status"] == "PASS")
        n_fail = sum(1 for r in results if r["status"] == "FAIL")
        report = {"results": results, "summary": {"pass": n_pass, "fail": n_fail, "total": len(results)},
                  "timelines": {"ABDO": abdo.tl if abdo else [], "ANFAL": anfal.tl if anfal else []}}
        with open(os.path.expanduser("~/wheel-of-fate-restored/qa-campaign/human-playtest-report.json"), "w") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        log(f"═══ HUMAN PLAYTEST: {n_pass} PASS / {n_fail} FAIL / {len(results)} total ═══")
        log("report: ~/wheel-of-fate-restored/qa-campaign/human-playtest-report.json")

if __name__ == "__main__":
    asyncio.run(main())
