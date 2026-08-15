import { NextResponse, type NextRequest } from 'next/server';

/**
 * Temporary block on direct public access to the APK file.
 * Per the suspension rule, the APK must stay out of public distribution until
 * the new version is re-tested on the stable baseline. The file remains in the
 * repo (accessible from GitHub) — this middleware only blocks the public
 * production path so that no one can download it via /wheel-of-fate.apk.
 */
const BLOCKED_PATHS = [
  '/wheel-of-fate.apk',
  '/عجلة-الحظ.apk',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (BLOCKED_PATHS.some((p) => pathname.toLowerCase() === p.toLowerCase())) {
    return new NextResponse(
      JSON.stringify({
        error: 'Download temporarily disabled',
        message: 'التحميل متوقف مؤقتًا لحين اكتمال اختبار النسخة الجديدة على النسخة المستقرة',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/wheel-of-fate.apk', '/(.*)\\.apk'],
};
