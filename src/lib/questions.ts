// ─── مكتبة الأسئلة الكاملة لـ Wheel of Fate ──────────────────────────────────
// كل سؤال له: category, text, depth (1=عادي 2=عميق 3=عميق جداً), deepenFollowUp اختياري

export type Category =
  | 'love'
  | 'relationship'
  | 'personality'
  | 'confessions'
  | 'bold'
  | 'future'
  | 'laugh'
  | 'situations'
  | 'dare'
  | 'would_you_rather'
  | 'memory';

export interface Question {
  id: number;
  category: Category;
  text: string;
  depth: 1 | 2 | 3;
  deepenFollowUp?: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  love: '❤️ الحب',
  relationship: '🫂 علاقتنا',
  personality: '🧠 الشخصية والأفكار',
  confessions: '🪞 الاعترافات',
  bold: '🔥 الجريئة',
  future: '💭 المستقبل',
  laugh: '😂 الضحك',
  situations: '🎭 المواقف والافتراضات',
  dare: '⚡ تحديات الجرأة',
  would_you_rather: '🤔 لو خيّرتك',
  memory: '💫 تذكّري',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  love: '❤️',
  relationship: '🫂',
  personality: '🧠',
  confessions: '🪞',
  bold: '🔥',
  future: '💭',
  laugh: '😂',
  situations: '🎭',
  dare: '⚡',
  would_you_rather: '🤔',
  memory: '💫',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  love: '#E88FA0',
  relationship: '#F4B6C2',
  personality: '#A8C5E8',
  confessions: '#C9B8E8',
  bold: '#D96C83',
  future: '#B8D8C8',
  laugh: '#F2B880',
  situations: '#E8D4A0',
  dare: '#FF6B6B',
  would_you_rather: '#6BCB77',
  memory: '#B4A7D6',
};

