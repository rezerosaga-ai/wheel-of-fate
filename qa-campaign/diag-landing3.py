#!/usr/bin/env python3
"""Diagnose: two parallel pages like harness; check whether age gate appears."""
import asyncio, os
from playwright.async_api import async_playwright

EVID = os.path.join(os.path.dirname(__file__), "evidence-e2")
os.makedirs(EVID, exist_ok=True)
BASE = "http://localhost:13000"

async def run(name, vp):
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page(viewport=vp, locale="ar")
        await page.goto(BASE + "/", wait_until="domcontentloaded", timeout=40000)
        await page.wait_for_timeout(3000)
        gate = page.get_by_text("نعم، أنا أكبر من 17")
        cnt = await gate.count()
        print(f"[{name}] gate count={cnt}")
        if cnt > 0:
            await gate.first.click()
            await page.wait_for_timeout(3000)
            print(f"[{name}] gate clicked")
        else:
            await page.screenshot(path=os.path.join(EVID, f"diag-{name}-nogate.png"))
        # check start button
        try:
            b = page.get_by_text("ابدأ لعبة جديدة")
            if await b.count():
                await b.first.click()
                await page.wait_for_timeout(3000)
                print(f"[{name}] start clicked OK")
                await page.screenshot(path=os.path.join(EVID, f"diag-{name}-started.png"))
            else:
                print(f"[{name}] start button NOT FOUND")
                await page.screenshot(path=os.path.join(EVID, f"diag-{name}-nostart.png"))
        except Exception as e:
            print(f"[{name}] start error: {str(e)[:120]}")
        await browser.close()

async def main():
    await asyncio.gather(run("ABDO", {"width": 390, "height": 844}),
                         run("ANFAL", {"width": 375, "height": 812}))

asyncio.run(main())
