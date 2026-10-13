import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnswerFeedbackCard } from '@/components/feedback/AnswerFeedbackCard';
import { useSessionSummary } from '@/hooks/usePractice';
import { formatScore, cn } from '@/lib/utils';
import { useState } from 'react';

export function SessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: summary, isLoading, isError, refetch, isFetching } = useSessionSummary(sessionId!);
  const [expanded, setExpanded] = useState<number | null>(0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your answer review…</p>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="text-xl font-semibold">Couldn’t load summary</h1>
        <p className="text-sm text-muted-foreground">
          The session may still be saving evaluations. Try again in a moment.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Retry'}
          </Button>
          <Button asChild variant="outline">
            <Link to="/history">History</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Session Completed!</h1>
        <p className="mt-1 text-muted-foreground">
          Review feedback for all {summary.answered} answers below
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <Target className="mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{summary.answered}/{summary.totalQuestions}</p>
            <p className="text-sm text-muted-foreground">Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <Trophy className="mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{formatScore(summary.averageScore)}</p>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-6">
            <Clock className="mb-2 h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{summary.durationMinutes}m</p>
            <p className="text-sm text-muted-foreground">Duration</p>
          </CardContent>
        </Card>
      </div>

      {summary.questions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {summary.questions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setExpanded(expanded === i ? null : i)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                q.score >= 7
                  ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                  : q.score >= 5
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                    : 'bg-red-500/15 text-red-700 dark:text-red-400',
                expanded === i && 'ring-2 ring-primary'
              )}
            >
              Q{i + 1}: {Number(q.score || 0).toFixed(1)}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {summary.strongTopics.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-green-600">
                <CheckCircle className="h-4 w-4" /> Strong Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {summary.strongTopics.map((t) => (
                  <li key={t} className="text-sm">✓ {t}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {summary.weakTopics.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-amber-600">
                <AlertTriangle className="h-4 w-4" /> Needs Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {summary.weakTopics.map((t) => (
                  <li key={t} className="text-sm">⚠ {t}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Answer Review ({summary.questions.length})</h2>
        {summary.questions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No answers found for this session. If you just finished, hit Retry or open History.
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          summary.questions.map((q, i) => {
            const open = expanded === i;
            return (
              <Card key={i} className={cn(open && 'border-primary/40')}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                  onClick={() => setExpanded(open ? null : i)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Q{i + 1}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          q.score >= 7
                            ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        )}
                      >
                        {formatScore(q.score)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium">{q.question}</p>
                  </div>
                  {open ? (
                    <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {open && (
                  <CardContent className="space-y-3 border-t pt-4">
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Your Answer</p>
                      <p className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{q.yourAnswer}</p>
                    </div>
                    <AnswerFeedbackCard
                      compact
                      title={`AI rating · Q${i + 1}`}
                      evaluation={{
                        score: q.score,
                        correctness: q.correctness,
                        relevance: q.relevance,
                        clarity: q.clarity,
                        grammar: q.grammar,
                        technicalAccuracy: q.technicalAccuracy,
                        communication: q.communication,
                        strengths: q.strengths,
                        improvements: q.improvements,
                        shortModelAnswer: q.shortModelAnswer,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                      }}
                      provider="gemini"
                    />
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link to="/learn/practice/setup">
            <RotateCcw className="h-4 w-4" />
            Start New Session
          </Link>
        </Button>
        {summary.weakTopics.length > 0 && (
          <Button asChild variant="outline" className="flex-1">
            <Link to="/progress/weak-areas">Practice Weak Areas</Link>
          </Button>
        )}
        <Button asChild variant="outline" className="flex-1">
          <Link to="/history">History</Link>
        </Button>
      </div>
    </div>
  );
}
