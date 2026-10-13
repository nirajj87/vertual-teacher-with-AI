type Diff = 'BEGINNER' | 'MEDIUM' | 'ADVANCED';

type SeedQuestion = {
  text: string;
  answer: string;
  topic: string;
  difficulty?: Diff;
};

type SeedBank = {
  name: string;
  description: string;
  topic: string;
  questions: SeedQuestion[];
};

const q = (
  text: string,
  answer: string,
  topic: string,
  difficulty: Diff = 'MEDIUM'
): SeedQuestion => ({ text, answer, topic, difficulty });

/** Hindi → English (50) — all 12 tenses, ~4 each */
const HI_TO_EN: SeedQuestion[] = [
  // Present Simple
  q('Translate to English (Present Simple): मैं रोज़ सुबह चाय पीता हूँ।', 'I drink tea every morning.', 'Translation · Present Simple', 'BEGINNER'),
  q('Translate to English (Present Simple): वह स्कूल जाती है।', 'She goes to school.', 'Translation · Present Simple', 'BEGINNER'),
  q('Translate to English (Present Simple): हम हिंदी बोलते हैं।', 'We speak Hindi.', 'Translation · Present Simple', 'BEGINNER'),
  q('Translate to English (Present Simple): क्या तुम अंग्रेज़ी समझते हो?', 'Do you understand English?', 'Translation · Present Simple', 'BEGINNER'),
  // Present Continuous
  q('Translate to English (Present Continuous): मैं अभी पढ़ रहा हूँ।', 'I am studying right now.', 'Translation · Present Continuous', 'BEGINNER'),
  q('Translate to English (Present Continuous): वे क्रिकेट खेल रहे हैं।', 'They are playing cricket.', 'Translation · Present Continuous', 'BEGINNER'),
  q('Translate to English (Present Continuous): वह खाना बना रही है।', 'She is cooking food.', 'Translation · Present Continuous', 'BEGINNER'),
  q('Translate to English (Present Continuous): क्या तुम मेरी बात सुन रहे हो?', 'Are you listening to me?', 'Translation · Present Continuous', 'BEGINNER'),
  // Present Perfect
  q('Translate to English (Present Perfect): मैंने अपना होमवर्क पूरा कर लिया है।', 'I have finished my homework.', 'Translation · Present Perfect', 'MEDIUM'),
  q('Translate to English (Present Perfect): उसने कभी विदेश नहीं देखा।', 'She has never seen a foreign country. / She has never been abroad.', 'Translation · Present Perfect', 'MEDIUM'),
  q('Translate to English (Present Perfect): क्या तुमने यह फिल्म देखी है?', 'Have you seen this movie?', 'Translation · Present Perfect', 'MEDIUM'),
  q('Translate to English (Present Perfect): हम अभी-अभी पहुँचे हैं।', 'We have just arrived.', 'Translation · Present Perfect', 'MEDIUM'),
  // Present Perfect Continuous
  q('Translate to English (Present Perfect Continuous): मैं दो घंटे से काम कर रहा हूँ।', 'I have been working for two hours.', 'Translation · Present Perfect Continuous', 'MEDIUM'),
  q('Translate to English (Present Perfect Continuous): वह सुबह से बारिश हो रही है।', 'It has been raining since morning.', 'Translation · Present Perfect Continuous', 'MEDIUM'),
  q('Translate to English (Present Perfect Continuous): वे लंबे समय से इंतज़ार कर रहे हैं।', 'They have been waiting for a long time.', 'Translation · Present Perfect Continuous', 'MEDIUM'),
  q('Translate to English (Present Perfect Continuous): तुम कब से यहाँ रह रहे हो?', 'How long have you been living here?', 'Translation · Present Perfect Continuous', 'MEDIUM'),
  // Past Simple
  q('Translate to English (Past Simple): कल मैं बाज़ार गया।', 'I went to the market yesterday.', 'Translation · Past Simple', 'BEGINNER'),
  q('Translate to English (Past Simple): उसने मुझे एक पत्र लिखा।', 'She wrote me a letter. / She wrote a letter to me.', 'Translation · Past Simple', 'BEGINNER'),
  q('Translate to English (Past Simple): हमने मैच जीत लिया।', 'We won the match.', 'Translation · Past Simple', 'BEGINNER'),
  q('Translate to English (Past Simple): क्या तुम स्कूल गए थे?', 'Did you go to school?', 'Translation · Past Simple', 'BEGINNER'),
  // Past Continuous
  q('Translate to English (Past Continuous): जब तुम आए, मैं पढ़ रहा था।', 'I was studying when you came.', 'Translation · Past Continuous', 'MEDIUM'),
  q('Translate to English (Past Continuous): वे टीवी देख रहे थे।', 'They were watching TV.', 'Translation · Past Continuous', 'BEGINNER'),
  q('Translate to English (Past Continuous): बारिश हो रही थी।', 'It was raining.', 'Translation · Past Continuous', 'BEGINNER'),
  q('Translate to English (Past Continuous): वह क्या कर रही थी?', 'What was she doing?', 'Translation · Past Continuous', 'BEGINNER'),
  // Past Perfect
  q('Translate to English (Past Perfect): जब मैं पहुँचा, ट्रेन जा चुकी थी।', 'When I arrived, the train had already left.', 'Translation · Past Perfect', 'MEDIUM'),
  q('Translate to English (Past Perfect): उसने खाना खाने से पहले हाथ धोए थे।', 'She had washed her hands before eating.', 'Translation · Past Perfect', 'MEDIUM'),
  q('Translate to English (Past Perfect): हमने पहले कभी ऐसा नहीं देखा था।', 'We had never seen anything like that before.', 'Translation · Past Perfect', 'MEDIUM'),
  q('Translate to English (Past Perfect): क्या तुमने फिल्म शुरू होने से पहले टिकट ले लिया था?', 'Had you bought the ticket before the movie started?', 'Translation · Past Perfect', 'ADVANCED'),
  // Past Perfect Continuous
  q('Translate to English (Past Perfect Continuous): बारिश शुरू होने से पहले तीन घंटे से धूप चमक रही थी।', 'The sun had been shining for three hours before it started raining.', 'Translation · Past Perfect Continuous', 'ADVANCED'),
  q('Translate to English (Past Perfect Continuous): वह नौकरी छोड़ने से पहले पाँच साल से वहाँ काम कर रहा था।', 'He had been working there for five years before he left the job.', 'Translation · Past Perfect Continuous', 'ADVANCED'),
  q('Translate to English (Past Perfect Continuous): हम थक गए थे क्योंकि हम सुबह से चल रहे थे।', 'We were tired because we had been walking since morning.', 'Translation · Past Perfect Continuous', 'ADVANCED'),
  q('Translate to English (Past Perfect Continuous): तुम कब से इंतज़ार कर रहे थे जब मैं आया?', 'How long had you been waiting when I arrived?', 'Translation · Past Perfect Continuous', 'ADVANCED'),
  // Future Simple
  q('Translate to English (Future Simple): मैं कल तुम्हें फोन करूँगा।', 'I will call you tomorrow.', 'Translation · Future Simple', 'BEGINNER'),
  q('Translate to English (Future Simple): वह जल्द ही वापस आएगी।', 'She will come back soon.', 'Translation · Future Simple', 'BEGINNER'),
  q('Translate to English (Future Simple): क्या तुम मेरी मदद करोगे?', 'Will you help me?', 'Translation · Future Simple', 'BEGINNER'),
  q('Translate to English (Future Simple): हम अगले महीने दिल्ली जाएँगे।', 'We will go to Delhi next month.', 'Translation · Future Simple', 'BEGINNER'),
  // Future Continuous
  q('Translate to English (Future Continuous): कल इस समय मैं यात्रा कर रहा हूँगा।', 'I will be travelling at this time tomorrow.', 'Translation · Future Continuous', 'MEDIUM'),
  q('Translate to English (Future Continuous): वे शाम को मैच देख रहे होंगे।', 'They will be watching the match in the evening.', 'Translation · Future Continuous', 'MEDIUM'),
  q('Translate to English (Future Continuous): क्या तुम रात 8 बजे काम कर रहे होगे?', 'Will you be working at 8 p.m.?', 'Translation · Future Continuous', 'MEDIUM'),
  q('Translate to English (Future Continuous): वह कक्षा में पढ़ा रही होगी।', 'She will be teaching in the class.', 'Translation · Future Continuous', 'MEDIUM'),
  // Future Perfect
  q('Translate to English (Future Perfect): अगले साल तक मैंने अपनी डिग्री पूरी कर ली होगी।', 'By next year I will have completed my degree.', 'Translation · Future Perfect', 'ADVANCED'),
  q('Translate to English (Future Perfect): तुम्हारे आने तक मैं खाना बना चुका हूँगा।', 'I will have cooked the food by the time you arrive.', 'Translation · Future Perfect', 'ADVANCED'),
  q('Translate to English (Future Perfect): 2030 तक वे नया घर बना चुके होंगे।', 'By 2030 they will have built a new house.', 'Translation · Future Perfect', 'ADVANCED'),
  q('Translate to English (Future Perfect): क्या तुम शाम तक रिपोर्ट भेज चुके होगे?', 'Will you have sent the report by evening?', 'Translation · Future Perfect', 'ADVANCED'),
  // Future Perfect Continuous
  q('Translate to English (Future Perfect Continuous): अगले महीने तक मैं यहाँ दस साल से काम कर रहा हूँगा।', 'By next month I will have been working here for ten years.', 'Translation · Future Perfect Continuous', 'ADVANCED'),
  q('Translate to English (Future Perfect Continuous): रात तक बारिश बारह घंटे से हो रही होगी।', 'By night it will have been raining for twelve hours.', 'Translation · Future Perfect Continuous', 'ADVANCED'),
  q('Translate to English (Future Perfect Continuous): जब तुम आओगे, वह दो घंटे से अभ्यास कर रही होगी।', 'When you arrive, she will have been practising for two hours.', 'Translation · Future Perfect Continuous', 'ADVANCED'),
  q('Translate to English (Future Perfect Continuous): 2028 तक हम इस शहर में पंद्रह साल से रह रहे होंगे।', 'By 2028 we will have been living in this city for fifteen years.', 'Translation · Future Perfect Continuous', 'ADVANCED'),
  // Extra mixed for round 50
  q('Translate to English (Present Simple): सूरज पूरब में उगता है।', 'The sun rises in the east.', 'Translation · Present Simple', 'BEGINNER'),
  q('Translate to English (Past Simple): कल बहुत ठंड थी।', 'It was very cold yesterday.', 'Translation · Past Simple', 'BEGINNER'),
];

