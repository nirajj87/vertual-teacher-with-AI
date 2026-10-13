import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  SpellCheck,
  BookOpen,
  Mic2,
  MessageSquareQuote,
  UserRound,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGrammarTopics } from '@/hooks/useLearning';
import { useStartPractice } from '@/hooks/usePractice';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const TOPIC_ICONS: Record<string, React.ElementType> = {
  tenses: Layers,
  translation: BookOpen,
  'wh-family': MessageSquareQuote,
  voice: Mic2,
  narration: MessageSquareQuote,
  introduction: UserRound,
  articles: BookOpen,
  prepositions: BookOpen,
  conditionals: SpellCheck,
  sva: SpellCheck,
};

const FALLBACK_TOPICS = [
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
  { id: 'conditionals', name: 'Conditionals', description: 'If clauses and unreal situations' },
];

export function GrammarPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useGrammarTopics();
  const startPractice = useStartPractice();
  const [topic, setTopic] = useState('Tenses');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(5);
  const [error, setError] = useState('');

  const topics = data?.topics?.length ? data.topics : FALLBACK_TOPICS;

  const handleStart = async () => {
    setError('');
    try {
      const session = await startPractice.mutateAsync({
        difficulty,
        questionCount,
        topic: `Grammar: ${topic}`,
        source: 'ai',
        mode: 'GRAMMAR',
      });
      navigate(`/learn/practice/${session.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-sky-50 via-background to-blue-50/80 p-6 sm:p-8 dark:from-sky-950/40 dark:to-slate-950">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sky-400/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
            <Link to="/learn/english"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
              <SpellCheck className="h-3.5 w-3.5" />
              Grammar Studio
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Build clearer English</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Pick a focus — tenses, voice, narration, introductions — then get scored feedback on every answer.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Choose a focus</h2>
          <p className="text-sm text-muted-foreground">One topic per session keeps practice sharp</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {topics.map((t) => {
              const Icon = TOPIC_ICONS[t.id] || SpellCheck;
              const selected = topic === t.name;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopic(t.name)}
                  className={cn(
                    'group rounded-2xl border p-4 text-left transition-all duration-200',
                    selected
                      ? 'border-sky-500 bg-sky-500/5 shadow-sm ring-2 ring-sky-500/30'
                      : 'hover:border-sky-400/50 hover:bg-muted/40'
                  )}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                        selected ? 'bg-sky-500 text-white' : 'bg-sky-500/10 text-sky-700 dark:text-sky-300'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold">{t.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">Session settings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Questions</Label>
            <Select
              value={String(questionCount)}
              onValueChange={(v) => setQuestionCount(parseInt(v, 10))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[3, 5, 8, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{topic}</span>
          </p>
          <Button size="lg" className="sm:min-w-[200px]" onClick={handleStart} disabled={startPractice.isPending}>
            {startPractice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start Grammar Practice'}
          </Button>
        </div>
      </section>
    </div>
  );
}
