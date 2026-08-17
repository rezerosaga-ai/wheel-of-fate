"""عزل SyntaxError: اختبارات evaluate معزولة على غرفة حية 9G4NFR"""
import asyncio, json
from playwright.async_api import async_playwright

CODE = "9G4NFR"
PID = "p_1786979160108_r8iqqfk"
PNAME = "عبدو"

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        p = await b.new_page()
        await p.goto(f"http://localhost:13000/room/{CODE}", wait_until="domcontentloaded")
        await p.wait_for_timeout(5000)
        await p.evaluate(f"""window.__uid={json.dumps(PID)}""")
        await p.evaluate(f"""window.__uname={json.dumps(PNAME)}""")
        # اختبار 1: chat JS كما في harness (args object)
        js1 = "async (args) => { const m = location.pathname.match(String.raw`/room/([A-Z0-9]{6})`); const r = await fetch('/api/room/' + m[1] + '/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({playerId: args.pid, playerName: args.pname, content: args.msg})}); return {status: r.status}; }"
        try:
            r1 = await p.evaluate(js1, {"pid": PID, "pname": PNAME, "msg": "اختبار 1 عربي"})
            print("TEST1 args-object OK:", r1)
        except Exception as e:
            print("TEST1 FAIL:", type(e).__name__, str(e)[:200])
        # اختبار 2: chat JS مع text argument واحد
        js2 = "async (msg) => { const m = location.pathname.match(String.raw`/room/([A-Z0-9]{6})`); const r = await fetch('/api/room/' + m[1] + '/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({playerId: window.__uid, playerName: window.__uname, content: msg})}); return {status: r.status}; }"
        try:
            r2 = await p.evaluate(js2, "اختبار 2 عربي")
            print("TEST2 text-arg OK:", r2)
        except Exception as e:
            print("TEST2 FAIL:", type(e).__name__, str(e)[:200])
        # اختبار 3: DOM eval بسيط
        try:
            r3 = await p.evaluate("document.querySelectorAll('button').length")
            print("TEST3 basic OK:", r3)
        except Exception as e:
            print("TEST3 FAIL:", type(e).__name__, str(e)[:200])
        await b.close()

asyncio.run(main())
