#!/usr/bin/env python3
"""Diagnose landing: does 'نعم، أنا أكبر من 17' (exact=False) match the gate button?"""
import asyncio, os
from playwright.async_api import async_playwright

EVID = os.path.join(os.path.dirname(__file__), "evidence-e2")
os.makedirs(EVID, exist_ok=True)

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        await page.goto("http://localhost:13000/", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)
        # count candidates
        for phrase in ["نعم، أنا أكبر من 17", "نعم، أنا أكبر من 17 سنة", "أكبر من 17"]:
            c = await page.get_by_text(phrase).count()
            print(f"get_by_text({phrase!r}).count() = {c}")
        # click the first candidate
        g = page.get_by_text("نعم، أنا أكبر من 17")
        if await g.count() > 0:
            print("clicking...")
            await g.first.click()
            await page.wait_for_timeout(3000)
            await page.screenshot(path=os.path.join(EVID, "diag-gate-clicked.png"))
            txt = await page.evaluate("""() => {
                const out = [];
                document.querySelectorAll('h1,h2,h3,button,a,label').forEach(el => {
                    const t = (el.textContent||'').trim().slice(0,50);
                    if (t && out.indexOf(t) < 0) out.push(t);
                });
                return out.slice(0, 40);
            }""")
            print("AFTER GATE:", txt)
        else:
            await page.screenshot(path=os.path.join(EVID, "diag-gate-nocount.png"))
            print("no match found")
        await browser.close()

asyncio.run(main())
