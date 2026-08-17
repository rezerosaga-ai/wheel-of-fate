#!/usr/bin/env python3
import json, glob
f = sorted(glob.glob('/home/ubuntu/wheel-of-fate-restored/qa-campaign/timeline-*.json'))[-1]
t = json.load(open(f))
steps = t['tests'] if isinstance(t, dict) else t
for x in steps[-16:]:
    ts = x.get('ts', '')
    if isinstance(ts, str):
        ts = ts[-12:]
    print(ts, '|', x.get('phase'), '| r', x.get('round'), '| cc', x.get('cc'), '| sent', x.get('answer_sent_by') or '', '| ok', x.get('answer_ok') or '', '| who', x.get('cur_player') or '')
