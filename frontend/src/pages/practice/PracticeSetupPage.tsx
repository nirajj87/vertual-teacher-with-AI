import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  useQuestionBanks,
  useStartPractice,
  useActiveSession,
  useEndSession,
} from '@/hooks/usePractice';
import { getErrorMessage } from '@/lib/api';

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBank = searchParams.get('bankId') || '';

  const { data: banksData } = useQuestionBanks();
  const { data: activeSession, isLoading: activeLoading } = useActiveSession();
  const startPractice = useStartPractice();
  const endSession = useEndSession();

  const [bankId, setBankId] = useState(preselectedBank);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(10);
  const [source, setSource] = useState<'bank' | 'ai' | 'mixed'>('bank');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  const setSourceAndDefaults = (value: 'bank' | 'ai' | 'mixed') => {
    setSource(value);
    if (value === 'ai' && questionCount > 8) setQuestionCount(5);
  };

  const handleStart = async () => {
    setError('');
    try {
      const session = await startPractice.mutateAsync({
        bankId: source !== 'ai' ? bankId : undefined,
        difficulty,
        questionCount: source === 'ai' ? Math.min(questionCount, 10) : questionCount,
        topic: topic || undefined,
        source,
      });
      navigate(`/learn/practice/${session.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCloseActive = async (mode: 'review' | 'discard') => {
    if (!activeSession?.id) return;
    setError('');
    try {
      await endSession.mutateAsync({ sessionId: activeSession.id, mode });
      if (mode === 'review') {
        navigate(`/learn/practice/${activeSession.id}/summary`);
      }
      // discard: active-session query invalidates → setup form shows
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (activeLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Unfinished Session</CardTitle>
            <CardDescription>
              Question {activeSession.currentIndex + 1} of {activeSession.totalQuestions}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button onClick={() => navigate(`/learn/practice/${activeSession.id}`)}>
              Continue Session
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCloseActive('review')}
              disabled={endSession.isPending}
            >
              {endSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'End & Review Answers'
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleCloseActive('discard')}
              disabled={endSession.isPending}
            >
              Close / Discard Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Practice Setup</h1>
          <p className="text-muted-foreground">Configure your practice session</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Question Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: 'bank', label: 'Question Bank', icon: BookOpen, desc: 'Use uploaded questions' },
              { value: 'ai', label: 'AI Generated', icon: Sparkles, desc: 'AI creates questions' },
              { value: 'mixed', label: 'Mixed', icon: Sparkles, desc: 'Bank + AI questions' },
            ].map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSourceAndDefaults(value as typeof source)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  source === value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'hover:border-primary/50'
                }`}
              >
                <Icon className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>

          {source === 'ai' && (
            <p className="rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-800 dark:text-sky-200">
              AI will try Gemini once (max ~8s). If slow/unavailable, curated Laravel / React / MySQL / OOPS / English questions start immediately.
            </p>
          )}

          {source !== 'ai' && (
            <div className="space-y-2">
              <Label>Question Bank</Label>
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a question bank" />
                </SelectTrigger>
                <SelectContent>
                  {banksData?.banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name} ({bank._count?.questions ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(source === 'ai' || source === 'mixed') && (
            <div className="space-y-2">
              <Label>Topic (for AI questions)</Label>
              <Input
                placeholder="e.g., JavaScript, OOP, Database"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner — Simple, more hints</SelectItem>
                  <SelectItem value="MEDIUM">Medium — Balanced</SelectItem>
                  <SelectItem value="ADVANCED">Advanced — Challenging</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Questions</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
              />
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleStart}
            disabled={startPractice.isPending || (source !== 'ai' && !bankId)}
          >
            {startPractice.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {source === 'ai' ? 'Preparing questions…' : 'Starting…'}
              </>
            ) : (
              'Start Practice'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