export const ALL_QUESTIONS: Question[] = [
  // ─── ❤️ الحب ─────────────────────────────────────────────────────────────────
  { id: 1, category: 'love', depth: 1, text: 'ما الشيء الذي يجعلك تشعر أن حبنا مازال يكبر؟', deepenFollowUp: 'وما الشيء الذي تخشى أن يوقف هذا النمو؟' },
  { id: 2, category: 'love', depth: 2, text: 'متى شعرت آخر مرة أن قلبك امتلأ بي؟ ماذا كنت تفعل في تلك اللحظة؟', deepenFollowUp: 'هل أخبرتني بذلك الشعور في تلك اللحظة؟ لماذا أو لماذا لا؟' },
  { id: 3, category: 'love', depth: 1, text: 'ما الشيء الصغير الذي أفعله ويُسعدك بشكل غير متوقع؟' },
  { id: 4, category: 'love', depth: 2, text: 'هل تعتقد أن هناك فرقاً بين أن تُحب وأن تكون محبوباً؟ أيهما تشعر به أكثر الآن؟' },
  { id: 5, category: 'love', depth: 1, text: 'ما الجملة التي لو قلتها لي الآن ستجعلني أبتسم فوراً؟' },
  { id: 6, category: 'love', depth: 2, text: 'كيف تعرف أنني أحبك فعلاً؟ ما الدليل الذي يقنعك؟', deepenFollowUp: 'وكيف أعرف أنتَ أنني أشعر بالأمان معك؟' },
  { id: 7, category: 'love', depth: 1, text: 'ما الشيء الذي تحبه في نفسك بسببي؟' },
  { id: 8, category: 'love', depth: 3, text: 'هل تعتقد أن الحب وحده كافٍ لاستمرار العلاقة؟ ماذا تضيف إليه؟', deepenFollowUp: 'ومن بين ما ذكرته، ما الشيء الذي تشعر أننا نفتقده أحياناً؟' },
  { id: 9, category: 'love', depth: 1, text: 'ما أكثر لحظة رومانسية قضيناها معاً تتذكرها حتى الآن؟' },
  { id: 10, category: 'love', depth: 2, text: 'هل تشعر أنني أحبك بالطريقة التي تحتاجها؟ ما الذي تتمناه أكثر؟', deepenFollowUp: 'وهل صعب عليك أن تطلب ذلك مني مباشرةً؟ لماذا؟' },
  { id: 11, category: 'love', depth: 1, text: 'ما الشيء الذي أفعله ويجعلك تشعر أنني أفهمك تماماً؟' },
  { id: 12, category: 'love', depth: 2, text: 'كيف تصف حبك لي لشخص لا يعرفنا؟' },
  { id: 13, category: 'love', depth: 1, text: 'ما الشيء الذي تتمنى أن أقوله لك أكثر؟' },
  { id: 14, category: 'love', depth: 3, text: 'هل هناك جزء منك يخشى أن يفقدني يوماً؟ كيف تتعامل مع هذا الخوف؟', deepenFollowUp: 'وهل هذا الخوف يُقربك مني أم يُبعدك أحياناً؟' },
  { id: 15, category: 'love', depth: 1, text: 'ما أول شيء يخطر ببالك حين تفكر فيّ؟' },
  { id: 16, category: 'love', depth: 2, text: 'هل هناك طريقة أُعبّر بها عن حبي لك لا تصلك كما أقصد؟', deepenFollowUp: 'وكيف تفضل أن أُعبّر عنه بدلاً من ذلك؟' },
  { id: 17, category: 'love', depth: 1, text: 'ما الشيء الذي يجعلك تشعر أنني أختارك كل يوم؟' },
  { id: 18, category: 'love', depth: 2, text: 'هل تعتقد أن الحب يتغير مع الوقت؟ كيف تغيّر حبك لي منذ البداية؟' },
  { id: 19, category: 'love', depth: 1, text: 'ما الشيء الذي تفعله لأجلي دون أن تطلب مني الشكر؟' },
  { id: 20, category: 'love', depth: 3, text: 'ما الشيء الذي لو حدث في حياتك سيغيّر مشاعرك تجاهي؟', deepenFollowUp: 'وهل أنا على علم بهذا الشيء؟' },

  // ─── 🫂 علاقتنا ──────────────────────────────────────────────────────────────
  { id: 21, category: 'relationship', depth: 1, text: 'ما أكثر شيء تقدّره في طريقة تواصلنا مع بعض؟' },
  { id: 22, category: 'relationship', depth: 2, text: 'ما الشيء الذي تتمنى أن نتغير فيه معاً كزوجين؟', deepenFollowUp: 'وما الخطوة الأولى التي يمكننا اتخاذها الآن؟' },
  { id: 23, category: 'relationship', depth: 1, text: 'ما الطقس أو العادة اليومية بيننا التي تُسعدك أكثر؟' },
  { id: 24, category: 'relationship', depth: 2, text: 'هل تشعر أننا نتحدث بما يكفي عن مشاعرنا؟ ما الذي يمنعنا أحياناً؟', deepenFollowUp: 'وما الذي تتمنى أن أسألك عنه أكثر؟' },
  { id: 25, category: 'relationship', depth: 1, text: 'ما أكثر لحظة اندهشت فيها من قوة علاقتنا؟' },
  { id: 26, category: 'relationship', depth: 3, text: 'هل تعتقد أن هناك حاجزاً بيننا الآن؟ ما طبيعته؟', deepenFollowUp: 'ومتى بدأت تشعر به؟ وهل حاولت إخباري؟' },
  { id: 27, category: 'relationship', depth: 2, text: 'ما الشيء الذي يجعل خلافاتنا أصعب مما ينبغي؟' },
  { id: 28, category: 'relationship', depth: 1, text: 'ما الذكرى المشتركة التي تضحك كلما تذكرتها؟' },
  { id: 29, category: 'relationship', depth: 2, text: 'كيف تشعر عندما أكون بعيداً عنك لفترة؟ ما الذي تشتاق إليه أولاً؟' },
  { id: 30, category: 'relationship', depth: 3, text: 'هل تشعر أن علاقتنا نمت في الأشهر الأخيرة؟ وإذا لم تكن كذلك، ما السبب برأيك؟', deepenFollowUp: 'وما الذي يمكنني فعله لأجعلك تشعر بالنمو معاً؟' },
  { id: 31, category: 'relationship', depth: 1, text: 'ما الشيء الذي تفخر به في علاقتنا لو حكيتها لصديق؟' },
  { id: 32, category: 'relationship', depth: 2, text: 'هل هناك شيء توقفنا عن فعله معاً كنت تستمتع به؟ ما هو؟', deepenFollowUp: 'ولماذا لم تخبرني؟' },
  { id: 33, category: 'relationship', depth: 1, text: 'ما الشيء الذي أتعلمه منك باستمرار بدون أن تعرف؟' },
  { id: 34, category: 'relationship', depth: 2, text: 'كيف تصف علاقتنا في جملة واحدة؟ واختر الجملة بعناية.' },
  { id: 35, category: 'relationship', depth: 3, text: 'ما أكثر شيء في شخصيتي جعل العلاقة أصعب مما كنت تتوقع؟', deepenFollowUp: 'وكيف تعاملت مع ذلك بداخلك؟' },
  { id: 36, category: 'relationship', depth: 1, text: 'ما أجمل شيء أحضرته لحياتك منذ أن كنا معاً؟' },
  { id: 37, category: 'relationship', depth: 2, text: 'هل تشعر أنك تقبلني كما أنا تماماً؟ أم هناك جزء تتمنى أن يختلف؟' },
  { id: 38, category: 'relationship', depth: 1, text: 'ما الشيء الذي أفعله ويجعلك تشعر بالأمان في علاقتنا؟' },
  { id: 39, category: 'relationship', depth: 2, text: 'كيف تتعامل عندما تشعر أننا بعيدان عاطفياً؟', deepenFollowUp: 'وهل تخبرني دائماً حين يحدث ذلك؟' },
  { id: 40, category: 'relationship', depth: 3, text: 'ما الشيء الذي تقوله لنفسك عن علاقتنا في لحظات الشك؟', deepenFollowUp: 'ومن أين جاء ذلك الصوت الداخلي؟' },

  // ─── 🧠 الشخصية والأفكار ─────────────────────────────────────────────────────
  { id: 41, category: 'personality', depth: 1, text: 'ما الشيء الذي اكتشفته عن نفسك بعد أن كنا معاً؟' },
  { id: 42, category: 'personality', depth: 2, text: 'ما الموضوع الذي تتمنى أن تفهمه عني أكثر؟', deepenFollowUp: 'وهل سبق أن حاولت وفشلت؟ ماذا حدث؟' },
  { id: 43, category: 'personality', depth: 1, text: 'ما الشيء الذي يثير حماسك في الحياة ولا أعرف عنه الكثير؟' },
  { id: 44, category: 'personality', depth: 2, text: 'ما أكبر تحدٍّ شخصي تواجهه الآن ولم تخبرني عنه كاملاً؟', deepenFollowUp: 'وكيف يمكنني مساعدتك فيه؟' },
  { id: 45, category: 'personality', depth: 1, text: 'إذا كان لديك يوم كامل لنفسك تماماً، ماذا ستفعل؟' },
  { id: 46, category: 'personality', depth: 3, text: 'ما الخوف الأعمق الذي يشكّل قراراتك في الحياة؟', deepenFollowUp: 'وكيف أثّر على علاقتنا دون أن تقصد؟' },
  { id: 47, category: 'personality', depth: 2, text: 'ما الإنجاز الذي فخرت به كثيراً ولم أعطك التقدير الكافي عليه؟' },
  { id: 48, category: 'personality', depth: 1, text: 'ما الكتاب أو الفيلم أو الأغنية التي تصف حياتك في هذه المرحلة؟' },
  { id: 49, category: 'personality', depth: 2, text: 'ما الشيء في شخصيتك لا يزال قيد التطور وتعمل عليه؟', deepenFollowUp: 'وكيف يمكنني أن أكون داعماً في هذا التطور؟' },
  { id: 50, category: 'personality', depth: 1, text: 'ما أكثر نصيحة تلقيتها في حياتك غيّرت طريقة تفكيرك؟' },
  { id: 51, category: 'personality', depth: 2, text: 'ما الفرق بين نفسك أمامي وأمام الآخرين؟ وما أسباب هذا الفرق؟' },
  { id: 52, category: 'personality', depth: 1, text: 'ما الشيء الذي تفعله بمفردك يجعلك تشعر بالسعادة الحقيقية؟' },
  { id: 53, category: 'personality', depth: 3, text: 'ما الجرح القديم الذي لا يزال يؤثر عليك حتى اليوم؟', deepenFollowUp: 'وكيف يظهر ذلك في علاقتنا؟' },
  { id: 54, category: 'personality', depth: 2, text: 'لو كان بإمكانك تغيير شيء واحد في طفولتك، ما هو؟', deepenFollowUp: 'وكيف أثّر ذلك الشيء على شخصيتك الآن؟' },
  { id: 55, category: 'personality', depth: 1, text: 'ما الشيء الذي تتمنى أن يفهمه الناس عنك بشكل أفضل؟' },
  { id: 56, category: 'personality', depth: 2, text: 'ما القرار الصعب اتخذته وحده وكنت تتمنى لو استشرتني فيه؟' },
  { id: 57, category: 'personality', depth: 1, text: 'إذا عرّفت نفسك بكلمتين فقط، ما هما؟' },
  { id: 58, category: 'personality', depth: 3, text: 'ما الشيء الذي تتحاشاه في العلاقات عموماً والذي تعلّمته من الماضي؟', deepenFollowUp: 'وهل أعدتَ تكراره معي رغم ذلك؟' },
  { id: 59, category: 'personality', depth: 2, text: 'ما أكثر شيء تحترمه في نفسك؟ ولماذا تختار هذه الصفة تحديداً؟' },
  { id: 60, category: 'personality', depth: 1, text: 'ما الشيء الذي تحلم بفعله لو لم يكن للخوف أي دور في قراراتك؟' },

  // ─── 🪞 الاعترافات ────────────────────────────────────────────────────────────
  { id: 61, category: 'confessions', depth: 1, text: 'ما شيء أزعجك مني ولم تقله لي لأنك لا تريد أن تجرحني؟', deepenFollowUp: 'وكيف تعاملت مع هذا الشعور بداخلك؟' },
  { id: 62, category: 'confessions', depth: 2, text: 'هل سبق أن أخبرت شخصاً عن مشكلة بيننا قبل أن تخبرني؟ ماذا قلت؟', deepenFollowUp: 'وكيف تشعر حين تفعل ذلك؟' },
  { id: 63, category: 'confessions', depth: 1, text: 'ما الشيء الذي فعلته وتمنيت لو أنك لم تفعله في علاقتنا؟' },
  { id: 64, category: 'confessions', depth: 3, text: 'هل هناك شيء قلته لي كان في الحقيقة أعمق مما يبدو؟ ما هو؟', deepenFollowUp: 'ولماذا اخترت قوله بتلك الطريقة غير المباشرة؟' },
  { id: 65, category: 'confessions', depth: 2, text: 'ما الطريقة التي تلجأ إليها لتجنب محادثة صعبة معي؟', deepenFollowUp: 'ومتى تدرك أنك بدأت في التجنب؟' },
  { id: 66, category: 'confessions', depth: 1, text: 'هل سبق أن شعرت بالغيرة مني؟ في أي موقف؟' },
  { id: 67, category: 'confessions', depth: 2, text: 'ما الشيء الذي كذبت فيه أو أخفيت الحقيقة بشأنه لتجنب مشكلة؟' },
  { id: 68, category: 'confessions', depth: 1, text: 'ما الشيء الذي لو عرفته عني مسبقاً، كان ممكن أن يغيّر قرارك؟' },
  { id: 69, category: 'confessions', depth: 3, text: 'ما الجانب في شخصيتي يخيفك أحياناً حتى لو لم تعترف بذلك؟', deepenFollowUp: 'وكيف تتعامل مع هذا الخوف؟' },
  { id: 70, category: 'confessions', depth: 2, text: 'هل سبق أن قرّرت أن تتركني أو فكرت جدياً في ذلك؟ ما الذي جعلك تتراجع؟', deepenFollowUp: 'وهل أنا أعرف ذلك؟' },
  { id: 71, category: 'confessions', depth: 1, text: 'ما الشيء الذي تعتذر منه دائماً ولكنك تكرره؟ ولماذا برأيك؟' },
  { id: 72, category: 'confessions', depth: 2, text: 'هل هناك شيء أفعله يضايقك لكنك قررت قبوله؟ ما هو؟', deepenFollowUp: 'وهل الأفضل أن تخبرني بدلاً من قبوله؟' },
  { id: 73, category: 'confessions', depth: 1, text: 'ما الشيء الذي أُحكم فيه حكماً خاطئاً ولم أقبل تصحيحه منك؟' },
  { id: 74, category: 'confessions', depth: 3, text: 'ما أكبر خطأ ارتكبته في علاقتنا ولم تعتذر عنه بشكل كافٍ؟', deepenFollowUp: 'وكيف لا يزال هذا الخطأ يؤثر عليك؟' },
  { id: 75, category: 'confessions', depth: 2, text: 'هل سبق أن شعرت أنك تقمّعت شيئاً مني لشهور قبل أن تقوله؟ ما هو؟' },

  // ─── 🔥 الجريئة ──────────────────────────────────────────────────────────────
  { id: 76, category: 'bold', depth: 1, text: 'ما أكثر لحظة شعرت فيها بالجاذبية تجاهي بشكل مفاجئ؟' },
  { id: 77, category: 'bold', depth: 2, text: 'ما الشيء الذي تتمنى أن أقدم عليه أكثر في علاقتنا؟', deepenFollowUp: 'وما الذي يمنعني من ذلك برأيك؟' },
  { id: 78, category: 'bold', depth: 1, text: 'ما الشيء الذي أفعله ويجعلك تشعر بالانجذاب التام نحوي؟' },
  { id: 79, category: 'bold', depth: 2, text: 'ما الأمر الذي تحلم بتجربته معي ولم تقله بعد؟' },
  { id: 80, category: 'bold', depth: 1, text: 'صف لحظة شعرت فيها أنني خصصت وقتي لك بالكامل — كيف كان ذلك؟' },
  { id: 81, category: 'bold', depth: 2, text: 'ما الشيء الذي تتمنى أن أقوله لك أو أفعله دون أن تطلبه منى؟', deepenFollowUp: 'ولماذا يصعب عليك طلب ذلك مباشرةً؟' },
  { id: 82, category: 'bold', depth: 1, text: 'ما الشيء في مظهري أو أسلوبي يستهويك تحديداً؟' },
  { id: 83, category: 'bold', depth: 2, text: 'هل هناك طريقة تودّ أن أُعبّر عن رغبتك الحضور لديّ بشكل مختلف؟' },
  { id: 84, category: 'bold', depth: 1, text: 'ما أجمل مجاملة قلتها لي ولا أزال أتذكرها؟' },
  { id: 85, category: 'bold', depth: 3, text: 'هل تشعر أن هناك جانباً منك لا تجرؤ على إظهاره أمامي؟ ما هو؟', deepenFollowUp: 'وما الذي يجعلك تخشى إظهاره؟' },
  { id: 86, category: 'bold', depth: 1, text: 'ما أكثر لحظة قربٍ حقيقي شعرت به مني — ليس بالضرورة جسدياً؟' },
  { id: 87, category: 'bold', depth: 2, text: 'ما أكثر لحظة شعرت فيها أنني احتجتك تماماً ولم أعترف بذلك؟' },
  { id: 88, category: 'bold', depth: 1, text: 'ما الشيء الذي تتمنى أن أفاجئك به؟' },
  { id: 89, category: 'bold', depth: 2, text: 'إذا كان بإمكانك إعادة تصميم يوم مثالي معاً، كيف سيكون من البداية حتى النهاية؟' },
  { id: 90, category: 'bold', depth: 1, text: 'ما الكلمات أو العبارات التي تريد أن أستخدمها معك أكثر؟' },

  // ─── 💭 المستقبل ──────────────────────────────────────────────────────────────
  { id: 91, category: 'future', depth: 1, text: 'ما الحلم الذي تريد أن نحققه معاً في السنوات القادمة؟' },
  { id: 92, category: 'future', depth: 2, text: 'كيف تتخيل حياتنا بعد عشر سنوات؟ ما الجزء الأكثر أهمية بالنسبة لك؟', deepenFollowUp: 'وما الشيء الذي تخشى أن يتغير؟' },
  { id: 93, category: 'future', depth: 1, text: 'ما المغامرة التي تتمنى أن نخوضها معاً يوماً؟' },
  { id: 94, category: 'future', depth: 2, text: 'ما أكبر خوف لديك من المستقبل يتعلق بعلاقتنا؟', deepenFollowUp: 'وكيف يمكنني أن أُطمّئنك بشأنه؟' },
  { id: 95, category: 'future', depth: 1, text: 'إذا نجحنا في تحقيق حلم واحد معاً، ما هو؟' },
  { id: 96, category: 'future', depth: 3, text: 'ما الشيء الذي تريده للمستقبل بشدة لكنك تخشى أن تطلبه مني؟', deepenFollowUp: 'وما الذي يجعلك تخشى الطلب؟' },
  { id: 97, category: 'future', depth: 2, text: 'ما الأهداف الشخصية التي تريد أن أكون داعماً فيها أكثر؟' },
  { id: 98, category: 'future', depth: 1, text: 'ما المكان الذي تحلم أن نزوره معاً ولم نفعل بعد؟' },
  { id: 99, category: 'future', depth: 2, text: 'كيف تريد أن تكون طريقة تعاملنا مع المشاكل في المستقبل؟', deepenFollowUp: 'وما الذي يجب أن يتغير مقارنةً بالآن لتحقيق ذلك؟' },
  { id: 100, category: 'future', depth: 1, text: 'ما الشيء الذي تريد أن نتعلمه معاً؟' },
  { id: 101, category: 'future', depth: 3, text: 'إذا علمت أن لديك سنة واحدة فقط مع الشخص الذي تحب، كيف ستقضيها؟', deepenFollowUp: 'وما الذي تؤجله الآن كان يجب أن تفعله؟' },
  { id: 102, category: 'future', depth: 2, text: 'ما أكثر شيء تريد أن تحققه في حياتك المهنية وتريدني أن أكون جزءاً منه؟' },
  { id: 103, category: 'future', depth: 1, text: 'ما التقليد أو العادة التي تريد أن نبنيها معاً في حياتنا المشتركة؟' },
  { id: 104, category: 'future', depth: 2, text: 'كيف تريد أن يكون شريكك الحياتي في لحظات الأزمة — وهل أنا كذلك الآن؟' },
  { id: 105, category: 'future', depth: 1, text: 'ما الشيء الذي تريد أن تقوله لنفسك بعد عشر سنوات عن علاقتنا؟' },

  // ─── 😂 الضحك ─────────────────────────────────────────────────────────────────
  { id: 106, category: 'laugh', depth: 1, text: 'ما أغرب عادة لديّ وتجدها مضحكة سراً؟' },
  { id: 107, category: 'laugh', depth: 1, text: 'ما الموقف المحرج الذي حدث لنا معاً وأصبحنا الآن نضحك عليه؟' },
  { id: 108, category: 'laugh', depth: 1, text: 'لو كنت ستكتب بطاقة تعريف بيّ لشخص غريب، ماذا ستكتب؟' },
  { id: 109, category: 'laugh', depth: 1, text: 'ما أسوأ نكتة سمعتها مني وابتسمت رغم ذلك لأجلي؟' },
  { id: 110, category: 'laugh', depth: 1, text: 'لو كانت حياتنا مسلسلاً، ما اسمه وما أكثر حلقة مضحكة فيه؟' },
  { id: 111, category: 'laugh', depth: 1, text: 'ما أغرب قرار اتخذناه معاً وأدهش الآخرين؟' },
  { id: 112, category: 'laugh', depth: 1, text: 'إذا كان بإمكانك تقليد شيئاً أفعله الآن، ما الذي ستقلّده؟' },
  { id: 113, category: 'laugh', depth: 1, text: 'ما الجملة التي أقولها دائماً وأصبحت من "علامات" علاقتنا؟' },
  { id: 114, category: 'laugh', depth: 1, text: 'لو كنت حيواناً، ما الحيوان الذي سيمثلني؟ وما الذي سيمثلك؟' },
  { id: 115, category: 'laugh', depth: 1, text: 'ما أشد لحظة أربكتك فيها ولم تتوقعها مني؟' },
  { id: 116, category: 'laugh', depth: 1, text: 'ما أغرب نقاش خضنا فيه وانتهى بلا نتيجة مضحكة؟' },
  { id: 117, category: 'laugh', depth: 1, text: 'لو كنت ستصف يومنا العادي كعرض ترويجي مثير، كيف سيكون؟' },
  { id: 118, category: 'laugh', depth: 1, text: 'ما عادتي في النوم التي تضحكك وتزعجك في نفس الوقت؟' },
  { id: 119, category: 'laugh', depth: 1, text: 'لو أعطيت علاقتنا لقباً كوميدياً، ما هو؟' },
  { id: 120, category: 'laugh', depth: 1, text: 'ما الشيء الصغير الذي تفعله وأنت تعرف أنه سيزعجني لكنك تفعله على أي حال مبتسماً؟' },

  // ─── 🎭 المواقف والافتراضات ──────────────────────────────────────────────────
  { id: 121, category: 'situations', depth: 1, text: 'لو كنا في جزيرة منعزلة لشهر، ما أول شيء ستشتكي منه وما أول شيء ستستمتع به؟' },
  { id: 122, category: 'situations', depth: 2, text: 'لو قدّر الله أن أمرض لفترة طويلة، كيف ستتعامل مع ذلك؟', deepenFollowUp: 'وهل تعتقد أنني سأكون شريكاً سهلاً في الأزمات؟' },
  { id: 123, category: 'situations', depth: 1, text: 'لو كان يمكنك تغيير قاعدة واحدة في حياتنا المشتركة، ما هي؟' },
  { id: 124, category: 'situations', depth: 2, text: 'لو تشاجرنا بشدة وقررت المغادرة لساعات، إلى أين ستذهب وماذا ستفعل؟', deepenFollowUp: 'وهل تعتقد أن ذلك الوقت يساعدك على التفكير أم يزيد الأمور صعوبةً؟' },
  { id: 125, category: 'situations', depth: 1, text: 'لو طُلب منك وصف علاقتنا بطبق واحد، ما هو؟ ولماذا؟' },
  { id: 126, category: 'situations', depth: 2, text: 'لو أخبرك شخص قريب أنه يرى علامات مقلقة في علاقتنا، كيف ستتعامل مع ذلك؟' },
  { id: 127, category: 'situations', depth: 1, text: 'لو استطعت العيش يوماً واحداً كاملاً في حياتي، ما الشيء الذي ستغيّره فيها؟' },
  { id: 128, category: 'situations', depth: 2, text: 'لو كنا في خلاف ودخل شخص ثالث وأخذ جانبك، ماذا ستشعر؟', deepenFollowUp: 'وهل تتمنى أحياناً أن يكون لدينا حَكَم خارجي؟' },
  { id: 129, category: 'situations', depth: 1, text: 'لو كان بإمكانك حذف ذكرى واحدة من علاقتنا، ماذا ستختار؟' },
  { id: 130, category: 'situations', depth: 3, text: 'لو علمت أنني حزين أو قلق ولا أريد أن أخبرك، كيف ستكتشف ذلك؟', deepenFollowUp: 'وكيف ستتعامل بدون أن تضغط عليّ؟' },
  { id: 131, category: 'situations', depth: 1, text: 'لو كان الطقس يعكس حالة علاقتنا الآن، ما الطقس؟' },
  { id: 132, category: 'situations', depth: 2, text: 'لو اكتشفت يوماً أن هاتفي يحتوي على مراسلات لم تعرفها، ما ردّ فعلك الأول؟' },
  { id: 133, category: 'situations', depth: 1, text: 'لو كان يمكنك إرسال رسالة لنفسك في أول يوم التعرف علينا، ما الذي ستقوله؟' },
  { id: 134, category: 'situations', depth: 2, text: 'لو كان لدينا "زر توقف" للجدالات، متى كنت ستضغط عليه في آخر خلاف بيننا؟' },
  { id: 135, category: 'situations', depth: 1, text: 'لو طُلب منك كتابة قانون واحد لعلاقتنا لا يمكن كسره، ما هو؟' },

  // ─── مزيد من الأسئلة لكل فئة لتصل 400+ ─────────────────────────────────────

  // ❤️ الحب (continued)
  { id: 136, category: 'love', depth: 1, text: 'ما الجملة التي تتمنى أن تسمعها مني كل صباح؟' },
  { id: 137, category: 'love', depth: 2, text: 'كيف تعرف أنني أفكر فيك حتى في لحظات انشغالي؟' },
  { id: 138, category: 'love', depth: 1, text: 'ما الطريقة التي تشعر معها أنني أحتفي بك كشخص وليس فقط كشريك؟' },
  { id: 139, category: 'love', depth: 2, text: 'هل هناك شيء في حبي لك يُشبه حب أحد من أسرتك؟ ما هو؟' },
  { id: 140, category: 'love', depth: 1, text: 'ما أصغر لفتة قمت بها أثّرت في قلبك كثيراً؟' },
  { id: 141, category: 'love', depth: 3, text: 'لو كان بإمكانك تحديد اللحظة التي وقعت فيها تماماً في حبي، ما هي؟', deepenFollowUp: 'وهل أخبرتني بها؟' },
  { id: 142, category: 'love', depth: 2, text: 'ما الشيء الذي يجعلك تثق بي تماماً؟ وما الذي يهزّ هذه الثقة أحياناً؟' },
  { id: 143, category: 'love', depth: 1, text: 'متى شعرت لأول مرة أن هذه العلاقة مختلفة عن غيرها؟' },

  // 🫂 علاقتنا (continued)
  { id: 144, category: 'relationship', depth: 2, text: 'ما الشيء الذي تعلمناه معاً من أصعب خلاف مررنا به؟', deepenFollowUp: 'وهل طبّقنا هذا الدرس فعلاً؟' },
  { id: 145, category: 'relationship', depth: 1, text: 'كيف تحب أن تُحتفى بك في أعيادك الخاصة؟' },
  { id: 146, category: 'relationship', depth: 2, text: 'هل هناك شيء تفتقده من بداية علاقتنا؟ ما هو؟' },
  { id: 147, category: 'relationship', depth: 1, text: 'ما الشيء الذي تقدّر فيّ أكثر عندما تكون تحت ضغط؟' },
  { id: 148, category: 'relationship', depth: 3, text: 'هل تشعر أن لدينا قواعد غير معلنة في علاقتنا؟ ما هي؟', deepenFollowUp: 'وهل هذه القواعد تخدمنا أم تعيقنا؟' },
  { id: 149, category: 'relationship', depth: 1, text: 'ما الشيء الذي تعرفه عني لا يعرفه أحد غيرك؟' },
  { id: 150, category: 'relationship', depth: 2, text: 'هل هناك موضوع نتجنب الحديث عنه معاً؟ ولماذا؟', deepenFollowUp: 'وما الذي نحتاجه حتى نستطيع فتحه بأمان؟' },

  // 🧠 الشخصية (continued)
  { id: 151, category: 'personality', depth: 2, text: 'ما أكثر شيء يُرهقك نفسياً ولا تتحدث عنه كثيراً؟', deepenFollowUp: 'وكيف يمكنني مساعدتك حين تشعر بذلك؟' },
  { id: 152, category: 'personality', depth: 1, text: 'ما الشيء الذي تُتقنه ولا أقدّره بالشكل الكافي؟' },
  { id: 153, category: 'personality', depth: 2, text: 'ما الوقت الذي تشعر فيه بأنك أنت تماماً دون قناع؟' },
  { id: 154, category: 'personality', depth: 1, text: 'لو كتبت مقالاً عن حياتك، ما سيكون العنوان؟' },
  { id: 155, category: 'personality', depth: 3, text: 'ما الشيء الذي تقنع نفسك به رغم أنك لا تؤمن به في قرارة قلبك؟', deepenFollowUp: 'وكيف يؤثر ذلك على سلوكك معي؟' },
  { id: 156, category: 'personality', depth: 2, text: 'ما أكثر شيء تمنيت فيه أن تكون مختلفاً عمّا أنت عليه؟' },
  { id: 157, category: 'personality', depth: 1, text: 'ما الموقف الذي أظهر لك أنك أقوى مما كنت تتخيل؟' },

  // 🪞 الاعترافات (continued)
  { id: 158, category: 'confessions', depth: 2, text: 'هل سبق أن شعرت بالغضب مني ولم تقله ثم ندمت على صمتك؟', deepenFollowUp: 'وما الذي منعك من قوله في تلك اللحظة؟' },
  { id: 159, category: 'confessions', depth: 1, text: 'ما الشيء الذي تمدحه علناً ولكن لا تحبه في السر؟' },
  { id: 160, category: 'confessions', depth: 3, text: 'هل هناك شيء تفعله يضر بك وتعرف أنه يضر بنا ومع ذلك تستمر؟ ما هو؟', deepenFollowUp: 'وماذا تحتاج لتوقفه؟' },
  { id: 161, category: 'confessions', depth: 2, text: 'ما اللحظة التي شعرت فيها أنك خذلتني ولم تقلها لي مباشرةً؟' },
  { id: 162, category: 'confessions', depth: 1, text: 'ما الشيء الذي أفعله ويجعلك تشعر بعدم الاحترام دون أن تقصد؟' },
  { id: 163, category: 'confessions', depth: 2, text: 'هل تعتقد أنني أعرفك كما تعرف نفسك؟ ما الجانب الذي أجهله تماماً؟' },
  { id: 164, category: 'confessions', depth: 1, text: 'ما الشيء الذي تعذّر فعله مؤخراً ولم تخبرني لماذا؟' },

  // 🔥 الجريئة (continued)
  { id: 165, category: 'bold', depth: 2, text: 'ما الشيء الذي يجعلك تشعر بالجاذبية الكاملة نحوي حتى في اللحظات العادية؟' },
  { id: 166, category: 'bold', depth: 1, text: 'ما الكلمات التي تحب أن أقولها لك في لحظة الضعف؟' },
  { id: 167, category: 'bold', depth: 2, text: 'هل هناك شيء تتمنى أن يكون أكثر حميمية بيننا في حياتنا اليومية؟' },
  { id: 168, category: 'bold', depth: 1, text: 'ما الطريقة التي تُحسسني فيها أنك حاضر تماماً معي حين أحتاجك؟' },
  { id: 169, category: 'bold', depth: 2, text: 'ما الجانب فيّ الذي تجده أكثر جاذبية حين أكون على طبيعتي تماماً؟' },
  { id: 170, category: 'bold', depth: 1, text: 'ما الشيء الذي إذا فعلته سيجعل مساءنا لا يُنسى؟' },

  // 💭 المستقبل (continued)
  { id: 171, category: 'future', depth: 2, text: 'ما الشيء الذي لو تغيّر في حياتنا سيجعلك تشعر أن كل شيء على ما يرام؟' },
  { id: 172, category: 'future', depth: 1, text: 'ما النوع من العيش الذي تحلم به معاً — مدينة أم ريف، هدوء أم حركة؟' },
  { id: 173, category: 'future', depth: 2, text: 'ما الشيء الذي تريد أن يتذكره الناس عنا كزوجين بعد سنوات؟', deepenFollowUp: 'وهل نمشي الآن في الاتجاه الصحيح لهذا؟' },
  { id: 174, category: 'future', depth: 1, text: 'ما الهوايات أو الاهتمامات التي تريد أن نشاركها معاً لم نبدأها بعد؟' },
  { id: 175, category: 'future', depth: 3, text: 'لو علمت أن المستقبل سيكون صعباً، ما الشيء الذي يجعلك متمسكاً بنا رغم ذلك؟', deepenFollowUp: 'وهل أعرف أنك تفكر بهذه الطريقة؟' },
  { id: 176, category: 'future', depth: 2, text: 'ما الشيء الذي تريد إنجازه لوحدك قبل أن تُركّز على أهدافنا المشتركة؟' },
  { id: 177, category: 'future', depth: 1, text: 'ما أول شيء ستفعله إذا حقّقنا حلمنا الكبير معاً؟' },

  // 😂 الضحك (continued)
  { id: 178, category: 'laugh', depth: 1, text: 'ما أسوأ تجربة طهي مررنا بها معاً وانتهت بالضحك؟' },
  { id: 179, category: 'laugh', depth: 1, text: 'لو كنت ستكتب عناوين أخبار عن حياتنا اليومية، ما سيكون الأضحك؟' },
  { id: 180, category: 'laugh', depth: 1, text: 'ما الجانب الطفولي فيّ الذي يُضحكك وأنا غير مُدرك له؟' },
  { id: 181, category: 'laugh', depth: 1, text: 'لو كنّا شخصيتين في برنامج تلفزيوني، من سيكون البطل الكوميدي منّا؟' },
  { id: 182, category: 'laugh', depth: 1, text: 'ما أغرب حجة دخلنا فيها وأدركنا بعدها أنها لا معنى لها؟' },
  { id: 183, category: 'laugh', depth: 1, text: 'ما الشيء الذي أفعله حين أكون متحمساً ويجعلك تبتسم بشكل لا إرادي؟' },

  // 🎭 المواقف (continued)
  { id: 184, category: 'situations', depth: 2, text: 'لو أتيحت لك فرصة عمل أحلامك في مدينة بعيدة، كيف ستُقرر؟', deepenFollowUp: 'وكيف ستجعل هذا القرار سهلاً علينا؟' },
  { id: 185, category: 'situations', depth: 1, text: 'لو كنا نلعب لعبة صدق أو جرأة الآن، ماذا ستختار ولماذا؟' },
  { id: 186, category: 'situations', depth: 2, text: 'لو احتجت مساعدتك في وقت صعب جداً، كيف ستعرف أنني محتاج دون أن أقول؟' },
  { id: 187, category: 'situations', depth: 1, text: 'لو كان بإمكانك تصميم يوم مثالي لي تماماً كما أحب — لا كما تحب أنت — كيف سيكون؟' },
  { id: 188, category: 'situations', depth: 2, text: 'لو خيّرك أحد قريب منك بين علاقتنا وشيء آخر مهم له، كيف ستتعامل مع الموقف؟' },
  { id: 189, category: 'situations', depth: 1, text: 'لو كنا نكتب كتاباً عن علاقتنا، ما الفصل الذي ستكتبه بنفسك؟' },
  { id: 190, category: 'situations', depth: 3, text: 'لو كانت علاقتنا طفلاً، كم عمره الآن وكيف يبدو؟', deepenFollowUp: 'وما الذي يحتاجه هذا الطفل الآن ليكبر بصحة؟' },

  // ─── جولة إضافية لكل فئة للوصول إلى 400+ ────────────────────────────────────

  // ❤️ الحب
  { id: 191, category: 'love', depth: 1, text: 'ما الشيء الذي أفعله تلقائياً يُعبّر عن حبي لك أكثر من الكلام؟' },
  { id: 192, category: 'love', depth: 2, text: 'كيف تتعامل عندما تحبني ولكنك لست معجباً بتصرفي؟', deepenFollowUp: 'وهل تنجح دائماً في الفصل بين الأمرين؟' },
  { id: 193, category: 'love', depth: 1, text: 'ما اللحظة التي تشعر فيها أن كل شيء في مكانه الصحيح معي؟' },
  { id: 194, category: 'love', depth: 3, text: 'هل تعتقد أن الحب الحقيقي يكفي لتجاوز كل شيء؟ أين الحدود بالنسبة لك؟', deepenFollowUp: 'وهل أعرف هذه الحدود؟' },
  { id: 195, category: 'love', depth: 2, text: 'ما الطريقة التي تعبّر بها عن حبك لي عندما تكون كلماتك عاجزة؟' },
  { id: 196, category: 'love', depth: 1, text: 'ما الأغنية التي تُذكّرك بي وبماذا؟' },
  { id: 197, category: 'love', depth: 2, text: 'ما الشيء الذي تتقنه في رعايتك لي لا يفعله أحد غيرك؟' },
  { id: 198, category: 'love', depth: 1, text: 'لو أرسلت لي رسالة الآن تعبر فيها عن مشاعرك دون قيود، ما ستكتب؟' },
  { id: 199, category: 'love', depth: 3, text: 'ما الشيء الذي تخشى أن يتوقف حبي عنده يوماً؟', deepenFollowUp: 'ومن أين جاء هذا الخوف؟' },
  { id: 200, category: 'love', depth: 2, text: 'ما معنى "الأمان" بالنسبة لك في علاقة حب؟ وهل تجده معي؟' },

  // 🫂 علاقتنا
  { id: 201, category: 'relationship', depth: 1, text: 'ما الشيء الذي يجعل العودة إلى البيت إليّ شعوراً مختلفاً؟' },
  { id: 202, category: 'relationship', depth: 2, text: 'ما الطريقة التي تفضلها للاعتذار عني حين تخطئ؟', deepenFollowUp: 'وهل تشعر أنني أقبل اعتذارك حقاً؟' },
  { id: 203, category: 'relationship', depth: 1, text: 'ما الشيء الذي تتمنى أن أبادر إليه بدون أن تطلبه مني؟' },
  { id: 204, category: 'relationship', depth: 3, text: 'ما الأنماط السلبية التي لاحظتها في علاقتنا وتعتقد أننا نتجاهلها؟', deepenFollowUp: 'وما الذي يجعل الحديث عنها صعباً؟' },
  { id: 205, category: 'relationship', depth: 2, text: 'كيف تتعامل مع نفسك في لحظات الشعور بالوحدة حتى حين أكون موجوداً؟' },
  { id: 206, category: 'relationship', depth: 1, text: 'ما الشيء الذي يجعل وجودي معك أسهل من وجود أي شخص آخر؟' },
  { id: 207, category: 'relationship', depth: 2, text: 'هل تشعر أنني أعطيك الوقت الكافي في وسط ضغوطات الحياة؟ ما الذي تحتاجه أكثر؟', deepenFollowUp: 'ولماذا لم تطلبه مباشرةً؟' },
  { id: 208, category: 'relationship', depth: 1, text: 'ما أول شيء تفكر فيه حين تعرض عليك فكرة أو قرار مهم — هل تفكر فيّ أم في نفسك أولاً؟' },
  { id: 209, category: 'relationship', depth: 2, text: 'ما الشيء الذي لو أصلحناه في طريقة تواصلنا سيجعل كل شيء أفضل؟' },
  { id: 210, category: 'relationship', depth: 1, text: 'ما الشيء الذي لا تجده في أي علاقة غير علاقتنا؟' },

  // 🧠 الشخصية
  { id: 211, category: 'personality', depth: 1, text: 'ما الشيء الذي يعطيك طاقة حقيقية بعد يوم صعب؟' },
  { id: 212, category: 'personality', depth: 2, text: 'ما الحدّ الذي لا يستطيع أحد تجاوزه معك — حتى أنا؟', deepenFollowUp: 'وهل أحترم هذا الحد دائماً؟' },
  { id: 213, category: 'personality', depth: 1, text: 'ما الشيء الذي يُربكك باستمرار وتجد صعوبة في تفسيره لنفسك؟' },
  { id: 214, category: 'personality', depth: 3, text: 'ما النمط الذي تكرره في علاقاتك ولاحظته مع الزمن؟', deepenFollowUp: 'وهل هو موجود في علاقتنا أيضاً؟' },
  { id: 215, category: 'personality', depth: 2, text: 'ما القيمة التي تعتبرها أكثر قيمة في حياتك وكيف أثّرت في اختياراتك؟' },
  { id: 216, category: 'personality', depth: 1, text: 'ما الشيء الذي تُحكم فيه بسرعة ثم تندم لاحقاً؟' },
  { id: 217, category: 'personality', depth: 2, text: 'ما المرحلة من حياتك كانت الأصعب وكيف غيّرتك؟', deepenFollowUp: 'وهل تعتقد أنني أرى آثار تلك المرحلة عليك؟' },
  { id: 218, category: 'personality', depth: 1, text: 'ما الشيء الذي يجعلك تشعر بالفخر الحقيقي بنفسك؟' },
  { id: 219, category: 'personality', depth: 3, text: 'ما الحاجة العاطفية الأساسية التي إذا لم تتلبَّ تُفقدك توازنك؟', deepenFollowUp: 'وهل تشعر أنني أُلبّيها لك؟' },
  { id: 220, category: 'personality', depth: 2, text: 'ما الفرق بين الطريقة التي ترى بها نفسك والطريقة التي تعتقد أنني أراك بها؟' },

  // 🪞 الاعترافات
  { id: 221, category: 'confessions', depth: 2, text: 'هل هناك شيء حدث في الماضي لا يزال يُشكّل شكوكك تجاهنا الآن؟', deepenFollowUp: 'وهل كلمتني عنه من قبل؟' },
  { id: 222, category: 'confessions', depth: 1, text: 'ما الشيء الذي تختلق فيه عذراً لنفسك لكنك تعرف في داخلك أنه خاطئ؟' },
  { id: 223, category: 'confessions', depth: 2, text: 'هل سبق أن شعرت أنك غير مُقدَّر مني وكنت محقاً في ذلك؟ ما الموقف؟' },
  { id: 224, category: 'confessions', depth: 1, text: 'ما الشيء الذي تتجنب الاعتذار عنه وأنت تعرف أنك أخطأت؟' },
  { id: 225, category: 'confessions', depth: 3, text: 'ما الشيء الذي تخشى الاعتراف به لي لأنك تخشى أن يغيّر نظرتي لك؟', deepenFollowUp: 'وهل تعتقد فعلاً أن ذلك سيغيّرني؟' },
  { id: 226, category: 'confessions', depth: 2, text: 'هل هناك شيء تُوافقني عليه ظاهرياً لكن في الداخل ترفضه تماماً؟', deepenFollowUp: 'وما الذي يمنعك من قول رأيك الحقيقي؟' },
  { id: 227, category: 'confessions', depth: 1, text: 'ما الشيء الذي تعلمته من خطأ ارتكبته في علاقتنا ولم تشاركني الدرس؟' },
  { id: 228, category: 'confessions', depth: 2, text: 'هل تعتقد أنك في بعض الأحيان تُعامل مشاعرك كأنها أقل أهمية من مشاعري؟', deepenFollowUp: 'ومن أين جاء ذلك التعليم؟' },
  { id: 229, category: 'confessions', depth: 1, text: 'ما الشيء الذي تفعله حين تكون محبطاً مني بدل أن تقول ذلك مباشرةً؟' },
  { id: 230, category: 'confessions', depth: 3, text: 'ما الجزء الذي لا تُريني إياه منك لأنك تظن أنني لن أحبه؟', deepenFollowUp: 'وهل هذا الظن مبني على تجارب حقيقية معي؟' },

  // 🔥 الجريئة
  { id: 231, category: 'bold', depth: 1, text: 'ما الشيء الذي تتمنى أن تُجامل عليه أكثر مما تفعل عادةً؟' },
  { id: 232, category: 'bold', depth: 2, text: 'ما أكثر لحظة شعرت فيها أنك تريد أن تكون شجاعاً عاطفياً أمامي ولم تستطع؟', deepenFollowUp: 'وما الذي كان يمنعك؟' },
  { id: 233, category: 'bold', depth: 1, text: 'ما الشيء الذي تحبه في طريقتي في التعبير عن محبتي لك — الشيء الذي لا يفعله أحد غيري؟' },
  { id: 234, category: 'bold', depth: 2, text: 'ما الحاجز الذي تشعر أنه يمنعنا من الوصول إلى مستوى أعمق من الحميمية؟' },
  { id: 235, category: 'bold', depth: 1, text: 'ما التجربة الجديدة التي تتمنى أن نخوضها معاً؟' },
  { id: 236, category: 'bold', depth: 2, text: 'هل تشعر أنني أُعطيك مساحة كافية لتكون نفسك تماماً في علاقتنا؟', deepenFollowUp: 'وما الذي يجعلك تتقلص أحياناً؟' },
  { id: 237, category: 'bold', depth: 1, text: 'ما الشيء الذي تحلم أن أفعله معك لم يسبق أن اقترحته؟' },
  { id: 238, category: 'bold', depth: 2, text: 'كيف تُعبّر عن رغبتك في القرب مني حين تشعر بذلك دون أن تقوله بالكلمات؟' },

  // 💭 المستقبل
  { id: 239, category: 'future', depth: 2, text: 'كيف تتخيل شكل حياتنا حين نكون أهدأ وأكثر استقراراً؟', deepenFollowUp: 'وما الشيء الذي يجب أن يتغير الآن لنصل إلى ذلك؟' },
  { id: 240, category: 'future', depth: 1, text: 'ما الشيء الذي ستفعله أولاً لو لم يكن في حياتنا أي ضغوط مالية؟' },
  { id: 241, category: 'future', depth: 2, text: 'كيف تريد أن يكون دورك في حياتنا المشتركة خلال السنوات القادمة؟', deepenFollowUp: 'وهل تعتقد أن الواقع الآن يسمح بذلك؟' },
  { id: 242, category: 'future', depth: 1, text: 'ما التغيير الصغير الذي لو بدأناه اليوم سيُحسّن حياتنا بشكل كبير؟' },
  { id: 243, category: 'future', depth: 3, text: 'لو كانت علاقتنا ستمر بتحدٍّ كبير قادم، ما أكثر شيء تعتمد عليه فيّ لتجاوزه؟', deepenFollowUp: 'وهل أعرف أنك تعتمد عليّ بهذا الشكل؟' },
  { id: 244, category: 'future', depth: 2, text: 'ما الشيء الذي تتمنى أن يكون لنا معاً لم يتحقق بعد؟' },
  { id: 245, category: 'future', depth: 1, text: 'ما الشيء الذي تريد أن تعلّمه لأطفالنا عن الحب؟' },

  // 😂 الضحك
  { id: 246, category: 'laugh', depth: 1, text: 'ما الحجة التافهة التي وجدت نفسك فيها تدافع عنها بكل جدية؟' },
  { id: 247, category: 'laugh', depth: 1, text: 'ما الاسم الكودي الذي ستُطلقه علينا كزوجين في مشروع سري؟' },
  { id: 248, category: 'laugh', depth: 1, text: 'ما التعبير الذي أخترعته أنت واستخدمناه حتى أصبح جزءاً من لغتنا؟' },
  { id: 249, category: 'laugh', depth: 1, text: 'ما الموقف الذي كان يجب أن يكون رومانسياً لكنه خرج بشكل كوميدي تماماً؟' },
  { id: 250, category: 'laugh', depth: 1, text: 'لو كانت حياتنا مسرحية تمثيلية، ما الحوار الأكثر تكراراً فيها؟' },

  // 🎭 المواقف
  { id: 251, category: 'situations', depth: 2, text: 'لو أخبرتك أنني أفكر جدياً في تغيير مسار حياتي المهني، ما ردّ فعلك الأول؟', deepenFollowUp: 'وما الذي ستحتاجه مني لتدعمني في ذلك؟' },
  { id: 252, category: 'situations', depth: 1, text: 'لو كنا في مكان عام وشعرت بالإحراج من موقف ما، كيف تريد أن أتصرف؟' },
  { id: 253, category: 'situations', depth: 2, text: 'لو أصيب أحد من عائلتك بمرض خطير، كيف ستريدني أن أكون بجانبك؟', deepenFollowUp: 'وهل تعتقد أنني سأكون هكذا فعلاً؟' },
  { id: 254, category: 'situations', depth: 1, text: 'لو استطعت تصميم يوم تعافٍ ومصالحة بيننا بعد خلاف كبير، كيف سيبدو؟' },
  { id: 255, category: 'situations', depth: 2, text: 'لو كانت لدينا قاعدة واحدة لا يمكن كسرها أبداً في خلافاتنا، ما ستختار؟', deepenFollowUp: 'وهل نتبع هذه القاعدة بالفعل؟' },

  // ─── المزيد لضمان 400+ ──────────────────────────────────────────────────────

  { id: 256, category: 'love', depth: 1, text: 'ما الوقت من اليوم تشعر فيه بأقرب ما يكون من حبي لك؟' },
  { id: 257, category: 'love', depth: 2, text: 'كيف تعبّر عن حبك لشخص حين تكون الكلمات غير كافية؟' },
  { id: 258, category: 'love', depth: 1, text: 'ما الجملة التي لو قلتها لي تماماً الآن ستشعر أنك أخرجت شيئاً من قلبك؟' },
  { id: 259, category: 'love', depth: 2, text: 'هل تعتقد أن حبنا يكفي للاحتمال أصعب الظروف؟ ما الذي يجعلك متأكداً من ذلك؟' },
  { id: 260, category: 'love', depth: 1, text: 'ما اللحظة التي أدركت فيها أن وجودي في حياتك ليس مجرد صدفة؟' },

  { id: 261, category: 'relationship', depth: 1, text: 'ما عادة صغيرة نفعلها معاً أصبحت بالنسبة لك طقساً لا تريد التخلي عنه؟' },
  { id: 262, category: 'relationship', depth: 2, text: 'كيف تتعامل مع احتياجاتك الشخصية حين تتعارض مع احتياجات علاقتنا؟' },
  { id: 263, category: 'relationship', depth: 1, text: 'ما الجانب الذي يجعلك تقول لنفسك: "نعم، هذا الشخص المناسب لي"؟' },
  { id: 264, category: 'relationship', depth: 3, text: 'ما أقسى لحظة مررنا بها معاً وكيف جعلتنا أقوى؟', deepenFollowUp: 'وما الذي تعلمته عن نفسك في تلك اللحظة؟' },
  { id: 265, category: 'relationship', depth: 2, text: 'هل تشعر أن لدينا توازناً عادلاً في العطاء والأخذ؟ أم هناك شيء يحتاج إعادة نظر؟' },

  { id: 266, category: 'personality', depth: 1, text: 'ما الشيء الذي يُخرج أفضل نسخة منك؟' },
  { id: 267, category: 'personality', depth: 2, text: 'ما أكبر درس تعلمته من فشلٍ مررت به؟' },
  { id: 268, category: 'personality', depth: 1, text: 'ما الشيء الذي يجعلك تشعر حقاً أنك حي ومُستيقظ؟' },
  { id: 269, category: 'personality', depth: 2, text: 'كيف تميّز بين الحدسك وبين مخاوفك حين تتخذ قراراً مهماً؟' },
  { id: 270, category: 'personality', depth: 1, text: 'ما الشيء الذي تفعله في لحظات الوحدة يعكس شخصيتك الحقيقية؟' },

  { id: 271, category: 'confessions', depth: 1, text: 'ما الشيء الذي أخطأت فيه وتمنيت لو أنني سامحتك قبل أن تطلب؟' },
  { id: 272, category: 'confessions', depth: 2, text: 'هل هناك لحظة قضيت فيها وقتاً طويلاً في الشك بنفسك بسببي؟', deepenFollowUp: 'وهل أعرف عن ذلك؟' },
  { id: 273, category: 'confessions', depth: 1, text: 'ما الشيء الذي تعتذر عنه كثيراً دون أن تقصد الأذى؟' },
  { id: 274, category: 'confessions', depth: 2, text: 'هل تشعر أنك حين تُخطئ تعاقب نفسك أكثر مما يجب؟ كيف يظهر ذلك؟' },
  { id: 275, category: 'confessions', depth: 3, text: 'ما الاعتراف الذي تريد إخباري به لكنك تنتظر اللحظة المناسبة؟' },

  { id: 276, category: 'bold', depth: 1, text: 'ما الجانب من شخصيتك الذي تعتقد أنه أكثر جاذبية مما أتوقع؟' },
  { id: 277, category: 'bold', depth: 2, text: 'ما الحدّ الفاصل بين الحميمية والبُعد الذي تحتاجه أحياناً؟', deepenFollowUp: 'وكيف أُدرك متى تحتاج هذا الحد؟' },
  { id: 278, category: 'bold', depth: 1, text: 'ما اللمسة أو الإيماءة الصغيرة التي تُشعرك بالاتصال العاطفي الكامل بي؟' },
  { id: 279, category: 'bold', depth: 2, text: 'ما الذي تحتاجه مني لتشعر بالأمان لتكون مفتوحاً وضعيفاً أمامي؟' },
  { id: 280, category: 'bold', depth: 1, text: 'ما أكثر لحظة شعرت فيها أن وجودي الجسدي بجانبك كان ضرورياً؟' },

  { id: 281, category: 'future', depth: 1, text: 'ما نوع الشيخوخة التي تحلم بها وأنت بجانبي؟' },
  { id: 282, category: 'future', depth: 2, text: 'ما الشيء الذي تريد أن تكون قد حققته في حياتك بحلول الخمسين؟', deepenFollowUp: 'وكيف يمكنني أن أكون داعماً في هذا المسار؟' },
  { id: 283, category: 'future', depth: 1, text: 'لو استطعت تصميم بيتنا المثالي، كيف سيبدو وأين سيكون؟' },
  { id: 284, category: 'future', depth: 2, text: 'ما أكثر خوف لديك من أن يُؤثّر على قرارات علاقتنا المستقبلية؟' },
  { id: 285, category: 'future', depth: 1, text: 'ما الشيء الذي تتمنى أن تُدرّسه لأجيالنا القادمة عن الحياة والحب؟' },

  { id: 286, category: 'laugh', depth: 1, text: 'لو أنتجت فيلماً عن يومٍ عادي في حياتنا، ما النوع: رومانسي، كوميدي، أو إثارة؟' },
  { id: 287, category: 'laugh', depth: 1, text: 'ما الشيء الذي أقوله حين أكون منزعجاً يُضحكك رغم أنك لا تريد أن تضحك؟' },
  { id: 288, category: 'laugh', depth: 1, text: 'ما الوصفة الغريبة التي جربناها وأدت إلى كارثة طعامية لا تُنسى؟' },
  { id: 289, category: 'laugh', depth: 1, text: 'لو كانت علاقتنا مشروباً، ما هو؟ ولماذا؟' },
  { id: 290, category: 'laugh', depth: 1, text: 'ما "التكيتكة" التي نفعلها لبعض ونعرف نتيجتها مسبقاً لكن نكررها؟' },

  { id: 291, category: 'situations', depth: 1, text: 'لو حدث زلزال عاطفي كبير في حياتنا، ما أول شيء ستفعله؟' },
  { id: 292, category: 'situations', depth: 2, text: 'لو كنا نتجادل وخطر ببالك شيء جارح جداً، هل ستقوله؟ وكيف ستتحكم؟', deepenFollowUp: 'وهل حدث هذا من قبل؟' },
  { id: 293, category: 'situations', depth: 1, text: 'لو كان بإمكانك أن تُعلّمني مهارة واحدة لأُتقنها، ماذا ستختار؟' },
  { id: 294, category: 'situations', depth: 2, text: 'لو كنا في موقف يجب على أحدنا التضحية فيه، كيف ستقرر من يُضحي؟' },
  { id: 295, category: 'situations', depth: 1, text: 'لو كان بإمكانك مسح يوم واحد من ذاكرتك وذاكرتي معاً، أي يوم ستختار؟' },

  // ─── آخر جولة للوصول إلى 400+ ──────────────────────────────────────────────

  { id: 296, category: 'love', depth: 2, text: 'ما الطريقة التي تُحبني بها بشكل غير مألوف لا تفعله مع أي شخص آخر؟' },
  { id: 297, category: 'love', depth: 1, text: 'هل هناك لحظة شعرت فيها أنني أكثر مما كنت تتمنى؟ وصفها.' },
  { id: 298, category: 'love', depth: 3, text: 'ما الشيء الذي لو قُلته لك الآن سيجعلك تعيد التفكير في كل شيء بشكل إيجابي؟' },
  { id: 299, category: 'love', depth: 2, text: 'كيف يبدو الحب بالنسبة لك في أصعب أيامه؟ وكيف يبدو في أجمل أيامه؟' },
  { id: 300, category: 'love', depth: 1, text: 'ما اللحظة التي تشعر فيها أنني أختارك بوعي وليس فقط بالعادة؟' },

  { id: 301, category: 'relationship', depth: 1, text: 'ما الشيء الذي يجعلك تشعر أننا "فريق" وليس فردين منفصلين؟' },
  { id: 302, category: 'relationship', depth: 2, text: 'هل تشعر أن لدينا لغة خاصة بيننا لا يفهمها أحد غيرنا؟ ما مثال عليها؟' },
  { id: 303, category: 'relationship', depth: 3, text: 'ما أصعب قرار اتخذناه معاً وكيف أثّر على ثقتك بعلاقتنا؟', deepenFollowUp: 'وهل لا تزال آثاره موجودة الآن؟' },
  { id: 304, category: 'relationship', depth: 2, text: 'هل تشعر أن لدينا طريقة صحية للخروج من دوامة الخلاف؟ ما هي؟' },
  { id: 305, category: 'relationship', depth: 1, text: 'ما الوقت من اليوم الذي تتمنى أن نقضيه دائماً معاً بهدوء وبدون هواتف؟' },

  { id: 306, category: 'personality', depth: 2, text: 'ما الشيء الذي يُشعرك بأنك غير مفهوم في علاقتنا وفي الحياة عموماً؟', deepenFollowUp: 'وكيف تريد أن يفهمك الناس؟' },
  { id: 307, category: 'personality', depth: 1, text: 'ما الشيء الذي تستمتع بتعليمه للآخرين أو مشاركته معهم؟' },
  { id: 308, category: 'personality', depth: 2, text: 'ما القيمة التي تتنازل عنها أحياناً لإرضاء الآخرين وتندم لاحقاً؟' },
  { id: 309, category: 'personality', depth: 1, text: 'ما اللحظة التي شعرت فيها أن كل المخاطرة كانت تستحق؟' },
  { id: 310, category: 'personality', depth: 3, text: 'ما الشيء الذي تُقنع به الآخرين لكنك لا تُقنع نفسك به في الحقيقة؟', deepenFollowUp: 'وكيف يؤثر ذلك التناقض على قراراتك؟' },

  { id: 311, category: 'confessions', depth: 2, text: 'هل هناك شيء تريده مني لم تطلبه لأنك تخشى رفضي؟', deepenFollowUp: 'وكيف يمكنني أن أجعلك تشعر بأمان أكثر لطلبه؟' },
  { id: 312, category: 'confessions', depth: 1, text: 'ما الشيء الذي كنت تعمل على إخفائه قبل أن تتعرف عليّ وخففت منه بعدها؟' },
  { id: 313, category: 'confessions', depth: 2, text: 'هل تعتقد أنك تعطي في العلاقة أكثر مما تأخذ؟ وكيف تتعامل مع هذا الشعور؟' },
  { id: 314, category: 'confessions', depth: 1, text: 'ما الشيء الذي تحاكم نفسك عليه بقسوة ولا تستحق ذلك؟' },
  { id: 315, category: 'confessions', depth: 3, text: 'ما الحدث الذي لو عرفته عني الآن سيفاجئك تماماً؟' },

  { id: 316, category: 'bold', depth: 1, text: 'ما الوقت الذي تشعر فيه بأكبر قدر من الانتماء والألفة معي؟' },
  { id: 317, category: 'bold', depth: 2, text: 'ما الشيء الذي تخجل من طلبه مني وأنت تعرف في الداخل أنه مشروع تماماً؟' },
  { id: 318, category: 'bold', depth: 1, text: 'ما أكثر لفتة جسدية صغيرة مني تُشعرك بالطمأنينة الكاملة؟' },
  { id: 319, category: 'bold', depth: 2, text: 'هل تشعر أنك حين تكون في ضعفك أمامي أنك في مأمن؟ ما الذي يُشعرك بذلك؟' },
  { id: 320, category: 'bold', depth: 1, text: 'ما الشيء الذي تريد أن يبقى سراً بيننا نحن فقط؟' },

  { id: 321, category: 'future', depth: 2, text: 'كيف تريد أن تكون حياتنا الروحية أو الداخلية معاً في المستقبل؟' },
  { id: 322, category: 'future', depth: 1, text: 'ما الصورة التي تتخيلها لنا معاً بعد عشر سنوات؟' },
  { id: 323, category: 'future', depth: 3, text: 'ما الذي تخشاه من أن يحدث لعلاقتنا إذا واصلنا بنفس الأنماط الحالية؟', deepenFollowUp: 'وما الخطوة الأولى لكسر هذه الأنماط؟' },
  { id: 324, category: 'future', depth: 2, text: 'كيف تريد أن تُعرّف النجاح في علاقتنا بعد سنوات؟ ما المعيار؟' },
  { id: 325, category: 'future', depth: 1, text: 'ما المكان الذي تريد أن نبني فيه ذكرى لا تُنسى معاً؟' },

  { id: 326, category: 'laugh', depth: 1, text: 'ما أغرب هدية قدمتها أو قدّمتها لي؟' },
  { id: 327, category: 'laugh', depth: 1, text: 'لو كنت منتجاً في السوق، ما الوصف المكتوب على العبوة؟' },
  { id: 328, category: 'laugh', depth: 1, text: 'ما الشيء الذي أفعله في النوم يُضحكك وأنت صاحٍ؟' },
  { id: 329, category: 'laugh', depth: 1, text: 'لو كنا في مسابقة "أسوأ نكتة"، من سيفوز بيننا؟' },
  { id: 330, category: 'laugh', depth: 1, text: 'ما الموقف الكوميدي الذي لو حُكي على منصة ستنجح؟' },

  { id: 331, category: 'situations', depth: 1, text: 'لو قرّرنا أن نتبادل أدوارنا الحياتية لأسبوع، ما أول ما ستُدرك بعد يومين؟' },
  { id: 332, category: 'situations', depth: 2, text: 'لو طلب منك أحد قريبيك أن يسكن معنا مؤقتاً، كيف ستتعامل مع الموقف وتحافظ على مساحتنا؟' },
  { id: 333, category: 'situations', depth: 1, text: 'لو كنا في طابور طويل ومتعب، كيف تُسلّي نفسك وكيف تُسلّيني؟' },
  { id: 334, category: 'situations', depth: 2, text: 'لو رأيت شيئاً يزعجك في سلوكي أمام الناس، كيف ستُنبهني بطريقة لطيفة؟', deepenFollowUp: 'وهل فعلت ذلك من قبل؟ وكيف استقبلته؟' },
  { id: 335, category: 'situations', depth: 1, text: 'لو كان لديكما زرٌّ واحد يُعيد أفضل لحظة في علاقتنا، أيّ لحظة ستختار؟' },

  // ─── أسئلة إضافية نهائية ───────────────────────────────────────────────────

  { id: 336, category: 'love', depth: 1, text: 'ما الشيء الذي تعتقد أنني أحبه فيك ولا تعرف لماذا؟' },
  { id: 337, category: 'love', depth: 2, text: 'كيف تُفرّق بين الحب الحقيقي وبين التعلق الذي يشبه الحب؟ وأيّهما تشعر به الآن؟' },
  { id: 338, category: 'love', depth: 1, text: 'ما أجمل جملة سمعتها مني وظلّت معك؟' },

  { id: 339, category: 'relationship', depth: 2, text: 'ما الحوار الذي يجب أن نجريه ولا نزال نؤجله؟', deepenFollowUp: 'وما الذي سيحدث لو أجريناه الآن؟' },
  { id: 340, category: 'relationship', depth: 1, text: 'ما الشيء الذي يجعلك تشعر أننا "بخير" حتى في الأوقات الصعبة؟' },

  { id: 341, category: 'personality', depth: 2, text: 'ما الدور الذي تؤدّيه في حياة الآخرين ويُرهقك أحياناً؟', deepenFollowUp: 'وهل تسمح لنفسك بأن تكون محتاجاً أحياناً؟' },
  { id: 342, category: 'personality', depth: 1, text: 'ما الشيء الذي حين تفعله تشعر أنك في أفضل حالاتك؟' },

  { id: 343, category: 'confessions', depth: 2, text: 'هل هناك خطأ اعتقدت أنني سامحتك عليه لكنه لا يزال يؤلمني؟', deepenFollowUp: 'وكيف يمكننا معالجته الآن؟' },
  { id: 344, category: 'confessions', depth: 1, text: 'ما الشيء الذي تتظاهر بأنك لا تهتم به ولكنه مهم لك كثيراً؟' },

  { id: 345, category: 'bold', depth: 2, text: 'ما الذي تحتاجه مني في لحظات القوة بنفس القدر الذي تحتاجه في لحظات الضعف؟' },
  { id: 346, category: 'bold', depth: 1, text: 'ما أكثر شيء يجعلك تشعر بجمالك أو قوتك حين أنا قريب منك؟' },

  { id: 347, category: 'future', depth: 2, text: 'ما الذي تريد أن تتذكّره بوضوح من هذه المرحلة في حياتنا؟' },
  { id: 348, category: 'future', depth: 1, text: 'ما أكثر قرار مشترك تتطلع إلى اتخاذه في المستقبل القريب؟' },

  { id: 349, category: 'laugh', depth: 1, text: 'ما "قانون بيتنا" الأكثر إثارةً للضحك؟' },
  { id: 350, category: 'laugh', depth: 1, text: 'لو كان لشخصيتنا معاً شعار إعلاني، ما هو؟' },

  { id: 351, category: 'situations', depth: 2, text: 'لو كنّا نحل خلافاً وعلقنا في دوامة، ما الجملة السحرية التي تريد أن تُوقف بها كل شيء وتبدأ من جديد؟' },
  { id: 352, category: 'situations', depth: 1, text: 'لو كنت تُنظّم مفاجأة رومانسية كاملة لي دون قيود، ماذا ستختار؟' },

  { id: 353, category: 'love', depth: 2, text: 'ما الطريقة التي أُحبك بها التي لا تُصدّقها أحياناً؟' },
  { id: 354, category: 'love', depth: 1, text: 'ما الشيء الذي تريد أن أعرفه عن مشاعرك ولم تقله حتى الآن؟' },

  { id: 355, category: 'relationship', depth: 2, text: 'ما أكثر شيء تتمنى أن أفعله بشكل تلقائي دون أن تطلب؟', deepenFollowUp: 'ولماذا يصعب عليك طلبه؟' },
  { id: 356, category: 'relationship', depth: 1, text: 'ما الطريقة التي تعرف بها أنني معك حتى في أصعب لحظاتك؟' },

  { id: 357, category: 'personality', depth: 1, text: 'ما الشيء الذي تؤمن به بعمق يميّزك عن كثير من الناس؟' },
  { id: 358, category: 'personality', depth: 2, text: 'ما التغيير الذي تتمنى أن تحدثه في نفسك وتعمل عليه بهدوء؟' },

  { id: 359, category: 'confessions', depth: 1, text: 'ما الشيء الذي اعتذرت عنه مرة وكنت تعني كل كلمة؟' },
  { id: 360, category: 'confessions', depth: 2, text: 'هل هناك حاجة عاطفية تضعها جانباً كثيراً وتتمنى أن تُعطيها لنفسك؟', deepenFollowUp: 'وكيف يمكنني مساعدتك في ذلك؟' },

  { id: 361, category: 'bold', depth: 1, text: 'ما اللحظة التي شعرت فيها أنك تريد أن تقول لي "أنا هنا وأنا مُختار"؟' },
  { id: 362, category: 'bold', depth: 2, text: 'ما الشيء الذي يجعل التقرب الجسدي منّي مريحاً وليس ملتزماً فقط؟' },

  { id: 363, category: 'future', depth: 1, text: 'ما الشيء الأول الذي تريد أن نبدأ به معاً حين تنتهي اللعبة الليلة؟' },
  { id: 364, category: 'future', depth: 2, text: 'ما الاتفاق الصغير الذي تريد أن نُوقّع عليه مجازياً الآن بشأن مستقبلنا؟', deepenFollowUp: 'وكيف سنتأكد من الالتزام به؟' },

  { id: 365, category: 'laugh', depth: 1, text: 'ما الفقرة الهزلية عن علاقتنا التي ستُضحك الجمهور لو عُرضت على المسرح؟' },
  { id: 366, category: 'laugh', depth: 1, text: 'ما العبارة التي تقولها حين تريد أن تختصر تعقيد موقف ما إلى شيء مضحك؟' },

  { id: 367, category: 'situations', depth: 1, text: 'لو كان بإمكانك أن تعيش يوم طفولتك المفضل مرة أخرى وأنا بجانبك، ما اليوم؟' },
  { id: 368, category: 'situations', depth: 2, text: 'لو كنّا نُنشئ "دستور علاقتنا" الآن، ما أهم مادة فيه؟', deepenFollowUp: 'وما المادة التي تعتقد أننا ننتهك أحياناً؟' },

  { id: 369, category: 'love', depth: 1, text: 'ما الجملة التي لو قلتها لي الآن ستُريحك وتُريحني في آنٍ معاً؟' },
  { id: 370, category: 'love', depth: 3, text: 'ما معنى أن تكون محبوباً من قِبَلك — بكلمات لم تقلها من قبل؟' },

  { id: 371, category: 'relationship', depth: 2, text: 'ما الشيء الذي لو عرفه أحد قريب منّا عن علاقتنا سيُفاجأ بإيجابية؟' },
  { id: 372, category: 'relationship', depth: 1, text: 'ما العبارة التي تريد أن تسمعها مني كل مرة نمرّ بوقت صعب؟' },

  { id: 373, category: 'personality', depth: 3, text: 'ما الصراع الداخلي الذي تعيشه الآن ولا تعرف كيف تُفسّره لنفسك؟', deepenFollowUp: 'وكيف يمكنني أن أكون معك فيه دون أن أزيده ثقلاً؟' },
  { id: 374, category: 'personality', depth: 1, text: 'ما الشيء الذي تجده صعباً لكنك تتمنى أن تُتقنه يوماً ما؟' },

  { id: 375, category: 'confessions', depth: 2, text: 'هل كان هناك وقت شعرت فيه أنني لا أستحقك؟ متى كان؟', deepenFollowUp: 'وكيف عشت مع هذا الشعور؟' },
  { id: 376, category: 'confessions', depth: 1, text: 'ما الشيء الذي تعرفه عن نفسك يُزعجك ولم تخبر أحداً به حتى الآن؟' },

  { id: 377, category: 'bold', depth: 2, text: 'ما الطريقة التي تُريني بها أنك بحاجتي دون أن تقول "أنا بحاجتك"؟', deepenFollowUp: 'وهل أُدركها عادةً؟' },
  { id: 378, category: 'bold', depth: 1, text: 'ما الشيء الذي تحبه في الطريقة التي أحمل بها قلبك؟' },

  { id: 379, category: 'future', depth: 1, text: 'ما الوعد الذي تريد أن تُجدّده معي الليلة؟' },
  { id: 380, category: 'future', depth: 2, text: 'ما الحلم الذي تتمنى أن يُحقّقه كلٌّ منّا للآخر في السنوات القادمة؟' },

  { id: 381, category: 'laugh', depth: 1, text: 'ما الشيء الذي تتوقع أننا سنتشاجر بشأنه وعمرنا 70 سنة؟' },
  { id: 382, category: 'laugh', depth: 1, text: 'لو كانت كل خلافاتنا أفلاماً، ما النوع الغالب؟ كوميدي رومانسي أم إثارة أم مسرحية كلاسيكية؟' },

  { id: 383, category: 'situations', depth: 2, text: 'لو كنا بحاجة لاتخاذ قرار صعب الليلة لا يُرضي أحدنا، كيف ستضمن ألّا يضرّ القرار علاقتنا؟' },
  { id: 384, category: 'situations', depth: 1, text: 'لو كان لدينا "بروتوكول" للمصالحة السريعة بعد الخلاف، كيف سيبدو؟' },

  // ─── Final stretch to 400+ ───────────────────────────────────────────────────

  { id: 385, category: 'love', depth: 1, text: 'ما الجزء من حياتي الذي تسعد لرؤيته يزدهر أكثر من أي شيء آخر؟' },
  { id: 386, category: 'love', depth: 2, text: 'كيف تصف الفرق بين الحب كشعور والحب كقرار؟ وأين نحن الآن؟' },
  { id: 387, category: 'relationship', depth: 1, text: 'ما الشيء الذي يجعل نزاعاتنا تنتهي بالتقرب وليس بالبعد؟' },
  { id: 388, category: 'relationship', depth: 2, text: 'ما الشيء الذي يُصعّب عليك إخباري به حين تكون غاضباً؟', deepenFollowUp: 'وما الذي تحتاجه مني حتى يصبح أسهل؟' },
  { id: 389, category: 'personality', depth: 1, text: 'ما الشيء الذي تفعله بهدوء لكنه يُحدث أثراً كبيراً في حياة المحيطين بك؟' },
  { id: 390, category: 'personality', depth: 2, text: 'ما النسخة من نفسك التي تريد أن تُعرّفني عليها أكثر؟' },
  { id: 391, category: 'confessions', depth: 1, text: 'ما الشيء الذي أحياناً تقوله وتتمنى أنك قلته بطريقة مختلفة؟' },
  { id: 392, category: 'confessions', depth: 2, text: 'هل هناك شيء تتمنى أنني فعلته في وقت سابق ولم أفعله؟ ما هو؟', deepenFollowUp: 'وكيف أثّر ذلك عليك؟' },
  { id: 393, category: 'bold', depth: 1, text: 'ما الشيء الذي تريد أن تكتشفه عنّي لم تجرؤ على السؤال عنه؟' },
  { id: 394, category: 'bold', depth: 2, text: 'ما الشيء الذي يجعلك تشعر أن علاقتنا حيّة ومتجددة حتى في الروتين؟' },
  { id: 395, category: 'future', depth: 1, text: 'ما التفاهم الصامت الجميل الذي نُطوّره بيننا بدون كلام؟' },
  { id: 396, category: 'future', depth: 2, text: 'ما الشيء الذي تريد أن تتعلّمه مني في المستقبل؟', deepenFollowUp: 'وهل أعرف أن لديك هذه الرغبة؟' },
  { id: 397, category: 'laugh', depth: 1, text: 'ما التقليد الغريب الذي بدأ بالصدفة وأصبح جزءاً من حياتنا؟' },
  { id: 398, category: 'laugh', depth: 1, text: 'ما الجملة التي لو سمعها أحد غريب ستبدو مجنونة تماماً لكنها عادية جداً بالنسبة لنا؟' },
  { id: 399, category: 'situations', depth: 1, text: 'لو كانت علاقتنا كتاباً والليلة هي الفصل الأخير من سنة هذه، كيف سيُختتم؟' },
  { id: 400, category: 'situations', depth: 2, text: 'لو كان بإمكانك أن تُخبر الناس بشيء واحد عن علاقتنا يُلهمهم، ما هو؟', deepenFollowUp: 'وهل أنت فعلاً تؤمن بهذا الشيء؟' },

  // Bonus questions
  { id: 401, category: 'love', depth: 2, text: 'ما أكثر لحظة شعرت فيها أن قلبنا ينبضان بنفس الإيقاع؟' },
  { id: 402, category: 'relationship', depth: 1, text: 'ما الشيء الذي أفعله يُشعرك أنني أختار علاقتنا كل يوم؟' },
  { id: 403, category: 'personality', depth: 2, text: 'ما الشيء الذي يجعلك شخصاً من الصعب نسيانه؟' },
  { id: 404, category: 'confessions', depth: 3, text: 'ما اللحظة التي أدركت فيها أن هذا الشخص يعني لي أكثر مما اعترفت به لنفسي؟' },
  { id: 405, category: 'bold', depth: 1, text: 'ما الشيء الذي تُجاهر به أمام الآخرين لكنك لا تقوله لي بشكل كافٍ؟' },

  // ─── حزمة 2 — أسئلة جديدة (406→605) ─────────────────────────────────────
  // ❤️ الحب
  { id: 406, category: 'love', depth: 1, text: 'ما الذي يجعلك تشعر أن حبّنا مختلف عن كل ما عشته من قبل؟' },
  { id: 407, category: 'love', depth: 2, text: 'هل تعتقد أن هناك لحظة معينة حوّلت مشاعرك نحوي من "أُحبه" إلى "أريده في حياتي دائماً"؟', deepenFollowUp: 'أخبرني عن تلك اللحظة بتفاصيلها.' },
  { id: 408, category: 'love', depth: 1, text: 'ما الرائحة أو الأغنية أو الطعام الذي يذكّرك بي فوراً؟' },
  { id: 409, category: 'love', depth: 3, text: 'لو أن الحب قابل للقياس، كيف تقيس حبّك لي الآن مقارنة بالبداية؟', deepenFollowUp: 'وما الذي زاد أو نقص؟' },
  { id: 410, category: 'love', depth: 1, text: 'ما اللحظة اليومية الصغيرة التي تتمنى أن تعيشها معي دائماً؟' },
  { id: 411, category: 'love', depth: 2, text: 'هل سبق أن خِفت أن تُحبّ بعمق لأن الفقدان مؤلم؟ كيف تجاوزت هذا الخوف؟' },
  { id: 412, category: 'love', depth: 1, text: 'ما الشيء الذي يجعلك تتساءل: "كيف كنت أعيش قبل أن أعرف هذا الشخص؟"' },
  { id: 413, category: 'love', depth: 2, text: 'كيف تُعبّر عن حبك لي بطريقة أعرفها أنا دون أن تقول "أحبك"؟' },
  { id: 414, category: 'love', depth: 1, text: 'ما الشيء الذي تحبّه في طريقة نومنا أو استيقاظنا معاً؟' },
  { id: 415, category: 'love', depth: 3, text: 'هل هناك جزء من قلبك خصّصته لي وحدي؟ كيف يبدو ذلك الجزء؟', deepenFollowUp: 'وهل أنت سعيد بما تجده هناك؟' },
  { id: 416, category: 'love', depth: 1, text: 'ما الوقت الذي يكون فيه قلبك أكثر انفتاحاً نحوي؟' },
  { id: 417, category: 'love', depth: 2, text: 'هل تعتقد أن الحب يحتاج إلى مجهود مستمر أم يجب أن يكون تلقائياً؟ وأين نحن في هذا؟' },
  { id: 418, category: 'love', depth: 1, text: 'ما الشيء الذي تفعله أنت لتعتني بنفسك وهو يُريحني أنا أيضاً؟' },
  { id: 419, category: 'love', depth: 2, text: 'متى تشعر أن الحب هو الشيء الأبسط في العالم؟ ومتى يبدو معقداً؟' },
  { id: 420, category: 'love', depth: 1, text: 'ما الشيء الجديد الذي اكتشفته في نفسك منذ أحببتني؟' },

  // 🫂 علاقتنا
  { id: 421, category: 'relationship', depth: 2, text: 'ما المعركة التي خضناها معاً وجعلتنا أقوى وليس أضعف؟', deepenFollowUp: 'وما الذي تعلّمته منها عنك وعني؟' },
  { id: 422, category: 'relationship', depth: 1, text: 'ما الشيء الذي يجعلك تشعر أننا نُكمّل بعضنا وليس نُلغي بعضنا؟' },
  { id: 423, category: 'relationship', depth: 2, text: 'هل تشعر أن لدينا مساحة كافية للفردية داخل علاقتنا؟ ما الذي يمكن تحسينه؟' },
  { id: 424, category: 'relationship', depth: 1, text: 'ما الذكرى المشتركة التي تجعلك تبتسم كلما تذكّرتها بشكل مفاجئ؟' },
  { id: 425, category: 'relationship', depth: 3, text: 'ما الشيء الذي توقّع أصدقاؤك أو عائلتك أنه سيكون مشكلة بيننا لكنه لم يكن؟', deepenFollowUp: 'وما الذي تحوّل إلى مفاجأة إيجابية؟' },
  { id: 426, category: 'relationship', depth: 1, text: 'ما الطريقة التي تُريني بها أنك لا تزال تختارني حتى في الأيام العادية؟' },
  { id: 427, category: 'relationship', depth: 2, text: 'كيف نتعامل مع الاختلاف في الطاقة؟ يوم أنت مرهق وأنا نشيط، أو العكس؟' },
  { id: 428, category: 'relationship', depth: 1, text: 'ما الشيء الصغير الذي نفعله معاً يُشعرك أننا منزل وليس فقط مكانان يلتقيان؟' },
  { id: 429, category: 'relationship', depth: 2, text: 'هل تعتقد أن علاقتنا تُشجّع كلاً منّا على النمو؟ كيف يبدو ذلك عملياً؟' },
  { id: 430, category: 'relationship', depth: 1, text: 'ما الشيء الذي نفعله بشكل مختلف عن معظم الأزواج وتعتزّ به؟' },
  { id: 431, category: 'relationship', depth: 3, text: 'لو كان بإمكانك تغيير نمط واحد في طريقة تواصلنا، ماذا ستغيّر؟', deepenFollowUp: 'وما الذي يمنعنا من البدء بهذا التغيير الآن؟' },
  { id: 432, category: 'relationship', depth: 1, text: 'ما الطريقة التي تعرف بها أنني أحترم رأيك حتى حين أختلف معك؟' },
  { id: 433, category: 'relationship', depth: 2, text: 'ما الشيء الذي تعلّمته من علاقتنا لم تتوقع أنك ستتعلمه؟' },
  { id: 434, category: 'relationship', depth: 1, text: 'كيف نحتفل بالانتصارات الصغيرة في حياتنا؟ هل تعتقد أننا نفعل ذلك بما يكفي؟' },
  { id: 435, category: 'relationship', depth: 2, text: 'ما الشيء الذي تتمنى أن نُنشئه سوياً كتقليد ثابت لعلاقتنا؟' },

  // 🧠 الشخصية والأفكار
  { id: 436, category: 'personality', depth: 2, text: 'ما الشيء الذي يُشعرك بأنك "أنت" الحقيقي وليس النسخة التي تُظهرها للعالم؟', deepenFollowUp: 'وهل تُظهر لي هذه النسخة الحقيقية؟' },
  { id: 437, category: 'personality', depth: 1, text: 'ما الكتاب أو الفيلم أو الموقف الذي غيّر طريقة تفكيرك بشكل عميق؟' },
  { id: 438, category: 'personality', depth: 3, text: 'ما الفكرة التي تؤمن بها بقوة لكنك تعرف أنها غير شعبية؟', deepenFollowUp: 'وكيف تشعر حين يعارضها الآخرون؟' },
  { id: 439, category: 'personality', depth: 1, text: 'ما الشيء الذي تفعله بطريقة مميزة لا يفعلها أحد غيرك في محيطك؟' },
  { id: 440, category: 'personality', depth: 2, text: 'ما الجانب من شخصيتك الذي يفاجئ الناس دائماً؟ ولماذا يُفاجئهم؟' },
  { id: 441, category: 'personality', depth: 1, text: 'ما الشيء الذي يجعلك تشعر بأنك في أفضل حالاتك الذهنية والعاطفية؟' },
  { id: 442, category: 'personality', depth: 2, text: 'ما الخوف الذي تغلّبت عليه وتفخر بذلك اليوم؟' },
  { id: 443, category: 'personality', depth: 1, text: 'ما الشيء الذي تتعلّمه بسرعة وبسهولة بينما يجد الآخرون صعوبة فيه؟' },
  { id: 444, category: 'personality', depth: 3, text: 'ما التناقض في شخصيتك الذي تعيش معه وتحاول فهمه؟', deepenFollowUp: 'هل يزعجك أم أصبحت تقبله؟' },
  { id: 445, category: 'personality', depth: 1, text: 'ما الشيء الذي يملأك بالطاقة بعد يوم مرهق؟' },
  { id: 446, category: 'personality', depth: 2, text: 'ما الموقف الذي اتخذت فيه قراراً صعباً ثم اكتشفت أنه كان الصواب؟' },
  { id: 447, category: 'personality', depth: 1, text: 'ما الشيء الذي تحلم بإنجازه ولم يخبر به أحد بعد؟' },
  { id: 448, category: 'personality', depth: 2, text: 'كيف تعرف أنك في بيئة تجعلك تنمو وليس تتراجع؟' },
  { id: 449, category: 'personality', depth: 1, text: 'ما الصفة التي تتمنى أن يصفك بها الناس بعد خمس سنوات؟' },
  { id: 450, category: 'personality', depth: 3, text: 'ما الشيء الذي كنت تظنه ضعفاً واكتشفت أنه قوتك الحقيقية؟', deepenFollowUp: 'ومتى حدث هذا الاكتشاف؟' },

  // 🪞 الاعترافات
  { id: 451, category: 'confessions', depth: 2, text: 'ما الشيء الذي فعلته في علاقتنا ولا تزال تُحاسب نفسك عليه بعدما مضى؟', deepenFollowUp: 'وهل تشعر أنك سامحت نفسك؟' },
  { id: 452, category: 'confessions', depth: 1, text: 'ما الجانب من نفسك الذي تُبالغ في إظهاره أمامي وهو ليس أنت حقاً؟' },
  { id: 453, category: 'confessions', depth: 3, text: 'هل هناك قرار في حياتك تتمنى لو أخذته بشكل مختلف؟ وكيف كانت حياتك ستبدو؟', deepenFollowUp: 'وهل هذا القرار يؤثر على علاقتنا بشكل غير مباشر؟' },
  { id: 454, category: 'confessions', depth: 1, text: 'ما الشيء الذي أحياناً تطلبه دون أن تقول مباشرة إنك تحتاجه؟' },
  { id: 455, category: 'confessions', depth: 2, text: 'هل سبق أن غيّرت رأيك بسببي في شيء مهم؟ ما هو؟' },
  { id: 456, category: 'confessions', depth: 1, text: 'ما الشيء الذي تخشى أن أكتشفه عنك رغم أنه يبدو بسيطاً؟' },
  { id: 457, category: 'confessions', depth: 2, text: 'هل هناك حدود تحتاجها في علاقتنا لم تقلها لأنك لا تريد أن تبدو "صعباً"؟' },
  { id: 458, category: 'confessions', depth: 1, text: 'ما الشيء الذي تعتذر عنه كثيراً وأنت في الحقيقة لا تحتاج لذلك؟' },
  { id: 459, category: 'confessions', depth: 3, text: 'ما الشيء الذي يُشغل تفكيرك في الليل ولا تشاركني به عادةً؟', deepenFollowUp: 'ما الذي يمنعك من مشاركتي؟' },
  { id: 460, category: 'confessions', depth: 1, text: 'ما الشيء الذي لو عرفته عن طفولتك سيُغيّر نظرتي لك بطريقة أفضل؟' },
  { id: 461, category: 'confessions', depth: 2, text: 'هل هناك شيء تتمناه من علاقتنا لكنك لم تطلبه لأنك تعتقد أنك لا تستحقه؟' },
  { id: 462, category: 'confessions', depth: 1, text: 'ما الشيء الذي تفعله وأنت وحدك لا تخبرني به لأنك تعتقد أنه سيُفاجئني؟' },
  { id: 463, category: 'confessions', depth: 2, text: 'ما الجملة التي سمعتها في طفولتك لا تزال تؤثر على طريقة حبّك اليوم؟' },
  { id: 464, category: 'confessions', depth: 1, text: 'ما الشيء الصغير الذي تتمنى أن أفعله دون أن تطلب مني؟' },
  { id: 465, category: 'confessions', depth: 3, text: 'هل هناك نسخة من نفسك تُخفيها حتى عني؟ كيف تبدو تلك النسخة؟', deepenFollowUp: 'ولماذا تُخفيها؟' },

  // 🔥 الجريئة
  { id: 466, category: 'bold', depth: 1, text: 'ما أجمل شيء في جسدك تعتقد أنني أُحبه أكثر منك؟' },
  { id: 467, category: 'bold', depth: 2, text: 'ما الشيء الذي يجعلك تشعر بجاذبيتك الكاملة حين تكون قريباً مني؟', deepenFollowUp: 'وهل أُشعرك بذلك كثيراً؟' },
  { id: 468, category: 'bold', depth: 1, text: 'ما المكان الذي تتمنى أن نزوره معاً ولم تقله من قبل لأنه يبدو جريئاً؟' },
  { id: 469, category: 'bold', depth: 2, text: 'هل هناك شيء تريد تجربته معي لكن تنتظر أن تشعر بالوقت المناسب؟' },
  { id: 470, category: 'bold', depth: 1, text: 'ما الذي يجعل لمستي لك مختلفة عن لمسة أي شخص آخر؟' },
  { id: 471, category: 'bold', depth: 2, text: 'ما الشيء الذي تريد أن تسمعه مني في لحظة الضعف الكاملة؟' },
  { id: 472, category: 'bold', depth: 1, text: 'ما أكثر لحظة شعرت فيها بأنك تريد أن تقف وتقول: "أنا معك تماماً"؟' },
  { id: 473, category: 'bold', depth: 2, text: 'كيف يبدو الأمان الحقيقي بالنسبة لك في علاقة؟ هل تشعر به معي؟' },
  { id: 474, category: 'bold', depth: 1, text: 'ما الشيء الذي يُشعرك أنني أراك حقاً كما أنت وليس كما تُريد أن أراك؟' },
  { id: 475, category: 'bold', depth: 3, text: 'لو أن الحميمية لها لغات مختلفة، أي لغة تشعر أننا نتحدثها معاً؟', deepenFollowUp: 'وأي لغة تتمنى أن نتعلّمها معاً؟' },
  { id: 476, category: 'bold', depth: 1, text: 'ما الشيء الذي يجعلك أكثر جرأة حين أكون بجانبك؟' },
  { id: 477, category: 'bold', depth: 2, text: 'هل هناك حلم رومانسي صغير تريد أن يتحقق هذه السنة؟ أخبرني.' },
  { id: 478, category: 'bold', depth: 1, text: 'ما اللحظة التي شعرت فيها بأنك تريد فقط أن تتوقف الوقت ونبقى هكذا؟' },
  { id: 479, category: 'bold', depth: 2, text: 'كيف يبدو الحبّ الحقيقي بالنسبة لك جسدياً؟ ما الذي تحتاجه لتشعر بالحبّ؟' },
  { id: 480, category: 'bold', depth: 1, text: 'ما الشيء الصغير الذي أفعله يُشعرك بأنني أفكّر فيك دون أن أقول ذلك؟' },

  // 💭 المستقبل
  { id: 481, category: 'future', depth: 1, text: 'ما المشروع المشترك الذي تتمنى أن ننجزه هذا العام؟' },
  { id: 482, category: 'future', depth: 2, text: 'كيف تتصوّر أن تبدو حياتنا اليومية المثالية بعد عشر سنوات؟', deepenFollowUp: 'وما الذي يجب أن نبدأ به الآن لنصل إلى ذلك؟' },
  { id: 483, category: 'future', depth: 1, text: 'ما الدولة أو المدينة التي تتمنى أن نعيش فيها يوماً ما؟ ولماذا؟' },
  { id: 484, category: 'future', depth: 3, text: 'ما الشيء الذي تخشى أن يتغيّر فيك مع الزمن وتتمنى أن يبقى؟', deepenFollowUp: 'وكيف يمكنني أن أساعدك في المحافظة عليه؟' },
  { id: 485, category: 'future', depth: 1, text: 'ما العادة الجديدة التي تريد أن نبدأها معاً الآن وتبقى معنا للأبد؟' },
  { id: 486, category: 'future', depth: 2, text: 'هل لديك حلم شخصي تحتاج فيه لدعمي بشكل مختلف مما أفعله الآن؟' },
  { id: 487, category: 'future', depth: 1, text: 'ما الشيء الذي تتمنى أن يقوله أطفالنا أو الناس قريبون منا عن علاقتنا يوماً ما؟' },
  { id: 488, category: 'future', depth: 2, text: 'كيف تريد أن تتذكّر هذه المرحلة من حياتنا حين تكون أكبر سناً؟' },
  { id: 489, category: 'future', depth: 1, text: 'ما الهدف الذي تريد أن نحققه سوياً وأنت متحمس له أكثر من أي شيء آخر؟' },
  { id: 490, category: 'future', depth: 3, text: 'ما الشيء الذي تريد أن تتغيّر فيه أنت شخصياً من أجل أن نكون أسعد معاً؟', deepenFollowUp: 'وما الذي يمكنني فعله لدعمك في ذلك؟' },
  { id: 491, category: 'future', depth: 1, text: 'ما الرحلة التي تحلم بها منذ زمن ولم تُخبرني بها؟' },
  { id: 492, category: 'future', depth: 2, text: 'كيف تتخيّل أن نُحتفل بذكرى زواجنا أو علاقتنا القادمة بطريقة لا تُنسى؟' },
  { id: 493, category: 'future', depth: 1, text: 'ما الشيء الذي تريد أن نتعلّمه معاً كزوجين أو كشريكين قريباً؟' },
  { id: 494, category: 'future', depth: 2, text: 'ما القرار الكبير الذي تريد أن تتخذه في حياتك هذا العام وتريد مشاركتي له؟' },
  { id: 495, category: 'future', depth: 1, text: 'لو كتبنا رسالة لأنفسنا الآن لنقرأها بعد 5 سنوات، ما أهم جملة فيها؟' },

  // 😂 الضحك
  { id: 496, category: 'laugh', depth: 1, text: 'ما أكثر جملة أقولها تُضحكك كلما سمعتها؟' },
  { id: 497, category: 'laugh', depth: 1, text: 'لو كنت محقق أحداث في فيلم عنّا، ما أول "دليل" ستجمعه عن شخصيتي؟' },
  { id: 498, category: 'laugh', depth: 1, text: 'ما عادتي الغريبة التي أصبحت "طبيعية جداً" بالنسبة لك؟' },
  { id: 499, category: 'laugh', depth: 1, text: 'لو كانت حياتنا مسلسلاً تلفزيونياً، ما اسمه وما صورة الغلاف؟' },
  { id: 500, category: 'laugh', depth: 1, text: 'ما أسوأ اقتراح تقديم طعام قدّمته وفاجأك قبولي له؟' },
  { id: 501, category: 'laugh', depth: 1, text: 'لو كانت علاقتنا أغنية، من أي فنان ستكون؟ ولماذا هذا الفنان تحديداً؟' },
  { id: 502, category: 'laugh', depth: 1, text: 'ما الشيء الذي تتذرع بأنه "ضرورة" لكنه في الحقيقة مجرد دلع؟' },
  { id: 503, category: 'laugh', depth: 1, text: 'لو كان لأسلوبنا في الجدال اسم "لعبة"، كيف ستصف قواعدها؟' },
  { id: 504, category: 'laugh', depth: 1, text: 'ما التقليد الغريب الذي نفعله قبل النوم لا يعلم به أحد غيرنا؟' },
  { id: 505, category: 'laugh', depth: 1, text: 'لو أُنتج فيلم عن "أسوأ لحظاتنا الكوميدية"، ما المشهد الافتتاحي؟' },
  { id: 506, category: 'laugh', depth: 1, text: 'ما الشيء الذي أفعله أثناء محاولتي المساعدة ويجعل الأمور أسوأ؟' },
  { id: 507, category: 'laugh', depth: 1, text: 'لو كنّا شخصيتان في قاموس العلاقات، ما التعريف المكتوب بجانب أسمائنا؟' },
  { id: 508, category: 'laugh', depth: 1, text: 'ما أكثر سؤال "ساذج" تسألني إياه وأنت تعرف الإجابة مسبقاً؟' },
  { id: 509, category: 'laugh', depth: 1, text: 'لو كنا نُقدّم برنامج طبخ معاً، ما العنوان المضحك الذي يصف فوضانا؟' },
  { id: 510, category: 'laugh', depth: 1, text: 'ما الشيء الذي أتفاخر به أمام الآخرين وأنت تعرف أنني مبالغ فيه؟' },

  // 🎭 المواقف والافتراضات
  { id: 511, category: 'situations', depth: 1, text: 'لو استطعت أن ترسل رسالة للنسخة منك قبل 5 سنوات عن علاقتنا، ماذا ستقول؟' },
  { id: 512, category: 'situations', depth: 2, text: 'لو كنّا في جزيرة معزولة لأسبوع بدون هواتف، كيف يكون أسلوب حياتنا؟', deepenFollowUp: 'وما الشيء الذي تعتقد أنه سيُفاجئك عن نفسك في ذلك الموقف؟' },
  { id: 513, category: 'situations', depth: 1, text: 'لو كانت لدينا "محكمة" تُحاكم أسوأ عاداتنا، أي عادة لك ستخسر القضية؟' },
  { id: 514, category: 'situations', depth: 2, text: 'لو أتيحت لك فرصة العودة لذكرى واحدة من علاقتنا لتعيشها مجدداً، أيها ستختار؟' },
  { id: 515, category: 'situations', depth: 1, text: 'لو كنّا نكتب دستور علاقتنا اليوم، ما المادة التي ستضيفها أنت بمبادرة شخصية؟' },
  { id: 516, category: 'situations', depth: 2, text: 'لو تحدّث أحد أصدقائي عن نقطة ضعف لديّ، هل ستدافع عني أم ستصمت؟ ولماذا؟', deepenFollowUp: 'وهل حدث هذا من قبل وكيف تصرّفت؟' },
  { id: 517, category: 'situations', depth: 1, text: 'لو كانت لدينا "كلمة سحرية" تعني "أحتاج لحضنة الآن بدون أسئلة"، ما ستكون؟' },
  { id: 518, category: 'situations', depth: 2, text: 'لو جاء يوم وشعرت أن علاقتنا في خطر، ما أول شيء ستفعله؟' },
  { id: 519, category: 'situations', depth: 1, text: 'لو كنا نُصمّم بيتنا المثالي معاً، ما الغرفة التي تريد أن تكون مساحتك الخاصة فيها؟' },
  { id: 520, category: 'situations', depth: 3, text: 'لو علمت أن لديك سنة واحدة فقط مع الشخص الذي تحب، كيف ستقضيها بشكل مختلف عن الآن؟', deepenFollowUp: 'وما الذي يمنعك من أن تعيشها هكذا الآن؟' },
  { id: 521, category: 'situations', depth: 1, text: 'لو كانت طاقتنا العاطفية "رصيداً"، كيف تصف حالته الآن؟ هل يحتاج شحناً؟' },
  { id: 522, category: 'situations', depth: 2, text: 'لو طلب منك شخص نصيحة عن علاقته وكانت تُشبه علاقتنا تماماً، ما النصيحة؟' },
  { id: 523, category: 'situations', depth: 1, text: 'لو كان بإمكانك نسيان شيء واحد حدث بيننا ليس لأنه سيء بل لأنك تريد اكتشافه مجدداً، ماذا ستختار؟' },
  { id: 524, category: 'situations', depth: 2, text: 'لو كنا نُشارك في برنامج عن أفضل الأزواج، ما الشيء الذي ستقوله للقضاة ليُقنعهم أننا نستحق الفوز؟' },
  { id: 525, category: 'situations', depth: 1, text: 'لو أعطيتك قطعة ورق وطلبت منك كتابة "ما الذي أنت ممتنّ له في علاقتنا"، ما الجملة الأولى التي ستكتبها؟' },

  // ─── جولة إضافية متنوعة (526→605) ────────────────────────────────────────
  { id: 526, category: 'love', depth: 1, text: 'ما الشيء الذي تراه فيّ أنا ولا يراه الآخرون؟' },
  { id: 527, category: 'love', depth: 2, text: 'هل تعتقد أننا كنا سنلتقي لو كانت الظروف مختلفة؟ كيف تتخيّل ذلك اللقاء؟' },
  { id: 528, category: 'love', depth: 1, text: 'ما أجمل كلمة وصفتني بها من قبل لم أنسَها حتى الآن؟' },
  { id: 529, category: 'relationship', depth: 2, text: 'ما الطريقة التي تُريد أن أُشعرك بها أنني "فريقك" في أصعب اللحظات؟' },
  { id: 530, category: 'relationship', depth: 1, text: 'ما الشيء الذي تتمنى أن نُسميه أو نُحدّد له اسماً في علاقتنا؟' },
  { id: 531, category: 'personality', depth: 1, text: 'ما الشيء الذي أنت فخور به في نفسك لا تقوله للآخرين لأنك لا تريد أن تبدو متكبراً؟' },
  { id: 532, category: 'personality', depth: 2, text: 'ما القيمة التي كنت مستعداً تتنازل عنها قبل عشر سنوات لكنك لم تعد تقبل ذلك اليوم؟' },
  { id: 533, category: 'confessions', depth: 1, text: 'ما الشيء الذي فعلته دون أن تُخبرني وتمنيت لو أنك أخبرتني؟' },
  { id: 534, category: 'confessions', depth: 2, text: 'هل سبق أن تصرّفت بطريقة معي كنت تعرف أنها ليست صادقة تماماً؟ ما هي؟' },
  { id: 535, category: 'bold', depth: 1, text: 'ما الشيء الذي تريد أن تقوله لي الآن لكنك كنت تحتاج "إذناً"؟' },
  { id: 536, category: 'bold', depth: 2, text: 'ما الحدّ بين الحب الصحي والتعلق المخيف بالنسبة لك؟ وأين نحن؟' },
  { id: 537, category: 'future', depth: 1, text: 'ما الشيء الذي تريد أن يبقى ثابتاً في علاقتنا مهما تغيّرت الظروف؟' },
  { id: 538, category: 'future', depth: 2, text: 'ما الخطة التي تريد أن تعملها معي لبناء شيء يدوم أكثر من الجيل الواحد؟' },
  { id: 539, category: 'laugh', depth: 1, text: 'ما الموقف الكوميدي الذي لو رويته لأحد من خارج علاقتنا لن يفهم لماذا نضحك؟' },
  { id: 540, category: 'laugh', depth: 1, text: 'ما النمط الغريب الذي نمارسه عند الشجار ثم يُضحكنا بعد كل مرة؟' },
  { id: 541, category: 'situations', depth: 1, text: 'لو كان بإمكانك تغيير شيء واحد في "قصة لقائنا الأول"، ماذا ستغيّر؟' },
  { id: 542, category: 'situations', depth: 2, text: 'لو كانت علاقتنا شركة ناشئة، ما المنتج الذي نصنعه وما هو تقييم المستثمرين لها؟' },
  { id: 543, category: 'love', depth: 2, text: 'ما الشيء الذي يجعلك تُدرك فجأة أنك تُحبّني حتى في اليوم العادي الممل؟' },
  { id: 544, category: 'love', depth: 1, text: 'ما الوقت الذي يكون فيه قلبك أكثر هدوءاً وسعادة حين أكون بجانبك؟' },
  { id: 545, category: 'relationship', depth: 1, text: 'ما الشيء الذي يُشعرك أننا "نفهم" بعضنا بدون كلام؟' },
  { id: 546, category: 'relationship', depth: 2, text: 'هل تشعر أن لدينا طقوساً مشتركة تجعلنا نشعر بأننا "نحن"؟ ما أهمها؟' },
  { id: 547, category: 'personality', depth: 1, text: 'ما الشيء الذي تمنحه للآخرين بسخاء لكنك تجد صعوبة في منحه لنفسك؟' },
  { id: 548, category: 'personality', depth: 3, text: 'ما الفترة الأصعب في حياتك وكيف شكّلت الشخص الذي أنت عليه اليوم؟', deepenFollowUp: 'وهل أثّر ذلك على طريقتك في الحبّ؟' },
  { id: 549, category: 'confessions', depth: 1, text: 'ما الشيء الذي تفعله لي وأنت تتمنى في سرّك أن أُلاحظه وأشكرك عليه؟' },
  { id: 550, category: 'confessions', depth: 2, text: 'هل هناك حاجة عاطفية أساسية تشعر أنني لا أُدركها دائماً؟ ما هي؟', deepenFollowUp: 'وكيف يمكنني أن أُلبّيها بشكل أفضل؟' },
  { id: 551, category: 'bold', depth: 1, text: 'ما الشيء الذي يجعلك تشعر أنك محبوب تماماً وليس فقط مقبولاً؟' },
  { id: 552, category: 'bold', depth: 2, text: 'ما الفرق بين أن تكون مُريحاً لي وبين أن تكون مُلهماً لي؟ هل أنت الاثنان معاً؟' },
  { id: 553, category: 'future', depth: 1, text: 'ما الشيء الذي تريد أن يكون جزءاً من روتيننا اليومي بعد سنة من الآن؟' },
  { id: 554, category: 'future', depth: 2, text: 'لو كتبنا "ميثاق الزوجين" لسنة قادمة، ما أول بند تريد أن تكتبه؟' },
  { id: 555, category: 'laugh', depth: 1, text: 'ما المهارة التي تتفاخر بها في بيتنا والجميع يعرف أنها ليست مهارة حقيقية؟' },
  { id: 556, category: 'laugh', depth: 1, text: 'لو كانت هناك "جائزة علاقات" هذا العام، في أي فئة سنفوز؟' },
  { id: 557, category: 'situations', depth: 2, text: 'لو أخطأت بحقك خطأ كبيراً غير مقصود، كيف تريد أن أعتذر منك بطريقة تصلك فعلاً؟' },
  { id: 558, category: 'situations', depth: 1, text: 'لو كنا نكتب فصل "أحلى شيء فعلناه معاً"، ما العنوان الفرعي لهذا الفصل؟' },
  { id: 559, category: 'love', depth: 1, text: 'ما الشيء الذي تتمنى أن أقوله لك الليلة قبل النوم؟' },
  { id: 560, category: 'love', depth: 2, text: 'هل تُؤمن أن بعض الناس يولدون لبعض؟ وكيف تشعر حيال فكرة أننا كنا "مُقدَّرَين" لبعض؟' },
  { id: 561, category: 'relationship', depth: 1, text: 'ما الشيء الذي يجعل وقوفنا جنباً لبعض لا يشعرك بالوحدة بل بالاكتمال؟' },
  { id: 562, category: 'relationship', depth: 3, text: 'لو كنا نوصف علاقتنا بجملة واحدة للأجيال القادمة، ما الجملة؟', deepenFollowUp: 'وهل هي الجملة التي تريد أن تعيشها فعلاً؟' },
  { id: 563, category: 'personality', depth: 1, text: 'ما الشيء الذي تفعله في وقت فراغك الذي يُعبّر عنك بعمق؟' },
  { id: 564, category: 'personality', depth: 2, text: 'ما الحدث الذي جعلك تُعيد النظر في إحدى قيمك الجوهرية؟' },
  { id: 565, category: 'confessions', depth: 1, text: 'ما الشيء الذي تشتري أو تفعله "لنفسك" لكنه في الحقيقة بسببي؟' },
  { id: 566, category: 'confessions', depth: 2, text: 'هل هناك شيء أخبرتني به يوماً وندمت على إخباري بعدها؟ لماذا؟' },
  { id: 567, category: 'bold', depth: 2, text: 'ما الشيء الذي يجعل الفضول بيننا حياً وليس مجرد عادة؟', deepenFollowUp: 'وكيف تُجدّد هذا الفضول في نفسك؟' },
  { id: 568, category: 'bold', depth: 1, text: 'ما الشيء الذي تريد مني أن أكون أكثر جرأة فيه معك؟' },
  { id: 569, category: 'future', depth: 1, text: 'ما الحلم الذي دفنته لكنك لم تنسَه أبداً؟' },
  { id: 570, category: 'future', depth: 2, text: 'لو كان بإمكانك تحديد "كلمة العام" لعلاقتنا القادمة، ما الكلمة؟' },
  { id: 571, category: 'laugh', depth: 1, text: 'ما الشيء الذي كنا نتجادل فيه في البداية وأصبح اليوم ضحكة عائلية؟' },
  { id: 572, category: 'laugh', depth: 1, text: 'لو كنّا في برنامج "من سيفوز"، من الفائز وما "القدرة الخاصة" لكل واحد؟' },
  { id: 573, category: 'situations', depth: 1, text: 'لو كان لدينا "مدرب علاقات"، ما الشيء الأول الذي سيُلاحظه ويثني عليه؟' },
  { id: 574, category: 'situations', depth: 2, text: 'لو كنت تكتب مقالاً عن علاقتنا بعنوان: "ما تعلّمته من الحب"، ما الفقرة الأولى؟' },
  { id: 575, category: 'love', depth: 3, text: 'ما الجانب من حبّنا الذي يبهرك أكثر كلما فكّرت فيه؟ ولماذا يبهرك؟', deepenFollowUp: 'وهل أعرف أن هذا الجانب يبهرك؟' },
  { id: 576, category: 'relationship', depth: 2, text: 'ما الأشياء الثلاثة التي لو تحقّقت ستشعر أن علاقتنا وصلت لمستوى جديد من النضج؟' },
  { id: 577, category: 'personality', depth: 1, text: 'ما الشيء الذي يجعلك متميزاً كشخص حتى في العلاقة وليس فقط كشريك؟' },
  { id: 578, category: 'confessions', depth: 3, text: 'ما أصعب شيء اعترفت به لنفسك عن نفسك؟ وهل أخبرتني يوماً؟', deepenFollowUp: 'وكيف تغيّرت بعد هذا الاعتراف؟' },
  { id: 579, category: 'bold', depth: 1, text: 'ما أكثر لحظة شعرت فيها أن قلبك "انكسر" بطريقة جميلة حين كنت معي؟' },
  { id: 580, category: 'future', depth: 1, text: 'ما الشيء الذي تريد أن تُعلّمه لأطفالنا أو للأجيال القادمة عن الحبّ الحقيقي؟' },
  { id: 581, category: 'laugh', depth: 1, text: 'ما "الكارثة الصغيرة" التي حدثت في رحلتنا الأولى معاً ولا تزال مضحكة؟' },
  { id: 582, category: 'situations', depth: 1, text: 'لو كان بإمكانك إضافة "برنامج تدريبي" لشريك الحياة، ما الموضوع الأول؟' },
  { id: 583, category: 'love', depth: 1, text: 'ما الشيء الذي تُدركه عن نفسك فقط حين تكون معي؟' },
  { id: 584, category: 'relationship', depth: 1, text: 'ما الطريقة التي نتواصل بها حين لا نكون في نفس المكان وتُشعرك بالقرب مني؟' },
  { id: 585, category: 'personality', depth: 2, text: 'ما الشيء الذي تعرفه عن نفسك تريد أن تُقرّ به الليلة أمامي؟' },
  { id: 586, category: 'confessions', depth: 1, text: 'ما الشيء الذي تفتقده في علاقة ماضية لم تجد طريقة لتطلبه مني؟' },
  { id: 587, category: 'bold', depth: 2, text: 'ما الشيء الذي يُعطيك أكبر قدر من الطمأنينة في علاقتنا؟', deepenFollowUp: 'وهل تُخبرني دائماً حين تشعر بذلك؟' },
  { id: 588, category: 'future', depth: 2, text: 'ما الأشياء التي تريد أن تنجزها "لنفسك" هذا العام وتريد دعمي فيها كلياً؟' },
  { id: 589, category: 'laugh', depth: 1, text: 'ما الطقس أو الموسم الذي يُظهر أسوأ طبائعنا الكوميدية معاً؟' },
  { id: 590, category: 'situations', depth: 2, text: 'لو أُتيح لك "إعادة ضبط" لحظة واحدة في علاقتنا لتفعلها بطريقة أفضل، ما هي؟' },
  { id: 591, category: 'love', depth: 2, text: 'هل تعتقد أن الحبّ يحتاج تجديداً دورياً مثل النباتات؟ وكيف نُجدّده نحن؟' },
  { id: 592, category: 'relationship', depth: 3, text: 'ما الشيء الذي لو حدث سيجعلك تُعيد تعريف ما تعنيه هذه العلاقة لك؟', deepenFollowUp: 'وهل تعتقد أنه قد يحدث؟' },
  { id: 593, category: 'personality', depth: 1, text: 'ما الشيء الذي تفعله ببطء لكن بإتقان يجعلك مميزاً عن الآخرين؟' },
  { id: 594, category: 'confessions', depth: 2, text: 'هل تشعر أن هناك جزءاً من حياتك الداخلية لا تُشاركني بما يكفي؟ ما هو؟' },
  { id: 595, category: 'bold', depth: 1, text: 'ما الشيء الذي يجعلك تشعر أنك "مكتمل" حين أكون بجانبك؟' },
  { id: 596, category: 'future', depth: 1, text: 'ما التعديل الصغير الذي لو فعلناه سيجعل حياتنا اليومية أجمل بكثير؟' },
  { id: 597, category: 'laugh', depth: 1, text: 'ما أطرف عذر استخدمته لتجنب أمر ما وكُشف أمرك؟' },
  { id: 598, category: 'situations', depth: 1, text: 'لو كنا نُصوّر "يوماً طبيعياً" في حياتنا، ما المشهد الذي سيُفاجئ المشاهدين أكثر؟' },
  { id: 599, category: 'love', depth: 1, text: 'ما الشيء الذي تُحبّه في طريقة غضبي منك ثم عودتي إليك؟' },
  { id: 600, category: 'relationship', depth: 2, text: 'ما الشيء الذي نفعله معاً يجعل الوقت يمرّ دون أن تشعر به؟' },
  { id: 601, category: 'personality', depth: 3, text: 'ما الجانب من شخصيتك الذي كبر فيك بسبب علاقتنا؟', deepenFollowUp: 'وكيف تشعر حين تُلاحظ هذا التغيير؟' },
  { id: 602, category: 'confessions', depth: 1, text: 'ما الشيء الذي تتمنى لو قلته لي بدل ما قلته في آخر خلاف بيننا؟' },
  { id: 603, category: 'bold', depth: 2, text: 'ما الشيء الذي يجعلك تشعر أن قلبك "في أيدٍ أمينة" حين تكون معي؟' },
  { id: 604, category: 'future', depth: 1, text: 'ما الشيء الذي تريد أن يكون "تقليدنا السنوي" الذي لا نتخلى عنه أبداً؟' },
  { id: 605, category: 'situations', depth: 2, text: 'لو كتب أحد يعرفنا جيداً مراجعة صادقة عن علاقتنا، ما الإيجابي الذي سيذكره أولاً؟', deepenFollowUp: 'وما النصيحة التي سيعطيها لنا؟' },
];

