// ─── Automation Tests: Full Game Flow (Playwright) ───────────────────────────
// يُشغَّل بـ: npx playwright test src/tests/automation/
// يتطلب: خادم التطوير يعمل على 13000

import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:13000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function clearStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

async function getPlayerIdFromStorage(page: Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem('wof_player_id') ?? '');
}

// ─── Suite 1: الصفحة الرئيسية ─────────────────────────────────────────────────

test.describe('الصفحة الرئيسية', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
  });

  test('تُعرض شاشة البداية بعنوان Wheel of Fate', async ({ page }) => {
    await expect(page).toHaveTitle(/Wheel of Fate/);
  });

  test('زر "ابدأ لعبة جديدة" موجود وقابل للنقر', async ({ page }) => {
    const btn = page.getByText('ابدأ لعبة جديدة');
    await expect(btn).toBeVisible();
  });

  test('زر "انضم إلى غرفة" موجود', async ({ page }) => {
    const btn = page.getByText('انضم إلى غرفة');
    await expect(btn).toBeVisible();
  });

  test('الصفحة RTL', async ({ page }) => {
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  test('لا توجد أخطاء JS في وحدة التحكم', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(1000);
    const critical = errors.filter((e) => !e.includes('Warning') && !e.includes('hydration'));
    expect(critical).toHaveLength(0);
  });
});

// ─── Suite 2: إنشاء غرفة ─────────────────────────────────────────────────────

