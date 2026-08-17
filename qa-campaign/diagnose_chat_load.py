"""تشخيص: لماذا يفشل اختبار 50 رسالة متزامنة في vitest لكن يمر يدويًا بـ threading.
الفرضية: fetch في Node (vitest) يتشارك HTTP connection pool مع vite-dev-server
أو أن Next dev server يرفض الطلبات عند وصول عدد الاتصالات المتزامنة.
"""
import requests, concurrent.futures, time, sys

BASE = 'http://localhost:13000'

def main():
    p1 = f'p_{time.time_ns()}_1'
    p2 = f'p_{time.time_ns()}_2'
    r = requests.post(f'{BASE}/api/room/create',
                      json={'playerId': p1, 'playerName': 'دردشة_ضغط'}, timeout=20).json()
    code = r.get('code')
    print('code:', code)
    if not code:
        sys.exit(1)
    j = requests.post(f'{BASE}/api/room/join',
                      json={'code': code, 'playerId': p2, 'playerName': 'ضاغط2'}, timeout=20)
    print('join:', j.status_code)

    def send(i):
        try:
            res = requests.post(f'{BASE}/api/room/{code}/chat', json={
                'playerId': p1 if i % 2 == 0 else p2,
                'playerName': 'ضاغط1' if i % 2 == 0 else 'ضاغط2',
                'content': f'رسالة اختبارية رقم {i}',
            }, timeout=15)
            return res.status_code, res.text[:80]
        except Exception as e:
            return 'ERR', str(e)[:80]

    # 50 رسالة بالتوازي الكامل (مثل Promise.all في vitest)
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as ex:
        results = list(ex.map(send, range(50)))
    codes = [s for s, _ in results]
    errs = [b for s, b in results if s != 200][:5]
    print('statuses:', codes[:10], '...')
    print('sample errors:', errs)
    if all(s == 200 for s, _ in results):
        print('ALL 200 — لا مشكلة في الخادم')
    else:
        from collections import Counter
        print('Counter:', Counter(codes))
        # الآن retry واحد لمعرفة: هل transient؟
        print('retrying 5 messages sequentially:')
        for i in range(5):
            s, b = send(100 + i)
            print(' ', s, b[:60])

if __name__ == '__main__':
    main()
