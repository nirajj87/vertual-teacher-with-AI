export interface CuratedQuestion {
  question: string;
  expectedAnswer?: string;
  topic?: string;
}

export const MODE_QUESTION_BANK: Record<string, CuratedQuestion[]> = {
  PRACTICE: [
    {
      question: 'What is polymorphism in Object-Oriented Programming? Give a short example.',
      expectedAnswer:
        'Polymorphism lets different types share one interface. Example: Animal.speak() implemented differently by Dog and Cat.',
      topic: 'OOPS',
    },
    {
      question: 'Explain Laravel routing and how a controller action is connected to a URL.',
      expectedAnswer:
        'Routes in routes/web.php or api.php map HTTP methods/URLs to controller methods, e.g. Route::get("/users", [UserController::class, "index"]).',
      topic: 'Laravel',
    },
    {
      question: 'What is the Virtual DOM in React and why is it useful?',
      expectedAnswer:
        'A lightweight JS representation of the UI. React diffs it to apply minimal real DOM updates for better performance.',
      topic: 'React',
    },
    {
      question: 'Difference between INNER JOIN and LEFT JOIN in MySQL?',
      expectedAnswer:
        'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all left-table rows plus matches from the right (NULLs if none).',
      topic: 'MySQL',
    },
    {
      question: 'What are the four pillars of OOPS?',
      expectedAnswer: 'Encapsulation, Abstraction, Inheritance, and Polymorphism.',
      topic: 'OOPS',
    },
    {
      question: 'How do you prevent SQL injection in a Laravel or MySQL app?',
      expectedAnswer:
        'Use parameterized queries / Eloquent or Query Builder bindings — never concatenate user input into raw SQL.',
      topic: 'MySQL',
    },
    {
      question: 'Explain React useState and when a component re-renders.',
      expectedAnswer:
        'useState holds local state. Calling the setter schedules a re-render with the new value.',
      topic: 'React',
    },
    {
      question: 'What is Eloquent ORM in Laravel?',
      expectedAnswer:
        'Laravel’s Active Record ORM for defining models and querying the database with fluent methods instead of raw SQL.',
      topic: 'Laravel',
    },
  ],
  GRAMMAR: [
    {
      question: 'Correct this sentence and explain: "I am working here since two years."',
      expectedAnswer:
        'I have been working here for two years. Use present perfect continuous with "for" for duration.',
      topic: 'Tenses',
    },
    {
      question: 'Change to passive voice: "They built this bridge in 1990."',
      expectedAnswer: 'This bridge was built in 1990.',
      topic: 'Voice',
    },
    {
      question: 'Change to indirect speech: She said, "I am tired."',
      expectedAnswer: 'She said (that) she was tired.',
      topic: 'Narration',
    },
    {
      question: 'Fill in the blank: "If I ___ more time, I would travel." (have/had)',
      expectedAnswer: 'had — second conditional uses past tense for unreal present situations.',
      topic: 'Conditionals',
    },
    {
      question: 'Correct: "He don\'t like coffee." Explain the rule.',
      expectedAnswer: "He doesn't like coffee. Third person singular present uses does/doesn't.",
      topic: 'Subject-Verb Agreement',
    },
    {
      question: 'Choose the correct article: "She is ___ university student." Explain why.',
      expectedAnswer: 'a — "university" starts with a consonant /juː/ sound, so use "a".',
      topic: 'Articles',
    },
    {
      question: 'Rewrite in present perfect: "I finish my homework."',
      expectedAnswer: 'I have finished my homework.',
      topic: 'Tenses',
    },
    {
      question: 'Change to active voice: "The email was sent by the manager."',
      expectedAnswer: 'The manager sent the email.',
      topic: 'Voice',
    },
    {
      question: 'Translate to English (Present Perfect): मैंने अपना होमवर्क पूरा कर लिया है।',
      expectedAnswer: 'I have finished my homework.',
      topic: 'Translation',
    },
    {
      question: 'Translate to Hindi (Past Simple): I bought a new laptop last week.',
      expectedAnswer: 'मैंने पिछले हफ्ते एक नया लैपटॉप खरीदा।',
      topic: 'Translation',
    },
    {
      question: 'Make a WH question: "She lives in Pune." (ask about place)',
      expectedAnswer: 'Where does she live?',
      topic: 'WH Family',
    },
    {
      question: 'Correct: "Where you are going?"',
      expectedAnswer: 'Where are you going?',
      topic: 'WH Family',
    },
  ],
  VOCABULARY: [
    {
      question: 'What does "meticulous" mean? Use it in a sentence.',
      expectedAnswer:
        'Meticulous means very careful and precise. Example: She is meticulous about documentation.',
      topic: 'Adjectives',
    },
    {
      question: 'Give a synonym and antonym of "scarce".',
      expectedAnswer: 'Synonym: rare/limited. Antonym: abundant/plentiful.',
      topic: 'Synonyms',
    },
    {
      question: 'Explain the word "resilient" with one workplace example.',
      expectedAnswer:
        'Resilient means recovering quickly from difficulties. Example: The team stayed resilient after a failed launch.',
      topic: 'Soft Skills Vocab',
    },
    {
      question: 'What is the difference between "affect" and "effect"?',
      expectedAnswer:
        'Affect is usually a verb (to influence). Effect is usually a noun (the result).',
      topic: 'Common Confusions',
    },
    {
      question: 'Define "procrastinate" and give an antonym.',
      expectedAnswer: 'To delay tasks unnecessarily. Antonym: prioritize / act promptly.',
      topic: 'Verbs',
    },
  ],
  ENGLISH: [
    {
      question: 'Introduce yourself for a job interview in about 60 seconds (written).',
      expectedAnswer:
        'Name, background, skills, achievements, and why you fit the role — clear and concise.',
      topic: 'Introduction',
    },
    {
      question: 'How was your day? Describe it in 4–5 sentences using past tense.',
      expectedAnswer: 'A clear past-tense narrative with correct grammar and natural vocabulary.',
      topic: 'Conversation',
    },
    {
      question: 'Narrate a short story about missing a bus and how you handled it.',
      expectedAnswer: 'Clear sequence (beginning–middle–end) with correct past narration.',
      topic: 'Narration',
    },
    {
      question: 'Describe your favorite hobby and why you enjoy it.',
      expectedAnswer: 'Structured answer with reasons and examples, natural English.',
      topic: 'Conversation',
    },
    {
      question: 'Give advice to a friend who is nervous about public speaking.',
      expectedAnswer: 'Practical tips in polite, supportive English.',
      topic: 'Advice Language',
    },
    {
      question: 'Explain the difference between active and passive voice with one example each.',
      expectedAnswer:
        'Active: Subject does the action (She wrote the report). Passive: Action receiver is subject (The report was written by her).',
      topic: 'Voice',
    },
  ],
  INTERVIEW: [
    {
      question: 'Tell me about yourself.',
      expectedAnswer:
        'Brief professional summary: background, key skills, relevant experience, and career goal.',
      topic: 'Introduction',
    },
    {
      question: 'Explain Laravel middleware with an example use case.',
      expectedAnswer:
        'Middleware filters HTTP requests (auth, logging, CORS). Example: auth middleware blocks guests from dashboard routes.',
      topic: 'Laravel',
    },
    {
      question: 'What is the difference between props and state in React?',
      expectedAnswer:
        'Props are read-only inputs from parent. State is mutable data owned by the component that triggers re-renders.',
      topic: 'React',
    },
    {
      question: 'How would you optimize a slow MySQL query?',
      expectedAnswer:
        'Check EXPLAIN, add proper indexes, avoid SELECT *, reduce joins/N+1, cache hot reads, and normalize/denormalize as needed.',
      topic: 'MySQL',
    },
    {
      question: 'Explain encapsulation vs abstraction in OOPS.',
      expectedAnswer:
        'Encapsulation hides data via access modifiers. Abstraction hides complexity by exposing only essential interfaces.',
      topic: 'OOPS',
    },
    {
      question: 'What is your greatest strength? Give an example.',
      expectedAnswer: 'One strength with a concrete STAR-style example.',
      topic: 'Behavioral',
    },
    {
      question: 'Describe a challenging problem you solved recently.',
      expectedAnswer: 'Situation, task, action, result — clear problem-solving story.',
      topic: 'Behavioral',
    },
    {
      question: 'Why do you want this role?',
      expectedAnswer: 'Align skills and goals with the role and company needs.',
      topic: 'HR',
    },
  ],
};