/** English → Hindi (50) — all 12 tenses, ~4 each */
const EN_TO_HI: SeedQuestion[] = [
  // Present Simple
  q('Translate to Hindi (Present Simple): I wake up early every day.', 'मैं रोज़ जल्दी उठता/उठती हूँ।', 'Translation · Present Simple', 'BEGINNER'),
  q('Translate to Hindi (Present Simple): She teaches English.', 'वह अंग्रेज़ी पढ़ाती है।', 'Translation · Present Simple', 'BEGINNER'),
  q('Translate to Hindi (Present Simple): They live in Mumbai.', 'वे मुंबई में रहते हैं।', 'Translation · Present Simple', 'BEGINNER'),
  q('Translate to Hindi (Present Simple): Do you like music?', 'क्या तुम्हें संगीत पसंद है?', 'Translation · Present Simple', 'BEGINNER'),
  // Present Continuous
  q('Translate to Hindi (Present Continuous): I am writing an email.', 'मैं एक ईमेल लिख रहा/रही हूँ।', 'Translation · Present Continuous', 'BEGINNER'),
  q('Translate to Hindi (Present Continuous): He is driving to work.', 'वह काम पर गाड़ी चला रहा है।', 'Translation · Present Continuous', 'BEGINNER'),
  q('Translate to Hindi (Present Continuous): The children are sleeping.', 'बच्चे सो रहे हैं।', 'Translation · Present Continuous', 'BEGINNER'),
  q('Translate to Hindi (Present Continuous): Are you coming with us?', 'क्या तुम हमारे साथ आ रहे हो?', 'Translation · Present Continuous', 'BEGINNER'),
  // Present Perfect
  q('Translate to Hindi (Present Perfect): I have lost my keys.', 'मैंने अपनी चाबियाँ खो दी हैं।', 'Translation · Present Perfect', 'MEDIUM'),
  q('Translate to Hindi (Present Perfect): She has already eaten lunch.', 'उसने पहले ही दोपहर का खाना खा लिया है।', 'Translation · Present Perfect', 'MEDIUM'),
  q('Translate to Hindi (Present Perfect): Have they finished the project?', 'क्या उन्होंने प्रोजेक्ट पूरा कर लिया है?', 'Translation · Present Perfect', 'MEDIUM'),
  q('Translate to Hindi (Present Perfect): We have known each other for years.', 'हम एक-दूसरे को सालों से जानते हैं।', 'Translation · Present Perfect', 'MEDIUM'),
  // Present Perfect Continuous
  q('Translate to Hindi (Present Perfect Continuous): I have been learning React for months.', 'मैं महीनों से React सीख रहा/रही हूँ।', 'Translation · Present Perfect Continuous', 'MEDIUM'),
  q('Translate to Hindi (Present Perfect Continuous): She has been talking on the phone since morning.', 'वह सुबह से फोन पर बात कर रही है।', 'Translation · Present Perfect Continuous', 'MEDIUM'),
  q('Translate to Hindi (Present Perfect Continuous): They have been playing since noon.', 'वे दोपहर से खेल रहे हैं।', 'Translation · Present Perfect Continuous', 'MEDIUM'),
  q('Translate to Hindi (Present Perfect Continuous): How long have you been waiting?', 'तुम कब से इंतज़ार कर रहे हो?', 'Translation · Present Perfect Continuous', 'MEDIUM'),
  // Past Simple
  q('Translate to Hindi (Past Simple): I bought a new laptop last week.', 'मैंने पिछले हफ्ते एक नया लैपटॉप खरीदा।', 'Translation · Past Simple', 'BEGINNER'),
  q('Translate to Hindi (Past Simple): He met his friend at the station.', 'उसने स्टेशन पर अपने दोस्त से मुलाकात की।', 'Translation · Past Simple', 'BEGINNER'),
  q('Translate to Hindi (Past Simple): We watched a movie yesterday.', 'हमने कल एक फिल्म देखी।', 'Translation · Past Simple', 'BEGINNER'),
  q('Translate to Hindi (Past Simple): Did she pass the exam?', 'क्या उसने परीक्षा पास की?', 'Translation · Past Simple', 'BEGINNER'),
  // Past Continuous
  q('Translate to Hindi (Past Continuous): I was cooking when the lights went out.', 'जब बत्ती चली गई, मैं खाना बना रहा/रही था/थी।', 'Translation · Past Continuous', 'MEDIUM'),
  q('Translate to Hindi (Past Continuous): They were arguing about the plan.', 'वे योजना के बारे में बहस कर रहे थे।', 'Translation · Past Continuous', 'MEDIUM'),
  q('Translate to Hindi (Past Continuous): She was reading a novel.', 'वह एक उपन्यास पढ़ रही थी।', 'Translation · Past Continuous', 'BEGINNER'),
  q('Translate to Hindi (Past Continuous): What were you doing at 9 p.m.?', 'रात 9 बजे तुम क्या कर रहे थे?', 'Translation · Past Continuous', 'BEGINNER'),
  // Past Perfect
  q('Translate to Hindi (Past Perfect): The guests had left before I reached home.', 'मेरे घर पहुँचने से पहले मेहमान जा चुके थे।', 'Translation · Past Perfect', 'MEDIUM'),
  q('Translate to Hindi (Past Perfect): He had studied hard before the test.', 'परीक्षा से पहले उसने मेहनत से पढ़ाई की थी।', 'Translation · Past Perfect', 'MEDIUM'),
  q('Translate to Hindi (Past Perfect): I had never flown before that trip.', 'उस यात्रा से पहले मैंने कभी उड़ान नहीं भरी थी।', 'Translation · Past Perfect', 'MEDIUM'),
  q('Translate to Hindi (Past Perfect): Had she finished cooking when they arrived?', 'क्या उनके पहुँचने तक उसने खाना बना लिया था?', 'Translation · Past Perfect', 'ADVANCED'),
  // Past Perfect Continuous
  q('Translate to Hindi (Past Perfect Continuous): He had been practising for hours before the show.', 'शो से पहले वह घंटों से अभ्यास कर रहा था।', 'Translation · Past Perfect Continuous', 'ADVANCED'),
  q('Translate to Hindi (Past Perfect Continuous): We had been driving all night.', 'हम पूरी रात गाड़ी चला रहे थे।', 'Translation · Past Perfect Continuous', 'ADVANCED'),
  q('Translate to Hindi (Past Perfect Continuous): She had been crying before her mother came.', 'उसकी माँ के आने से पहले वह रो रही थी।', 'Translation · Past Perfect Continuous', 'ADVANCED'),
  q('Translate to Hindi (Past Perfect Continuous): How long had they been searching?', 'वे कब से खोज रहे थे?', 'Translation · Past Perfect Continuous', 'ADVANCED'),
  // Future Simple
  q('Translate to Hindi (Future Simple): I will help you with the code.', 'मैं कोड में तुम्हारी मदद करूँगा/करूँगी।', 'Translation · Future Simple', 'BEGINNER'),
  q('Translate to Hindi (Future Simple): She will join the meeting later.', 'वह बाद में मीटिंग में शामिल होगी।', 'Translation · Future Simple', 'BEGINNER'),
  q('Translate to Hindi (Future Simple): Will they accept the offer?', 'क्या वे ऑफर स्वीकार करेंगे?', 'Translation · Future Simple', 'BEGINNER'),
  q('Translate to Hindi (Future Simple): We will start the project next week.', 'हम अगले हफ्ते प्रोजेक्ट शुरू करेंगे।', 'Translation · Future Simple', 'BEGINNER'),
  // Future Continuous
  q('Translate to Hindi (Future Continuous): This time tomorrow I will be flying to Delhi.', 'कल इस समय मैं दिल्ली जा रहा/रही हूँगा/हूँगी।', 'Translation · Future Continuous', 'MEDIUM'),
  q('Translate to Hindi (Future Continuous): She will be sleeping at midnight.', 'आधी रात को वह सो रही होगी।', 'Translation · Future Continuous', 'MEDIUM'),
  q('Translate to Hindi (Future Continuous): Will you be using the laptop tonight?', 'क्या तुम आज रात लैपटॉप इस्तेमाल कर रहे होगे?', 'Translation · Future Continuous', 'MEDIUM'),
  q('Translate to Hindi (Future Continuous): They will be celebrating their victory.', 'वे अपनी जीत का जश्न मना रहे होंगे।', 'Translation · Future Continuous', 'MEDIUM'),
  // Future Perfect
  q('Translate to Hindi (Future Perfect): By Friday I will have submitted the assignment.', 'शुक्रवार तक मैं असाइनमेंट जमा कर चुका/चुकी हूँगा/हूँगी।', 'Translation · Future Perfect', 'ADVANCED'),
  q('Translate to Hindi (Future Perfect): She will have left before we arrive.', 'हमारे पहुँचने से पहले वह जा चुकी होगी।', 'Translation · Future Perfect', 'ADVANCED'),
  q('Translate to Hindi (Future Perfect): Will they have completed the work by then?', 'क्या तब तक वे काम पूरा कर चुके होंगे?', 'Translation · Future Perfect', 'ADVANCED'),
  q('Translate to Hindi (Future Perfect): By 2027 he will have saved enough money.', '2027 तक उसने काफी पैसे बचा लिए होंगे।', 'Translation · Future Perfect', 'ADVANCED'),
  // Future Perfect Continuous
  q('Translate to Hindi (Future Perfect Continuous): By June I will have been learning English for two years.', 'जून तक मैं दो साल से अंग्रेज़ी सीख रहा/रही हूँगा/हूँगी।', 'Translation · Future Perfect Continuous', 'ADVANCED'),
  q('Translate to Hindi (Future Perfect Continuous): She will have been teaching for a decade by then.', 'तब तक वह एक दशक से पढ़ा रही होगी।', 'Translation · Future Perfect Continuous', 'ADVANCED'),
  q('Translate to Hindi (Future Perfect Continuous): By evening they will have been travelling for eight hours.', 'शाम तक वे आठ घंटे से यात्रा कर रहे होंगे।', 'Translation · Future Perfect Continuous', 'ADVANCED'),
  q('Translate to Hindi (Future Perfect Continuous): Will you have been working here for five years by March?', 'क्या मार्च तक तुम यहाँ पाँच साल से काम कर रहे होगे?', 'Translation · Future Perfect Continuous', 'ADVANCED'),
  // Extra
  q('Translate to Hindi (Present Simple): Water boils at 100 degrees.', 'पानी 100 डिग्री पर उबलता है।', 'Translation · Present Simple', 'BEGINNER'),
  q('Translate to Hindi (Future Simple): It will rain tonight.', 'आज रात बारिश होगी।', 'Translation · Future Simple', 'BEGINNER'),
];

