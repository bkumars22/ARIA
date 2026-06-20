// ─── ARIA Q&A Engine ─────────────────────────────────────────
// Answers genuine student questions in their language.
// Called before lesson-script evaluation so real questions
// are never marked "wrong" or ignored.

import { t } from './lessonData.js';

// ─── Detect if student is asking a question ───────────────────
export function isQuestion(input) {
  const q = input.trim().toLowerCase();
  if (q.endsWith('?')) return true;
  return /^(what|who|where|when|why|how|explain|tell me|describe|define|meaning|means|is it|can you|please|help|i don.t understand|i don.t know|confused|not clear|నేను అర్థం|నేను తెలుసుకోవాలి|मुझे नहीं पता|मैं समझ नहीं|புரியவில்லை|ಅರ್ಥವಾಗಲಿಲ್ಲ|മനസ്സിലായില്ല)/.test(q);
}

// ─── Detect confusion / help requests ────────────────────────
export function isConfused(input) {
  return /(don.t understand|not understand|confused|don.t know|no idea|what do you mean|help me|i am lost|what\?|huh|నాకు తెలియదు|అర్థం కాలేదు|मुझे नहीं|समझ नहीं|புரியல|ಗೊತ್ತಿಲ್ಲ|അറിയില്ല)/i.test(input);
}

// ─── Knowledge Bank ───────────────────────────────────────────
// Each entry: { match: regex, answer: (name, lang) => string }
// Checked in ORDER — put more specific patterns first.

