#!/usr/bin/env python3
"""تشخيص شكل state بعد الانضمام: ما المفاتيح الفعلية؟"""
import asyncio, json, sys
sys.path.insert(0, '.')
from playwright.async_api import async_playwright
BASE = 'http://localhost:13000'

STATE_JS = ('async () => {'
    + '  const m = location.pathname.match(String.raw`/room/([A-Z0-9]{6})`);'
    + '  if (!m) return {err: "no room", path: location.pathname};'
    + '  const ctl = new AbortController();'
    + '  const tid = setTimeout(() => ctl.abort(), 10000);'
    + '  let r;'
    + '  try { r = await fetch(\'/api/room/\' + m[1] + \'/state\', {signal: ctl.signal}); }'
    + '  finally { clearTimeout(tid); }'
    + '  if (!r) return {err: "fetch failed"};'
    + '  return await r.json();'
    + '}')

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True, args=["--disable-dev-shm-usage"])
        p = await b.new_page(viewport={"width": 390, "height": 844}, locale="ar")
        await p.goto(BASE + '/', wait_until="domcontentloaded", timeout=40000)
        try: await p.get_by_text("نعم").first.click(timeout=4000)
        except Exception: pass
        await p.get_by_text("ابدأ لعبة جديدة").click(timeout=10000)
        await p.locator("input").first.fill("DIAG", timeout=8000)
        await p.wait_for_timeout(300)
        try: await p.get_by_text("😂 مرحة وخفيفة").first.click(timeout=3000)
        except Exception: pass
        await p.get_by_text("إنشاء الغرفة").click(timeout=10000)
        await p.wait_for_timeout(6000)
        code = None
        try:
            el = await p.locator("input, text=code").first.text_content() if False else None
        except Exception: pass
        # احصل على code من localStorage
        ls = await p.evaluate("() => { const o={}; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); try{o[k]=JSON.parse(localStorage.getItem(k))}catch(e){o[k]=localStorage.getItem(k)}} return o; }")
        print("LOCALSTORAGE:", json.dumps(ls, ensure_ascii=False)[:1500])
        wp = ls.get("wof-player") or {}
        room_code = (wp.get("state") or {}).get("room") or (ls.get("wof-room") or {}).get("code")
        print("WOP-PLAYER KEYS:", list((wp.get("state") or {}).keys()))
        # جرب الحالة من API مباشرة
        if not room_code:
            # ابحث في الصفحة عن رابط/كود
            txt = await p.evaluate("() => document.body.innerText")
            print("BODY SNIPPET:", txt[:400])
            import re
            m = re.search(r'([A-Z0-9]{6})', txt)
            if m: room_code = m.group(1)
        print("ROOM CODE:", room_code)
        if room_code:
            d = await p.evaluate(STATE_JS)
            print("STATE:", json.dumps(d, ensure_ascii=False)[:2000])
        await b.close()

asyncio.run(main())