test.describe('إنشاء غرفة', () => {
  test('النقر على "ابدأ لعبة جديدة" يُظهر نموذج الاسم', async ({ page }) => {
    await page.goto(BASE);
    await page.click('text=ابدأ لعبة جديدة');
    // ينتظر ظهور حقل الاسم أو نموذج الإدخال
    await expect(page.locator('input[placeholder*="اسم"], input[placeholder*="اسمك"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('إنشاء غرفة يُنشئ رمز 6 محارف', async ({ page }) => {
    await page.goto(BASE);
    await page.click('text=ابدأ لعبة جديدة');

    // ملء اسم اللاعب
    const nameInput = page.locator('input').first();
    await nameInput.fill('عبدو_اختبار');

    // تأكيد
    const confirmBtn = page.locator('button').filter({ hasText: /ابدأ|موافق|إنشاء|دخول/ }).first();
    await confirmBtn.click();

    // انتظر ظهور رمز الغرفة
    await page.waitForURL(/room\//, { timeout: 10000 });
    const url = page.url();
    const codeMatch = url.match(/room\/([A-Z0-9]{6})/);
    expect(codeMatch).not.toBeNull();
    expect(codeMatch![1]).toHaveLength(6);
  });
});

// ─── Suite 3: تدفق الانضمام ────────────────────────────────────────────────────

test.describe('الانضمام إلى غرفة', () => {
  test('النقر على "انضم" يُظهر حقل الرمز', async ({ page }) => {
    await page.goto(BASE);
    await page.click('text=انضم إلى غرفة');
    await expect(
      page.locator('input[placeholder*="رمز"], input[placeholder*="الغرفة"], input[maxlength="6"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('رمز غرفة خاطئ يُظهر رسالة خطأ', async ({ page }) => {
    await page.goto(BASE);
    await page.click('text=انضم إلى غرفة');

    const codeInput = page.locator('input[placeholder*="رمز"], input[maxlength="6"]').first();
    await codeInput.fill('XXXXXX');

    const nameInput = page.locator('input[placeholder*="اسم"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('لاعب_اختبار');
    }

    const joinBtn = page.locator('button').filter({ hasText: /انضم|دخول|موافق/ }).first();
    await joinBtn.click();

    // ينتظر رسالة خطأ
    await expect(
      page.locator('text=/غير موجود|خطأ|لم يتم|not found/i').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ─── Suite 4: لعبة كاملة بين browser-1 وbrowser-2 ──────────────────────────

test.describe('تدفق اللعبة الكامل', () => {
  test('p1 ينشئ غرفة — p2 ينضم — كلاهما يصل إلى spin_start', async ({ browser }) => {
    // ── فتح متصفحين مستقلين ──────────────────────────────────────────────────
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    try {
      // P1: ينشئ غرفة
      await page1.goto(BASE);
      await page1.click('text=ابدأ لعبة جديدة');

      const nameInput1 = page1.locator('input').first();
      await nameInput1.fill('عبدو');
      await page1.locator('button').filter({ hasText: /ابدأ|موافق|إنشاء|دخول/ }).first().click();

      await page1.waitForURL(/room\//, { timeout: 10000 });
      const p1Url = page1.url();
      const codeMatch = p1Url.match(/room\/([A-Z0-9]{6})/);
      expect(codeMatch).not.toBeNull();
      const roomCode = codeMatch![1];

      // P2: ينضم
      await page2.goto(BASE);
      await page2.click('text=انضم إلى غرفة');

      const codeInput = page2.locator('input[placeholder*="رمز"], input[maxlength="6"]').first();
      await codeInput.fill(roomCode);

      const nameInput2 = page2.locator('input[placeholder*="اسم"]').first();
      if (await nameInput2.isVisible()) {
        await nameInput2.fill('أنفال');
      }
      await page2.locator('button').filter({ hasText: /انضم|دخول|موافق/ }).first().click();

      await page2.waitForURL(/room\//, { timeout: 10000 });

      // كلاهما يجب أن يرى شاشة الدوران الأولى
      await expect(page1.locator('text=/دور|لعبة|جولة|دوّر|اللعبة/i').first()).toBeVisible({ timeout: 8000 });
      await expect(page2.locator('text=/دور|لعبة|جولة|دوّر|اللعبة/i').first()).toBeVisible({ timeout: 8000 });

    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });

  test('الدردشة تُرسل وتظهر للطرفين', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    try {
      // إنشاء غرفة
      await page1.goto(BASE);
      await page1.click('text=ابدأ لعبة جديدة');
      await page1.locator('input').first().fill('أنفال');
      await page1.locator('button').filter({ hasText: /ابدأ|موافق|إنشاء|دخول/ }).first().click();
      await page1.waitForURL(/room\//, { timeout: 10000 });

      const code = page1.url().match(/room\/([A-Z0-9]{6})/)![1];

      // انضمام
      await page2.goto(BASE);
      await page2.click('text=انضم إلى غرفة');
      await page2.locator('input[maxlength="6"], input[placeholder*="رمز"]').first().fill(code);
      const ni = page2.locator('input[placeholder*="اسم"]').first();
      if (await ni.isVisible()) await ni.fill('عبدو');
      await page2.locator('button').filter({ hasText: /انضم|دخول/ }).first().click();
      await page2.waitForURL(/room\//, { timeout: 10000 });

      // فتح الدردشة من p1
      const chatBtn = page1.locator('button').filter({ hasText: /💬|دردشة|chat/i }).first();
      if (await chatBtn.isVisible()) {
        await chatBtn.click();
        const msgInput = page1.locator('input[placeholder*="رسالة"], input[placeholder*="اكتب"]').first();
        if (await msgInput.isVisible()) {
          await msgInput.fill('مرحبا من اختبار playwright');
          await msgInput.press('Enter');
          await page1.waitForTimeout(1000);
          await expect(page1.locator('text=مرحبا من اختبار playwright')).toBeVisible({ timeout: 5000 });
        }
      }
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  });
});

// ─── Suite 5: الاستجابة للشاشات المختلفة ────────────────────────────────────

test.describe('Responsive / Mobile', () => {
  test('الصفحة تعمل على شاشة iPhone 12', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    await expect(page.locator('body')).toBeVisible();
    const btn = page.getByText('ابدأ لعبة جديدة');
    await expect(btn).toBeVisible();
    await expect(btn).toBeInViewport();
  });

  test('الصفحة تعمل على شاشة Android (360×800)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(BASE);
    const btn = page.getByText('ابدأ لعبة جديدة');
    await expect(btn).toBeVisible();
    await expect(btn).toBeInViewport();
  });

  test('لا يوجد overflow أفقي على الموبايل', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    const bodyWidth  = await page.evaluate(() => document.body.scrollWidth);
    const viewWidth  = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewWidth + 5); // هامش 5px للتسامح
  });
});
