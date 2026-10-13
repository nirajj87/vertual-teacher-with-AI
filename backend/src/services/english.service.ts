import { getAIProvider } from '../ai/factory';
import { aiUsageService } from './aiUsage.service';
import { prisma } from '../config/database';
import { ValidationError } from '../utils/errors';

const VOCAB_WORDS = [
  { word: 'meticulous', meaning: 'Very careful and precise', example: 'She is meticulous about code reviews.', synonyms: ['careful', 'thorough'], antonyms: ['careless'] },
  { word: 'resilient', meaning: 'Able to recover quickly from difficulties', example: 'The team stayed resilient after setbacks.', synonyms: ['tough', 'adaptable'], antonyms: ['fragile'] },
  { word: 'concise', meaning: 'Short and clear', example: 'Keep your interview answers concise.', synonyms: ['brief', 'succinct'], antonyms: ['wordy'] },
  { word: 'ambiguous', meaning: 'Unclear or open to more than one meaning', example: 'Avoid ambiguous requirements.', synonyms: ['vague'], antonyms: ['clear'] },
  { word: 'procrastinate', meaning: 'Delay tasks unnecessarily', example: 'Do not procrastinate on studying.', synonyms: ['delay'], antonyms: ['prioritize'] },
  { word: 'collaborate', meaning: 'Work together', example: 'Engineers collaborate on features.', synonyms: ['cooperate'], antonyms: ['compete alone'] },
  { word: 'innovative', meaning: 'Introducing new ideas', example: 'They built an innovative solution.', synonyms: ['creative'], antonyms: ['conventional'] },
  { word: 'articulate', meaning: 'Express clearly', example: 'She articulated her idea well.', synonyms: ['eloquent'], antonyms: ['unclear'] },
];

export class EnglishService {
  async getOverview(userId: string) {
    const recent = await prisma.practiceSession.findMany({
      where: {
        userId,
        mode: { in: ['ENGLISH', 'GRAMMAR', 'VOCABULARY'] },
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    return {
      englishLevel: user?.profile?.englishLevel || 'A2',
      recentSessions: recent,
      modes: [
        { id: 'ENGLISH', title: 'Conversation', description: 'Natural speaking & writing practice', href: '/learn/english/conversation' },
        { id: 'GRAMMAR', title: 'Grammar', description: 'Tenses, articles, structure', href: '/learn/grammar' },
        { id: 'VOCABULARY', title: 'Vocabulary', description: 'Words, meanings, usage', href: '/learn/vocabulary' },
      ],
    };
  }

  async correctSentence(userId: string, text: string) {
    if (!text.trim()) throw new ValidationError('Text is required');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, settings: true },
    });
    const settings = user?.settings?.ai as { provider?: string } | null;
    const provider = getAIProvider(
      settings?.provider || user?.profile?.preferredAiProvider?.toLowerCase()
    );

    const start = Date.now();
    const result = await provider.correctEnglish({
      text,
      level: user?.profile?.englishLevel || 'B1',
    });
    await aiUsageService.logUsage({
      userId,
      provider: provider.name,
      model: provider.model,
      requestType: 'correct_english',
      responseTimeMs: Date.now() - start,
    });

    return result;
  }

  async getVocabulary(_userId: string, count = 5) {
    const shuffled = [...VOCAB_WORDS].sort(() => Math.random() - 0.5);
    return { words: shuffled.slice(0, count) };
  }

  async getGrammarTopics() {
    return {
      topics: [
        { id: 'tenses', name: 'Tenses', description: 'Present, past, perfect & continuous forms' },
        {
          id: 'translation',
          name: 'Translation',
          description: 'Hindi↔English — all 12 tenses (50–50 practice)',
        },
        {
          id: 'wh-family',
          name: 'WH Family',
          description: 'What, Where, When, Why, Who, Which, Whose, Whom, How',
        },
        { id: 'voice', name: 'Voice', description: 'Active and passive voice conversion' },
        { id: 'narration', name: 'Narration', description: 'Direct and indirect speech' },
        { id: 'introduction', name: 'Introduction', description: 'Self-intro & speaking openers' },
        { id: 'articles', name: 'Articles', description: 'a, an, the — usage rules' },
        { id: 'prepositions', name: 'Prepositions', description: 'in, on, at, for, since' },
        { id: 'conditionals', name: 'Conditionals', description: 'If clauses and unreal situations' },
        { id: 'sva', name: 'Subject-Verb Agreement', description: 'Matching subjects and verbs' },
      ],
    };
  }
}

export const englishService = new EnglishService();
