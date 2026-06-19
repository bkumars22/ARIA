// ─── Board-aware subjects, style and lesson content ──────────
import { t } from './lessonData.js';

export const BOARDS = ['CBSE', 'ICSE', 'IGCSE'];

export const BOARD_META = {
  CBSE:  { color:'#2563eb', bg:'#eff6ff', label:'CBSE · NCERT',        emoji:'🟦' },
  ICSE:  { color:'#16a34a', bg:'#f0fdf4', label:'ICSE · Selina',       emoji:'🟩' },
  IGCSE: { color:'#9333ea', bg:'#faf5ff', label:'IGCSE · Cambridge',   emoji:'🟧' },
};

// ─── Subjects available per board ────────────────────────────
export const BOARD_SUBJECTS = {
  CBSE: [
    { id:'Mathematics',    emoji:'🔢' },
    { id:'Science',        emoji:'🔬' },
    { id:'English',        emoji:'📖' },
    { id:'Social Studies', emoji:'🌍' },
    { id:'Hindi',          emoji:'🇮🇳' },
    { id:'Computer Science', emoji:'💻' },
    { id:'Life Skills',    emoji:'🌱' },
  ],
  ICSE: [
    { id:'Mathematics',          emoji:'🔢' },
    { id:'Physics',              emoji:'⚡' },
    { id:'Chemistry',            emoji:'🧪' },
    { id:'Biology',              emoji:'🌱' },
    { id:'English Literature',   emoji:'📚' },
    { id:'History & Civics',     emoji:'🏛️' },
    { id:'Computer Applications',emoji:'💻' },
    { id:'Environmental Science',emoji:'🌍' },
    { id:'Life Skills',          emoji:'💡' },
  ],
  IGCSE: [
    { id:'Mathematics',     emoji:'🔢' },
    { id:'Physics',         emoji:'⚡' },
    { id:'Chemistry',       emoji:'🧪' },
    { id:'Biology',         emoji:'🌱' },
    { id:'English Language',emoji:'📖' },
    { id:'Computer Science',emoji:'💻' },
    { id:'Economics',       emoji:'📊' },
    { id:'Business Studies',emoji:'💼' },
    { id:'Life Skills',     emoji:'💡' },
  ],
};

// ─── Board-style intro shown before the first lesson ─────────
export const BOARD_INTRO = {
  CBSE:  (n, lang) => t(lang, {
    en: `🟦 **CBSE Mode — NCERT Curriculum**\n\nI'll teach you exactly the way your NCERT textbook does — chapter by chapter, with exam-style questions! Your board exam will feel easy! 💪`,
    te: `🟦 **CBSE విధానం — NCERT పాఠ్యక్రమం**\n\nనీ NCERT పాఠ్యపుస్తకం లాగే అధ్యాయం వారీగా నేర్పిస్తాను — పరీక్ష సులభంగా అనిపిస్తుంది! 💪`,
    hi: `🟦 **CBSE मोड — NCERT पाठ्यक्रम**\n\nमैं तुम्हारी NCERT किताब की तरह अध्याय दर अध्याय पढ़ाऊँगा — बोर्ड परीक्षा आसान लगेगी! 💪`,
    ta: `🟦 **CBSE முறை — NCERT பாடத்திட்டம்**\n\nNERT புத்தகம் போல் அத்தியாயம் அத்தியாயமாக கற்பிக்கிறேன்! 💪`,
    kn: `🟦 **CBSE ವಿಧಾನ — NCERT ಪಠ್ಯಕ್ರಮ**\n\nNCERT ಪುಸ್ತಕದಂತೆ ಅಧ್ಯಾಯ ಅಧ್ಯಾಯವಾಗಿ ಕಲಿಸುತ್ತೇನೆ! 💪`,
    ml: `🟦 **CBSE രീതി — NCERT പാഠ്യക്രമം**\n\nNCERT പുസ്തകം പോലെ അദ്ധ്യായം അദ്ധ്യായമായി പഠിപ്പിക്കാം! 💪`,
  }),
  ICSE:  (n, lang) => t(lang, {
    en: `🟩 **ICSE Mode — Selina / Frank Curriculum**\n\nICSE rewards **deep thinking and application** — not just memorisation. I'll challenge you to analyse, explain and apply concepts practically! 🧠`,
    te: `🟩 **ICSE విధానం — Selina పాఠ్యక్రమం**\n\nICSE **లోతైన ఆలోచన మరియు అనువర్తనం**కు బహుమతి ఇస్తుంది — కేవలం కంఠస్థం కాదు. నేను నిన్ను విశ్లేషించడానికి సవాలు చేస్తాను! 🧠`,
    hi: `🟩 **ICSE मोड — Selina पाठ्यक्रम**\n\nICSE **गहरी सोच और अनुप्रयोग** को पुरस्कृत करता है — सिर्फ रटना नहीं। मैं तुम्हें विश्लेषण करने की चुनौती दूँगा! 🧠`,
    ta: `🟩 **ICSE முறை — Selina பாடத்திட்டம்**\n\nICSE **ஆழமான சிந்தனை மற்றும் பயன்பாட்டை** கௌரவிக்கிறது! 🧠`,
    kn: `🟩 **ICSE ವಿಧಾನ — Selina ಪಠ್ಯಕ್ರಮ**\n\nICSE **ಆಳವಾದ ಚಿಂತನೆ ಮತ್ತು ಅನ್ವಯ**ವನ್ನು ಬಹುಮಾನಿಸುತ್ತದೆ! 🧠`,
    ml: `🟩 **ICSE രീതി — Selina പാഠ്യക്രമം**\n\nICSE **ആഴമായ ചിന്തയും പ്രയോഗവും** പ്രതിഫലിപ്പിക്കുന്നു! 🧠`,
  }),
  IGCSE: (n, lang) => t(lang, {
    en: `🟧 **IGCSE Mode — Cambridge International**\n\n⚠️ Cambridge rule: **METHOD > ANSWER**. Always show your working — examiners award marks for each step, even if the final answer is wrong. I'll teach you to think like Cambridge expects! 📝`,
    te: `🟧 **IGCSE విధానం — Cambridge International**\n\n⚠️ Cambridge నియమం: **పద్ధతి > సమాధానం**. ఎల్లప్పుడూ నీ పని చూపించు — పరీక్షకులు ప్రతి దశకు మార్కులు ఇస్తారు! 📝`,
    hi: `🟧 **IGCSE मोड — Cambridge International**\n\n⚠️ Cambridge नियम: **तरीका > उत्तर**। हमेशा अपना काम दिखाओ — परीक्षक हर चरण के लिए अंक देते हैं! 📝`,
    ta: `🟧 **IGCSE முறை — Cambridge International**\n\n⚠️ Cambridge விதி: **முறை > பதில்**. உன் வேலையை எப்போதும் காட்டு! 📝`,
    kn: `🟧 **IGCSE ವಿಧಾನ — Cambridge International**\n\n⚠️ Cambridge ನಿಯಮ: **ವಿಧಾನ > ಉತ್ತರ**. ನಿನ್ನ ಕೆಲಸ ತೋರಿಸು! 📝`,
    ml: `🟧 **IGCSE രീതി — Cambridge International**\n\n⚠️ Cambridge നിയമം: **രീതി > ഉത്തരം**. പ്രവൃത്തി കാണിക്കൂ! 📝`,
  }),
};

