"""استخراج الخطأ الأصلي من 500 في chat تحت الحمل المتراكم."""
import requests, concurrent.futures, time, random, sys

BASE = 'http://localhost:13000'

def uid():
    return f'p_load_{int(time.time() * 1000)}_{int(random.random() * 10000)}'

def run_sequence():
    results = []

    def createRoom(pid, name):
        r = requests.post(f'{BASE}/api/room/create',
                          json={'playerId': pid, 'playerName': name}, timeout=20)
        return r.json()

    def joinRoom(code, pid, name):
        r = requests.post(f'{BASE}/api/room/join',
                          json={'code': code, 'playerId': pid, 'playerName': name}, timeout=20)
        return r.status_code, r.json()

    # تجميع حمل أولي (10 غرف)
    p1 = uid(); r = createRoom(p1, 'لاعب 0')
    code = r.get('code')
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        ex.map(lambda i: createRoom(uid(), f'لاعب {i}'), range(1, 10))
    # 10 actions (chat type = 400 لكن لا يهم)
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        list(ex.map(
            lambda i: requests.post(f'{BASE}/api/room/{code}/action',
                                    json={'type': 'chat', 'content': 'x'}, timeout=15).status_code,
            range(10)))
    # polling
    for _ in range(15):
        requests.get(f'{BASE}/api/room/{code}/state', params={'playerId': p1}, timeout=10)
    # chat burst 50
    p1 = uid(); p2 = uid()
    r = createRoom(p1, 'دردشة_ضغط')
    c = r.get('code')
    joinRoom(c, p2, 'ضاغط2')

    def send(i):
        res = requests.post(f'{BASE}/api/room/{c}/chat', json={
            'playerId': p1 if i % 2 == 0 else p2,
            'playerName': 'ضاغط1' if i % 2 == 0 else 'ضاغط2',
            'content': f'رسالة اختبارية رقم {i}',
        }, timeout=15)
        return res.status_code, res.text.strip()[:150]

    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as ex:
        results = list(ex.map(send, range(50)))
    from collections import Counter
    cnt = Counter(s for s, _ in results)
    print('Counter:', cnt)
    for s, b in results[:3]:
        if s != 200:
            print(f'ERROR body: {b}')
    return cnt

if __name__ == '__main__':
    run_sequence()