// ─── فئات جديدة ─────────────────────────────────────────────────────────────────

export const DARE_QUESTIONS: Question[] = [
  { id: 606, category: 'dare', depth: 1, text: 'غيّر صورتك الشخصية على واتساب لصورة مضحكة لمدة ساعة كاملة 📸' },
  { id: 607, category: 'dare', depth: 1, text: 'أرسل صوتية تقول "أحبك" بصوت بطيئ وقمري 🌙' },
  { id: 608, category: 'dare', depth: 2, text: 'اكتب أغنية قصيرة (4 أسطر) عن علاقتكما وأنشدها صوتيًا 🎵' },
  { id: 609, category: 'dare', depth: 1, text: 'ارسم وجه الطرف الآخر على يديك وارسله صورة 🎨' },
  { id: 610, category: 'dare', depth: 2, text: 'ادعِ أن الطرف الآخر هو نجمك المفضل لمدة 10 دقائق وقل له جمل معجبين 🌟' },
  { id: 611, category: 'dare', depth: 1, text: 'أرسل آخر صورة سيلفي التقطتها في حياتك مهما كانت 💀' },
  { id: 612, category: 'dare', depth: 2, text: 'قل "أنا أحبك" بكل لهجة تعرفها (فصحى، دارجة، أجنبية...) 💕' },
  { id: 613, category: 'dare', depth: 1, text: 'غيّر اسم الطرف الآخر في هاتفك إلى لقب مضحك طوال اليوم 😂' },
  { id: 614, category: 'dare', depth: 2, text: 'اكتب رسالة حب على ورقة، صوّرها، وأرسلها — ثم ارمها بعد أن يقرأها الطرف الآخر 💌' },
  { id: 615, category: 'dare', depth: 1, text: 'قل جملة رومانسية بصوت جاد وكأنك ممثل في فيلم 🎬' },
  { id: 616, category: 'dare', depth: 2, text: 'ارسم قلبًا بأصابعك على أي سطح وارسله صورة ❤️' },
  { id: 617, category: 'dare', depth: 1, text: 'أرسل رسالة صوتية تردد فيها اسم الطرف الآخر 5 مرات بنبرات مختلفة 🗣️' },
  { id: 618, category: 'dare', depth: 2, text: 'اصنع قصة قصيرة (3 جمل) بطلاها أنتما، وروها بصوت مثير 😏' },
  { id: 619, category: 'dare', depth: 1, text: 'قل "أنت أجمل شيء حدث لي" مع نظرة مباشرة إذا كنتما معًا 👀' },
  { id: 620, category: 'dare', depth: 2, text: 'أرسل فيديو مدته 10 ثوانٍ تصرخ فيه "أنا أحب [اسمه] أكثر من أي شيء!" 📹' },
];

