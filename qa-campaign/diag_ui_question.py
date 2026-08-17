"""تشخيص واجهة السؤال في غرفة حية XDWHHY من منظور ABDO وANFAL"""
import asyncio, json
from playwright.async_api import async_playwright

CODE = "XDWHHY"
PLAYERS = [("ABDO", "p_1786980638118_q8mcqlg"), ("ANFAL", "p_1786980638658_ttgntfd")]

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(headless=True)
        for name, pid in PLAYERS:
            p = await b.new_page(viewport={"width": 390, "height": 844}, locale="ar")
            await p.goto(f"http://localhost:13000/room/{CODE}", wait_until="domcontentloaded")
            await p.wait_for_timeout(8000)
            info = await p.evaluate("""() => {
                const ta = document.querySelectorAll('textarea');
                const btns = [...document.querySelectorAll('button')];
                return {
                    textareas: ta.length,
                    taInfo: [...ta].map(t => {
                        const r = t.getBoundingClientRect();
                        return {visible: r.width>0 && r.height>0, disabled: t.disabled, readonly: t.readOnly, value: t.value, placeholder: t.placeholder, h: r.height};
                    }),
                    submitButtons: btns.filter(x => x.type === 'submit').map(x => {
                        const r = x.getBoundingClientRect();
                        return {text: (x.innerText||'').slice(0,30), visible: r.width>0 && r.height>0, disabled: x.disabled, hasClickHandler: !!x.onclick};
                    }),
                    allButtonTexts: btns.filter(x => {const r=x.getBoundingClientRect(); return r.width>0 && r.height>0;}).map(x => (x.innerText||'').slice(0,25)),
                    url: location.pathname
                };
            }""")
            print(f"--- {name} (pid={pid}) ---")
            print(json.dumps(info, ensure_ascii=False, indent=2))
            await p.screenshot(path=f"/tmp/diag_{name.lower()}.png")
            await p.close()
        await b.close()

asyncio.run(main())
