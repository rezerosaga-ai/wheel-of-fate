import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rooms, reflections } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * HP-BUG-07 FIX (G-04 امتداد): إعادة محاولة الأخطاء المتقطعة — Reflection جزء
 * أساسي من الرحلة العاطفية ولا يجب أن يفشل بصمت تحت الحمل المتزامن.
 */
async function retryWrap<T>(fn: () => Promise<T>, attempts = 8): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const msg = ((err as Error)?.message || '') + ' ' + (((err as Error)?.cause as Error)?.message || '');
      const isNet = /ECONNRESET|ECONNREFUSED|connection|too many clients|terminat|unexpected|EPIPE|socket|server closed the connection|Failed query/i.test(msg);
      if (!isNet || i === attempts - 1) {
        // تسجيل الخطأ الأصلي الكامل مع err.cause لأغراض التشخيص — HP-BUG-06
        console.error('retryWrap giving up:', msg);
        throw err;
      }
      await new Promise((res) => setTimeout(res, 300 * Math.pow(1.8, i)));
    }
  }
  throw lastErr;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { playerId, content } = await req.json() as {
      playerId: string;
      content: string;
    };

    if (!playerId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [room] = await retryWrap(() =>
      db.select().from(rooms).where(eq(rooms.code, code)).limit(1)
    );
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.player1Id !== playerId && room.player2Id !== playerId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const sessionDate = new Date().toISOString().split('T')[0]!;

    // Save reflection (private — only this player can read it)
    const [ref] = await retryWrap(() =>
      db.insert(reflections)
      .values({
        roomCode: code,
        playerId,
        sessionDate,
        content: content.trim(),
        topicsFound: [],
        adaptiveQuestionsGenerated: [],
      })
      .returning()
    );

    // Try synchronous AI analysis (with timeout fallback)
    let analysis: string | undefined;
    try {
      analysis = await Promise.race([
        analyzeReflectionSync(ref.id, content.trim()),
        new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 8000)),
      ]);
    } catch { /* ignore */ }

    return NextResponse.json({ reflectionId: ref.id, saved: true, analysis });
  } catch (error) {
    console.error('Reflect error:', error);
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
  }
}

// ─── Synchronous analysis returning human-readable Arabic text ──────────────
async function analyzeReflectionSync(
  reflectionId: number,
  content: string
): Promise<string | undefined> {
  try {
    const apiKey = process.env.BTY_LLM_SERVER_API_KEY;
    const baseUrl = process.env.REACTUS_BASE_URL;
    if (!apiKey || !baseUrl) return undefined;

    const llmBaseUrl = process.env.BTY_LLM_SERVER_BASE_URL ?? `${baseUrl}/v1`;

    const prompt = `أنت مرافق تأملي للعلاقات العاطفية. لست طبيباً نفسياً ولا تُشخّص.

شخص في علاقة حب كتب هذا التأمل بعد جلسة مع شريكه:

"${content}"

اكتب تحليلاً دافئاً وصادقاً بالعربية (6-8 جمل):
- ما الذي تلمسته في هذه الكلمات؟
- ما الحاجة العاطفية الأساسية التي تبدو حاضرة؟
- ملاحظة واحدة عملية للتواصل الأفضل مع الشريك

لا تستخدم قوائم أو عناوين. اجعلها محادثة دافئة وشخصية.`;

    const response = await fetch(`${llmBaseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'x-bty-business': 'ReActUs',
        'x-bty-workspace': 'default',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4.6',
        max_tokens: 400,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return undefined;

    const data = await response.json() as {
      content?: Array<{ type: string; text: string }>;
    };
    const text = (data.content?.[0]?.text ?? '').trim();

    // Also update DB in background
    void db.update(reflections).set({ emotionsAnalysis: { analysis: text } }).where(eq(reflections.id, reflectionId));

    return text || undefined;
  } catch {
    return undefined;
  }
}

async function analyzeReflectionAsync(
  reflectionId: number,
  content: string,
  roomCode: string,
  _playerId: string
) {
  try {
    const apiKey = process.env.BTY_LLM_SERVER_API_KEY;
    const baseUrl = process.env.REACTUS_BASE_URL;
    if (!apiKey || !baseUrl) return;

    // Use claude-sonnet-4.6 via Anthropic protocol
    const llmBaseUrl = process.env.BTY_LLM_SERVER_BASE_URL ?? `${baseUrl}/v1`;
    
    const prompt = `أنت مساعد تأمل للعلاقات، وليس طبيباً نفسياً. لا تُشخّص.
    
شخص في علاقة حب كتب التأمل التالي بعد جلسة لعبة مع شريكه:

"${content}"

المطلوب:
1. استخرج المشاعر الرئيسية (3 على الأكثر).
2. استخرج الاحتياجات المحتملة (3 على الأكثر).
3. اقترح 2-3 أسئلة تأملية للجلسة القادمة تنبع من هذا التأمل دون الكشف عن مصدرها.

أجب بـ JSON فقط:
{
  "emotions": ["مشاعر1", "مشاعر2"],
  "needs": ["حاجة1", "حاجة2"],
  "adaptiveQuestions": ["سؤال1", "سؤال2"],
  "topics": ["موضوع1", "موضوع2"]
}`;

    const response = await fetch(`${llmBaseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'x-bty-business': 'ReActUs',
        'x-bty-workspace': 'default',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4.6',
        max_tokens: 500,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return;

    const data = await response.json() as {
      content?: Array<{ type: string; text: string }>;
    };
    const text = data.content?.[0]?.text ?? '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const analysis = JSON.parse(jsonMatch[0]) as {
      emotions: string[];
      needs: string[];
      adaptiveQuestions: string[];
      topics: string[];
    };

    // Update reflection with analysis
    await db
      .update(reflections)
      .set({
        emotionsAnalysis: analysis,
        topicsFound: analysis.topics ?? [],
        adaptiveQuestionsGenerated: analysis.adaptiveQuestions ?? [],
      })
      .where(eq(reflections.id, reflectionId));

  } catch (err) {
    console.error('AI analysis failed (non-blocking):', err);
  }
}

import { eq as drizzleEq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Returns adaptive questions for a player based on their past reflections
  try {
    const { code } = await params;
    const playerId = req.nextUrl.searchParams.get('playerId');
    if (!playerId) return NextResponse.json({ questions: [] });

    const playerReflections = await retryWrap(() =>
      db
        .select()
        .from(reflections)
      .where(
        and(
          drizzleEq(reflections.roomCode, code),
          drizzleEq(reflections.playerId, playerId)
        )
      )
      .limit(5)
    );

    const allAdaptive = playerReflections.flatMap(
      (r) => (r.adaptiveQuestionsGenerated as string[]) ?? []
    );

    return NextResponse.json({ questions: allAdaptive.slice(0, 3) });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