export const WOULD_YOU_RATHER_QUESTIONS: Question[] = [
  { id: 621, category: 'would_you_rather', depth: 1, text: 'لو خيّرتك: تقضي سنة كاملة مع الطرف الآخر في جزيرة مهجورة، أم سنة في مدينة كبيرة مزدحمة؟ 🏝️' },
  { id: 622, category: 'would_you_rather', depth: 1, text: 'لو خيّرتك: أن تعرف تاريخ وفاتك، أم أن تعرف كيف ستلتقي بحب جديد بعد هذا؟ ⏳' },
  { id: 623, category: 'would_you_rather', depth: 2, text: 'لو خيّرتك: أن تنسى كل ذكرياتك مع الطرف الآخر، أم أن تتذكر كل لحظة لكن لا تستطيع أن تلمسه؟ 💭' },
  { id: 624, category: 'would_you_rather', depth: 1, text: 'لو خيّرتك: أن تعيش في فيلم رومانسي مع الطرف الآخر، أم في فيلم مغامرات؟ 🎬' },
  { id: 625, category: 'would_you_rather', depth: 2, text: 'لو خيّرتك: أن تقرأ أفكار الطرف الآخر لمدة يوم واحد، أم أن يعرف هو أفكارك؟ 🧠' },
  { id: 626, category: 'would_you_rather', depth: 1, text: 'لو خيّرتك: أن تكون أغنى شخص في العالم لكن وحيدًا، أم فقيرًا لكن مع الطرف الآخر؟ 💰' },
  { id: 627, category: 'would_you_rather', depth: 2, text: 'لو خيّرتك: أن تنام بجانب الطرف الآخر كل ليلة لكن لا تستطيعان الكلام، أم تتكلمان بلا توقف لكن تنامان بعيدًا؟ 🛏️' },
  { id: 628, category: 'would_you_rather', depth: 1, text: 'لو خيّرتك: أن تحيا 100 عام مع شخص تكرهه، أم 50 عامًا مع من تحب؟ ⏰' },
  { id: 629, category: 'would_you_rather', depth: 2, text: 'لو خيّرتك: أن تعرف كل إجابة على أسئلة الطرف الآخر، أم أن لا يسألك أي سؤال أبدًا؟ ❓' },
  { id: 630, category: 'would_you_rather', depth: 1, text: 'لو خيّرتك: أن تعود بك الزمن 5 سنوات وتختار نفس الشخص، أم تلتقي به بعد 10 سنوات؟ 🔄' },
  { id: 631, category: 'would_you_rather', depth: 2, text: 'لو خيّرتك: أن تسمع الطرف الآخر يقول "أحبك" كل يوم لكن لا يفعله، أم يفعله نادرًا بصدق؟ 💬' },
  { id: 632, category: 'would_you_rather', depth: 1, text: 'لو خيّرتك: أن تنسى يوم واحد فقط من علاقتكما (اختره)، أم أن تتذكره للأبد؟ 🗓️' },
  { id: 633, category: 'would_you_rather', depth: 2, text: 'لو خيّرتك: أن يكون للطرف الآخر نفس الشخص كل يوم، أم أن يتغير شخصيته كل أسبوع؟ 🎭' },
  { id: 634, category: 'would_you_rather', depth: 1, text: 'لو خيّرتك: أن تعيش في عالم خيالي (مثل هاري بوتر) مع الطرف الآخر، أم في عالمنا الحقيقي؟ ✨' },
  { id: 635, category: 'would_you_rather', depth: 2, text: 'لو خيّرتك: أن يعرف الطرف الآخر كل أسرارك من يوم واحد، أم أن يحتفظ بسر واحد كبير لا يكتشفه أبدًا؟ 🤫' },
];

