#!/usr/bin/env python3
"""انضمام فعلي كـ ANFAL إلى غرفة حية ثم فحص DOM صفحة question."""
import asyncio, sys, json
sys.path.insert(0, '/home/ubuntu/wheel-of-fate-restored/qa-campaign')
from playwright.async_api import async_playwright

CODE = sys.argv[1] if len(sys.argv) > 1 else '4XYQVG'
BASE = 'http://localhost:13000'

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        p = await b.new_page(viewport={"width": 390, "height": 844}, locale="ar")
        await p.goto(f'{BASE}/room/{CODE}', wait_until="domcontentloaded", timeout=30000)
        await p.wait_for_timeout(2500)
        for i in range(4):
            try:
                await p.locator("input").first.fill("أنفال")
                break
            except Exception:
                await p.wait_for_timeout(1000)
        await p.wait_for_timeout(400)
        try: await p.get_by_text("دخول").first.click()
        except Exception: await p.keyboard.press("Enter")
        await p.wait_for_timeout(5000)
        # الحالة من API
        import urllib.request
        s = json.load(urllib.request.urlopen(f'{BASE}/api/room/{CODE}/state', timeout=10))
        gs = s.get('gameState', {})
        print("API: phase=", gs.get('phase'), "round=", gs.get('roundNumber'), "cpi=", gs.get('currentPlayerIdx'), "cc=", gs.get('conflictCount'))
        # DOM
        info = await p.evaluate("""() => {
            const ta = [...document.querySelectorAll('textarea, input[type="text"]')].map(e => {
                const r = e.getBoundingClientRect();
                return {tag: e.tagName.toLowerCase(), visible: r.width>0&&r.height>0, value: e.value};
            });
            const btns = [...document.querySelectorAll('button')].map(e => {
                const r = e.getBoundingClientRect();
                return {text: e.textContent.trim().slice(0,60), visible: r.width>0&&r.height>0};
            }).filter(e => e.visible);
            return {ta, btns, url: location.pathname, body: document.body.innerText.slice(0,500)};
        }""")
        ls = await p.evaluate("() => { const o={}; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); try{o[k]=(localStorage.getItem(k)||'').slice(0,200)}catch(e){o[k]='err'} } return o; }")
        print("url:", info['url'])
        print("inputs:", info['ta'])
        print("visible buttons:", info['btns'][:12])
        print("body:\n", info['body'])
        print("ls keys:", list(ls.keys()))
        await p.screenshot(path='/home/ubuntu/wheel-of-fate-restored/qa-campaign/evidence/diag_join_dom.png')
        await b.close()

asyncio.run(main())
