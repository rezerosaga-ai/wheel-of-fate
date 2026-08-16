#!/usr/bin/env python3
"""Reproduce spin_question -> question transition."""
import requests, random, string, json
BASE='http://localhost:13000'
def post(p,b):
    r=requests.post(BASE+p, json=b, headers={'Content-Type':'application/json'}).json()
    return r
def get(p): return requests.get(BASE+p).json()
p1='p_test_'+ ''.join(random.choices(string.ascii_lowercase,k=6))
p2='p_test_'+ ''.join(random.choices(string.ascii_lowercase,k=6))
code=post('/api/room/create',{'playerId':p1,'playerName':'عبدو'})['code']
post('/api/room/join',{'code':code,'playerId':p2,'playerName':'أنفال'})

def last_state():
    return get(f'/api/room/{code}/state?playerId={p1}')['gameState']

# 1. spin from p1 -> spin_start
r=post(f'/api/room/{code}/action',{'type':'spin','playerId':p1})
print('spin1:', r['gameState']['phase'], 'curIdx:', r['gameState']['currentPlayerIdx'], '| keys:', sorted(r['gameState'].keys())[:0])

st=last_state()
actor=p1 if st['currentPlayerIdx']==0 else p2
print('current player:', actor)
# 2. spin from current -> category + auto to spin_question
r=post(f'/api/room/{code}/action',{'type':'spin','playerId':actor})
st=last_state()
print('spin2: phase=', st['phase'], 'cat=', st.get('currentCategory'), 'pending=', st.get('pendingSpinResult'))

actor=p1 if st['currentPlayerIdx']==0 else p2
# 3. spin from current in spin_question -> should go to question (new alias)
r=post(f'/api/room/{code}/action',{'type':'spin','playerId':actor})
print('spin3 full response:', json.dumps(r, ensure_ascii=False)[:400])
st=last_state()
print('spin3: phase=', st['phase'], 'qId=', st.get('currentQuestionId'), 'pending=', bool(st.get('pendingSpinResult')))