export const MEMORY_QUESTIONS: Question[] = [
  { id: 636, category: 'memory', depth: 1, text: 'ما أول شيء لفت انتباهك في الطرف الآخر؟ 👀' },
  { id: 637, category: 'memory', depth: 2, text: 'ما اللحظة التي قلت فيها في بالك "هذا الشخص مختلف"؟ ✨' },
  { id: 638, category: 'memory', depth: 1, text: 'ما أول رسالة أرسلها لك الطرف الآخر ولم تنسها حتى الآن؟ 💬' },
  { id: 639, category: 'memory', depth: 2, text: 'ما الموقف الذي ضحكت فيه من قلبك بجانبه و لم تنسه؟ 😂' },
  { id: 640, category: 'memory', depth: 1, text: 'ما أول حلم حلمته عنه (مستقبل، سفر، بيت...)؟ 🏠' },
  { id: 641, category: 'memory', depth: 2, text: 'ما أكثر لحظة شعرت فيها أنه/هي "يتفهمك" بدون كلام؟ 🤝' },
  { id: 642, category: 'memory', depth: 1, text: 'ما الأغنية التي تذكّرك به/بها فورًا عندما تسمعها؟ 🎵' },
  { id: 643, category: 'memory', depth: 2, text: 'ما أول مرة شعرت فيها بأن قلبك ينبض بشكل مختلف عندما كنت معه/معها؟ 💓' },
  { id: 644, category: 'memory', depth: 1, text: 'ما أكثر نكتة أو مقولة مضحكة قلتها أنتما ولا تنساها؟ 😆' },
  { id: 645, category: 'memory', depth: 2, text: 'ما اللحظة التي شعرت فيها أنك لا تريد أن تنتهي؟ 🌅' },
  { id: 646, category: 'memory', depth: 1, text: 'ما أول هدية (مادية أو معنوية) أعطيتك إياها ولم تنسها؟ 🎁' },
  { id: 647, category: 'memory', depth: 2, text: 'ما أكثر موقف محرج مررتما به معًا وما زلتما تضحكان منه؟ 😅' },
  { id: 648, category: 'memory', depth: 1, text: 'ما الكلمة أو الجملة التي قالها لك مرة واحدة وما زالت تدور في رأسك؟ 💭' },
  { id: 649, category: 'memory', depth: 2, text: 'ما أكثر مرة شعرت فيها أنك محظوظ/محظوظة بسببه/بسببها؟ 🍀' },
  { id: 650, category: 'memory', depth: 1, text: 'ما أول صورة جمعتكما التي حفظتها على هاتفك؟ 📸' },
];