/** WH-family practice — form, complete, translate, answer */
const WH_FAMILY: SeedQuestion[] = [
  q('Make a WH question: "She lives in Pune." (ask about place)', 'Where does she live?', 'WH Family · Where', 'BEGINNER'),
  q('Make a WH question: "He goes to school at 8 a.m." (ask about time)', 'When does he go to school?', 'WH Family · When', 'BEGINNER'),
  q('Make a WH question: "Ravi broke the glass." (ask about person)', 'Who broke the glass?', 'WH Family · Who', 'BEGINNER'),
  q('Make a WH question: "She bought a laptop." (ask about thing)', 'What did she buy?', 'WH Family · What', 'BEGINNER'),
  q('Make a WH question: "They chose the blue shirt." (ask about choice)', 'Which shirt did they choose?', 'WH Family · Which', 'BEGINNER'),
  q('Make a WH question: "He failed because he didn’t study." (ask about reason)', "Why did he fail?", 'WH Family · Why', 'BEGINNER'),
  q('Make a WH question: "She fixed the bug carefully." (ask about manner)', 'How did she fix the bug?', 'WH Family · How', 'BEGINNER'),
  q('Make a WH question: "This bag belongs to Neha." (ask about possession)', 'Whose bag is this?', 'WH Family · Whose', 'MEDIUM'),
  q('Make a WH question: "I called the manager." (object person — formal)', 'Whom did you call? / Who did you call?', 'WH Family · Whom', 'ADVANCED'),
  q('Fill: "___ is your name?"', 'What', 'WH Family · What', 'BEGINNER'),
  q('Fill: "___ do you live?"', 'Where', 'WH Family · Where', 'BEGINNER'),
  q('Fill: "___ are you late?"', 'Why', 'WH Family · Why', 'BEGINNER'),
  q('Fill: "___ book is this — yours or mine?"', 'Whose', 'WH Family · Whose', 'MEDIUM'),
  q('Fill: "___ of these two options is better?"', 'Which', 'WH Family · Which', 'MEDIUM'),
  q('Fill: "___ many hours do you sleep?"', 'How', 'WH Family · How', 'BEGINNER'),
  q('Correct: "Where you are going?"', 'Where are you going?', 'WH Family · Where', 'BEGINNER'),
  q('Correct: "What she wants?"', 'What does she want?', 'WH Family · What', 'BEGINNER'),
  q('Correct: "Why he is crying?"', 'Why is he crying?', 'WH Family · Why', 'BEGINNER'),
  q('Correct: "How you solved this?"', 'How did you solve this?', 'WH Family · How', 'MEDIUM'),
  q('Translate to English: तुम कहाँ रहते हो?', 'Where do you live?', 'WH Family · Where', 'BEGINNER'),
  q('Translate to English: तुम्हारा नाम क्या है?', 'What is your name?', 'WH Family · What', 'BEGINNER'),
  q('Translate to English: तुम स्कूल कब जाते हो?', 'When do you go to school?', 'WH Family · When', 'BEGINNER'),
  q('Translate to English: तुम उदास क्यों हो?', 'Why are you sad?', 'WH Family · Why', 'BEGINNER'),
  q('Translate to English: यह किसकी किताब है?', 'Whose book is this?', 'WH Family · Whose', 'MEDIUM'),
  q('Translate to English: तुमने यह कैसे किया?', 'How did you do this?', 'WH Family · How', 'BEGINNER'),
  q('Translate to English: इनमें से कौन सा रंग तुम्हें पसंद है?', 'Which of these colours do you like?', 'WH Family · Which', 'MEDIUM'),
  q('Translate to Hindi: Who is knocking at the door?', 'दरवाज़े पर कौन खटखटा रहा है?', 'WH Family · Who', 'BEGINNER'),
  q('Translate to Hindi: What are you looking for?', 'तुम क्या ढूँढ रहे हो?', 'WH Family · What', 'BEGINNER'),
  q('Translate to Hindi: When will the train arrive?', 'ट्रेन कब आएगी?', 'WH Family · When', 'BEGINNER'),
  q('Answer in a full sentence: Where do you work?', 'I work at/in … (complete place). Example: I work in an IT company in Noida.', 'WH Family · Where', 'BEGINNER'),
  q('Answer in a full sentence: Why do you want to learn English?', 'Because … (reason). Example: Because it helps in interviews and global communication.', 'WH Family · Why', 'BEGINNER'),
  q('Answer in a full sentence: How often do you practise coding?', 'I practise … (frequency). Example: I practise coding every day for two hours.', 'WH Family · How', 'MEDIUM'),
  q('Difference between Who and Whom?', 'Who = subject (Who called?). Whom = object (Whom did you call?). Informal English often uses who for both.', 'WH Family · Whom', 'ADVANCED'),
  q('Difference between What and Which?', 'What = open choice; Which = limited/known options.', 'WH Family · Which', 'MEDIUM'),
  q('Make WH questions for: "Amit wrote a letter to his teacher yesterday." (Who / What / Whom / When)', 'Who wrote a letter? What did Amit write? Whom did Amit write to? When did Amit write a letter?', 'WH Family · Mixed', 'ADVANCED'),
];

export const ENGLISH_PRACTICE_BANKS: SeedBank[] = [
  {
    name: 'English - Translation',
    description: 'Hindi↔English translation — 50+50 across all 12 tenses',
    topic: 'Translation',
    questions: [...HI_TO_EN, ...EN_TO_HI],
  },
  {
    name: 'English - WH Family',
    description: 'What / Where / When / Why / Who / Which / Whose / Whom / How practice',
    topic: 'WH Family',
    questions: WH_FAMILY,
  },
];
