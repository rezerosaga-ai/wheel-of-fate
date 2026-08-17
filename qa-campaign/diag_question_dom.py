#!/usr/bin/env python3
"""تشخيص DOM صفحة question في غرفة حية: هل يظهر textarea لصفحة ABDO/ANFAL؟"""
import asyncio, sys
sys.path.insert(0, '/home/ubuntu/wheel-of-fate-restored/qa-campaign')
from playwright.async_api import async_playwright

CODE = sys.argv[1] if len(sys.argv) > 1 else '4XYQVG'
BASE = 'http://localhost:13000'

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        for label in ("ABDO_view", "ANFAL_view"):
            p = await b.new_page()
            await p.goto(f'{BASE}/room/{CODE}', wait_until="domcontentloaded", timeout=30000)
            await p.wait_for_timeout(6000)
            st = await p.evaluate("""() => {
                const ta = [...document.querySelectorAll('textarea, input[type="text"]')].map(e => ({
                    tag: e.tagName.toLowerCase(),
                    visible: (() => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })(),
                    name: e.name || e.id || null
                }));
                const btns = [...document.querySelectorAll('button')].map(e => ({
                    text: e.textContent.trim().slice(0, 50),
                    visible: (() => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })()
                })).filter(e => e.visible);
                const body = document.body.innerText.slice(0, 600);
                return {ta, btns, body};
            }""")
            ls = await p.evaluate("() => { const o={}; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); try{o[k]=(localStorage.getItem(k)||'').slice(0,150)}catch(e){o[k]='err'} } return o; }")
            player = None
            wp = ls.get('wof-player')
            if wp:
                try:
                    import json
                    d = json.loads(wp)
                    player = (d.get('state') or {}).get('player')
                except Exception:
                    pass
            print(f"\n===== {label} =====")
            print("player:", json.dumps(player, ensure_ascii=False) if player else None)
            print("inputs:", st['ta'])
            print("visible buttons:", st['btns'][:10])
            print("body preview:\n", st['body'])
            await p.close()
        await b.close()

if __name__ == "__main__":
    import json
    asyncio.run(main())
