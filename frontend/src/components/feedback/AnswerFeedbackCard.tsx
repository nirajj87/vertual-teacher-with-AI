import { useState } from 'react';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatScore, cn } from '@/lib/utils';

export interface FeedbackRatings {
  score: number;
  correctness?: number;
  relevance?: number;
  clarity?: number;
  grammar?: number;
  technicalAccuracy?: number;
  communication?: number;
}

export interface AnswerFeedbackCardProps {
  title?: string;
  evaluation: FeedbackRatings & {
    strengths?: string[];
    improvements?: string[];
    shortModelAnswer?: string;
    correctAnswer?: string;
    explanation?: string;
  };
  provider?: string;
  model?: string;
  compact?: boolean;
  className?: string;
}

function shortText(text: string | undefined, max = 120): string {
  if (!text) return '';
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function RatingChip({ label, value }: { label: string; value?: number }) {
  if (value == null || Number.isNaN(value)) return null;
  const tone =
    value >= 7
      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
      : value >= 5
        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
        : 'bg-red-500/10 text-red-700 dark:text-red-400';
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', tone)}>
      {label} {value.toFixed(1)}
    </span>
  );
}

export function AnswerFeedbackCard({
  title = 'Feedback',
  evaluation,
  provider,
  model,
  compact = false,
  className,
}: AnswerFeedbackCardProps) {
  const [showMore, setShowMore] = useState(false);
  const score = evaluation.score ?? 0;
  const strengths = (evaluation.strengths || []).map((s) => shortText(s, 90)).filter(Boolean).slice(0, 2);
  const improvements = (evaluation.improvements || []).map((s) => shortText(s, 90)).filter(Boolean).slice(0, 2);
  const better = shortText(evaluation.shortModelAnswer || evaluation.correctAnswer, 180);
  const explanation = shortText(evaluation.explanation, 160);

  const sourceLabel =
    provider === 'local' || provider === 'cache'
      ? `Saved answer · ${model === 'eval-cache' ? 'cache' : 'local validate'} (tokens saved)`
      : provider === 'mock'
        ? 'Local scoring'
        : provider === 'gemini'
          ? `AI · Gemini${model ? ` (${model})` : ''}`
          : provider === 'openai'
            ? `AI · OpenAI${model ? ` (${model})` : ''}`
            : provider
              ? `AI · ${provider}`
              : 'AI feedback';

  return (
    <Card
      className={cn(
        'border-2',
        score >= 7 ? 'border-green-500/30' : score >= 5 ? 'border-amber-500/30' : 'border-red-500/30',
        className
      )}
    >
      <CardContent className={cn(compact ? 'p-4' : 'p-6')}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{formatScore(score)}</p>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  score >= 7
                    ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                    : score >= 5
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-red-500/15 text-red-700 dark:text-red-400'
                )}
              >
                {score >= 7 ? 'Good' : score >= 5 ? 'Fair' : 'Needs work'}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{sourceLabel}</p>
          </div>
          {score >= 7 ? (
            <CheckCircle className="h-9 w-9 shrink-0 text-green-500" />
          ) : (
            <XCircle className="h-9 w-9 shrink-0 text-amber-500" />
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <RatingChip label="Correct" value={evaluation.correctness} />
          <RatingChip label="Clear" value={evaluation.clarity} />
          <RatingChip label="Relevant" value={evaluation.relevance} />
          <RatingChip label="Grammar" value={evaluation.grammar} />
          <RatingChip label="Technical" value={evaluation.technicalAccuracy} />
          <RatingChip label="Comm." value={evaluation.communication} />
        </div>

        {strengths.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-600">Good</p>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {improvements.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600">Improve</p>
            <ul className="space-y-1">
              {improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {better && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Better answer
            </p>
            <p className="text-sm leading-relaxed">{better}</p>
          </div>
        )}

        {(explanation || evaluation.correctAnswer) && (
          <>
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="mt-3 text-sm text-primary hover:underline"
            >
              {showMore ? 'Hide details' : 'More detail'}
            </button>
            {showMore && (
              <div className="mt-2 space-y-2 rounded-lg border p-3 text-sm text-muted-foreground">
                {explanation && <p>{explanation}</p>}
                {evaluation.correctAnswer && evaluation.correctAnswer !== better && (
                  <p>
                    <span className="font-medium text-foreground">Model answer: </span>
                    {shortText(evaluation.correctAnswer, 280)}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
