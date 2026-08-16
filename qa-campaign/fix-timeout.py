#!/usr/bin/env python3
"""Raise timeout for the long full-round integration test only."""
p = 'src/tests/integration/api.test.ts'
s = open(p).read()
old = "it('جولة كاملة: سؤال ← إجابة ← تقييم ← نقاط ← نهاية جولة', async () => {"
new = "it('جولة كاملة: سؤال ← إجابة ← تقييم ← نقاط ← نهاية جولة', async () => {"
# append 20000ms as third argument (vitest it(name, fn, timeout))
anchor = old + "\n"
if anchor in s:
    s = s.replace(anchor, old + ", 20000) => {\n", 1)
else:
    raise SystemExit("anchor not found")
open(p, 'w').write(s)
print("timeout fixed")
