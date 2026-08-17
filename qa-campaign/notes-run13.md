
## اكتشاف: harness قديم قيد التشغيل!

python3 /tmp/harness_local_test.py يعمل منذ 13:39 (~ساعتين) في الخلفية (pid 160853) — يستهلك موارد ويخلق غرفًا منافِسة. يجب إيقافه دائمًا قبل أي conflict_run. ضغط RAM: next-server 32% + renderer pages. الحل: قتل /tmp/harness + رفع vm.swappiness + تقليل headless shells القديمة.
