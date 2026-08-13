// ─── Unit Tests: questions.ts ─────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import {
  ALL_QUESTIONS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  CATEGORIES,
  getRandomQuestion,
  getQuestionById,
  getWeightedRandomCategory,
  FATE_CARDS,
  KNOW_ME_QUESTIONS,
  type Category,
} from '@/lib/questions';

// ─── ALL_QUESTIONS ────────────────────────────────────────────────────────────

describe('ALL_QUESTIONS', () => {
  it('يحتوي على أسئلة كافية (أكثر من 50)', () => {
    expect(ALL_QUESTIONS.length).toBeGreaterThan(50);
  });

  it('كل سؤال له id فريد', () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('كل سؤال له نص غير فارغ', () => {
    ALL_QUESTIONS.forEach((q) => {
      expect(q.text.trim().length).toBeGreaterThan(5);
    });
  });

  it('depth دائماً 1 أو 2 أو 3', () => {
    ALL_QUESTIONS.forEach((q) => {
      expect([1, 2, 3]).toContain(q.depth);
    });
  });

  it('كل فئة لها أسئلة', () => {
    const validCategories: Category[] = ['love', 'relationship', 'personality', 'confessions', 'bold', 'future', 'laugh', 'situations'];
    validCategories.forEach((cat) => {
      const count = ALL_QUESTIONS.filter((q) => q.category === cat).length;
      expect(count).toBeGreaterThan(0);
    });
  });

  it('كل سؤال deepenFollowUp (إذا وُجد) له نص غير فارغ', () => {
    ALL_QUESTIONS.forEach((q) => {
      if (q.deepenFollowUp !== undefined) {
        expect(q.deepenFollowUp.trim().length).toBeGreaterThan(5);
      }
    });
  });
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

describe('CATEGORIES', () => {
  it('يحتوي على 8 فئات', () => {
    expect(CATEGORIES).toHaveLength(8);
  });

  it('يحتوي على جميع الفئات المتوقعة', () => {
    const expected: Category[] = ['love', 'relationship', 'personality', 'confessions', 'bold', 'future', 'laugh', 'situations'];
    expected.forEach((c) => expect(CATEGORIES).toContain(c));
  });
});

// ─── CATEGORY_LABELS ──────────────────────────────────────────────────────────

describe('CATEGORY_LABELS', () => {
  it('لكل فئة تسمية عربية', () => {
    const cats: Category[] = ['love', 'relationship', 'personality', 'confessions', 'bold', 'future', 'laugh', 'situations'];
    cats.forEach((c) => {
      expect(CATEGORY_LABELS[c]).toBeTruthy();
      // يحتوي على نص عربي
      expect(CATEGORY_LABELS[c]).toMatch(/[\u0600-\u06FF]/);
    });
  });
});

// ─── getRandomQuestion ────────────────────────────────────────────────────────

describe('getRandomQuestion', () => {
  it('يعيد سؤالاً من الفئة الصحيحة', () => {
    const q = getRandomQuestion('love');
    expect(q?.category).toBe('love');
  });

  it('يعيد null أو سؤالاً احتياطياً إذا استُنفدت جميع الأسئلة', () => {
    // getRandomQuestion قد تعيد null أو fallback عشوائي عند استنفاد الأسئلة
    // السلوك الصحيح: لا تُعطل البرنامج — تعيد null أو أي سؤال
    const loveIds = ALL_QUESTIONS.filter((q) => q.category === 'love').map((q) => q.id);
    const q = getRandomQuestion('love', loveIds);
    // null أو سؤال عشوائي — كلاهما مقبول
    expect(q === null || typeof q?.id === 'number').toBe(true);
  });

  it('يتجنب الأسئلة المستخدمة', () => {
    const loveIds = ALL_QUESTIONS.filter((q) => q.category === 'love').map((q) => q.id);
    const allButLast = loveIds.slice(0, -1);
    const q = getRandomQuestion('love', allButLast);
    expect(q).not.toBeNull();
    expect(allButLast).not.toContain(q?.id);
  });

  it('يعمل لجميع الفئات الثماني', () => {
    const cats: Category[] = ['love', 'relationship', 'personality', 'confessions', 'bold', 'future', 'laugh', 'situations'];
    cats.forEach((cat) => {
      const q = getRandomQuestion(cat);
      expect(q?.category).toBe(cat);
    });
  });
});

// ─── getQuestionById ──────────────────────────────────────────────────────────

describe('getQuestionById', () => {
  it('يعيد السؤال بالـ id الصحيح', () => {
    const firstQ = ALL_QUESTIONS[0];
    const found = getQuestionById(firstQ.id);
    expect(found?.id).toBe(firstQ.id);
    expect(found?.text).toBe(firstQ.text);
  });

  it('يعيد undefined لـ id غير موجود', () => {
    expect(getQuestionById(999999)).toBeUndefined();
  });

  it('يعيد undefined لـ id = 0', () => {
    expect(getQuestionById(0)).toBeUndefined();
  });
});

// ─── getWeightedRandomCategory ────────────────────────────────────────────────

describe('getWeightedRandomCategory', () => {
  it('يعيد فئة صحيحة', () => {
    const cats: Category[] = ['love', 'relationship', 'personality', 'confessions', 'bold', 'future', 'laugh', 'situations'];
    for (let i = 0; i < 30; i++) {
      expect(cats).toContain(getWeightedRandomCategory(null));
    }
  });

  it('لا يُعيد نفس الفئة الأخيرة في الغالب', () => {
    let sameCount = 0;
    for (let i = 0; i < 50; i++) {
      if (getWeightedRandomCategory('love') === 'love') sameCount++;
    }
    expect(sameCount).toBeLessThan(15);
  });

  it('يعمل عند lastCategory = null', () => {
    expect(() => getWeightedRandomCategory(null)).not.toThrow();
  });
});

// ─── FATE_CARDS ───────────────────────────────────────────────────────────────

describe('FATE_CARDS', () => {
  it('يحتوي على بطاقات قدر', () => {
    expect(FATE_CARDS.length).toBeGreaterThan(0);
  });

  it('كل بطاقة لها id, type, title, text, icon, color', () => {
    FATE_CARDS.forEach((card) => {
      expect(card.id).toBeTruthy();
      expect(card.type).toBeTruthy();
      expect(card.title.trim().length).toBeGreaterThan(0);
      expect(card.text.trim().length).toBeGreaterThan(0);
      expect(card.icon).toBeTruthy();
      expect(card.color).toMatch(/^#/);
    });
  });

  it('أنواع البطاقات من القائمة المحددة', () => {
    const validTypes = ['romantic', 'funny', 'deep', 'confession', 'letter', 'future', 'challenge', 'secret_msg'];
    FATE_CARDS.forEach((card) => {
      expect(validTypes).toContain(card.type);
    });
  });
});

// ─── KNOW_ME_QUESTIONS ────────────────────────────────────────────────────────

describe('KNOW_ME_QUESTIONS', () => {
  it('يحتوي على أسئلة hل تعرفني', () => {
    expect(KNOW_ME_QUESTIONS.length).toBeGreaterThan(5);
  });

  it('كل سؤال نص عربي غير فارغ', () => {
    KNOW_ME_QUESTIONS.forEach((q) => {
      expect(q.trim().length).toBeGreaterThan(10);
      expect(q).toMatch(/[\u0600-\u06FF]/);
    });
  });
});
