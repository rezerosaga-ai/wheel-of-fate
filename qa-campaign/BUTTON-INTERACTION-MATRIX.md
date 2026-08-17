# Button Interaction Matrix — Wheel of Fate (17/08/2026)

منهجية: لا PASS بدون إثبات النتيجة الوظيفية النهائية (تغير حالة server + DOM + الطرف الآخر).

## GameRoom.tsx (اللعبة داخل الغرفة)

| # | الزر | phase | action | precondition | expected outcome |
|---|---|---|---|---|---|
| G1 | 🎡 أدر العجلة (spin_start) | spin_start | spin | currentPlayer = صاحب الدور | phase→spin_question, currentPlayer يتغير للسائل |
| G2 | 🔥 تحدي (use_challenge) | fate_card | use_challenge (مع SFX) | currentPlayer | challengeActive=true, ينتقل للتحدي |
| G3 | التالي (next_round) | round_end (بعد fate_card) | next_round | currentPlayer | round++, phase→spin_category |
| G4 | إنهاء الجلسة (end_session) | round_end | end_session | currentPlayer | phase→session_end |
| G5 | التالي (next_round) | round_end (بعد know_me) | next_round | currentPlayer | round++, spin |
| G6 | التالي (next_round) | round_end (عام) | next_round | currentPlayer | spin_category |
| G7 | إرسال الحوار (conflict_step) | conflict | conflict_step | الدور المتناوب | dialogueCount++, يتحول الدور |
| G8 | متابعة السؤال (conflict_next) | conflict + agreed | conflict_next | agreed=True | phase→question, cc=0 |
| G9 | فهمنا بعضنا (conflict_agree) | conflict | conflict_agree | dialogueCount≥2, !agreed | agreed=True, love+3 (مرة واحدة فقط — G-02) |
| G10 | تحديث الحالة 🔄 | fallback | poll() | أي | re-fetch state |
| G11 | 🎡 أدر العجلة (spin) | spin_category | spin | currentPlayer+!spinning | resolve category → spin_question |
| G12 | اختر السؤال (pick_question) | spin_question | pick_question | currentPlayer+!spinning | resolve question → question phase |
| G13 | إنهاء الجولة (end_round) | reaction | end_round | currentPlayer, reactionDone | cc قد يفعّل conflict |

## GameRoomLayout.tsx (الشريط العلوي/السفلي)
| # | الزر | action | ملاحظة |
|---|---|---|---|
| L1 | 🎵 mute/toggle | toggleMusic | musicOn persist؟ |
| L2 | خروج/خلف | navigate | |
| L3 | chat toggle | setChatOpen | |
| L4 | مسح error banner | setActionError(null) | |

## HomeScreen.tsx
| # | الزر | action | ملاحظة |
|---|---|---|---|
| H1 | ← back | setScreen('home') | |
| H2 | name chips | playerName select | create/join |
| H3 | ابدأ | createRoom | ينتج roomCode |
| H4 | انضم | setScreen('join') | |
| H5 | إنشاء غرفة | create | |

## WaitingRoom.tsx
| # | الزر | action | ملاحظة |
|---|---|---|---|
| W1 | مشاركة الرمز | shareCode (navigator.clipboard) | |
| W2 | ابدأ اللعبة | (حسب الكود) | |

## RoomJoinScreen.tsx
| # | الزر | action | ملاحظة |
|---|---|---|---|
| J1 | انضم | join room | UX-031 fixed |

## SessionEnd.tsx (الانعكاس)
| # | الزر | action | ملاحظة |
|---|---|---|---|
| S1 | زر خطوة | setStep('reflection') | |
| S2 | رجوع للرئيسية | router.push('/') | |
| S3 | حفظ الانعكاس | saveReflection | API submit |
| S4 | التالي | setStep('done') | |
| S5 | مشاركة | (share) | |

## components/game/
| # | الملف | أزرار | ملاحظة |
|---|---|---|---|
| C1 | ChatPanel.tsx | إرسال رسالة / Reply / emoji picker | chat controls |
| C2 | FateCard.tsx | أزرار البطاقة (تخطي/تحدي...) | |
| C3 | ChallengeCard.tsx | أزرار التحدي | |
| C4 | QuestionCard | submit answer + rating (stars) | question/reaction |

## Question/Answer/Rating controls
- answer submit: داخل QuestionCard (type:'answer' — يعمل عبر alias)
- rating stars: react_love/react_laugh/etc → submit_reaction
- reflection textarea: SessionEnd S3

## Audio State Timeline المطلوب إثباته
| GAME STATE | EXPECTED MUSIC |
|---|---|
| spin/question/reaction | lobby/default BGM |
| challenge | 'challenge' BGM |
| session_end | 'session_end' BGM |
| mute toggle | volume=0 |
| refresh | يجب استعادة last state |

## Mobile viewports
375×812, 390×844, 412×915, 1280×720

## تفاصيل مؤكدة من الكود (17/08)
- WaitingRoom: أزرار = «📤 مشاركة الرمز» (navigator.clipboard) + «← العودة للرئيسية» (clearRoom + router.push('/')). لا يوجد زر "ابدأ اللعبة" — بدء اللعبة تلقائي عند انضمام الثاني (isWaiting=false → spinner).
- ChatPanel.tsx سطر 53: sendChat عبر api.sendChat(roomCode, player.id, player.name, trimmed).
- GameRoom: BGM.play حسب phase (challenge/session_end) سطور 217-223; SFX fateCard/roundEnd/dontLaugh سطور 234-236.
- GameRoomLayout: mute toggle, chat toggle موجودان.
- conflict_run.py الحالي يغطي: lobby→join→spin×2→answer(API)→react_barf→end_round×2→conflict dialogue→agree→next. لا يغطي: bomb/skip/deepen/dont_laugh، fate_card، know_me، session_end/reflection، mute، chat من الواجهة الفعلية، mobile viewports، screenshots.
- harness_local_test.py موجود في qa-campaign/full-project-verifier/.
- dev server localhost:13000 يعمل. الذاكرة 3.9GB متاحة ~1.5GB — يجب قتل chromium القديم (11 process) قبل أي harness ثقيل.