// ─── Board + Subject specific lessons ────────────────────────
// These OVERRIDE the default lessonData.js lessons for that board+subject
export const BOARD_LESSONS = {

  // ── CBSE ───────────────────────────────────────────────────
  CBSE: {
    Mathematics: [
      {
        topic: { en:'Rational Numbers (Ch.1)', te:'కారణాంక సంఖ్యలు', hi:'परिमेय संख्याएं', ta:'விகித எண்கள்', kn:'ಭಾಗಲಬ್ಧ ಸಂಖ್ಯೆಗಳು', ml:'ഭിന്ന സംഖ്യകൾ' },
        teach: (n, lang) => t(lang, {
          en: `Hi ${n}! 📘 NCERT Class 8, Chapter 1 — **Rational Numbers**!\n\nNCERT defines: *"A number p/q where p and q are integers and q ≠ 0"*\n\n🟦 **Quick Check:**\n• Is **-3/5** rational? → YES (p=-3, q=5, q≠0) ✓\n• Is **7** rational? → YES (write as 7/1) ✓\n• Is **√2** rational? → NO (can't write as p/q) ✗\n\n**NCERT Board Exam Pattern:**\nRepresent **-2/3** on a number line.\n\nFirst tell me — which direction does a negative fraction go? ⬅️ Left or ➡️ Right of zero?`,
          te: `నమస్తే ${n}! 📘 NCERT తరగతి 8, అధ్యాయం 1 — **కారణాంక సంఖ్యలు**!\n\nNCERT నిర్వచనం: *"p/q రూపంలో ఉన్న సంఖ్య, ఇక్కడ p మరియు q పూర్ణాంకాలు, q ≠ 0"*\n\n🟦 **త్వరిత తనిఖీ:**\n• **-3/5** కారణాంక సంఖ్య? → అవును ✓\n• **7** కారణాంక సంఖ్య? → అవును (7/1 గా రాయవచ్చు) ✓\n• **√2** కారణాంక సంఖ్య? → లేదు ✗\n\n**బోర్డ్ పరీక్ష నమూనా:**\n**-2/3**ని సంఖ్యా రేఖపై చూపించండి.\n\nముందు చెప్పు — ప్రతికూల భిన్నం ఏ దిశలో ఉంటుంది? ⬅️ శూన్యానికి ఎడమవైపు లేదా ➡️ కుడివైపు?`,
          hi: `नमस्ते ${n}! 📘 NCERT कक्षा 8, अध्याय 1 — **परिमेय संख्याएं**!\n\nNCERT परिभाषा: *"p/q के रूप में संख्या जहाँ p और q पूर्णांक हों, q ≠ 0"*\n\n🟦 **त्वरित जाँच:**\n• **-3/5** परिमेय है? → हाँ ✓\n• **7** परिमेय है? → हाँ (7/1 लिखें) ✓\n• **√2** परिमेय है? → नहीं ✗\n\n**बोर्ड परीक्षा प्रश्न:**\n**-2/3** को संख्या रेखा पर दर्शाइए।\n\nपहले बताओ — ऋणात्मक भिन्न संख्या रेखा पर किस दिशा में होगा? ⬅️ बाएं या ➡️ दाएं?`,
          ta: `வணக்கம் ${n}! 📘 NCERT 8ம் வகுப்பு, அத்தியாயம் 1 — **விகித எண்கள்**!\n\nNCERT வரையறை: p/q வடிவ எண், q ≠ 0\n\n**-2/3** ஐ எண் கோட்டில் குறிக்கவும். எந்த திசையில் போவோம்?`,
          kn: `ನಮಸ್ಕಾರ ${n}! 📘 NCERT 8ನೇ ತರಗತಿ, ಅಧ್ಯಾಯ 1 — **ಭಾಗಲಬ್ಧ ಸಂಖ್ಯೆಗಳು**!\n\n**-2/3** ಅನ್ನು ಸಂಖ್ಯಾ ರೇಖೆಯಲ್ಲಿ ತೋರಿಸಿ. ಯಾವ ದಿಕ್ಕು?`,
          ml: `നമസ്കാരം ${n}! 📘 NCERT ക്ലാസ് 8, അദ്ധ്യായം 1 — **ഭിന്ന സംഖ്യകൾ**!\n\n**-2/3** നമ്പർ ലൈനിൽ കാണിക്കൂ. ഏത് ദിശ?`,
        }),
        check: s => /left|ഇടത്|ఎడమ|बाएं|இடது|ಎಡ|-/.test(s.toLowerCase()),
        correct: (n, lang) => t(lang, {
          en: `✅ Exactly, ${n}! **Left of zero** — because negative numbers are always to the LEFT!\n\nNow for the number line: divide the space between -1 and 0 into 3 equal parts. **-2/3** is 2 parts to the left from 0.\n\n📝 **CBSE Board Tip:** This exact type appears in SA2 exams — 2 marks for diagram + 1 mark for labelling!\n\n✏️ **Next NCERT Q:** Is **0** a rational number? Explain with a reason.`,
          te: `✅ సరిగ్గా, ${n}! **శూన్యానికి ఎడమవైపు** — ఎందుకంటే ప్రతికూల సంఖ్యలు ఎల్లప్పుడూ ఎడమవైపు ఉంటాయి!\n\nSA2 పరీక్షలో ఇలాంటి ప్రశ్నకు 3 మార్కులు!\n\n✏️ **NCERT ప్రశ్న:** **0** కారణాంక సంఖ్యా? కారణంతో వివరించండి.`,
          hi: `✅ बिल्कुल सही, ${n}! **शून्य से बाईं तरफ** — क्योंकि ऋणात्मक संख्याएं हमेशा बाएं होती हैं!\n\nSA2 में यही प्रकार 3 अंकों के लिए आता है!\n\n✏️ **NCERT Q:** क्या **0** एक परिमेय संख्या है? कारण दो।`,
          ta: `✅ சரி, ${n}! இடது பக்கம் — எதிர்மறை எண்கள் எப்போதும் இடது பக்கம்!\n\n✏️ **0** ஒரு விகித எண்ணா? காரணம் சொல்லுங்கள்.`,
          kn: `✅ ಸರಿ, ${n}! ಎಡ ಬದಿ!\n\n✏️ **0** ಒಂದು ಭಾಗಲಬ್ಧ ಸಂಖ್ಯೆಯೇ? ಕಾರಣ ಕೊಡಿ.`,
          ml: `✅ ശരി, ${n}! ഇടതുഭാഗം!\n\n✏️ **0** ഒരു ഭിന്ന സംഖ്യയോ? കാരണം പറയൂ.`,
        }),
        wrong: (n, lang) => t(lang, {
          en: `Not quite, ${n}! Negative numbers are always to the **LEFT** of zero on a number line.\n\n📐 Think of a thermometer — 0°C in the middle, below-zero temperatures are LEFT.\n\nSo **-2/3** is **2 steps LEFT** of zero.\n\n✏️ **Try:** Is **-7/4** to the left or right of **-1**?`,
          te: `కాదు, ${n}! ప్రతికూల సంఖ్యలు సంఖ్యా రేఖపై శూన్యానికి **ఎడమవైపు** ఉంటాయి.\n\nఉష్ణమాపకం గురించి ఆలోచించు — 0°C మధ్యలో, శూన్యం కిందికి ఎడమవైపు.\n\n✏️ **ప్రయత్నించు:** **-7/4** అనేది **-1** యొక్క ఎడమవైపు లేదా కుడివైపు?`,
          hi: `नहीं, ${n}! ऋणात्मक संख्याएं हमेशा **बाईं तरफ** होती हैं।\n\nथर्मामीटर सोचो — 0°C बीच में, शून्य से नीचे बाईं तरफ।\n\n✏️ **कोशिश:** **-7/4** क्या **-1** के बाईं या दाईं तरफ है?`,
          ta: `இல்லை, ${n}! எதிர்மறை எண்கள் இடது பக்கம்.\n\n✏️ **-7/4** என்பது **-1** இன் இடது அல்லது வலது பக்கம்?`,
          kn: `ಇಲ್ಲ, ${n}! ಋಣ ಸಂಖ್ಯೆಗಳು ಎಡ ಬದಿ.\n\n✏️ **-7/4** ಎಂಬುದು **-1** ರ ಎಡ ಅಥವಾ ಬಲ?`,
          ml: `ഇല്ല, ${n}! നെഗറ്റീവ് സംഖ്യകൾ ഇടതുഭാഗം.\n\n✏️ **-7/4** എന്നത് **-1** ന്റെ ഇടതോ വലതോ?`,
        }),
        nextCheck: s => /yes|yes.*rational|0.*rational|0\/1|rational.*0|0 is|ఔను|हाँ|ஆம்|ಹೌದು|അതെ/i.test(s),
        nextCorrect: (n, lang) => t(lang, {
          en: `🌟 Perfect, ${n}! **0 IS rational** — 0 = 0/1 and q=1 ≠ 0 ✓\n\nThis is a common 1-mark CBSE question — you nailed it!\n\n📝 **NCERT Key Fact:** Between any two rational numbers, there are infinite rational numbers. Amazing, right? 🤯`,
          te: `🌟 అద్భుతం, ${n}! **0 కారణాంక సంఖ్య** — 0 = 0/1, q=1 ≠ 0 ✓\n\nCBSE పరీక్షలో 1 మార్క్ ప్రశ్న — నువ్వు చేసావు!`,
          hi: `🌟 शानदार, ${n}! **0 परिमेय है** — 0 = 0/1, q=1 ≠ 0 ✓\n\nCBSE में 1 अंक का प्रश्न — तुमने सही किया!`,
          ta: `🌟 அருமை, ${n}! **0 விகித எண்** — 0 = 0/1 ✓`,
          kn: `🌟 ಅದ್ಭುತ, ${n}! **0 ಭಾಗಲಬ್ಧ ಸಂಖ್ಯೆ** — 0 = 0/1 ✓`,
          ml: `🌟 അടിപൊളി, ${n}! **0 ഭിന്ന സംഖ്യ** — 0 = 0/1 ✓`,
        }),
        nextWrong: (n, lang) => t(lang, {
          en: `Yes! **0 is rational** — write it as 0/1 (p=0, q=1, q≠0). Any integer is a rational number! CBSE loves this question. 📘`,
          te: `అవును! **0 కారణాంక సంఖ్య** — 0/1 గా రాయవచ్చు. ఏ పూర్ణాంకమైనా కారణాంక సంఖ్యే! 📘`,
          hi: `हाँ! **0 परिमेय है** — 0/1 लिखो। कोई भी पूर्णांक परिमेय संख्या होती है! 📘`,
          ta: `ஆம்! **0 விகித எண்** — 0/1 எழுதுங்கள். 📘`,
          kn: `ಹೌದು! **0 ಭಾಗಲಬ್ಧ** — 0/1 ಬರೆಯಿರಿ. 📘`,
          ml: `അതെ! **0 ഭിന്ന സംഖ്യ** — 0/1 ആയി എഴുതൂ. 📘`,
        }),
      },
    ],
    'Social Studies': [
      {
        topic: { en:'The Rise of Nationalism in Europe', te:'యూరప్‌లో జాతీయవాదం', hi:'यूरोप में राष्ट्रवाद का उदय', ta:'ஐரோப்பாவில் தேசியவாதம்', kn:'ಯೂರೋಪಿನಲ್ಲಿ ರಾಷ್ಟ್ರೀಯತೆ', ml:'യൂറോപ്പിലെ ദേശീയത' },
        teach: (n, lang) => t(lang, {
          en: `Hello ${n}! NCERT Class 10 History — **The Rise of Nationalism in Europe** 🌍\n\nThis chapter is a MAJOR topic for board exams — 5 to 8 marks guaranteed!\n\n📖 **Key Concept: Frederic Sorrieu's Vision (1848)**\nAn artist drew a painting of people from all nations marching peacefully towards a "Statue of Liberty" — he DREAMED of a world of democratic republics.\n\n🗝️ **Core Ideas:**\n1. **Nation-state** — a territory with defined borders, one language, one culture\n2. **Nationalism** — pride and love for your nation\n3. **French Revolution (1789)** — first time "Nation" replaced "King" as the source of power\n\n✏️ **Board Q:** What was the main idea behind the French Revolution's concept of "La Patrie" (the Fatherland)?`,
          te: `నమస్తే ${n}! NCERT తరగతి 10 చరిత్ర — **యూరప్‌లో జాతీయవాదం పెరుగుదల** 🌍\n\nఈ అధ్యాయం బోర్డ్ పరీక్షలో 5-8 మార్కులు ఖచ్చితంగా వస్తుంది!\n\n🗝️ **ముఖ్య అంశాలు:**\n1. **జాతి-రాజ్యం** — నిర్వచించబడిన సరిహద్దులు, ఒక భాష, ఒక సంస్కృతి కలిగిన ప్రాంతం\n2. **జాతీయవాదం** — నీ జాతిపై గర్వం మరియు ప్రేమ\n3. **ఫ్రెంచ్ విప్లవం (1789)** — మొట్టమొదటిసారి "జాతి" "రాజు"ను శక్తి మూలంగా స్థానం పొందింది\n\n✏️ **బోర్డ్ ప్రశ్న:** ఫ్రెంచ్ విప్లవం యొక్క "La Patrie" భావన వెనుక ప్రధాన ఆలోచన ఏమిటి?`,
          hi: `नमस्ते ${n}! NCERT कक्षा 10 इतिहास — **यूरोप में राष्ट्रवाद का उदय** 🌍\n\nयह अध्याय बोर्ड परीक्षा में 5-8 अंक देता है!\n\n🗝️ **मुख्य विचार:**\n1. **राष्ट्र-राज्य** — एक क्षेत्र, एक भाषा, एक संस्कृति\n2. **राष्ट्रवाद** — अपने देश पर गर्व\n3. **फ्रांसीसी क्रांति (1789)** — पहली बार "राष्ट्र" ने "राजा" की जगह ली\n\n✏️ **बोर्ड प्रश्न:** फ्रांसीसी क्रांति के "La Patrie" की मुख्य अवधारणा क्या थी?`,
          ta: `வணக்கம் ${n}! NCERT 10ம் வகுப்பு வரலாறு — **ஐரோப்பாவில் தேசியவாதம்** 🌍\n\n✏️ **தேர்வு கேள்வி:** La Patrie என்றால் என்ன?`,
          kn: `ನಮಸ್ಕಾರ ${n}! NCERT 10ನೇ ತರಗತಿ ಇತಿಹಾಸ — **ಯೂರೋಪಿನಲ್ಲಿ ರಾಷ್ಟ್ರೀಯತೆ** 🌍\n\n✏️ **ಪ್ರಶ್ನೆ:** La Patrie ಎಂದರೇನು?`,
          ml: `നമസ്കാരം ${n}! NCERT 10 ക്ലാസ് ചരിത്രം — **യൂറോപ്പിലെ ദേശീയത** 🌍\n\n✏️ **ചോദ്യം:** La Patrie എന്നതിന്റെ അർത്ഥം?`,
        }),
        check: s => /fatherland|homeland|nation|country|patrie|motherland|patriotism|pride|దేశం|राष्ट्र|தேசம்|ರಾಷ್ಟ್ರ|ദേശം/i.test(s),
        correct: (n, lang) => t(lang, {
          en: `🌟 Brilliant, ${n}! **La Patrie = The Fatherland** — the idea that citizens owe loyalty to their NATION, not just the king.\n\nThis replaced the old loyalty to a king with loyalty to a democratic nation-state!\n\n📝 **Board Tip:** Always mention **1789** for French Revolution date — examiners love specific dates!\n\n✏️ **Next:** What is the significance of the year **1848** in European nationalism?`,
          te: `🌟 అద్భుతం, ${n}! **La Patrie = పితృభూమి** — పౌరులు రాజుకు కాదు, **జాతికి** విధేయత చూపాలనే ఆలోచన!\n\n✏️ **తర్వాత:** యూరోపియన్ జాతీయవాదంలో **1848** సంవత్సరం యొక్క ప్రాముఖ్యత ఏమిటి?`,
          hi: `🌟 शानदार, ${n}! **La Patrie = पितृभूमि** — नागरिकों की राजा के प्रति नहीं, राष्ट्र के प्रति वफ़ादारी!\n\n✏️ **अगला:** **1848** का यूरोपीय राष्ट्रवाद में क्या महत्व है?`,
          ta: `🌟 அருமை, ${n}! La Patrie = தாய்நாடு!\n\n✏️ **1848** இன் முக்கியத்துவம்?`,
          kn: `🌟 ಅದ್ಭುತ, ${n}! La Patrie = ಮಾತೃಭೂಮಿ!\n\n✏️ **1848** ರ ಮಹತ್ವ?`,
          ml: `🌟 അടിപൊളി, ${n}! La Patrie = മാതൃഭൂമി!\n\n✏️ **1848** ന്റെ പ്രാധാന്യം?`,
        }),
        wrong: (n, lang) => t(lang, {
          en: `**La Patrie = "The Fatherland"** — it expressed love and loyalty to one's nation/homeland.\n\nThe French Revolution introduced the idea that power belongs to the PEOPLE/NATION, not the king. This was REVOLUTIONARY for 1789!\n\n✏️ **Board Q:** Name the painting Frederic Sorrieu made in 1848 and what it depicted.`,
          te: `**La Patrie = "పితృభూమి"** — ఒకరి జాతి/స్వదేశంపై ప్రేమ మరియు విధేయతను వ్యక్తపరిచింది.\n\n✏️ Frederic Sorrieu 1848లో చేసిన చిత్రకళ పేరు ఏమిటి?`,
          hi: `**La Patrie = "पितृभूमि"** — अपने देश के प्रति प्रेम और वफ़ादारी।\n\n✏️ Frederic Sorrieu ने 1848 में कौन सी पेंटिंग बनाई?`,
          ta: `**La Patrie = தாய்நாடு** — தேசத்தின் மீது அன்பு.\n\n✏️ Frederic Sorrieu யின் 1848 ஓவியம் பெயர் என்ன?`,
          kn: `**La Patrie = ಮಾತೃಭೂಮಿ**.\n\n✏️ Sorrieu ರ 1848 ಚಿತ್ರ ಹೆಸರು?`,
          ml: `**La Patrie = മാതൃഭൂമി**.\n\n✏️ Sorrieu ന്റെ 1848 ചിത്രം?`,
        }),
        nextCheck: s => /1848|year.*revolution|revolution.*1848|spring|springtime|revolutions/i.test(s),
        nextCorrect: (n, lang) => t(lang, {
          en: `✅ Yes! **1848 — "The Spring of Nations"** — revolutions broke out across Europe — France, Germany, Italy, Austria all rose up demanding constitutional governments!\n\nCBSE loves asking "What is the significance of 1848?" — 3 marks! You just earned them! 🎯`,
          te: `✅ అవును! **1848 — "జాతుల వసంతం"** — ఫ్రాన్స్, జర్మనీ, ఇటలీ అంతటా విప్లవాలు జరిగాయి! CBSE లో 3 మార్కుల ప్రశ్న!`,
          hi: `✅ हाँ! **1848 — "राष्ट्रों का वसंत"** — पूरे यूरोप में क्रांतियाँ हुईं! CBSE में 3 अंकों का प्रश्न!`,
          ta: `✅ **1848 — "Nations Spring"** — முழு ஐரோப்பாவிலும் புரட்சிகள்!`,
          kn: `✅ **1848 — "ರಾಷ್ಟ್ರಗಳ ವಸಂತ"**!`,
          ml: `✅ **1848 — "ദേശങ്ങളുടെ വസന്തം"**!`,
        }),
        nextWrong: (n, lang) => t(lang, { en:`1848 = "The Spring of Nations" — revolutions across Europe demanding constitutional governments. CBSE 3-mark answer! 📘`, te:`1848 = "జాతుల వసంతం" — CBSE 3 మార్కుల సమాధానం! 📘`, hi:`1848 = "राष्ट्रों का वसंत" — CBSE 3 अंकों का उत्तर! 📘`, ta:`1848 = "Nations Spring" 📘`, kn:`1848 = "ರಾಷ್ಟ್ರಗಳ ವಸಂತ" 📘`, ml:`1848 = "ദേശങ്ങളുടെ വസന്തം" 📘` }),
      },
    ],
  },

  // ── ICSE ───────────────────────────────────────────────────
  ICSE: {
    Physics: [
      {
        topic: { en:'Force & Motion (Newton\'s Laws)', te:'బలం & చలనం', hi:'बल और गति', ta:'விசை & இயக்கம்', kn:'ಬಲ & ಚಲನೆ', ml:'ബലവും ചലനവും' },
        teach: (n, lang) => t(lang, {
          en: `Hi ${n}! 🟩 ICSE Physics loves **real-world application**!\n\nNewton's Three Laws — but ICSE style: you must APPLY, not just memorise.\n\n📖 **Newton's Laws:**\n1. **Inertia** — a body stays at rest or moving unless a force acts\n2. **F = ma** — Force = Mass × Acceleration\n3. **Action-Reaction** — every action has an equal and opposite reaction\n\n🚀 **ICSE Application Q (3 marks):**\n*"A car of mass 800 kg accelerates from 0 to 20 m/s in 10 seconds.*\n*Calculate (a) the acceleration, and (b) the force applied by the engine."*\n\nBefore solving — tell me: **which Newton's Law** gives us F = ma?`,
          te: `నమస్తే ${n}! 🟩 ICSE భౌతిక శాస్త్రం **వాస్తవ-ప్రపంచ అనువర్తనం** ప్రేమిస్తుంది!\n\nన్యూటన్ మూడు నియమాలు — కానీ ICSE శైలి: కంఠస్థం చేయడం మాత్రమే కాదు, వర్తించాలి.\n\n📖 **న్యూటన్ నియమాలు:**\n1. **జడత్వం** — బలం లేకుండా వస్తువు చలన స్థితిలోనే ఉంటుంది\n2. **F = ma** — బలం = ద్రవ్యరాశి × త్వరణం\n3. **చర్య-ప్రతిచర్య** — ప్రతి చర్యకు సమాన వ్యతిరేక ప్రతిచర్య\n\n🚀 **ICSE అనువర్తన ప్రశ్న:**\n*"800 kg ద్రవ్యరాశి కారు 10 సెకన్లలో 0 నుండి 20 m/s కి వేగం పొందింది.*\n*(a) త్వరణం (b) బలం లెక్కించండి."*\n\nమొదట చెప్పు: F = ma ఏ న్యూటన్ నియమం?`,
          hi: `नमस्ते ${n}! 🟩 ICSE भौतिकी **वास्तविक दुनिया के अनुप्रयोग** को पसंद करती है!\n\nNewton के तीन नियम — ICSE शैली: सिर्फ रटना नहीं, लागू करना है!\n\n📖 **Newton के नियम:**\n1. **जड़ता** — बिना बल के वस्तु उसी अवस्था में रहती है\n2. **F = ma** — बल = द्रव्यमान × त्वरण\n3. **क्रिया-प्रतिक्रिया**\n\n🚀 **ICSE प्रश्न (3 अंक):**\n*"800 kg की कार 10 सेकंड में 0 से 20 m/s तक त्वरित होती है।\n(a) त्वरण (b) बल की गणना करो।"*\n\nपहले बताओ: F = ma किस Newton के नियम से है?`,
          ta: `வணக்கம் ${n}! 🟩 ICSE இயற்பியல் **பயன்பாட்டை** நேசிக்கிறது!\n\n✏️ **Newton இன் F = ma எந்த விதி?**`,
          kn: `ನಮಸ್ಕಾರ ${n}! 🟩 ICSE ಭೌತಶಾಸ್ತ್ರ **ಅನ್ವಯ**ವನ್ನು ಪ್ರೀತಿಸುತ್ತದೆ!\n\n✏️ **F = ma ಯಾವ Newton ನಿಯಮ?**`,
          ml: `നമസ്കാരം ${n}! 🟩 ICSE ഫിസിക്സ് **പ്രയോഗം** ഇഷ്ടപ്പെടുന്നു!\n\n✏️ **F = ma ഏത് Newton നിയമം?**`,
        }),
        check: s => /second|2nd|two|రెండు|दूसरा|இரண்டாவது|ಎರಡನೇ|രണ്ടാം/i.test(s),
        correct: (n, lang) => t(lang, {
          en: `✅ Perfect! **Newton's Second Law** — F = ma!\n\nNow let's solve the ICSE problem:\n\n**Given:** m = 800 kg, u = 0, v = 20 m/s, t = 10 s\n\n**(a) Acceleration:** a = (v-u)/t = (20-0)/10 = **2 m/s²**\n**(b) Force:** F = ma = 800 × 2 = **1600 N**\n\n📝 **ICSE Tip:** Always write GIVEN, FORMULA, SUBSTITUTION, ANSWER — 1 mark each step!\n\n✏️ **Next:** If the mass doubled to 1600 kg with same force 1600 N, what happens to acceleration?`,
          te: `✅ సరైనది! **న్యూటన్ రెండవ నియమం** — F = ma!\n\nISCE సమస్య పరిష్కారం:\n**(a) త్వరణం:** a = (20-0)/10 = **2 m/s²**\n**(b) బలం:** F = 800 × 2 = **1600 N**\n\n📝 ICSE చిట్కా: ఎల్లప్పుడూ GIVEN, FORMULA, SUBSTITUTION, ANSWER రాయి!\n\n✏️ **తర్వాత:** ద్రవ్యరాశి 1600 kg కు రెట్టింపైతే, అదే 1600 N బలంతో త్వరణం ఏమవుతుంది?`,
          hi: `✅ सही! **Newton का दूसरा नियम** — F = ma!\n\n**(a) त्वरण:** a = (20-0)/10 = **2 m/s²**\n**(b) बल:** F = 800 × 2 = **1600 N**\n\n📝 ICSE टिप: GIVEN, FORMULA, SUBSTITUTION, ANSWER लिखो!\n\n✏️ **अगला:** द्रव्यमान 1600 kg हो और बल 1600 N रहे तो त्वरण?`,
          ta: `✅ சரி! Newton இரண்டாம் விதி!\na = 2 m/s², F = 1600 N\n\n✏️ திணிவு இரட்டிப்பானால் முடுக்கம் என்னவாகும்?`,
          kn: `✅ ಸರಿ! Newton 2ನೇ ನಿಯಮ!\na = 2 m/s², F = 1600 N\n\n✏️ ದ್ರವ್ಯರಾಶಿ ದ್ವಿಗುಣವಾದರೆ ವೇಗವರ್ಧನ ಏನಾಗುತ್ತದೆ?`,
          ml: `✅ ശരി! Newton 2nd law!\na = 2 m/s², F = 1600 N\n\n✏️ ദ്രവ്യമാനം ഇരട്ടിയാകുമ്പോൾ ത്വരണം?`,
        }),
        wrong: (n, lang) => t(lang, { en:`F = ma comes from **Newton's Second Law** — Force equals Mass times Acceleration.\n\n1st Law = Inertia (object stays still or moving)\n**2nd Law = F = ma** ← this one!\n3rd Law = Action-Reaction\n\nNow solve: a = (20-0)/10 = **2 m/s²**, then F = 800 × 2 = ?`, te:`F = ma **న్యూటన్ రెండవ నియమం** నుండి వచ్చింది.\n\na = (20-0)/10 = **2 m/s²**, తర్వాత F = 800 × 2 = ?`, hi:`F = ma **Newton का दूसरा नियम** है.\n\na = (20-0)/10 = **2 m/s²**, फिर F = 800 × 2 = ?`, ta:`F = ma Newton 2வது விதி!\na = 2 m/s², F = ?`, kn:`F = ma Newton 2ನೇ ನಿಯಮ!\na = 2 m/s², F = ?`, ml:`F = ma Newton 2nd law!\na = 2 m/s², F = ?` }),
        nextCheck: s => /half|halved|1 m|1m|reduces|decreases|less|సగం|आधा|பாதி|ಅರ್ಧ|പകുതി/i.test(s),
        nextCorrect: (n, lang) => t(lang, { en:`🌟 Brilliant! If mass doubles and force stays same: a = F/m = 1600/1600 = **1 m/s²** — acceleration HALVES!\n\nThis is Newton's 2nd Law in action — **mass and acceleration are inversely proportional when force is constant!** Perfect ICSE answer! ✅`, te:`🌟 అద్భుతం! F స్థిరంగా ఉంటే, ద్రవ్యరాశి రెట్టింపైతే: a = 1600/1600 = **1 m/s²** — త్వరణం సగానికి తగ్గుతుంది! పర్ఫెక్ట్ ICSE సమాధానం!`, hi:`🌟 शानदार! F स्थिर रहे, m दोगुना हो: a = 1600/1600 = **1 m/s²** — त्वरण आधा! ICSE का उत्तम उत्तर!`, ta:`🌟 அருமை! a = 1 m/s² — ICSE சிறந்த பதில்!`, kn:`🌟 ಅದ್ಭುತ! a = 1 m/s² — ICSE ಉತ್ತಮ ಉತ್ತರ!`, ml:`🌟 അടിപൊളി! a = 1 m/s² — ICSE മികച്ച ഉത്തരം!` }),
        nextWrong: (n, lang) => t(lang, { en:`If mass DOUBLES and force stays same: a = F/m = 1600/1600 = **1 m/s²** (halved). Mass and acceleration are inversely proportional! ICSE loves this concept. 🟩`, te:`ద్రవ్యరాశి రెట్టింపైతే: a = 1600/1600 = **1 m/s²**. ద్రవ్యరాశి మరియు త్వరణం విలోమ నిష్పత్తిలో ఉంటాయి! 🟩`, hi:`द्रव्यमान दोगुना: a = 1600/1600 = **1 m/s²**। व्युत्क्रम अनुपात! 🟩`, ta:`m ×2 → a ÷2 = 1 m/s² 🟩`, kn:`m ×2 → a ÷2 = 1 m/s² 🟩`, ml:`m ×2 → a ÷2 = 1 m/s² 🟩` }),
      },
    ],
  },

  // ── IGCSE ──────────────────────────────────────────────────
  IGCSE: {
    Mathematics: [
      {
        topic: { en:'Functions & Graphs (0580 Extended)', te:'ఫంక్షన్లు & గ్రాఫ్‌లు', hi:'फलन और ग्राफ', ta:'சார்புகள் & வரைபடங்கள்', kn:'ಕಾರ್ಯಗಳು & ಗ್ರಾಫ್‌ಗಳು', ml:'ഫങ്ഷൻ & ഗ്രാഫ്' },
        teach: (n, lang) => t(lang, {
          en: `Hi ${n}! 🟧 Cambridge Extended Maths (0580) — remember: **SHOW WORKING = EARN MARKS!**\n\nEven if your final answer is wrong, you get marks for correct working. Never skip steps!\n\n📝 **Cambridge-Style Question (4 marks):**\n\n*"Given f(x) = 2x² - 3x + 1, find:*\n*(a) f(-2)*\n*(b) the values of x when f(x) = 0"*\n\n**Before you calculate:** Tell me your METHOD for part (a).\nWhat is your FIRST step when finding f(-2)?`,
          te: `నమస్తే ${n}! 🟧 Cambridge Extended Maths (0580) — గుర్తుంచుకో: **పని చూపించడం = మార్కులు సంపాదించడం!**\n\nచివరి సమాధానం తప్పైనా, సరైన పని చేస్తే మార్కులు వస్తాయి. దశలు ఎప్పుడూ వదలవద్దు!\n\n📝 **Cambridge నమూనా ప్రశ్న (4 మార్కులు):**\n\n*"f(x) = 2x² - 3x + 1 అయితే:*\n*(a) f(-2) కనుగొనండి*\n*(b) f(x) = 0 అయినప్పుడు x విలువలు"*\n\nలెక్క వేయడానికి ముందు: (a) కోసం నీ **పద్ధతి** చెప్పు. f(-2) కనుగొనేందుకు మొదటి దశ ఏమిటి?`,
          hi: `नमस्ते ${n}! 🟧 Cambridge Extended Maths (0580) — याद रखो: **काम दिखाना = अंक कमाना!**\n\n📝 **Cambridge प्रश्न (4 अंक):**\n\n*"f(x) = 2x² - 3x + 1 दिया है:*\n*(a) f(-2) ज्ञात करो*\n*(b) x के मान जब f(x) = 0"*\n\nपहले बताओ: f(-2) के लिए पहला कदम क्या है?`,
          ta: `வணக்கம் ${n}! 🟧 Cambridge Extended (0580) — **வேலை காட்டுவது = மதிப்பெண் பெறுவது!**\n\n✏️ f(x) = 2x² - 3x + 1 \n(a) f(-2) காண்க — முதல் படி என்ன?`,
          kn: `ನಮಸ್ಕಾರ ${n}! 🟧 Cambridge Extended (0580) — **ಕೆಲಸ ತೋರಿಸು = ಅಂಕ ಗಳಿಸು!**\n\n✏️ f(x) = 2x² - 3x + 1\n(a) f(-2) ಕಂಡುಹಿಡಿ — ಮೊದಲ ಹಂತ?`,
          ml: `നമസ്കാരം ${n}! 🟧 Cambridge Extended (0580) — **പ്രവൃത്തി കാണിക്കൂ = മാർക്ക് നേടൂ!**\n\n✏️ f(x) = 2x² - 3x + 1\n(a) f(-2) കണ്ടെത്തൂ — ആദ്യ ഘട്ടം?`,
        }),
        check: s => /substitute|replace|put|plug|x.*-2|-2.*x|sub/i.test(s),
        correct: (n, lang) => t(lang, {
          en: `✅ Exactly right, ${n}! **Substitute x = -2** into f(x).\n\n📝 **Cambridge Working (show every line):**\nf(-2) = 2(-2)² - 3(-2) + 1\n     = 2(4) - (-6) + 1\n     = 8 + 6 + 1\n     = **15**\n\n⚠️ Common mistake: (-2)² = **+4** not -4! Squaring makes it positive!\n\nFor part (b), f(x) = 0 means: **2x² - 3x + 1 = 0**\n\n✏️ **Next:** Use the quadratic formula or factorisation. Which method do you prefer?`,
          te: `✅ సరైనది, ${n}! **x = -2 ప్రత్యామ్నాయం** చేయి.\n\n📝 **Cambridge పని:**\nf(-2) = 2(-2)² - 3(-2) + 1\n     = 2(4) + 6 + 1 = **15**\n\n⚠️ సాధారణ తప్పు: (-2)² = **+4** కానీ -4 కాదు!\n\n(b) కోసం: 2x² - 3x + 1 = 0\n\n✏️ **తర్వాత:** ఫ్యాక్టరైజేషన్ లేదా చతుర్భుజ సూత్రం — ఏది ఇష్టం?`,
          hi: `✅ सही, ${n}! **x = -2 रखो।**\n\n📝 f(-2) = 2(4) + 6 + 1 = **15**\n\n⚠️ (-2)² = **+4** याद रखो!\n\n(b): 2x² - 3x + 1 = 0\n\n✏️ **अगला:** गुणनखंड या द्विघात सूत्र?`,
          ta: `✅ சரி! f(-2) = 2(4) + 6 + 1 = **15**\n\n✏️ (b): 2x² - 3x + 1 = 0 — காரணிப்பிரிவு செய்யுங்கள்`,
          kn: `✅ ಸರಿ! f(-2) = **15**\n\n✏️ (b): 2x² - 3x + 1 = 0 — ಅಪವರ್ತಿಸಿ`,
          ml: `✅ ശരി! f(-2) = **15**\n\n✏️ (b): 2x² - 3x + 1 = 0 — ഘടകങ്ങളാക്കൂ`,
        }),
        wrong: (n, lang) => t(lang, {
          en: `The first step is to **substitute x = -2** — replace every x with (-2):\n\nf(-2) = 2**(-2)**² - 3**(-2)** + 1\n\n⚠️ Cambridge Trap: (-2)² = **+4** (negative × negative = positive!)\n\nSo: 2(4) - 3(-2) + 1 = 8 + 6 + 1 = **15**\n\nAlways show each line of working — Cambridge gives 1 mark per correct step! 📝`,
          te: `మొదటి దశ **x = -2 ప్రత్యామ్నాయం**: f(-2) = 2(-2)² - 3(-2) + 1 = 2(4) + 6 + 1 = **15**\n\nCambridge ప్రతి సరైన దశకు 1 మార్క్ ఇస్తుంది! 📝`,
          hi: `पहला कदम **x = -2 रखो**: f(-2) = 2(4) + 6 + 1 = **15**\n\nCambridge हर सही कदम के लिए 1 अंक देता है! 📝`,
          ta: `x = -2 வைக்கவும்: f(-2) = 2(4) + 6 + 1 = **15** 📝`,
          kn: `x = -2 ಹಾಕಿ: f(-2) = 2(4) + 6 + 1 = **15** 📝`,
          ml: `x = -2 വെക്കൂ: f(-2) = 2(4) + 6 + 1 = **15** 📝`,
        }),
        nextCheck: s => /factoris|factor|quadratic|formula|2x|1\/2|x=1/i.test(s),
        nextCorrect: (n, lang) => t(lang, {
          en: `🌟 Excellent method, ${n}!\n\n**Factorising 2x² - 3x + 1 = 0:**\n(2x - 1)(x - 1) = 0\nx = **1/2** or x = **1**\n\n📝 **Cambridge Marking:** Show the factorisation = 1 mark, each root = 1 mark each. Total 3 marks from just this!\n\nYou're thinking exactly like Cambridge wants! 🎯`,
          te: `🌟 అద్భుతమైన పద్ధతి, ${n}!\n\n**ఫ్యాక్టరైజేషన్:** (2x-1)(x-1) = 0\nx = **1/2** లేదా x = **1**\n\n📝 Cambridge మార్కింగ్: ఫ్యాక్టరైజేషన్ = 1 మార్క్, ప్రతి మూలం = 1 మార్క్!`,
          hi: `🌟 शानदार तरीका, ${n}!\n\n(2x-1)(x-1) = 0\nx = **1/2** या x = **1**\n\n📝 Cambridge: गुणनखंड = 1 अंक, हर मूल = 1 अंक!`,
          ta: `🌟 அருமை! (2x-1)(x-1) = 0, x = **1/2** அல்லது x = **1** 🎯`,
          kn: `🌟 ಅದ್ಭುತ! x = **1/2** ಅಥವಾ x = **1** 🎯`,
          ml: `🌟 അടിപൊളി! x = **1/2** അല്ലെങ്കിൽ x = **1** 🎯`,
        }),
        nextWrong: (n, lang) => t(lang, { en:`**Factorising 2x² - 3x + 1:** Find two numbers that multiply to 2×1=2 and add to -3. That's -2 and -1.\n2x² - 2x - x + 1 = 2x(x-1) - 1(x-1) = **(2x-1)(x-1) = 0**\nx = **1/2 or x = 1** ✓\n\nAlways show factorisation steps! 📝`, te:`**ఫ్యాక్టరైజేషన్:** (2x-1)(x-1) = 0, x = **1/2 లేదా 1** ✓ దశలు చూపించు! 📝`, hi:`**गुणनखंड:** (2x-1)(x-1) = 0, x = **1/2 या 1** ✓ काम दिखाओ! 📝`, ta:`(2x-1)(x-1) = 0, x = **1/2 or 1** 📝`, kn:`(2x-1)(x-1) = 0, x = **1/2 or 1** 📝`, ml:`(2x-1)(x-1) = 0, x = **1/2 or 1** 📝` }),
      },
    ],
    Economics: [
      {
        topic: { en:'Supply & Demand (0455)', te:'సరఫరా & డిమాండ్', hi:'आपूर्ति और माँग', ta:'விநியோகம் & தேவை', kn:'ಪೂರೈಕೆ & ಬೇಡಿಕೆ', ml:'വിതരണം & ഡിമാൻഡ്' },
        teach: (n, lang) => t(lang, {
          en: `Hello ${n}! 🟧 IGCSE Economics (0455) — Cambridge loves **diagram + explanation** questions!\n\n📊 **Law of Demand:**\nWhen price ↑, quantity demanded ↓ (inverse relationship)\n\n📊 **Law of Supply:**\nWhen price ↑, quantity supplied ↑ (direct relationship)\n\n🎯 **Cambridge 4-mark Q:**\n*"The price of coffee rises. Using a supply and demand diagram, explain what happens to the equilibrium price and quantity of tea (a substitute)."*\n\n**Cambridge needs:** Draw diagram + label axes + show shifts + explain in words.\n\n✏️ First: Is tea a **substitute** or **complement** for coffee? And what happens to tea demand when coffee gets expensive?`,
          te: `నమస్తే ${n}! 🟧 IGCSE ఎకనామిక్స్ (0455) — Cambridge **రేఖాచిత్రం + వివరణ** ప్రేమిస్తుంది!\n\n📊 **డిమాండ్ నియమం:** ధర ↑ → డిమాండ్ ↓\n📊 **సరఫరా నియమం:** ధర ↑ → సరఫరా ↑\n\n🎯 **Cambridge 4 మార్కుల ప్రశ్న:**\n*"కాఫీ ధర పెరుగుతుంది. S&D రేఖాచిత్రం ఉపయోగించి టీ ఏమవుతుందో వివరించండి (ప్రత్యామ్నాయం)."*\n\n✏️ మొదట: కాఫీ ఖరీదు పెరిగినప్పుడు టీ డిమాండ్ ఏమవుతుంది?`,
          hi: `नमस्ते ${n}! 🟧 IGCSE Economics (0455) — Cambridge **diagram + explanation** प्यार करता है!\n\n📊 **माँग नियम:** कीमत ↑ → माँग ↓\n📊 **आपूर्ति नियम:** कीमत ↑ → आपूर्ति ↑\n\n🎯 **Cambridge 4-अंक प्रश्न:**\n*"कॉफी की कीमत बढ़ती है। S&D diagram से चाय (substitute) का क्या होता है?"*\n\n✏️ पहले: कॉफी महंगी होने पर चाय की माँग क्या होगी?`,
          ta: `வணக்கம் ${n}! 🟧 IGCSE Economics (0455)!\n\nகாஃபி விலை உயர்ந்தால் தேயிலை தேவை என்னவாகும்?`,
          kn: `ನಮಸ್ಕಾರ ${n}! 🟧 IGCSE Economics (0455)!\n\nಕಾಫಿ ದರ ಹೆಚ್ಚಿದರೆ ಚಹಾ ಬೇಡಿಕೆ ಏನಾಗುತ್ತದೆ?`,
          ml: `നമസ്കാരം ${n}! 🟧 IGCSE Economics (0455)!\n\nകോഫി വില ഉയർന്നാൽ ടീ ഡിമാൻഡ്?`,
        }),
        check: s => /increase|rise|up|more|higher|పెరుగుతుంది|बढ़ेगी|அதிகரிக்கும்|ಹೆಚ್ಚಾಗುತ್ತದೆ|കൂടും/i.test(s),
        correct: (n, lang) => t(lang, {
          en: `✅ Exactly! Tea demand **INCREASES** — people switch from expensive coffee to cheaper tea (substitution effect)!\n\n📊 **Cambridge 4-Mark Answer Structure:**\n1. Define substitute ✓\n2. Draw D&S diagram for tea ✓\n3. Show demand curve shifts RIGHT (D₁ → D₂) ✓\n4. New equilibrium: higher price AND higher quantity ✓\n\n📝 **IGCSE Exam Tip:** Cambridge expects you to say: *"As the price of coffee rises, consumers switch to tea, increasing demand for tea, shifting the demand curve rightward, raising equilibrium price and quantity."*\n\n✏️ **Next:** What if tea and coffee were COMPLEMENTS instead? What happens?`,
          te: `✅ సరిగ్గా! టీ డిమాండ్ **పెరుగుతుంది** — ప్రజలు ఖరీదైన కాఫీ నుండి టీకి మారతారు!\n\n📊 **Cambridge 4 మార్కుల సమాధానం:**\n1. ప్రత్యామ్నాయం నిర్వచించు\n2. టీ D&S రేఖాచిత్రం గీయి\n3. డిమాండ్ కర్వ్ కుడివైపు (D₁ → D₂)\n4. కొత్త సమతుల్యత: అధిక ధర మరియు అధిక పరిమాణం\n\n✏️ **తర్వాత:** కాఫీ మరియు టీ **పూర్తక** అయితే ఏమవుతుంది?`,
          hi: `✅ बिल्कुल! चाय की माँग **बढ़ेगी** — लोग महंगी कॉफी छोड़कर चाय पीएंगे!\n\n📊 Cambridge 4-अंक उत्तर:\n1. Substitute परिभाषित करो\n2. चाय का D&S diagram\n3. माँग वक्र दाईं तरफ (D₁ → D₂)\n4. नई साम्यावस्था: अधिक कीमत और मात्रा\n\n✏️ **अगला:** Complement होते तो क्या होता?`,
          ta: `✅ சரி! தேயிலை தேவை **அதிகரிக்கும்**!\n\n✏️ Complement ஆக இருந்தால் என்னவாகும்?`,
          kn: `✅ ಸರಿ! ಚಹಾ ಬೇಡಿಕೆ **ಹೆಚ್ಚಾಗುತ್ತದೆ**!\n\n✏️ Complement ಆಗಿದ್ದರೆ?`,
          ml: `✅ ശരി! ടീ ഡിമാൻഡ് **കൂടും**!\n\n✏️ Complement ആയിരുന്നെങ്കിൽ?`,
        }),
        wrong: (n, lang) => t(lang, { en:`Tea demand **INCREASES** — tea is a substitute for coffee. When coffee is expensive, people SWITCH to tea (it's cheaper now relative to coffee).\n\nSubstitutes: when price of A rises → demand for B rises.\nComplements: when price of A rises → demand for B falls.\n\n✏️ So what happens to tea's price and quantity in the diagram?`, te:`టీ డిమాండ్ **పెరుగుతుంది** — ప్రత్యామ్నాయాలు: A ధర పెరిగితే → B డిమాండ్ పెరుగుతుంది.`, hi:`चाय की माँग **बढ़ेगी** — substitute: A महंगा → B की माँग बढ़े।`, ta:`தேயிலை தேவை **அதிகரிக்கும்** — Substitute விதி.`, kn:`ಚಹಾ ಬೇಡಿಕೆ **ಹೆಚ್ಚಾಗುತ್ತದೆ** — Substitute ನಿಯಮ.`, ml:`ടീ ഡിമാൻഡ് **കൂടും** — Substitute നിയമം.` }),
        nextCheck: s => /decrease|fall|less|lower|drops|తగ్గుతుంది|घटेगी|குறையும்|ಕಡಿಮೆಯಾಗುತ್ತದೆ|കുറയും/i.test(s),
        nextCorrect: (n, lang) => t(lang, { en:`🌟 Perfect Cambridge thinking, ${n}!\n\nComplements (e.g. coffee + milk): If coffee ↑, coffee demand ↓ → milk demand also ↓!\nDemand curve for milk shifts LEFT.\n\nYou understand both substitute and complement effects — that's the full IGCSE topic! 🎯`, te:`🌟 అద్భుతమైన Cambridge ఆలోచన, ${n}!\nపూర్తకాలు: కాఫీ ↑ → కాఫీ డిమాండ్ ↓ → పాలు డిమాండ్ ↓! పర్ఫెక్ట్ IGCSE సమాధానం!`, hi:`🌟 Cambridge सोच, ${n}!\nPerfect: Coffee ↑ → Coffee demand ↓ → Milk demand ↓! IGCSE पूर्ण!`, ta:`🌟 Cambridge சிந்தனை, ${n}! Complements: coffee ↑ → milk demand ↓. சரியான!`, kn:`🌟 Cambridge ಚಿಂತನೆ, ${n}! Complements: coffee ↑ → milk demand ↓.`, ml:`🌟 Cambridge ചിന്ത, ${n}! Complements: coffee ↑ → milk demand ↓.` }),
        nextWrong: (n, lang) => t(lang, { en:`If coffee & milk are complements: coffee ↑ → people buy less coffee → they also buy less milk (used together!) → milk demand DECREASES, curve shifts LEFT. 📊`, te:`పూర్తకాలు: కాఫీ ↑ → పాలు డిమాండ్ ↓ 📊`, hi:`Complements: coffee ↑ → milk demand ↓ 📊`, ta:`Complements: coffee ↑ → milk demand ↓ 📊`, kn:`Complements: coffee ↑ → milk demand ↓ 📊`, ml:`Complements: coffee ↑ → milk demand ↓ 📊` }),
      },
    ],
  },
};
