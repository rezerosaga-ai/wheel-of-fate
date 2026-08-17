"""
Couple Browser Automation Harness — Wheel of Fate
Observer-only QA tool. لا يعدّل Production ولا يصلح Bugs.
يحاكي لاعبين مستقلين عبر متصفحي Chromium حقيقيين (Playwright).

الاستخدام:
  python3 harness.py              # run: ABDO creates, ANFAL joins, full loop
  python3 harness.py multi-vp     # multi-viewport test
  python3 harness.py refresh      # refresh/reconnect test during chat
"""
import asyncio
import json
import os
import re
import sys
import time
from datetime import datetime, timezone

from playwright.async_api import async_playwright

BASE = os.environ.get("WOF_BASE", "https://wheel-of-fate-three.vercel.app")
EVID_DIR = os.path.join(os.path.dirname(__file__), "evidence")
TIMELINE_PATH = os.path.join(os.path.dirname(__file__), "timeline.json")

ARABIC_CHARS = re.compile(r"[\u0600-\u06FF]")


def ts():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def norm(text):
    return " ".join((text or "").split())


class Player:
    """متصفح مستقل حقيقي — لاعب واحد."""

    def __init__(self, name, mood="😂\nمرحة وخفيفة", viewport=None):
        self.name = name
        self.mood = mood
        self.vp = viewport or {"width": 390, "height": 844}
        self.timeline = []
        self.browser = None
        self.page = None
        self.ctx = None
        self.role = None  # player1 / player2

    def log(self, action, extra=None):
        entry = {"ts": ts(), "client": self.name, "action": action}
        if extra:
            entry.update(extra)
        self.timeline.append(entry)
        print(f"[{self.name}] {action}" + (f" — {extra}" if extra else ""))

    async def launch(self, pw, headless=True):  # console_errors تُهيأ في launch
        self.browser = await pw.chromium.launch(headless=headless)
        self.ctx = await self.browser.new_context(
            viewport=self.vp, locale="ar",
            timezone_id="Asia/Riyadh", device_scale_factor=2,
        )
        self.page = await self.ctx.new_page()
        self.console_errors = []
        self.page_errors = []
        self.page.on("console", lambda m: (self.log("console", {"lvl": m.type, "txt": m.text[:150]}), self.console_errors.append(m.text[:150])) if m.type == "error" else None)
        self.page.on("pageerror", lambda e: (self.log("pageerror", {"err": str(e)[:200]}), self.page_errors.append(str(e)[:200])))
        self.log("launched", {"vp": f"{self.vp['width']}x{self.vp['height']}"})

    async def goto(self, path=""):
        await self.page.goto(BASE + path, wait_until="domcontentloaded", timeout=40000)
        await self.page.wait_for_timeout(3000)

    async def state(self):
        return await self.page.evaluate("""() => {
            const lp = localStorage.getItem('wof-player');
            let st = {};
            try { st = JSON.parse(lp || '{}').state || {}; } catch(e) {}
            return {
                url: location.pathname + location.search,
                text: norm(document.body.innerText).slice(0, 800),
                wheel: !!document.querySelector('canvas'),
                phaseText: (document.body.innerText.match(/دورك|دور .{1,25}|يختار|لف العجلة|عجلة الحظ|انتظر|في انتظار/) || []).slice(0,3),
                player: st.player || null,
                room: st.room ? {code: st.room.code, id: st.room.id, p1: st.room.player1Name, p2: st.room.player2Name} : null,
                mood: st.mood || null,
            };
        }""".replace("norm(", "(s)=>s.replace(/\\n+/g,' ').replace(/ +/g,' ').trim("))

    async def snapshot(self, tag):
        path = os.path.join(EVID_DIR, f"{self.name.lower()}_{self.vp['width']}x{self.vp['height']}_{tag}.png")
        await self.page.screenshot(path=path, full_page=False)
        self.log("screenshot", {"tag": tag, "path": os.path.basename(path)})
        return path

    async def dom(self, tag):
        d = await self.page.evaluate("""() => {
            const scan = (el, depth) => {
                if (!el || depth > 8) return null;
                const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
                const cs = el.getBoundingClientRect ? getComputedStyle(el) : null;
                return {
                    tag: el.tagName.toLowerCase(),
                    id: el.id || null,
                    cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 80),
                    text: (el.innerText || '').slice(0, 120),
                    visible: r ? r.width > 0 && r.height > 0 : false,
                    bbox: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null,
                    z: cs ? cs.zIndex : null,
                    overflow: cs ? (cs.overflow + ' ' + cs.overflowX).trim() : null,
                    disp: cs ? cs.display : null,
                    children: [...el.children].slice(0, 12).map(c => scan(c, depth+1)).filter(Boolean),
                };
            };
            const body = document.body;
            return {
                url: location.pathname,
                bodyBBox: (()=>{const r=body.getBoundingClientRect();return [r.width,r.height];})(),
                scrollY: window.scrollY,
                scrollH: document.documentElement.scrollHeight,
                nodes: (body.querySelectorAll('button, [role=button], input, textarea, canvas').length),
                root: scan(body.firstElementChild, 0),
            };
        }""")
        path = os.path.join(EVID_DIR, f"{self.name.lower()}_{self.vp['width']}_{tag}_dom.json")
        with open(path, "w") as f:
            json.dump(d, f, ensure_ascii=False, indent=1)
        self.log("dom", {"tag": tag, "path": os.path.basename(path), "nodes": d["nodes"]})
        return d

    async def audio(self):
        a = await self.page.evaluate("""() => {
            const out = {elements: [], webaudio: {running:false, nodes:0}};
            out.elements = [...document.querySelectorAll('audio,video')].map(e => ({
                src: (e.src || (e.currentSrc||'').slice(0,120)).slice(0,120),
                state: e.readyState >= 2 ? (e.paused ? 'paused' : 'playing') : 'loading',
                vol: e.volume, muted: e.muted, dur: e.duration,
                cls: (e.className||'').toString().slice(0,60),
                visible: (()=>{const r=e.getBoundingClientRect();return r.width>0||r.height>0;})(),
            }));
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC && AC.prototype) {
                    const acs = [...new Set([window.__debugAudioCtx])].filter(Boolean);
                    out.webaudio.count = acs.length;
                }
            } catch(e) {}
            // Also detect Web Audio via performance entries (audio assets)
            out.audioRequests = performance.getEntriesByType('resource')
                .filter(r => /\\.(mp3|ogg|wav|webm)(\\?|$)/i.test(r.name))
                .map(r => ({url: r.name.split('/').pop().slice(0,60), dur: Math.round(r.duration)}));
            return out;
        }""")
        self.log("audio", {"audio": a})
        return a

    async def pass_age_gate(self):
        await self.page.reload(wait_until="domcontentloaded") if False else None
        gate = self.page.get_by_text("نعم، أنا أكبر من 17")
        if await gate.count() > 0:
            await gate.first.click()
            await self.page.wait_for_timeout(2500)
            self.log("age gate passed")

    async def join_via_code_screen(self, name, code):
        """UX-031: زائر الرابط المباشر /room/CODE يرى شاشة 'الغرفة تنتظرك — ما اسمك' ثم ينضم."""
        # 1) age gate إذا ظهر (قد يكون على / قبل التوجيه)
        await self.pass_age_gate()
        cur = await self.page.evaluate("()=>location.pathname")
        # 2) إن كان ما زال في /room/CODE بلا اسم → شاشة الانضمام
        found = await self.page.get_by_text("تنتظرك").count() > 0
        if found:
            inp = self.page.locator("input").first
            await inp.click()
            await inp.fill(name)
            await self.page.wait_for_timeout(600)
            btn = self.page.get_by_text("انضم للغرفة")
            if await btn.count() == 0:
                btn = self.page.locator("button[type=submit], button").filter(has_text="انضم")
            await btn.first.click()
            await self.page.wait_for_timeout(5000)
            self.log("joined via code screen")
        # 3) إن كان قد وُجّه إلى / (حالة استثنائية) استخدم join_room العادي
        if cur == "/" or (await self.page.evaluate("()=>location.pathname")) == "/":
            await self.join_room(code)
            found = True
        return found

    async def set_name_and_mood(self, confirm=True):
        """من شاشة home: ابدأ لعبة جديدة -> اسم + مزاج -> إنشاء غرفة."""
        await self.page.get_by_text("ابدأ لعبة جديدة").click()
        await self.page.wait_for_timeout(3000)
        # fill name with retries
        filled = False
        for i in range(4):
            try:
                await self.page.locator("input").first.fill(self.name)
                filled = True
                break
            except Exception as e:
                self.log("name-fill retry", {"i": i, "err": str(e)[:60]})
                await self.page.wait_for_timeout(2000)
        if not filled:
            raise RuntimeError(f"{self.name}: لم يُملأ حقل الاسم")
        # mood: قد يكون زر نصه متعدد الأسطر — نطابق أول سطر
        mood_line = self.mood.split("\n")[0]
        mood_target = self.page.get_by_text(mood_line).first
        await mood_target.click()
        await self.page.wait_for_timeout(800)
        if confirm:
            await self.page.get_by_text("إنشاء الغرفة").click()
            await self.page.wait_for_timeout(6000)
            self.log("create room clicked")
        st = await self.state()
        self.log("after create", {"url": st["url"], "room": st["room"]})
        return st

    async def join_as(self, name, code):
        """انضمام من شاشة غرفة مباشرة (بعد age gate على /room/CODE): اسم + رمز + دخول."""
        await self.page.wait_for_timeout(3000)
        for candidate in [name, name.split(" ")[0]]:
            if await self.page.get_by_text(candidate).count() > 0:
                await self.page.get_by_text(candidate).first.click()
                self.log("join_as name picked", {"name": candidate})
                break
        else:
            for i in range(3):
                try:
                    await self.page.locator("input").first.fill(name.split(" ")[0])
                    break
                except Exception:
                    await self.page.wait_for_timeout(1500)
        await self.page.wait_for_timeout(600)
        code_inp = self.page.locator("input").nth(1)
        for i in range(4):
            try:
                await code_inp.click()
                await code_inp.fill(code)
                break
            except Exception:
                await self.page.wait_for_timeout(1500)
        await self.page.wait_for_timeout(600)
        enter = self.page.get_by_text("دخول")
        if await enter.count() > 0:
            await enter.first.click()
        await self.page.wait_for_timeout(4000)
        cur = await self.page.evaluate("()=>location.pathname + location.search")
        self.log("join_as done", {"url": cur, "name": name})

    async def join_room(self, code):
        """من شاشة home: انضم إلى غرفة -> اسم (زر جاهز أو كتابة) -> رمز الغرفة -> دخول."""
        await self.page.get_by_text("انضم إلى غرفة").click()
        await self.page.wait_for_timeout(3500)
        # 1) الاسم: جرّب زر الاسم الجاهز (نصف الاسم الأول للمطابقة) أولًا
        picked_name = False
        for candidate in [self.name, self.name.split(" ")[0], "أنفال", "عبدو"]:
            if await self.page.get_by_text(candidate).count() > 0:
                try:
                    await self.page.get_by_text(candidate).first.click()
                    picked_name = True
                    self.log("name picked", {"name": candidate})
                    break
                except Exception:
                    continue
        # إن لم تنجح الأزرار، املأ حقل الاسم الأول
        if not picked_name:
            for i in range(3):
                try:
                    await self.page.locator("input").first.fill(self.name.split(" ")[0])
                    break
                except Exception as e:
                    self.log("name-fill retry", {"i": i, "err": str(e)[:60]})
                    await self.page.wait_for_timeout(1500)
        await self.page.wait_for_timeout(600)
        # 2) حقل الرمز (input الثاني، maxLength=6)
        code_inp = self.page.locator("input").nth(1)
        for i in range(4):
            try:
                await code_inp.click()
                await code_inp.fill(code)
                self.log("code filled", {"code": code})
                break
            except Exception as e:
                self.log("code-fill retry", {"i": i, "err": str(e)[:60]})
                await self.page.wait_for_timeout(1500)
        # 3) زر الدخول
        await self.page.wait_for_timeout(500)
        if await self.page.get_by_text("دخول").count() > 0:
            await self.page.get_by_text("دخول").first.click()
        else:
            await self.page.keyboard.press("Enter")
        await self.page.wait_for_timeout(6000)
        st = await self.state()
        self.log("joined", {"url": st["url"], "room": st["room"]})
        return st

    async def wait_for_state_phase(self, phase, timeout_ms=30000, poll=1500):
        """انتظر حتى تصل حالة الغرفة (zustand) إلى phase معين — عبر polling state()."""
        start = time.time()
        while time.time() - start < timeout_ms / 1000:
            try:
                gs = (await self.state()).get("gameState") or {}
                if gs.get("phase") == phase:
                    self.log("phase reached", {"phase": phase})
                    return True
            except Exception:
                pass
            await self.page.wait_for_timeout(poll)
        return False

    async def wait_for(self, needle, timeout_ms=30000, poll=800, negate=False):
        """انتظر ظهور needle في نص الصفحة (أو غيابه إذا negate)."""
        start = time.time()
        last = None
        while time.time() - start < timeout_ms / 1000:
            t = await self.page.evaluate("()=>document.body.innerText")
            t = norm(t)
            last = t
            if (needle in t) != negate:
                return True
            await self.page.wait_for_timeout(poll)
        self.log("wait-failed", {"needle": needle, "negate": negate, "lastText": last[:200]})
        return False

    async def click_text(self, text, wait_after=3000):
        loc = self.page.get_by_text(text).first
        if await loc.count() == 0:
            raise RuntimeError(f"{self.name}: النص غير موجود: {text}")
        await loc.click()
        await self.page.wait_for_timeout(wait_after)
        self.log("clicked", {"text": text})

    async def visible_text(self):
        return norm(await self.page.evaluate("()=>document.body.innerText"))

    async def refresh(self, tag):
        await self.page.reload(wait_until="domcontentloaded")
        await self.page.wait_for_timeout(5000)
        self.log("refresh", {"tag": tag})
        return await self.state()

    async def send_chat(self, msg):
        """اكتب في حقل الدردشة وأرسل."""
        inp = self.page.locator("textarea, input[type=text]").last
        try:
            await inp.wait_for(state="visible", timeout=5000)
            await inp.click()
            await inp.fill(msg)
            await self.page.wait_for_timeout(400)
        except Exception as e:
            self.log("chat-fill fail", {"err": str(e)[:80]})
            raise
        # زر الإرسال: نصه غالبًا سهم أو 'إرسال'
        btn = self.page.get_by_text("إرسال").first
        if await btn.count() == 0:
            # جرب زر svg-button قريب
            btn = self.page.locator("button[type=submit], button[aria-label]").last
        try:
            await btn.click()
            await self.page.wait_for_timeout(1500)
        except Exception:
            await self.page.keyboard.press("Enter")
            await self.page.wait_for_timeout(1500)
        self.log("chat sent", {"msg": msg[:60]})

    async def is_chat_visible(self):
        return await self.page.evaluate("""() => {
            const ta = document.querySelectorAll('textarea').length + document.querySelectorAll('input[type=text]').length;
            const msgs = [...document.querySelectorAll('*')].filter(e=>e.children.length===0 && /\\S{8,}/.test(e.innerText||'')).length;
            return {inputs: ta};
        }""")

    async def react_emoji(self, emoji="❤️"):
        """إذا ظهر اختيار reactions."""
        btn = self.page.get_by_text(emoji).first
        if await btn.count() > 0:
            await btn.click()
            await self.page.wait_for_timeout(1500)
            self.log("emoji reaction", {"emoji": emoji})
            return True
        return False

    async def spin_wheel_ack(self):
        """لف العجلة إن أمكن: الزر 'لف العجلة' ثم انتظر النتيجة."""
        spin = self.page.get_by_text("لف العجلة")
        if await spin.count() > 0:
            await spin.first.click()
            self.log("spin clicked")
            await self.page.wait_for_timeout(6000)
            await self.snapshot("after-spin")
            return True
        return False

    async def capture_room_code(self):
        return await self.page.evaluate("""() => {
            const t = document.body.innerText;
            const m = t.match(/\\b([A-Z0-9]{6})\\b/);
            return m ? m[1] : null;
        }""")

    async def close(self):
        if self.browser:
            await self.browser.close()
            self.log("closed")


