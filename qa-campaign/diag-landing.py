#!/usr/bin/env python3
"""Diagnose landing page in Playwright — take screenshots + list visible text."""
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
        await page.screenshot(path=os.path.join(EVID, "diag-landing-1.png"))
        texts = await page.evaluate("""() => {
            const out = [];
            document.querySelectorAll('h1,h2,h3,button,a,[role=button],label').forEach(el => {
                const t = (el.textContent||'').trim().slice(0,60);
                if (t && out.indexOf(t) < 0) out.push(t);
            });
            return out.slice(0, 40);
        }""")
        print("VISIBLE TEXT:", texts)
        print("URL:", page.url)
        # try clicking the button
        try:
            await page.get_by_text("ابدأ لعبة جديدة").click(timeout=5000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path=os.path.join(EVID, "diag-landing-2.png"))
            print("CLICK OK")
        except Exception as e:
            print("CLICK FAIL:", str(e)[:200])
        await browser.close()

asyncio.run(main())