const KB = [

  // ══════════════════════════════════════════════════════════
  // MATHEMATICS
  // ══════════════════════════════════════════════════════════

  {
    subjects: ['Mathematics', 'Science', 'English', 'Coding', 'Life Skills',
               'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Hindi',
               'English Language', 'English Literature', 'Computer Science',
               'Computer Applications', 'History & Civics', 'Environmental Science',
               'Economics', 'Business Studies'],
    match: /what is maths|what is mathematics|maths mean|mathematics mean|what are maths|maths kya hai|ganit kya|ganit|లెక్కలు అంటే|లెక్కలు ఏమిటి|கணிதம் என்ன|ಗಣಿತ ಏನು|ഗണിതം എന്ത്/i,
    answer: (name, lang) => t(lang, {
      en: `Great question, ${name}! **Mathematics** is the study of numbers, shapes, and patterns.\n\nWe use maths EVERY day without even realising it:\n• 🛒 Counting money at a shop\n• ⏰ Reading a clock\n• 🍕 Sharing a pizza equally\n• 📏 Measuring a room\n\nMaths is like a superpower — it helps you understand the world and solve any problem!\n\nThe word comes from Greek: *"mathema"* = "that which is learnt".\n\n💡 **Did you know?** The shapes of snowflakes, flowers, and galaxies all follow mathematical patterns!\n\nSo when you study maths, you're learning the language of the universe! 🌍`,
      te: `చాలా మంచి ప్రశ్న, ${name}! **గణితం** అంటే సంఖ్యలు, ఆకారాలు మరియు నమూనాల అధ్యయనం.\n\nమనం ప్రతిరోజూ గణితాన్ని ఉపయోగిస్తాం:\n• 🛒 దుకాణంలో డబ్బు లెక్కించడం\n• ⏰ గడియారం చదవడం\n• 🍕 పిజ్జాను సమానంగా పంచుకోవడం\n• 📏 గది కొలవడం\n\nగణితం ఒక అద్భుత శక్తి — ఇది నీకు ప్రపంచాన్ని అర్థం చేసుకోవడంలో సహాయపడుతుంది!\n\n💡 **తెలుసా?** హిమ వర్షపు పోగులు, పువ్వులు, పాలపుంత కూడా గణిత నమూనాలను అనుసరిస్తాయి!\n\nనువ్వు గణితం చదువుతున్నప్పుడు, నువ్వు విశ్వం యొక్క భాషను నేర్చుకుంటున్నావు! 🌍`,
      hi: `बहुत अच्छा सवाल, ${name}! **गणित** संख्याओं, आकृतियों और पैटर्न का अध्ययन है।\n\nहम हर दिन गणित का उपयोग करते हैं:\n• 🛒 दुकान पर पैसे गिनना\n• ⏰ घड़ी पढ़ना\n• 🍕 पिज़्ज़ा बराबर बाँटना\n• 📏 कमरा नापना\n\nगणित एक महाशक्ति है — यह तुम्हें दुनिया समझने में मदद करती है!\n\n💡 **क्या तुम जानते हो?** बर्फ के टुकड़े, फूल और आकाशगंगाएँ सभी गणितीय पैटर्न का पालन करती हैं!\n\nगणित पढ़कर तुम ब्रह्मांड की भाषा सीख रहे हो! 🌍`,
      ta: `நல்ல கேள்வி, ${name}! **கணிதம்** என்பது எண்கள், வடிவங்கள் மற்றும் முறைகளின் படிப்பு.\n\nதினமும் கணிதம் பயன்படுகிறது:\n• 🛒 கடையில் பணம் கணக்கிடுவது\n• ⏰ மணி பார்ப்பது\n• 🍕 பிட்சா சமபங்காகப் பிரிப்பது\n\nகணிதம் ஒரு சக்தி — இது உலகை புரிந்துகொள்ள உதவுகிறது! 🌍`,
      kn: `ಒಳ್ಳೆಯ ಪ್ರಶ್ನೆ, ${name}! **ಗಣಿತ** ಎಂದರೆ ಸಂಖ್ಯೆಗಳು, ಆಕಾರಗಳು ಮತ್ತು ಮಾದರಿಗಳ ಅಧ್ಯಯನ.\n\nಪ್ರತಿದಿನ ಗಣಿತ ಬಳಕೆ:\n• 🛒 ಅಂಗಡಿಯಲ್ಲಿ ಹಣ ಎಣಿಸುವುದು\n• ⏰ ಗಡಿಯಾರ ಓದುವುದು\n• 🍕 ಪಿಝ್ಝಾ ಸಮಾನವಾಗಿ ಹಂಚುವುದು\n\nಗಣಿತ ಒಂದು ಅಮೋಘ ಶಕ್ತಿ! 🌍`,
      ml: `നല്ല ചോദ്യം, ${name}! **ഗണിതം** എന്നത് സംഖ്യകൾ, ആകൃതികൾ, മാതൃകകൾ എന്നിവയുടെ പഠനം.\n\nദൈനംദിന ഉപയോഗം:\n• 🛒 കടയിൽ പണം കണക്കാക്കൽ\n• ⏰ ഘടികാരം വായിക്കൽ\n• 🍕 പിസ്സ തുല്യമായി പങ്കിടൽ\n\nഗണിതം ഒരു അദ്ഭുത ശക്തി! 🌍`,
    }),
  },

  {
    subjects: ['Mathematics'],
    match: /what is addition|what is adding|addition mean|how.*add|plus mean|kya hai addition|కూడిక అంటే|కూడిక ఏమిటి|जोड़ क्या|கூட்டல் என்ன/i,
    answer: (name, lang) => t(lang, {
      en: `Great question, ${name}! **Addition** means combining two or more numbers to get a bigger total.\n\nThe symbol is **+** (plus).\n\n🍎 **Real life example:**\nYou have **3 apples** in a basket.\nYour friend gives you **4 more apples**.\nNow you have: 3 + 4 = **7 apples** total!\n\n📝 **How to add:**\n1. Start with the first number: 3\n2. Count on by the second number: 4, 5, 6, **7**\n3. Answer = 7\n\n💡 **Tip:** Addition always makes numbers bigger!\n3 + 4 = 7 (bigger than both 3 and 4)\n\nWant to try a sum? Ask me! 😊`,
      te: `మంచి ప్రశ్న, ${name}! **కూడిక** అంటే రెండు లేదా అంతకంటే ఎక్కువ సంఖ్యలను కలిపి మొత్తం తెలుసుకోవడం.\n\nచిహ్నం: **+** (ప్లస్)\n\n🍎 **నిజ జీవిత ఉదాహరణ:**\nబుట్టలో **3 ఆపిల్లు** ఉన్నాయి.\nస్నేహితుడు **4 ఇచ్చాడు**.\nమొత్తం: 3 + 4 = **7 ఆపిల్లు**!\n\n💡 **చిట్కా:** కూడిక ఎప్పుడూ సంఖ్యలను పెద్దవిగా చేస్తుంది!\n\nఒక లెక్క వేయాలా? అడుగు! 😊`,
      hi: `अच्छा सवाल, ${name}! **जोड़** का मतलब है दो या अधिक संख्याओं को मिलाकर कुल निकालना।\n\nचिन्ह: **+** (प्लस)\n\n🍎 **असली जीवन उदाहरण:**\nटोकरी में **3 सेब** हैं।\nदोस्त ने **4 और दिए**।\nकुल: 3 + 4 = **7 सेब**!\n\n💡 **टिप:** जोड़ हमेशा संख्या बड़ी करती है!\n\nकोई सवाल हल करना है? पूछो! 😊`,
      ta: `நல்ல கேள்வி, ${name}! **கூட்டல்** என்பது எண்களை சேர்த்து மொத்தம் காண்பது.\n\nகுறி: **+** (plus)\n\n🍎 3 ஆப்பிள் + 4 ஆப்பிள் = **7 ஆப்பிள்**!\n\n💡 கூட்டல் எப்போதும் பெரிய எண் தரும்! 😊`,
      kn: `ಒಳ್ಳೆಯ ಪ್ರಶ್ನೆ, ${name}! **ಕೂಡಿಸುವಿಕೆ** ಎಂದರೆ ಸಂಖ್ಯೆಗಳನ್ನು ಒಟ್ಟಿಗೆ ಸೇರಿಸಿ ಮೊತ್ತ ಕಾಣುವುದು.\n\nಚಿಹ್ನೆ: **+**\n\n🍎 3 + 4 = **7** !\n\n💡 ಕೂಡಿಸುವಿಕೆ ಯಾವಾಗಲೂ ದೊಡ್ಡ ಸಂಖ್ಯೆ ಕೊಡುತ್ತದೆ! 😊`,
      ml: `നല്ല ചോദ്യം, ${name}! **കൂട്ടൽ** എന്നത് സംഖ്യകൾ ചേർത്ത് ആകെ കാണുന്നത്.\n\nചിഹ്നം: **+**\n\n🍎 3 + 4 = **7** !\n\n💡 കൂട്ടൽ സംഖ്യ വലുതാക്കുന്നു! 😊`,
    }),
  },

  {
    subjects: ['Mathematics'],
    match: /what is subtraction|what is minus|subtraction mean|take away|घटाव|తీసివేత|கழித்தல்|ಕಳೆಯುವಿಕೆ|കുറയ്ക്കൽ/i,
    answer: (name, lang) => t(lang, {
      en: `**Subtraction** means taking away a number from another to find what's left.\n\nThe symbol is **−** (minus).\n\n🍎 **Example:**\nYou have **10 mangoes**.\nYou eat **3 mangoes**.\nHow many left? 10 − 3 = **7 mangoes**!\n\n📝 **Rule:** Subtraction always makes numbers smaller.\n10 − 3 = 7 (smaller than 10)\n\n💡 **Think of it as:** you started with 10, then went backwards 3 steps → 9, 8, **7**!\n\nWant to practice? Give me a number and I'll make a subtraction problem! 😊`,
      te: `**తీసివేత** అంటే ఒక సంఖ్య నుండి మరొకటి తీసివేసి మిగిలింది తెలుసుకోవడం.\n\nచిహ్నం: **−** (మైనస్)\n\n🍎 **ఉదాహరణ:**\n10 మామిడి పళ్ళు ఉన్నాయి.\n3 తిన్నావు.\nమిగిలింది: 10 − 3 = **7**!\n\n💡 తీసివేత ఎప్పుడూ సంఖ్యను చిన్నదిగా చేస్తుంది! 😊`,
      hi: `**घटाव** का मतलब है एक संख्या में से दूसरी घटाकर बाकी निकालना।\n\nचिन्ह: **−** (माइनस)\n\n🍎 **उदाहरण:**\n10 आम हैं। 3 खा लिए। बचे: 10 − 3 = **7**!\n\n💡 घटाव संख्या को छोटा करता है! 😊`,
      ta: `**கழித்தல்** என்பது ஒரு எண்ணிலிருந்து இன்னொன்றை எடுத்துவிட்டு மீதி காண்பது.\n\n🍎 10 − 3 = **7** ! 😊`,
      kn: `**ಕಳೆಯುವಿಕೆ** ಎಂದರೆ ಒಂದು ಸಂಖ್ಯೆಯಿಂದ ಇನ್ನೊಂದನ್ನು ತೆಗೆದು ಉಳಿದದ್ದು ಕಾಣುವುದು.\n\n🍎 10 − 3 = **7** ! 😊`,
      ml: `**കുറയ്ക്കൽ** എന്നത് ഒരു സംഖ്യയിൽ നിന്ന് മറ്റൊന്ന് കളഞ്ഞ് ശേഷം കാണുന്നത്.\n\n🍎 10 − 3 = **7** ! 😊`,
    }),
  },

  {
    subjects: ['Mathematics'],
    match: /what is multiplication|times table|multiply|what is times|गुणा|గుణకారం|பெருக்கல்|ಗುಣಾಕಾರ|ഗുണനം/i,
    answer: (name, lang) => t(lang, {
      en: `**Multiplication** is a fast way to add the same number many times!\n\nThe symbol is **×** (times).\n\n🌟 **Think of it this way:**\n3 × 4 means "3 groups of 4"\n= 4 + 4 + 4 = **12**\n\n📦 **Real life:**\n3 boxes, each has 4 chocolates 🍫🍫🍫🍫\nTotal chocolates = 3 × 4 = **12**!\n\n🗝️ **Key Times Tables to memorise:**\n• 2× → doubles (2, 4, 6, 8, 10...)\n• 5× → ends in 0 or 5 (5, 10, 15, 20...)\n• 10× → just add a zero (10, 20, 30...)\n\n💡 Fun fact: 7 × 8 = 56 — "5, 6, 7, 8" — 56 = 7 × 8! Memory trick! 😄\n\nAsk me any times table — I'll explain it! 😊`,
      te: `**గుణకారం** అంటే ఒకే సంఖ్యను పదే పదే కూడే వేగమైన మార్గం!\n\nచిహ్నం: **×** (టైమ్స్)\n\n📦 **ఉదాహరణ:**\n3 పెట్టెలు, ప్రతి పెట్టెలో 4 చాక్లెట్లు 🍫\nమొత్తం = 3 × 4 = **12**!\n\n🗝️ **గుణకారపు పట్టికలు:**\n• 2× → రెట్టింపు (2, 4, 6, 8, 10...)\n• 5× → 0 లేదా 5 తో ముగుస్తుంది\n• 10× → శూన్యం జోడించండి\n\nఏదైనా గుణకారం అడుగు! 😊`,
      hi: `**गुणा** एक ही संख्या को बार-बार जोड़ने का तेज़ तरीका है!\n\nचिन्ह: **×** (गुणा)\n\n📦 **उदाहरण:**\n3 डिब्बे, हर डिब्बे में 4 चॉकलेट 🍫\nकुल = 3 × 4 = **12**!\n\n🗝️ **पहाड़े याद करें:**\n• 2× → दोगुना\n• 5× → 0 या 5 पर खत्म\n• 10× → शून्य लगाओ\n\nकोई भी पहाड़ा पूछो! 😊`,
      ta: `**பெருக்கல்** என்பது ஒரே எண்ணை பலமுறை கூட்டுவதற்கான வேகமான வழி!\n\n📦 3 × 4 = **12** (3 கூட்டங்களில் 4 → 4+4+4)\n\n😊 எந்த பெருக்கலும் கேள்!`,
      kn: `**ಗುಣಾಕಾರ** ಎಂದರೆ ಒಂದೇ ಸಂಖ್ಯೆಯನ್ನು ಪದೇ ಪದೇ ಕೂಡಿಸುವ ವೇಗದ ವಿಧಾನ!\n\n📦 3 × 4 = **12** 😊`,
      ml: `**ഗുണനം** എന്നത് ഒരേ സംഖ്യ പലതവണ കൂട്ടുന്നതിനുള്ള വേഗമേറിയ മാർഗ്ഗം!\n\n📦 3 × 4 = **12** 😊`,
    }),
  },

  {
    subjects: ['Mathematics'],
    match: /what is division|what is divide|how.*divide|भाग|భాగహారం|வகுத்தல்|ಭಾಗಾಕಾರ|ഹരണം/i,
    answer: (name, lang) => t(lang, {
      en: `**Division** means splitting something into equal groups.\n\nThe symbol is **÷** (divide).\n\n🍕 **Pizza example:**\nYou have **12 pizza slices**.\n4 friends want equal shares.\nEach gets: 12 ÷ 4 = **3 slices**!\n\n📝 **Division undoes multiplication:**\n3 × 4 = 12 → 12 ÷ 4 = 3 ✓\n\n💡 **Remember:**\n- The number being divided = **dividend** (12)\n- The number dividing = **divisor** (4)\n- The answer = **quotient** (3)\n\nAny number divided by itself = 1 (e.g., 5 ÷ 5 = 1)\nAny number divided by 1 = itself (e.g., 7 ÷ 1 = 7)\n\nWant to practice? 😊`,
      te: `**భాగహారం** అంటే ఏదైనా సమాన సమూహాలుగా విభజించడం.\n\n🍕 12 పిజ్జా ముక్కలు, 4 స్నేహితులు → ప్రతి ఒక్కరికి: 12 ÷ 4 = **3 ముక్కలు**!\n\n💡 భాగహారం గుణకారానికి వ్యతిరేకం:\n3 × 4 = 12 → 12 ÷ 4 = 3 ✓ 😊`,
      hi: `**भाग** का मतलब है किसी चीज़ को बराबर हिस्सों में बाँटना।\n\n🍕 12 पिज़्ज़ा स्लाइस, 4 दोस्त → हर किसी को: 12 ÷ 4 = **3 स्लाइस**!\n\n💡 भाग गुणा का उलटा है:\n3 × 4 = 12 → 12 ÷ 4 = 3 ✓ 😊`,
      ta: `**வகுத்தல்** என்பது சம பங்காக பிரிப்பது.\n\n🍕 12 ÷ 4 = **3** 😊`,
      kn: `**ಭಾಗಾಕಾರ** ಎಂದರೆ ಸಮಾನ ಭಾಗಗಳಾಗಿ ವಿಭಜಿಸುವುದು.\n\n🍕 12 ÷ 4 = **3** 😊`,
      ml: `**ഹരണം** എന്നത് തുല്യ ഭാഗങ്ങളായി വിഭജിക്കുന്നത്.\n\n🍕 12 ÷ 4 = **3** 😊`,
    }),
  },

  {
    subjects: ['Mathematics'],
    match: /what is fraction|what are fractions|fraction mean|భిన్నం|अंश|பின்னம்|ಭಿನ್ನ|ഭിന്നം/i,
    answer: (name, lang) => t(lang, {
      en: `**Fractions** represent a PART of a whole.\n\n🍕 **The best example — pizza!**\nA whole pizza = 1\nCut into 4 equal slices:\n• 1 slice = **1/4** (one-quarter)\n• 2 slices = **2/4** = **1/2** (one-half)\n• 3 slices = **3/4** (three-quarters)\n\n📝 **A fraction has two parts:**\n\n    2   ← Numerator (how many parts you have)\n   ───\n    4   ← Denominator (total equal parts)\n\n🌟 **Common fractions:**\n• 1/2 = half (one half of anything)\n• 1/4 = quarter (half of a half!)\n• 3/4 = three quarters\n\n💡 **Real life:** You scored 7 out of 10 = 7/10!\n\nWant me to explain with another example? 😊`,
      te: `**భిన్నాలు** అంటే ఒక మొత్తంలో భాగం సూచించడం.\n\n🍕 పిజ్జాను 4 సమాన ముక్కలుగా కత్తిరించు:\n• 1 ముక్క = **1/4**\n• 2 ముక్కలు = **2/4** = **1/2**\n\n📝 భిన్నంలో:\n• పైన = లవం (నీ దగ్గర ఉన్న భాగాలు)\n• కిందన = హారం (మొత్తం సమాన భాగాలు)\n\n💡 10కి 7 మార్కులు వచ్చాయి = 7/10! 😊`,
      hi: `**भिन्न** का मतलब है पूरे का एक हिस्सा।\n\n🍕 पिज़्ज़ा को 4 बराबर टुकड़ों में काटो:\n• 1 टुकड़ा = **1/4**\n• 2 टुकड़े = **2/4** = **1/2**\n\n📝 भिन्न के दो भाग:\n• अंश (ऊपर) = तुम्हारे पास कितने भाग\n• हर (नीचे) = कुल बराबर भाग\n\n💡 10 में से 7 अंक = 7/10! 😊`,
      ta: `**பின்னம்** என்பது ஒரு முழுவதன் பகுதி.\n\n🍕 பிட்சாவை 4 சம துண்டாக்கு:\n1 துண்டு = **1/4**, 2 துண்டு = **1/2** 😊`,
      kn: `**ಭಿನ್ನ** ಎಂದರೆ ಒಂದು ಪೂರ್ಣದ ಭಾಗ.\n\n🍕 ಪಿಝ್ಝಾವನ್ನು 4 ಭಾಗ ಮಾಡಿ: 1 ಭಾಗ = **1/4** 😊`,
      ml: `**ഭിന്നം** എന്നത് ഒരു മുഴുവന്റെ ഭാഗം.\n\n🍕 പിസ്സ 4 ആക്കിയാൽ: 1 ഭാഗം = **1/4** 😊`,
    }),
  },

  // ══════════════════════════════════════════════════════════
  // SCIENCE
  // ══════════════════════════════════════════════════════════

  {
    subjects: ['Science', 'Biology', 'Physics', 'Chemistry', 'Environmental Science'],
    match: /what is science|science mean|vigyan|విజ్ఞానం అంటే|అంటే ఏమిటి.*శాస్త్రం|विज्ञान क्या|அறிவியல் என்ன|ವಿಜ್ಞಾನ ಏನು|ശാസ്ത്രം എന്ത്/i,
    answer: (name, lang) => t(lang, {
      en: `**Science** is the study of everything around us — and how it works!\n\nScience asks three questions:\n🔍 **WHAT** is this?\n❓ **WHY** does it happen?\n🔬 **HOW** can we prove it?\n\n**The 3 main branches:**\n• 🌱 **Biology** — living things (plants, animals, humans)\n• ⚗️ **Chemistry** — what things are made of (atoms, molecules)\n• ⚡ **Physics** — forces and energy (gravity, electricity, light)\n\n💡 **Science is everywhere:**\n• Why does ice melt? → Physics\n• Why do plants grow toward light? → Biology\n• Why does salt dissolve in water? → Chemistry\n\n🚀 **Scientists who changed the world:**\nC.V. Raman (India) · Marie Curie · Isaac Newton · APJ Abdul Kalam\n\nCuriosity is the most important thing in science. And you're already curious — that's why you asked! 😊`,
      te: `**సైన్స్** అంటే మన చుట్టూ ఉన్న ప్రతి దాని అధ్యయనం!\n\nసైన్స్ 3 ప్రశ్నలు అడుగుతుంది:\n🔍 **ఏమిటి?** 🔬 **ఎందుకు?** 💡 **ఎలా?**\n\n**3 ప్రధాన శాఖలు:**\n• 🌱 **జీవ శాస్త్రం** — జీవులు\n• ⚗️ **రసాయన శాస్త్రం** — పదార్థాల నిర్మాణం\n• ⚡ **భౌతిక శాస్త్రం** — శక్తి మరియు బలాలు\n\n🚀 భారత శాస్త్రవేత్తలు: సి.వి. రామన్, ఏపీజే అబ్దుల్ కలాం!\n\nనీ జిజ్ఞాసే సైన్స్ యొక్క మొదటి పాఠం! 😊`,
      hi: `**विज्ञान** हमारे आसपास की हर चीज़ का अध्ययन है!\n\n**3 मुख्य शाखाएँ:**\n• 🌱 **जीव विज्ञान** — जीवित चीज़ें\n• ⚗️ **रसायन** — चीज़ें किस चीज़ से बनी हैं\n• ⚡ **भौतिकी** — बल और ऊर्जा\n\n🚀 APJ Abdul Kalam — भारत के मिसाइल मैन!\n\nतुम्हारी जिज्ञासा ही सबसे बड़ा वैज्ञानिक गुण है! 😊`,
      ta: `**அறிவியல்** நம்மைச் சுற்றியுள்ள அனைத்தையும் படிப்பது!\n\n3 பிரிவுகள்: 🌱 உயிரியல் · ⚗️ வேதியியல் · ⚡ இயற்பியல்\n\nஆர்வம் தான் அறிவியலின் அடிப்படை! 😊`,
      kn: `**ವಿಜ್ಞಾನ** ನಮ್ಮ ಸುತ್ತಲಿನ ಪ್ರತಿಯೊಂದರ ಅಧ್ಯಯನ!\n\n3 ಶಾಖೆಗಳು: 🌱 ಜೀವಶಾಸ್ತ್ರ · ⚗️ ರಸಾಯನ · ⚡ ಭೌತಶಾಸ್ತ್ರ\n\nನಿಮ್ಮ ಕುತೂಹಲ ತಾನೇ ವಿಜ್ಞಾನದ ಮೊದಲ ಪಾಠ! 😊`,
      ml: `**ശാസ്ത്രം** നമ്മുടെ ചുറ്റുമുള്ള എല്ലാറ്റിന്റെയും പഠനം!\n\n3 ശാഖകൾ: 🌱 ജീവശാസ്ത്രം · ⚗️ രസതന്ത്രം · ⚡ ഭൌതികശാസ്ത്രം\n\nജിജ്ഞാസ ആണ് ശാസ്ത്രത്തിന്റെ ആദ്യ പദം! 😊`,
    }),
  },

  {
    subjects: ['Science', 'Biology', 'Environmental Science'],
    match: /what is photosynthesis|photosynthesis mean|కిరణజన్య|प्रकाश संश्लेषण|ஒளிச்சேர்க்கை|ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ|ഫോട്ടോസിന്തസിസ്/i,
    answer: (name, lang) => t(lang, {
      en: `**Photosynthesis** is how plants make their own food using sunlight!\n\n🌿 **The recipe for plant food:**\n\n☀️ Sunlight\n+ 💧 Water (from roots)\n+ 🌬️ Carbon dioxide (CO₂ from air)\n↓\n🍬 Glucose (sugar = plant food)\n+ 🌬️ **Oxygen** (released into air — we breathe this!)\n\n📝 **The equation:**\n6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\n\n🌱 **Where does it happen?**\nIn the green parts of leaves, using **chlorophyll** — the green pigment that captures sunlight.\n\n💡 **Why does this matter to YOU?**\nEvery breath you take uses the oxygen that plants made!\nEvery meal you eat started with photosynthesis!\n\n🌍 Without photosynthesis → no oxygen → no life on Earth!\n\nThat's why forests are called "the lungs of the Earth" 🫁`,
      te: `**కిరణజన్య సంయోగక్రియ** అంటే మొక్కలు సూర్యకాంతి ఉపయోగించి ఆహారం తయారు చేసుకోవడం!\n\n🌿 **మొక్క ఆహార వంటకం:**\n☀️ సూర్యకాంతి + 💧 నీరు + 🌬️ CO₂ → 🍬 గ్లూకోజ్ + 🌬️ **ఆక్సిజన్**\n\n🌱 **ఇది ఎక్కడ జరుగుతుంది?**\nఆకులలో **క్లోరోఫిల్** (ఆకుపచ్చ వర్ణకం) ద్వారా.\n\n💡 **నీకు ఎందుకు ముఖ్యం?**\nనువ్వు పీల్చే ప్రతి శ్వాస మొక్కలు తయారు చేసిన ఆక్సిజన్!\nనువ్వు తినే ప్రతి భోజనం కిరణజన్య సంయోగక్రియతో మొదలైంది!\n\n🌍 మొక్కలు లేకుండా = ఆక్సిజన్ లేదు = జీవితం లేదు!`,
      hi: `**प्रकाश संश्लेषण** वह प्रक्रिया है जिससे पौधे सूरज की रोशनी से अपना खाना बनाते हैं!\n\n🌿 **पौधे का खाना बनाने का तरीका:**\n☀️ सूरज + 💧 पानी + 🌬️ CO₂ → 🍬 ग्लूकोज + 🌬️ **ऑक्सीजन**\n\n🌱 **क्लोरोफिल** — पत्तों का हरा रंजक — सूरज की रोशनी पकड़ता है।\n\n💡 तुम जो सांस लेते हो वह ऑक्सीजन पौधों ने बनाई है! 🫁`,
      ta: `**ஒளிச்சேர்க்கை** என்பது தாவரங்கள் சூரிய ஒளியால் உணவு தயாரிக்கும் முறை!\n\n☀️ + 💧 + CO₂ → 🍬 குளுக்கோஸ் + **ஆக்சிஜன்**\n\n🌱 **குளோரோபில்** = பச்சை நிற பொருள் சூரிய ஒளியை பிடிக்கும். 🫁`,
      kn: `**ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ** ಎಂದರೆ ಸಸ್ಯಗಳು ಸೂರ್ಯನ ಬೆಳಕಿನಿಂದ ಆಹಾರ ತಯಾರಿಸುವ ಪ್ರಕ್ರಿಯೆ!\n\n☀️ + 💧 + CO₂ → 🍬 ಗ್ಲೂಕೋಸ್ + **ಆಮ್ಲಜನಕ** 🫁`,
      ml: `**ഫോട്ടോസിന്തസിസ്** ആണ് സസ്യങ്ങൾ സൂര്യപ്രകാശം ഉപയോഗിച്ച് ഭക്ഷണം ഉണ്ടാക്കുന്ന പ്രക്രിയ!\n\n☀️ + 💧 + CO₂ → 🍬 ഗ്ലൂക്കോസ് + **ഓക്സിജൻ** 🫁`,
    }),
  },

  {
    subjects: ['Science', 'Physics'],
    match: /what is gravity|gravity mean|gravity kya|గురుత్వాకర్షణ|गुरुत्वाकर्षण|ஈர்ப்பு|ಗುರುತ್ವ|ഗുരുത്വം/i,
    answer: (name, lang) => t(lang, {
      en: `**Gravity** is the invisible force that pulls everything toward everything else!\n\n🍎 **Newton's discovery:**\nAn apple fell from a tree. Isaac Newton asked "WHY?" — and discovered gravity! (1687)\n\n🌍 **What gravity does:**\n• Keeps you on the ground (Earth pulls you down)\n• Makes things fall when you drop them\n• Keeps the Moon orbiting Earth\n• Keeps Earth orbiting the Sun\n• Holds the whole solar system together!\n\n📐 **On Earth:** Everything falls at the same speed in a vacuum — 9.8 m/s² (acceleration due to gravity)\n\n💡 **Fun fact:** The Moon has 1/6 of Earth's gravity — that's why astronauts bounce when they walk on it! On the Moon, you'd weigh only 10 kg if you weigh 60 kg on Earth!\n\n🚀 Gravity is the reason rockets need so much fuel — they're fighting Earth's gravity to escape!`,
      te: `**గురుత్వాకర్షణ** అంటే ప్రతిదాన్ని ప్రతిదాని వైపు లాగే అదృశ్య శక్తి!\n\n🍎 **న్యూటన్ ఆవిష్కరణ:**\nఒక ఆపిల్ చెట్టు నుండి పడింది. ఐజాక్ న్యూటన్ "ఎందుకు?" అని అడిగి గురుత్వాకర్షణ కనుగొన్నాడు!\n\n🌍 **గురుత్వాకర్షణ చేసేది:**\n• నిన్ను నేలపై నిలిపి ఉంచడం\n• వస్తువులు పడటం\n• చంద్రుడు భూమి చుట్టూ తిరగడం\n\n💡 చంద్రుడిపై భూమి కంటే 6 రెట్లు తక్కువ గురుత్వాకర్షణ — అందుకే వ్యోమగాములు అక్కడ ఎగురుతారు! 🚀`,
      hi: `**गुरुत्वाकर्षण** वह अदृश्य शक्ति है जो हर चीज़ को हर चीज़ की ओर खींचती है!\n\n🍎 **Newton की खोज:** एक सेब गिरा, Newton ने पूछा "क्यों?" और गुरुत्वाकर्षण खोजा!\n\n🌍 यह क्या करता है: तुम्हें जमीन पर रखता है, चाँद को पृथ्वी के चारों ओर, पृथ्वी को सूरज के चारों ओर!\n\n💡 चाँद पर 1/6 गुरुत्व है — इसलिए अंतरिक्ष यात्री वहाँ उछलते हैं! 🚀`,
      ta: `**ஈர்ப்பு** என்பது எல்லாவற்றையும் ஈர்க்கும் ஒரு கண்ணுக்கு தெரியாத சக்தி!\n\n🍎 Newton ஒரு ஆப்பிள் விழுவதை பார்த்து ஈர்ப்பு கண்டுபிடித்தார்!\n\n🌍 நம்மை தரையில் வைக்கிறது, சந்திரனை பூமியைச் சுற்ற வைக்கிறது! 🚀`,
      kn: `**ಗುರುತ್ವ** ಎಂದರೆ ಎಲ್ಲವನ್ನೂ ಎಲ್ಲದರ ಕಡೆಗೆ ಎಳೆಯುವ ಅಗೋಚರ ಶಕ್ತಿ!\n\n🍎 Newton ಸೇಬು ಬೀಳುವುದನ್ನು ನೋಡಿ ಗುರುತ್ವ ಕಂಡುಹಿಡಿದರು! 🚀`,
      ml: `**ഗുരുത്വം** എന്നത് എല്ലാറ്റിനെയും അടുത്തേക്ക് വലിക്കുന്ന അദൃശ്യ ശക്തി!\n\n🍎 Newton ഒരു ആപ്പിൾ വീഴുന്നത് കണ്ടു ഗുരുത്വം കണ്ടെത്തി! 🚀`,
    }),
  },

  // ══════════════════════════════════════════════════════════
  // ENGLISH
  // ══════════════════════════════════════════════════════════

  {
    subjects: ['English', 'English Language', 'English Literature'],
    match: /what is.*noun|noun mean|what are nouns|నామవాచకం|संज्ञा क्या|பெயர்ச்சொல்|ನಾಮಪದ|നാമം/i,
    answer: (name, lang) => t(lang, {
      en: `A **noun** is a naming word — it names a person, place, thing, or animal!\n\n📝 **NOUN = Name of something**\n\n**4 types of nouns:**\n• 👤 **Person:** teacher, doctor, mother, Kumar\n• 🏙️ **Place:** school, India, Mumbai, garden\n• 📦 **Thing:** book, phone, chair, pizza\n• 🐕 **Animal:** dog, elephant, parrot\n\n✅ **Quick test — spot the nouns:**\n*"The **girl** threw a **ball** in the **park**."*\n→ girl (person), ball (thing), park (place) = **3 nouns!**\n\n💡 **Tip:** If you can put "a", "an" or "the" before a word, it's probably a noun!\n• a **book** ✓ · the **school** ✓ · an **elephant** ✓\n\nNouns are the building blocks of language — every sentence needs one! 😊`,
      te: `**నామవాచకం** అంటే పేరు పెట్టే పదం — వ్యక్తి, స్థలం, వస్తువు లేదా జంతువు పేరు!\n\n**4 రకాలు:**\n• 👤 వ్యక్తి: గురువు, డాక్టర్, అమ్మ\n• 🏙️ స్థలం: పాఠశాల, భారతదేశం, తోట\n• 📦 వస్తువు: పుస్తకం, ఫోన్, కుర్చీ\n• 🐕 జంతువు: కుక్క, ఏనుగు, చిలుక\n\n✅ **వాక్యంలో నామవాచకాలు కనుగొను:**\n*"**అమ్మాయి** **తోటలో** **బంతి** విసిరింది."* → 3 నామవాచకాలు!\n\n💡 "ఒక" లేదా "ఆ" ముందు పెట్టగలిగితే, అది నామవాచకం! 😊`,
      hi: `**संज्ञा** वह शब्द है जो किसी का नाम बताता है — व्यक्ति, स्थान, वस्तु या जानवर!\n\n**4 प्रकार:**\n• 👤 व्यक्ति: शिक्षक, डॉक्टर, माँ\n• 🏙️ स्थान: विद्यालय, भारत, बगीचा\n• 📦 वस्तु: किताब, फोन, कुर्सी\n• 🐕 जानवर: कुत्ता, हाथी, तोता\n\n✅ **वाक्य में संज्ञा खोजो:**\n*"**लड़की** ने **बगीचे** में **गेंद** फेंकी।"* → 3 संज्ञाएं!\n\n💡 जिस शब्द के पहले "एक" या "वह" लगा सको, वह संज्ञा है! 😊`,
      ta: `**பெயர்ச்சொல்** என்பது ஒரு நபர், இடம், பொருள் அல்லது விலங்கின் பெயர்!\n\n👤 நபர் · 🏙️ இடம் · 📦 பொருள் · 🐕 விலங்கு\n\n✅ "பெண் தோட்டத்தில் பந்தை வீசினாள்" → 3 பெயர்ச்சொற்கள்! 😊`,
      kn: `**ನಾಮಪದ** ಎಂದರೆ ವ್ಯಕ್ತಿ, ಸ್ಥಳ, ವಸ್ತು ಅಥವಾ ಪ್ರಾಣಿಯ ಹೆಸರು!\n\n✅ "ಹುಡುಗಿ ತೋಟದಲ್ಲಿ ಚೆಂಡು ಎಸೆದಳು" → 3 ನಾಮಪದಗಳು! 😊`,
      ml: `**നാമം** എന്നത് ഒരു വ്യക്തി, സ്ഥലം, വസ്തു അല്ലെങ്കിൽ മൃഗത്തിന്റെ പേര്!\n\n✅ "പെൺകുട്ടി തോട്ടത്തിൽ പന്ത് എറിഞ്ഞു" → 3 നാമങ്ങൾ! 😊`,
    }),
  },

  {
    subjects: ['English', 'English Language', 'English Literature'],
    match: /what is.*verb|verb mean|what are verbs|క్రియ|क्रिया क्या|வினைச்சொல்|ಕ್ರಿಯಾಪದ|ക്രിയ/i,
    answer: (name, lang) => t(lang, {
      en: `A **verb** is an action word — it tells you WHAT is happening!\n\n💡 **Verb = what someone/something DOES or IS**\n\n**Action verbs (doing words):**\n• run, jump, eat, sleep, read, write, sing, play\n\n**Being verbs (state words):**\n• is, are, was, were, am, be, been\n\n✅ **Find the verbs:**\n*"The dog **barks** and **runs** in the garden."*\n→ barks + runs = **2 verbs!**\n\n📝 **Verb tenses (time):**\n• Past: I **ate** an apple (yesterday)\n• Present: I **eat** an apple (now)\n• Future: I **will eat** an apple (tomorrow)\n\n💡 **Trick:** If you can put "I ___" or "She ___" before it, it's probably a verb!\n• I **run** ✓ · She **sings** ✓ · They **sleep** ✓ 😊`,
      te: `**క్రియ** అంటే చర్యను తెలిపే పదం — ఏమి జరుగుతుందో చెప్తుంది!\n\n**క్రియలు (చర్యలు):** పరుగెత్తడం, తినడం, నిద్రపోవడం, చదవడం\n\n✅ **వాక్యంలో క్రియలు కనుగొను:**\n*"కుక్క **మొరుగుతుంది** మరియు **పరుగెత్తుతుంది**."* → 2 క్రియలు!\n\n📝 **కాలాలు:** గత కాలం · వర్తమాన కాలం · భవిష్యత్కాలం 😊`,
      hi: `**क्रिया** वह शब्द है जो बताता है कि कोई क्या कर रहा है!\n\n**क्रियाएं:** दौड़ना, खाना, सोना, पढ़ना, गाना\n\n✅ "कुत्ता **भौंकता** है और **दौड़ता** है।" → 2 क्रियाएं!\n\n📝 भूत · वर्तमान · भविष्य काल 😊`,
      ta: `**வினைச்சொல்** செயலை குறிக்கும் சொல்!\n\n✅ "நாய் **குரைக்கிறது** மற்றும் **ஓடுகிறது**." → 2 வினைகள்! 😊`,
      kn: `**ಕ್ರಿಯಾಪದ** ಏನಾಗುತ್ತಿದೆ ಎಂದು ತಿಳಿಸುವ ಪದ!\n\n✅ "ನಾಯಿ **ಬೊಗಳುತ್ತದೆ** ಮತ್ತು **ಓಡುತ್ತದೆ**." → 2 ಕ್ರಿಯಾಪದ! 😊`,
      ml: `**ക്രിയ** എന്ത് നടക്കുന്നു എന്ന് പറയുന്ന വാക്ക്!\n\n✅ "നായ **കുരയ്ക്കുന്നു** പിന്നെ **ഓടുന്നു**." → 2 ക్రియ! 😊`,
    }),
  },

  // ══════════════════════════════════════════════════════════
  // CODING
  // ══════════════════════════════════════════════════════════

  {
    subjects: ['Coding', 'Computer Science', 'Computer Applications'],
    match: /what is coding|what is programming|code mean|programming mean|కోడింగ్ అంటే|कोडिंग क्या|நிரல் என்ன|ಕೋಡಿಂಗ್ ಏನು|കോഡിംഗ് എന്ത്/i,
    answer: (name, lang) => t(lang, {
      en: `**Coding** (or Programming) is giving a computer step-by-step instructions to do something!\n\n💻 **Think of it this way:**\nA computer is VERY fast but VERY dumb — it only does exactly what you tell it.\nCoding = writing those instructions.\n\n🌟 **Real things made by coding:**\n• 📱 Every app on your phone\n• 🎮 Every video game you play\n• 🌐 Every website you visit\n• 🤖 ARIA itself — I'm built with code!\n\n📝 **Programming languages:**\n• **Python** — simple, used for AI (great for beginners!)\n• **JavaScript** — makes websites interactive\n• **Java** — used in Android apps\n• **Scratch** — drag-and-drop, perfect for Grade 3-6!\n\n🚀 **The most important skill in coding:**\nThinking in small, clear steps — called an **Algorithm**.\n\n💡 APJ Abdul Kalam said: *"Dream, Dream, Dream — then work hard to make it reality."*\nCoding turns YOUR dreams into reality! 😊`,
      te: `**కోడింగ్** అంటే కంప్యూటర్‌కు అడుగు అడుగున సూచనలు ఇవ్వడం!\n\n💻 కంప్యూటర్ చాలా వేగంగా ఉంటుంది కానీ నువ్వు చెప్పినట్టే చేస్తుంది.\n\n🌟 **కోడింగ్‌తో తయారైనవి:**\n• 📱 నీ ఫోన్‌లోని ప్రతి యాప్\n• 🎮 ప్రతి వీడియో గేమ్\n• 🌐 ప్రతి వెబ్‌సైట్\n• 🤖 ARIA కూడా కోడ్‌తో తయారైంది!\n\n📝 **భాషలు:** Python · JavaScript · Java · Scratch (బిగినర్స్ కోసం!)\n\n🚀 కోడింగ్ నీ కలలను నిజం చేస్తుంది! 😊`,
      hi: `**कोडिंग** का मतलब है कंप्यूटर को कदम-दर-कदम निर्देश देना!\n\n💻 कंप्यूटर बहुत तेज़ है पर जो कहो वही करता है।\n\n🌟 **कोडिंग से बनी चीज़ें:**\n• 📱 तुम्हारे फोन के हर ऐप\n• 🎮 हर वीडियो गेम\n• 🌐 हर वेबसाइट\n• 🤖 ARIA भी कोड से बना है!\n\n📝 **भाषाएँ:** Python · JavaScript · Java · Scratch\n\n🚀 कोडिंग तुम्हारे सपने सच कर सकती है! 😊`,
      ta: `**கோடிங்** என்பது கணினிக்கு படிப்படியான வழிமுறைகள் தருவது!\n\n🌟 உன் ஃபோனில் உள்ள எல்லா App-களும், கேம்களும், இணையதளங்களும் கோடிங்கால் தயாரானவை!\n\n🚀 Python, Scratch கற்க ஆரம்பி! 😊`,
      kn: `**ಕೋಡಿಂಗ್** ಎಂದರೆ ಕಂಪ್ಯೂಟರ್‌ಗೆ ಹಂತ ಹಂತವಾಗಿ ಸೂಚನೆ ನೀಡುವುದು!\n\n🌟 ಫೋನ್ Apps, ಗೇಮ್ಸ್, ವೆಬ್‌ಸೈಟ್‌ಗಳು ಎಲ್ಲವೂ ಕೋಡಿಂಗ್‌ನಿಂದ!\n\n🚀 Scratch ಅಥವಾ Python ಕಲಿ! 😊`,
      ml: `**കോഡിംഗ്** എന്നത് കമ്പ്യൂട്ടറിന് ഘട്ടം ഘട്ടമായ നിർദ്ദേശം നൽകുന്നത്!\n\n🌟 ഫോൺ Apps, ഗെയിമുകൾ, വെബ്സൈറ്റുകൾ എല്ലാം കോഡിംഗ് ഉപയോഗിച്ചാണ്!\n\n🚀 Python, Scratch തുടങ്ങൂ! 😊`,
    }),
  },

  // ══════════════════════════════════════════════════════════
  // LIFE SKILLS
  // ══════════════════════════════════════════════════════════

  {
    subjects: ['Life Skills'],
    match: /what is.*life skill|life skill mean|జీవిత నైపుణ్యాలు|जीवन कौशल|வாழ்க்கை திறன்|ಜೀವನ ಕೌಶಲ|ജീവിത ശേഷി/i,
    answer: (name, lang) => t(lang, {
      en: `**Life Skills** are abilities that help you handle everyday situations wisely and confidently!\n\nSchools teach you WHAT to know.\nLife Skills teach you HOW to LIVE.\n\n🌟 **The 10 core Life Skills (WHO list):**\n1. **Problem Solving** — think through challenges\n2. **Decision Making** — choose wisely\n3. **Creative Thinking** — find new solutions\n4. **Critical Thinking** — question and analyse\n5. **Communication** — express yourself clearly\n6. **Empathy** — understand others' feelings\n7. **Self-Awareness** — know your strengths & weaknesses\n8. **Managing Emotions** — stay calm under pressure\n9. **Managing Stress** — handle difficult times\n10. **Interpersonal Skills** — build good relationships\n\n💡 **Why do they matter?**\nYou can know all the maths in the world — but without Life Skills, you can't handle a difficult situation, lead a team, or stay calm when things go wrong.\n\nA doctor needs Life Skills to speak kindly to patients.\nA business leader needs Life Skills to inspire a team.\nEVEN YOU need them every single day! 😊`,
      te: `**జీవిత నైపుణ్యాలు** అంటే రోజువారీ పరిస్థితులను తెలివిగా నిర్వహించే సామర్థ్యాలు!\n\nపాఠశాల నీకు **ఏమి** నేర్పిస్తుంది.\nజీవిత నైపుణ్యాలు **ఎలా జీవించాలి** అని నేర్పిస్తాయి!\n\n🌟 **10 ముఖ్య నైపుణ్యాలు:**\n1. సమస్య పరిష్కారం · 2. నిర్ణయం తీసుకోవడం · 3. సృజనాత్మక ఆలోచన · 4. విమర్శనాత్మక ఆలోచన · 5. సంభాషణ · 6. సానుభూతి · 7. స్వీయ అవగాహన · 8. భావోద్వేగ నిర్వహణ · 9. ఒత్తిడి నిర్వహణ · 10. వ్యక్తుల మధ్య నైపుణ్యాలు\n\n💡 డాక్టర్, ఇంజనీర్, ఉపాధ్యాయుడు — అందరికీ జీవిత నైపుణ్యాలు అవసరం! 😊`,
      hi: `**जीवन कौशल** वे क्षमताएँ हैं जो तुम्हें रोज़मर्रा की चुनौतियों से समझदारी से निपटने में मदद करती हैं!\n\nस्कूल बताता है **क्या जानें**।\nजीवन कौशल सिखाता है **कैसे जिएं**!\n\n🌟 **10 मुख्य जीवन कौशल:**\nसमस्या समाधान · निर्णय लेना · रचनात्मक सोच · आलोचनात्मक सोच · संवाद · सहानुभूति · आत्म-जागरूकता · भावना प्रबंधन · तनाव प्रबंधन · सामाजिक कौशल\n\n💡 ये कौशल हर पेशे में, हर रिश्ते में ज़रूरी हैं! 😊`,
      ta: `**வாழ்க்கை திறன்கள்** தினசரி சவால்களை புத்திசாலித்தனமாக சமாளிக்கும் திறன்கள்!\n\nபள்ளி **என்ன தெரிய வேண்டும்** கற்பிக்கும்.\nவாழ்க்கை திறன்கள் **எப்படி வாழ வேண்டும்** கற்பிக்கும்! 😊`,
      kn: `**ಜೀವನ ಕೌಶಲ** ದೈನಂದಿನ ಸವಾಲುಗಳನ್ನು ಬುದ್ಧಿವಂತಿಕೆಯಿಂದ ನಿಭಾಯಿಸುವ ಸಾಮರ್ಥ್ಯಗಳು!\n\nಶಾಲೆ **ಏನು ತಿಳಿಯಬೇಕು** ಕಲಿಸುತ್ತದೆ.\nಜೀವನ ಕೌಶಲ **ಹೇಗೆ ಜೀವಿಸಬೇಕು** ಕಲಿಸುತ್ತದೆ! 😊`,
      ml: `**ജീവിത ശേഷി** ദൈനംദിന വെല്ലുവിളികൾ ജ്ഞാനത്തോടെ കൈകാര്യം ചെയ്യാനുള്ള കഴിവുകൾ!\n\nസ്കൂൾ **എന്ത് അറിയണം** പഠിപ്പിക്കുന്നു.\nജീവിത ശേഷി **എങ്ങനെ ജീവിക്കണം** പഠിപ്പിക്കുന്നു! 😊`,
    }),
  },

  // ══════════════════════════════════════════════════════════
  // CONFUSION / "I DON'T UNDERSTAND"
  // ══════════════════════════════════════════════════════════

  {
    subjects: null, // works for all subjects
    match: /don.t understand|not understand|confused|i don.t know|what do you mean|can you explain|please explain|explain again|tell me again|what\?|huh|నాకు అర్థం కాలేదు|నాకు తెలియదు|मुझे समझ नहीं|समझ नहीं आया|புரியவில்லை|ಅರ್ಥವಾಗಲಿಲ್ಲ|മനസ്സിലായില്ല/i,
    answer: (name, lang) => t(lang, {
      en: `No problem at all, ${name}! Confusion is HOW we learn — every great scientist and mathematician was confused first! 😊\n\nLet me try a different way to explain.\n\n**Can you tell me:**\n• Which part was confusing?\n• What do you already understand so far?\n\nOr just say "start again" and I'll explain the whole topic from scratch with a fresh real-life example! 🌟`,
      te: `పర్వాలేదు, ${name}! గందరగోళం అనేది నేర్చుకోవడానికి సంకేతం — ప్రతి గొప్ప శాస్త్రవేత్త మొదట అర్థం కాలేదు! 😊\n\nవేరేలా వివరిస్తాను.\n\n**చెప్పగలవా:**\n• ఏ భాగం అర్థం కాలేదు?\n• ఇప్పటి వరకు ఏమి అర్థమైంది?\n\nలేదా "మళ్ళీ మొదలుపెట్టు" అని చెప్పు — కొత్త ఉదాహరణతో వివరిస్తాను! 🌟`,
      hi: `कोई बात नहीं, ${name}! भ्रम होना सीखने की निशानी है — हर महान वैज्ञानिक पहले भ्रमित था! 😊\n\nमैं अलग तरीके से समझाता हूँ।\n\n**बताओ:**\n• कौन सा हिस्सा समझ नहीं आया?\n• अभी तक क्या समझे?\n\nया कहो "फिर से शुरू करो" — नए उदाहरण से समझाऊँगा! 🌟`,
      ta: `பரவாயில்லை, ${name}! குழப்பம் கற்றலின் அடையாளம்! 😊\n\nவேறு வழியில் விளக்குகிறேன்.\n• எந்த பகுதி புரியவில்லை?\n• "மீண்டும் தொடங்கு" சொன்னால் புதிய உதாரணத்துடன் விளக்குவேன்! 🌟`,
      kn: `ಪರ್ವಾಗಿಲ್ಲ, ${name}! ಗೊಂದಲ ಕಲಿಕೆಯ ಸಂಕೇತ! 😊\n\nಬೇರೆ ರೀತಿಯಲ್ಲಿ ವಿವರಿಸುತ್ತೇನೆ.\n"ಮತ್ತೆ ಶುರು ಮಾಡು" ಅಂದರೆ ಹೊಸ ಉದಾಹರಣೆಯೊಂದಿಗೆ ವಿವರಿಸುತ್ತೇನೆ! 🌟`,
      ml: `പരവായില്ല, ${name}! ആശയക്കുഴപ്പം പഠനത്തിന്റെ അടയാളം! 😊\n\nവ്യത്യസ്തമായി വിശദീകരിക്കാം.\n"വീണ്ടും തുടങ്ങൂ" എന്ന് പറഞ്ഞാൽ പുതിയ ഉദാഹരണം തരാം! 🌟`,
    }),
  },
];

// ─── Main lookup function ─────────────────────────────────────
export function findAnswer(input, subject, lang, name) {
  const q = (input || '').trim();
  if (!q) return null;

  for (const entry of KB) {
    // Check subject filter (null = all subjects)
    if (entry.subjects && !entry.subjects.includes(subject)) continue;
    // Check pattern match
    if (entry.match.test(q)) {
      return entry.answer(name, lang);
    }
  }
  return null;
}