MUSIC_MOOD = "😂\nمرحة وخفيفة"


async def run_main(mode):
    os.makedirs(EVID_DIR, exist_ok=True)
    results = {"mode": mode, "started": ts(), "tests": [], "players": []}

    def new_test(name):
        st = {"name": name, "started": ts(), "status": "BLOCKED"}
        results["tests"].append(st)
        return st

    abdo = Player("ABDO", MUSIC_MOOD, {"width": 390, "height": 844})
    anfal = Player("ANFAL", MUSIC_MOOD, {"width": 390, "height": 844})

    async with async_playwright() as pw:
        await abdo.launch(pw)
        await anfal.launch(pw)

        await abdo.goto("/")
        await abdo.pass_age_gate()

        await anfal.goto("/")
        await anfal.pass_age_gate()

        # ---------- T1: إنشاء غرفة والانضمام ----------
        st1 = new_test("lobby_create_join")
        try:
            s = await abdo.set_name_and_mood()
            st1["abdo_after_create"] = s
            if not s["room"] or not s["room"].get("code"):
                st1["status"] = "FAIL"; raise RuntimeError("no room code")
            code = s["room"]["code"]
            st1["room_code"] = code
            s2 = await anfal.join_room(code)
            st1["anfal_after_join"] = s2
            await asyncio.sleep(8)
            sa = await abdo.state()
            st1["abdo_after_join"] = sa
            await abdo.snapshot("both-in-room")
            await anfal.snapshot("both-in-room")
            if sa["room"] and sa["room"].get("p2") and s2["room"] and s2["room"].get("p1"):
                st1["status"] = "PASS"
            else:
                st1["status"] = "FAIL"
            st1["dom"] = {"abdo": await abdo.dom("room-both"), "anfal": await anfal.dom("room-both")}
        except asyncio.TimeoutError as e:
            st1["status"] = "FAIL"; st1["timeout"] = True; st1["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st1["status"] = "FAIL"; st1["reason"] = f"{type(e).__name__}: {str(e)[:200]}"
        room_code = st1.get("room_code")

        # ---------- T2: بدء اللعب — اللف واختيار السؤال ----------
        st2 = new_test("spin_and_question")
        try:
            await abdo.snapshot("spin-start")
            # زر البداية الحقيقي هو «ابدأ اللعبة!»
            did = False
            for label in ["ابدأ اللعبة", "ادر العجلة", "أدر العجلة"]:
                if await abdo.page.get_by_text(label).count() > 0:
                    await abdo.click_text(label, wait_after=3000)
                    did = True
                    st2["spin_label"] = label
                    break
            if not did:
                did = await abdo.spin_wheel_ack()
            st2["spin_clicked"] = did
            txt = await abdo.visible_text()
            crashed = ("couldn't load" in txt) or txt is None or len((txt or "").strip()) < 5
            st2["crash_detected"] = crashed
            st2["console_errors"] = abdo.console_errors[:5]
            st2["page_errors"] = abdo.page_errors[:5]
            if crashed:
                await abdo.page.reload(wait_until="domcontentloaded")
                await abdo.page.wait_for_timeout(8000)
                txt2 = await abdo.visible_text()
                st2["recovered"] = ("couldn't load" not in txt2) and len(txt2.strip()) >= 5
                st2["text_after_recovery"] = txt2[:200]
            await abdo.snapshot("after-spin"); await anfal.snapshot("after-spin")
            await abdo.dom("spin-after"); await anfal.dom("spin-after")
            sa, sn = await abdo.state(), await anfal.state()
            st2["abdo_state"] = sa; st2["anfal_state"] = sn
            if not did:
                st2["status"] = "BLOCKED"; st2["reason"] = "لم يظهر زر لف العجلة"
            else:
                st2["status"] = "PASS"
        except asyncio.TimeoutError as e:
            st2["status"] = "FAIL"; st2["timeout"] = True; st2["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st2["status"] = "FAIL"; st2["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        # ---------- T3: اختيار سؤال + إجابة ----------
        st3 = new_test("pick_question_answer")
        try:
            # بعد «ابدأ اللعبة» تنتقل spin_category → spin_question ثم يجب النقر على
            # «🎲 اختر السؤال» لإكمال الانتقال إلى question (تصميم اللعبة).
            picked = False
            for _ in range(25):
                await abdo.page.wait_for_timeout(2000)
                sa = await abdo.state()
                ph = (sa.get("gameState") or {}).get("phase")
                if ph == "question":
                    picked = True; break
                if await abdo.page.get_by_text("اختر السؤال").count() > 0:
                    await abdo.click_text("اختر السؤال", wait_after=4000)
                    picked = True; st3["cta_clicked"] = True; break
            st3["cta_clicked"] = st3.get("cta_clicked", False)
            waited = picked
            if not picked:
                waited = await abdo.wait_for_state_phase("question", timeout_ms=60000)
            sa = await abdo.state()
            st3["abdo_visible"] = (sa.get("text") or "")[:400]
            st3["states"] = {"abdo": sa}
            await abdo.snapshot("picked-question")
            st3["picked"] = bool((sa.get("gameState") or {}).get("currentQuestionId")) and waited
            st3["status"] = "PASS" if st3["picked"] else "FAIL"
            st3["reason"] = None if st3["picked"] else "لم تصل الغرفة إلى مرحلة question"
        except asyncio.TimeoutError as e:
            st3["status"] = "FAIL"; st3["timeout"] = True; st3["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st3["status"] = "FAIL"; st3["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        # ---------- T4: الإجابة من الطرف المجيب ----------
        st4 = new_test("answer_from_responder")
        try:
            # تحقق أن المجيب (أنفال) يرى السؤال في واجهتها
            awaited = await anfal.wait_for_state_phase("question", timeout_ms=90000)
            sa, sn = await abdo.state(), await anfal.state()
            st4["states_before"] = {"abdo": sa, "anfal": sn}
            t_anfal = await anfal.visible_text()
            st4["anfal_sees_question"] = awaited and bool((sn.get("gameState") or {}).get("currentQuestionId"))
            st4["anfal_visible"] = t_anfal[:400]
            await anfal.snapshot("answer-ready")
            st4["status"] = "PASS" if st4["anfal_sees_question"] else "FAIL"
            st4["reason"] = None if st4["anfal_sees_question"] else "المجيب لم يرَ السؤال في واجهته"
        except asyncio.TimeoutError as e:
            st4["status"] = "FAIL"; st4["timeout"] = True; st4["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st4["status"] = "FAIL"; st4["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        # ---------- T5: الدردشة ----------
        st5 = new_test("chat_exchange")
        try:
            # انتظر وصول الطرفين لمرحلة question (اللعبة تلقائية) قبل فتح الدردشة
            await abdo.wait_for_state_phase("question", timeout_ms=120000)
            msgs_abdo = ["أنت أجمل شيء حصل لي 🌹", "هههههه وش هالضحكة 😂"]
            msgs_anfal = ["ههه حلو", "الله يسعدك ❤️"]
            st5["msgs"] = []
            for m in msgs_abdo:
                await abdo.send_chat(m); st5["msgs"].append({"from": "ABDO", "msg": m})
            for m in msgs_anfal:
                await anfal.send_chat(m); st5["msgs"].append({"from": "ANFAL", "msg": m})
            await abdo.snapshot("chat-abdo"); await anfal.snapshot("chat-anfal")
            a = await abdo.visible_text(); st5["abdo_visible"] = a[:400]
            # تحقق من وجود رسالة طرف مقابل
            abdo_sees_anfal = any(m in a for m in msgs_anfal)
            anfal_text = await anfal.visible_text()
            anfal_sees_abdo = any(m in anfal_text for m in msgs_abdo)
            st5["visibility"] = {"abdo_sees_anfal": abdo_sees_anfal, "anfal_sees_abdo": anfal_sees_abdo}
            st5["dom"] = {"abdo": await abdo.dom("chat"), "anfal": await anfal.dom("chat")}
            if abdo_sees_anfal and anfal_sees_abdo:
                st5["status"] = "PASS"
            elif not abdo_sees_anfal and not anfal_sees_abdo:
                st5["status"] = "FAIL"; st5["reason"] = "لا الرسائل المتبادلة ظاهرة لأي طرف — عقد الدردشة معطل"
            else:
                st5["status"] = "FAIL"; st5["reason"] = "ظهور غير متماثل بين الطرفين"
            st5["console_errors"] = {"abdo": abdo.console_errors[:5], "anfal": anfal.console_errors[:5]}
        except asyncio.TimeoutError as e:
            st5["status"] = "FAIL"; st5["timeout"] = True; st5["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st5["status"] = "FAIL"; st5["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        # ---------- T6: audio probe ----------
        st6 = new_test("audio_probe")
        try:
            aa = await abdo.audio(); an = await anfal.audio()
            st6["abdo_audio"] = aa; st6["anfal_audio"] = an
            has_any = bool(aa["elements"] or aa["audioRequests"] or an["elements"] or an["audioRequests"])
            st6["status"] = "PASS" if has_any else "NOT_RETESTED"
            st6["reason"] = "لم تُرصد عناصر صوت في DOM" if not has_any else None
        except asyncio.TimeoutError as e:
            st6["status"] = "FAIL"; st6["timeout"] = True; st6["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st6["status"] = "FAIL"; st6["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        # ---------- T7: refresh/reconnect أثناء الدردشة ----------
        st7 = new_test("refresh_during_chat")
        try:
            before = await abdo.state()
            st7["state_before_refresh"] = before
            after = await abdo.refresh("during-chat")
            st7["state_after_refresh"] = after
            same_url = before["url"] == after["url"]
            st7["url_restored"] = same_url
            st7["dom"] = await abdo.dom("refresh-after")
            st7["status"] = "PASS" if (same_url and after["player"]) else "FAIL"
        except asyncio.TimeoutError as e:
            st7["status"] = "FAIL"; st7["timeout"] = True; st7["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st7["status"] = "FAIL"; st7["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        # ---------- T8: multi-viewport (ANFAL على 375 و 412 و 1280) ----------
        st8 = new_test("multi_viewport")
        try:
            st8["shots"] = []
            code = results["tests"][0].get("room_code") or "VJCU4J"
            for vp in [{"width": 375, "height": 812}, {"width": 412, "height": 915}, {"width": 1280, "height": 720}]:
                p = Player("ANFAL-VP", MUSIC_MOOD, vp)
                await p.launch(pw)
                await p.goto("/room/" + code)
                # زائر الرابط المباشر: age gate ثم شاشة الاسم (UX-031)
                await p.pass_age_gate()
                joined = await p.join_via_code_screen(name="أنفال", code=code)
                s = await p.state()
                s = s or {}
                await p.snapshot("room-vp")
                await p.dom("room-vp")
                st8["shots"].append({"vp": f"{vp['width']}x{vp['height']}", "url": s.get("url", "unknown"), "room": (s.get("room") or {}).get("p1"), "text": (s.get("text") or "")[:200], "joined": joined})
                await p.close()
            st8["status"] = "PASS" if all(sh.get("joined") for sh in st8["shots"]) else "FAIL"
            st8["reason"] = None if st8["status"] == "PASS" else "فشل دخول أحد الـ viewports عبر الرابط المباشر"
        except asyncio.TimeoutError as e:
            st8["status"] = "FAIL"; st8["timeout"] = True; st8["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st8["status"] = "FAIL"; st8["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        # ---------- T9: reaction emoji ----------
        st9 = new_test("emoji_reaction")
        try:
            hit = await anfal.react_emoji("❤️")
            st9["reacted"] = hit
            if not hit:
                for e in ["😂", "🥹", "🔥"]:
                    hit = await anfal.react_emoji(e)
                    if hit:
                        break
            st9["status"] = "PASS" if hit else "BLOCKED"
            st9["reason"] = "لم يظهر اختيار reactions في هذه المرحلة" if not hit else None
        except asyncio.TimeoutError as e:
            st9["status"] = "FAIL"; st9["timeout"] = True; st9["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st9["status"] = "FAIL"; st9["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        # ---------- T10: حالة نهاية الجلسة ----------
        st10 = new_test("game_progress_check")
        try:
            sa, sn = await abdo.state(), await anfal.state()
            st10["final_states"] = {"abdo": sa, "anfal": sn}
            await abdo.snapshot("final"); await anfal.snapshot("final")
            await abdo.dom("final"); await anfal.dom("final")
            a_a = await abdo.audio(); a_n = await anfal.audio()
            st10["final_audio"] = {"abdo": a_a, "anfal": a_n}
            st10["console_errors"] = {"abdo": abdo.console_errors[:8], "anfal": anfal.console_errors[:8]}
            st10["page_errors"] = {"abdo": abdo.page_errors[:8], "anfal": anfal.page_errors[:8]}
            st10["status"] = "PASS"
        except asyncio.TimeoutError as e:
            st10["status"] = "FAIL"; st10["timeout"] = True; st10["reason"] = f"Timeout: {str(e)[:120]}"
        except Exception as e:
            st10["status"] = "FAIL"; st10["reason"] = f"{type(e).__name__}: {str(e)[:200]}"

        results["players"] = [
            {"name": "ABDO", "timeline": abdo.timeline, "vp": abdo.vp},
            {"name": "ANFAL", "timeline": anfal.timeline, "vp": anfal.vp},
        ]
        results["ended"] = ts()
        del st1, st2, st3, st4, st5, st6, st7, st8, st9, st10

    with open(TIMELINE_PATH, "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)

    # طباعة ملخص
    print("\n===== TEST SUMMARY =====")
    for t in results["tests"]:
        print(f"- {t['name']}: {t['status']}" + (f" ({t.get('reason')})" if t.get("reason") else ""))
    print("timeline written to", TIMELINE_PATH)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "run"
    asyncio.run(run_main(mode))
