import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Loader2,
  ArrowRight,
  Target,
  BookOpen,
  Sparkles,
  TrendingDown,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWeakAreas } from '@/hooks/useLearning';
import { cn, formatScore } from '@/lib/utils';

export function WeakAreasPage() {
  const { data, isLoading } = useWeakAreas();

  const modeHref = (mode: string) => {
    switch (mode) {
      case 'GRAMMAR':
        return '/learn/grammar';
      case 'VOCABULARY':
        return '/learn/vocabulary';
      case 'INTERVIEW':
        return '/interview/setup';
      case 'ENGLISH':
        return '/learn/english/conversation';
      default:
        return '/learn/practice/setup';
    }
  };

  const areas = data?.weakAreas || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-50 via-background to-orange-50/70 p-6 sm:p-8 dark:from-amber-950/30 dark:to-slate-950">
        <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-amber-400/15 blur-2xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-300">
            <TrendingDown className="h-3.5 w-3.5" />
            Focus Plan
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Weak areas</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Clear ratings and short “what to improve” tips from your recent practice — then drill the gap.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !areas.length ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Target className="h-7 w-7 text-amber-600" />
          </div>
          <p className="text-lg font-semibold">No weak areas yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Complete practice or interview sessions. Topics scoring under ~6/10 appear here with improvement tips.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link to="/learn/practice/setup">
                <BookOpen className="h-4 w-4" /> Start Practice
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/learn/grammar">Grammar Drill</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/interview/setup">Mock Interview</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">What to improve</h2>
              <p className="text-sm text-muted-foreground">
                {areas.length} focus area{areas.length === 1 ? '' : 's'} from your answers
              </p>
            </div>

            <div className="space-y-4">
              {areas.map((w) => {
                const rating = w.rating ?? Math.round((1 - w.severity) * 100) / 10;
                const pct = Math.min(100, Math.round((10 - Math.min(rating, 10)) * 10));
                const tips = w.whatToImprove || [];
                return (
                  <div
                    key={w.id}
                    className="rounded-2xl border bg-card p-4 transition-shadow hover:shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{w.topic}</p>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-semibold',
                                rating >= 7
                                  ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                                  : rating >= 5
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                    : 'bg-red-500/15 text-red-700 dark:text-red-400'
                              )}
                            >
                              {formatScore(rating)} · {w.ratingLabel || 'Needs work'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {w.feedback || w.focusPlan?.summary || `${w.category} · ${w.count} flags`}
                          </p>

                          {tips.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {tips.map((tip, i) => (
                                <li key={i} className="flex gap-2 text-sm">
                                  <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="mt-4">
                            <Button asChild size="sm">
                              <Link to={modeHref(w.suggestedMode || 'PRACTICE')}>
                                Practice {w.topic}
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="sm:w-36">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Gap</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              pct >= 50 ? 'bg-red-500' : pct >= 30 ? 'bg-amber-500' : 'bg-sky-500'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {w.totalAttempts || w.count} attempt{(w.totalAttempts || w.count) === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {recommendations.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <h2 className="text-lg font-semibold">Recommended next</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {recommendations.map((r) => (
                  <div key={r.topic} className="flex flex-col rounded-2xl border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{r.topic}</p>
                      {r.rating != null && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatScore(r.rating)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.action}</p>
                    {(r.whatToImprove || []).length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        Focus: {r.whatToImprove!.slice(0, 2).join(' · ')}
                      </p>
                    )}
                    <Button asChild size="sm" className="mt-4 w-fit">
                      <Link to={modeHref(r.suggestedMode)}>
                        Start {r.minutes ? `(${r.minutes}m)` : ''}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