// أضف الأسئلة الجديدة إلى ALL_QUESTIONS
ALL_QUESTIONS.push(...DARE_QUESTIONS, ...WOULD_YOU_RATHER_QUESTIONS, ...MEMORY_QUESTIONS);

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getQuestionsByCategory(category: Category): Question[] {
  return ALL_QUESTIONS.filter((q) => q.category === category);
}

export function getRandomQuestion(
  category: Category,
  usedIds: number[] = []
): Question | null {
  const available = ALL_QUESTIONS.filter(
    (q) => q.category === category && !usedIds.includes(q.id)
  );
  if (available.length === 0) {
    // All used — reset and use any from this category
    const all = getQuestionsByCategory(category);
    return all[Math.floor(Math.random() * all.length)] ?? null;
  }
  return available[Math.floor(Math.random() * available.length)] ?? null;
}

export function getQuestionById(id: number): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export const CATEGORIES: Category[] = [
  'love',
  'relationship',
  'personality',
  'confessions',
  'bold',
  'future',
  'laugh',
  'situations',
  'dare',
  'would_you_rather',
  'memory',
];

// Weighted category distribution (approx from blueprint)
export const CATEGORY_WEIGHTS: Record<Category, number> = {
  love: 14,
  relationship: 14,
  personality: 10,
  confessions: 8,
  bold: 8,
  future: 8,
  laugh: 8,
  situations: 8,
  dare: 8,
  would_you_rather: 8,
  memory: 8,
};

