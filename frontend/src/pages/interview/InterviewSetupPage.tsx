import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2,
  Briefcase,
  Code2,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStartInterview } from '@/hooks/useLearning';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

const TYPES = [
  { id: 'HR', label: 'HR', desc: 'Intro, motivation, culture fit', icon: Users },
  { id: 'Technical', label: 'Technical', desc: 'Laravel, React, MySQL, OOPS', icon: Code2 },
  { id: 'Behavioral', label: 'Behavioral', desc: 'STAR stories & soft skills', icon: Sparkles },
  { id: 'Fresher', label: 'Fresher', desc: 'Campus / first-job ready', icon: Briefcase },
  { id: 'Managerial', label: 'Managerial', desc: 'Leadership & ownership', icon: Building2 },
  { id: 'Coding', label: 'Coding', desc: 'Problem-solving round', icon: Code2 },
];

const TECH_CHIPS = ['Laravel', 'React', 'MySQL', 'OOPS', 'Node.js', 'JavaScript'];

export function InterviewSetupPage() {
  const navigate = useNavigate();
  const startInterview = useStartInterview();
  const [interviewType, setInterviewType] = useState('Technical');
  const [targetJob, setTargetJob] = useState('Full Stack Developer');
  const [technology, setTechnology] = useState('Laravel, React, MySQL');
  const [company, setCompany] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(5);
  const [error, setError] = useState('');

  const toggleTech = (tech: string) => {
    const parts = technology
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.includes(tech)) {
      setTechnology(parts.filter((p) => p !== tech).join(', '));
    } else {
      setTechnology([...parts, tech].join(', '));
    }
  };

  const handleStart = async () => {
    setError('');
    try {
      const result = await startInterview.mutateAsync({
        interviewType,
        targetJob: targetJob || undefined,
        technology: technology || undefined,
        company: company || undefined,
        difficulty,
        questionCount,
      });
      navigate(`/learn/practice/${result.sessionId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.25),transparent_50%)]" />
        <div className="relative">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sky-200/80">Mock Interview</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Practice like the real round</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
            Configure role and stack — get scored answers on Laravel, React, MySQL, OOPS, and HR prompts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/interview/history" className="text-xs text-sky-200 underline-offset-4 hover:underline">
              History
            </Link>
            <span className="text-slate-500">·</span>
            <Link to="/interview/analytics" className="text-xs text-sky-200 underline-offset-4 hover:underline">
              Analytics
            </Link>
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
          <h2 className="text-lg font-semibold">Interview type</h2>
          <p className="text-sm text-muted-foreground">Sets the question style and scoring focus</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const selected = interviewType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setInterviewType(t.id)}
                className={cn(
                  'rounded-2xl border p-4 text-left transition-all',
                  selected
                    ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/30'
                    : 'hover:border-sky-400/50 hover:bg-muted/40'
                )}
              >
                <Icon className={cn('mb-2 h-5 w-5', selected ? 'text-sky-600' : 'text-muted-foreground')} />
                <p className="font-semibold">{t.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Role details</h2>
          <p className="text-sm text-muted-foreground">Optional fields still improve question relevance</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Target job</Label>
            <Input
              placeholder="e.g. Full Stack Developer"
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Technology focus</Label>
            <Input
              placeholder="e.g. Laravel, React, MySQL"
              value={technology}
              onChange={(e) => setTechnology(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {TECH_CHIPS.map((tech) => {
                const active = technology
                  .split(',')
                  .map((s) => s.trim())
                  .includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                        : 'text-muted-foreground hover:border-sky-400/50'
                    )}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Company (optional)</Label>
            <Input placeholder="e.g. Google" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner / Fresher</SelectItem>
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
                {[3, 5, 8, 10, 12].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleStart} disabled={startInterview.isPending}>
          {startInterview.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Start Interview <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </section>
    </div>
  );
}