export function getWeightedRandomCategory(lastCategory?: Category | null): Category {
  const categories = CATEGORIES.filter((c) => c !== lastCategory);
  const totalWeight = categories.reduce(
    (sum, c) => sum + CATEGORY_WEIGHTS[c],
    0
  );
  let rand = Math.random() * totalWeight;
  for (const c of categories) {
    rand -= CATEGORY_WEIGHTS[c];
    if (rand <= 0) return c;
  }
  return categories[Math.floor(Math.random() * categories.length)];
}

// ─── بطاقات القدر الكاملة ──────────────────────────────────────────────────────
// type: 'secret_msg' = الرسالة السرية (نظام خاص)
// type: 'challenge' = تحدي يؤديه كلاهما أو أحدهما ثم يتابعان
export interface FateCard {
  id: number;
  type: 'romantic' | 'funny' | 'deep' | 'confession' | 'letter' | 'future' | 'challenge' | 'secret_msg';
  icon: string;
  title: string;
  text: string;
  color: string;
}

export const FATE_CARDS: FateCard[] = [
  // ─── رومانسي ❤️
  { id: 1,  type: 'romantic',    icon: '❤️', color: '#F4A8B8',
    title: 'لحظة صادقة',
    text: 'قل لشريكك شيئاً واحداً تحبه فيه لم تجد الوقت تقوله من قبل. لا تختار الواضح — اختر الشيء الخفيّ الذي يُشعرك بالامتنان.' },

  { id: 2,  type: 'romantic',    icon: '💌', color: '#F9C8D3',
    title: 'رسالة القدر',
    text: 'اكتب الآن، في مكان ما على هاتفك، رسالة قصيرة كأن هذه آخر رسالة ترسلها اليوم. ثم أرسلها فعلاً.' },

  { id: 3,  type: 'romantic',    icon: '🌙', color: '#C9B8E8',
    title: 'ذكرى دافئة',
    text: 'أخبر شريكك عن أجمل لحظة مرّت عليكما لم تناقشاها بعدها. لماذا بقيت في ذاكرتك؟' },

  // ─── مضحك 😂
  { id: 4,  type: 'funny',       icon: '😂', color: '#F9D080',
    title: 'الممثل الكوميدي',
    text: 'لديك دقيقة كاملة تُقلّد فيها شريكك — طريقة كلامه، تعابيره، ردود أفعاله. الآخر يمنع نفسه من الضحك.' },

  { id: 5,  type: 'funny',       icon: '🎭', color: '#E8D4A0',
    title: 'اخترعا لغتكما',
    text: 'ابتكرا الآن جملة واحدة بـ"لغة سرية" لا يفهمها إلا أنتما. ثم استعملاها في محادثتكما القادمة.' },

  { id: 6,  type: 'funny',       icon: '📱', color: '#F2B880',
    title: 'الرسالة الأولى',
    text: 'أرسل لشريكك رسالة نصية الآن — كأنكما تتعارفان للمرة الأولى ولا تعرفانه. اجعلها طريفة.' },

  // ─── عميق 🧠
  { id: 7,  type: 'deep',        icon: '🧠', color: '#A8C5E8',
    title: 'الحوار الصعب',
    text: 'اختر موضوعاً لم تتكلما عنه بصدق حتى الآن. ابدآ الحوار الآن — بدون دفاعية، بدون اتهام.' },

  { id: 8,  type: 'deep',        icon: '🪞', color: '#C9B8E8',
    title: 'أتعلّم منك',
    text: 'شارك شيئاً تعلّمته عن نفسك من خلال علاقتكما. شيئاً ما كنت لتكتشفه بدون وجود الآخر.' },

  { id: 9,  type: 'deep',        icon: '🌊', color: '#B8D8C8',
    title: 'تحت السطح',
    text: 'ما الشيء الذي يراه الناس فيك لكنك لا تُصدّقه؟ هل يراه شريكك أيضاً؟' },

  // ─── اعترافات 🫣
  { id: 10, type: 'confession',  icon: '🫣', color: '#E8B8C1',
    title: 'اعتراف صغير',
    text: 'اعترف بشيء صغير أخفيته عن شريكك هذا الأسبوع — ليس بالضرورة كبيراً، فقط صادقاً.' },

  { id: 11, type: 'confession',  icon: '💭', color: '#C8A8E0',
    title: 'الفكرة المخبأة',
    text: 'ما الفكرة التي تدور في رأسك عن علاقتكما ولم تجد الجرأة لتقولها؟ قلها الآن بطريقة لطيفة.' },

  // ─── مستقبل 🔮
  { id: 12, type: 'future',      icon: '🔮', color: '#B8D8C8',
    title: 'سنوات خمس',
    text: 'تخيّلا معاً: أين ستكونان بعد 5 سنوات في يوم مثل اليوم؟ كل واحد يصف مشهداً واحداً.' },

  { id: 13, type: 'future',      icon: '🌅', color: '#F2D0A0',
    title: 'حلم مشترك',
    text: 'ما الشيء الذي تريد تحقيقه مع شريكك ولم تصرّحا به بعد؟ قله الآن.' },

  // ─── تحدي 🎭
  { id: 14, type: 'challenge',   icon: '⭐', color: '#F9D08A',
    title: 'ثلاثة أشياء',
    text: 'قل ثلاثة أشياء تُقدّرها في شريكك لم تقلها اليوم. لا تكرر ما قلته من قبل في هذه الجلسة.' },

  { id: 15, type: 'challenge',   icon: '🤫', color: '#E8D4C0',
    title: 'تحدي الصمت',
    text: 'دقيقتان بهدوء كامل، بدون هواتف، تنظران لبعض فقط. بعدها كل واحد يقول ما فكّر فيه.' },

  // ─── الرسالة السرية 💌 (نظام خاص)
  { id: 16, type: 'secret_msg',  icon: '📩', color: '#F4A8B8',
    title: 'الرسالة السرية',
    text: 'كلٌّ منكما يكتب رسالة قصيرة للآخر، دون أن تقرأها قبل الكشف. ثم تُكشف في نفس الوقت.' },

  { id: 17, type: 'romantic',    icon: '🫶', color: '#F9C8D3',
    title: 'شكراً',
    text: 'قل شيئاً واحداً تشكر شريكك عليه — شيئاً فعله في الفترة الأخيرة لم تشكره عليه بعد.' },

  { id: 18, type: 'deep',        icon: '💞', color: '#F4B6C2',
    title: 'عندما تغيب',
    text: 'أخبر شريكك: ما الشيء الذي تفتقده فيه أكثر حين يكون بعيداً؟ الإجابة لا يجب أن تكون واضحة.' },
];

export const KNOW_ME_QUESTIONS = [
  'ما هو طبقك المفضل الذي أعرف أنك لا تملّ منه؟',
  'ما الشيء الصغير الذي يرفع مزاجك فوراً؟',
  'ما الذكرى من طفولتي التي أُحدّثك عنها أكثر من غيرها؟',
  'ما الشيء الذي أقوله دائماً حين أكون منزعجاً؟',
  'لو كنت تُكمل هذه الجملة عني: "أكره ..."، ماذا ستضع؟',
  'ما الشيء الذي أتمنى أن تقوله لي كثيراً ولا تفعله؟',
  'ما الفيلم أو المسلسل الذي أعود إليه دائماً حين أريد الراحة؟',
  'ما الصفة التي أحبّها في نفسي أكثر من غيرها؟',
  'ما أكثر موقف يجعلني أضحك بشكل لا أتحكم فيه؟',
  'ما الشيء الذي أتحمّله بصعوبة من الآخرين؟',
];
