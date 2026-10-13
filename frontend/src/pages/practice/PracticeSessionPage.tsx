import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Lightbulb,
  Send,
  ChevronRight,
  Mic,
  Keyboard,
  X,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  useCurrentQuestion,
  useSubmitAnswer,
  useGetHint,
  useEndSession,
  useStartPractice,
} from '@/hooks/usePractice';
import { useSynthesizeSpeech } from '@/hooks/useSpeech';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { AITeacherAvatar, AvatarState } from '@/components/voice/AITeacherAvatar';
import { QuestionSpeaker } from '@/components/voice/QuestionSpeaker';
import { VoiceAnswerPanel } from '@/components/voice/VoiceAnswerPanel';
import { AnswerFeedbackCard } from '@/components/feedback/AnswerFeedbackCard';
import { SessionSummary, SubmitAnswerResult } from '@/types/practice';
import { cn, formatScore } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';
import api from '@/lib/api';
import { UserSettings } from '@/types';

type Phase = 'answering' | 'evaluating' | 'feedback' | 'completed';
type AnswerMode = 'text' | 'voice';

type SessionMeta = {
  topic?: string | null;
  mode?: string;
  difficulty: string;
  questionCount: number;
  bankId?: string | null;
};

export function PracticeSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: current, isLoading, refetch, isError } = useCurrentQuestion(sessionId!);
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserSettings }>('/settings');
      return data.data;
    },
  });

  const submitAnswer = useSubmitAnswer(sessionId!);
  const getHint = useGetHint(sessionId!);
  const endSession = useEndSession();
  const startPractice = useStartPractice();
  const synthesize = useSynthesizeSpeech();

  const tts = useTextToSpeech({
    voicePreference: 'FEMALE',
    defaultSpeed: settings?.voice?.speed ?? 1,
  });

  const [answerMode, setAnswerMode] = useState<AnswerMode>('text');
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState<Phase>('answering');
  const [feedback, setFeedback] = useState<SubmitAnswerResult | null>(null);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [showEndMenu, setShowEndMenu] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [expandedResult, setExpandedResult] = useState<number | null>(0);

  const voiceEnabled = settings?.voice?.enabled !== false;

  useEffect(() => {
    if (phase === 'completed') return;
    setAnswer('');
    setPhase('answering');
    setFeedback(null);
    setHint('');
    tts.stop();
  }, [current?.currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Capture category/mode for "Continue" restart + reset scores on new session
  useEffect(() => {
    if (!current) return;
    setSessionMeta({
      topic: current.topic ?? current.question.topic,
      mode: current.mode || 'PRACTICE',
      difficulty: current.difficulty,
      questionCount: current.totalQuestions,
      bankId: current.bankId,
    });
    if (current.currentIndex === 0 && phase !== 'completed') {
      setScoreHistory([]);
      setSummary(null);
    }
  }, [sessionId, current?.sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Support ?abandon=true from setup page
  useEffect(() => {
    if (!sessionId || searchParams.get('abandon') !== 'true') return;
    let cancelled = false;
    (async () => {
      try {
        await endSession.mutateAsync({ sessionId, mode: 'discard' });
        if (!cancelled) navigate('/learn/practice/setup', { replace: true });
      } catch {
        if (!cancelled) navigate('/learn/practice/setup', { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const showInlineResults = async (sid: string) => {
    setError('');
    tts.stop();
    try {
      const result = await endSession.mutateAsync({ sessionId: sid, mode: 'review' });
      const data = result.summary || null;
      if (data) {
        setSummary(data);
        setPhase('completed');
        setShowEndMenu(false);
        setExpandedResult(0);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setShowEndMenu(false);
    }
  };

  const handleEndSession = async (mode: 'review' | 'discard') => {
    if (!sessionId) return;
    if (mode === 'review') {
      await showInlineResults(sessionId);
      return;
    }
    setError('');
    tts.stop();
    try {
      await endSession.mutateAsync({ sessionId, mode: 'discard' });
      navigate('/learn/practice/setup', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setShowEndMenu(false);
    }
  };

  const handleCloseResults = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleContinueSameCategory = async () => {
    setError('');
    const meta = sessionMeta;
    try {
      const payload = {
        difficulty: meta?.difficulty || 'MEDIUM',
        questionCount: meta?.questionCount || 5,
        topic: meta?.topic || undefined,
        mode: (meta?.mode as 'PRACTICE' | 'ENGLISH' | 'INTERVIEW' | 'VOCABULARY' | 'GRAMMAR') || 'PRACTICE',
        source: (meta?.bankId ? 'bank' : 'ai') as 'bank' | 'ai',
        bankId: meta?.bankId || undefined,
      };
      const session = await startPractice.mutateAsync(payload);
      setPhase('answering');
      setFeedback(null);
      setSummary(null);
      setScoreHistory([]);
      navigate(`/learn/practice/${session.id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Auto-play question if enabled
  useEffect(() => {
    if (!current?.question.text || phase !== 'answering') return;
    if (!settings?.voice?.autoPlayQuestions) return;

    const playQuestion = async () => {
      try {
        const result = await synthesize.mutateAsync({ text: current.question.text });
        if (result.useBrowser || !result.audioBase64) {
          await tts.speak(current.question.text);
        } else {
          await tts.speak(current.question.text, {
            base64: result.audioBase64,
            mimeType: result.mimeType,
          });
        }
      } catch {
        await tts.speak(current.question.text);
      }
    };

    playQuestion();
  }, [current?.question.text, current?.currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const avatarState: AvatarState =
    phase === 'evaluating' ? 'thinking' :
    tts.isPlaying ? 'speaking' :
    phase === 'answering' && answerMode === 'voice' ? 'listening' :
    'idle';

  const progress = current
    ? ((current.currentIndex + (phase === 'feedback' ? 1 : 0)) / current.totalQuestions) * 100
    : 0;

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  const handleSubmit = async (text?: string, answerType: 'WRITTEN' | 'VOICE' = 'WRITTEN') => {
    const finalAnswer = text ?? answer;
    if (!finalAnswer.trim()) return;
    setError('');
    setPhase('evaluating');
    tts.stop();
    try {
      const result = await submitAnswer.mutateAsync({ answerText: finalAnswer, answerType });
      setFeedback(result);
      setScoreHistory((prev) => [...prev, result.evaluation.score]);
      setPhase('feedback');
    } catch (err) {
      setError(getErrorMessage(err));
      setPhase('answering');
    }
  };

  const handleContinue = async () => {
    if (feedback?.isLast && sessionId) {
      await showInlineResults(sessionId);
    } else {
      await refetch();
    }
  };

  const handleHint = async () => {
    try {
      const result = await getHint.mutateAsync();
      setHint(result.hint);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleListen = useCallback(async () => {
    if (!current?.question.text) return;
    try {
      const result = await synthesize.mutateAsync({ text: current.question.text });
      if (result.useBrowser || !result.audioBase64) {
        await tts.speak(current.question.text);
      } else {
        await tts.speak(current.question.text, {
          base64: result.audioBase64,
          mimeType: result.mimeType,
        });
      }
    } catch {
      await tts.speak(current.question.text);
    }
  }, [current?.question.text, synthesize, tts]);

  if (isLoading || (searchParams.get('abandon') === 'true' && endSession.isPending)) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Inline results after session complete (same page)
  if (phase === 'completed' && summary) {
    const categoryLabel = sessionMeta?.topic || summary.weakTopics[0] || summary.strongTopics[0] || 'Practice';
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Session complete</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryLabel} · {summary.answered}/{summary.totalQuestions} answered · avg{' '}
            {formatScore(summary.averageScore)}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          {summary.questions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setExpandedResult(expandedResult === i ? null : i)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium',
                q.score >= 7
                  ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                expandedResult === i && 'ring-2 ring-primary'
              )}
            >
              Q{i + 1}: {Number(q.score).toFixed(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {summary.questions.map((q, i) => {
            if (expandedResult !== null && expandedResult !== i) return null;
            return (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium">
                  <span className="text-muted-foreground">Q{i + 1}. </span>
                  {q.question}
                </p>
                <p className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{q.yourAnswer}</p>
                <AnswerFeedbackCard
                  compact
                  title={`Result · Q${i + 1}`}
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
                />
              </div>
            );
          })}
          {expandedResult === null && (
            <p className="text-center text-sm text-muted-foreground">
              Tap a score chip above to review that answer
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            size="lg"
            onClick={handleCloseResults}
          >
            <X className="h-4 w-4" />
            Close
          </Button>
          <Button
            className="flex-1"
            size="lg"
            onClick={handleContinueSameCategory}
            disabled={startPractice.isPending}
          >
            {startPractice.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Continue
              </>
            )}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Continue starts a new set in the same category
          {sessionMeta?.topic ? ` (${sessionMeta.topic})` : ''}.
        </p>
      </div>
    );
  }

  if (!current || isError) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Session not found or completed.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={() => navigate('/learn/practice/setup')}>
            Start New Session
          </Button>
          {sessionId && (
            <Button
              variant="outline"
              onClick={() => handleEndSession('discard')}
              disabled={endSession.isPending}
            >
              Close Session
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">
            Question {current.currentIndex + 1} / {current.totalQuestions}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground capitalize">{current.difficulty.toLowerCase()}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowEndMenu(true)}
              disabled={endSession.isPending || phase === 'evaluating'}
            >
              <X className="h-4 w-4" />
              End
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        {scoreHistory.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {scoreHistory.map((score, i) => (
              <span
                key={i}
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  score >= 7
                    ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                )}
                title={`Question ${i + 1}`}
              >
                Q{i + 1}: {score.toFixed(1)}
              </span>
            ))}
          </div>
        )}
      </div>

      <AITeacherAvatar state={avatarState} className="mb-6" />

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Card className="mb-6">
        <CardContent className="p-6">
          {current.question.topic && (
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
              {current.question.topic}
            </span>
          )}
          <p className="text-lg leading-relaxed">{current.question.text}</p>

          {voiceEnabled && phase === 'answering' && (
            <QuestionSpeaker
              text={current.question.text}
              isPlaying={tts.isPlaying}
              isPaused={tts.isPaused}
              speed={tts.speed}
              onSpeak={handleListen}
              onPause={tts.pause}
              onResume={tts.resume}
              onReplay={tts.replay}
              onSpeedChange={tts.setSpeed}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      {phase === 'answering' && (
        <>
          {voiceEnabled && (
            <div className="mb-4 flex rounded-lg border p-1">
              <button
                type="button"
                onClick={() => setAnswerMode('text')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
                  answerMode === 'text' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Keyboard className="h-4 w-4" /> Write
              </button>
              <button
                type="button"
                onClick={() => setAnswerMode('voice')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors',
                  answerMode === 'voice' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Mic className="h-4 w-4" /> Speak
              </button>
            </div>
          )}

          {answerMode === 'voice' && voiceEnabled ? (
            <VoiceAnswerPanel
              sessionId={sessionId}
              onSubmit={(t) => handleSubmit(t, 'VOICE')}
              onSwitchToText={() => setAnswerMode('text')}
            />
          ) : (
            <div className="space-y-4">
              <Textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[160px] text-base"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{wordCount} words · {answer.length} characters</span>
                <button type="button" onClick={() => setAnswer('')} className="hover:text-foreground">
                  Clear
                </button>
              </div>

              {hint && (
                <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm">
                  <span className="font-medium text-amber-700 dark:text-amber-400">Hint: </span>
                  {hint}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={handleHint} disabled={getHint.isPending || !!hint}>
                  <Lightbulb className="h-4 w-4" />
                  {getHint.isPending ? 'Loading...' : 'Hint'}
                </Button>
                <Button onClick={() => handleSubmit()} disabled={!answer.trim()}>
                  <Send className="h-4 w-4" />
                  Submit Answer
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === 'evaluating' && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
            <p className="font-medium">AI Teacher is evaluating your answer...</p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {['Correctness', 'Relevance', 'Grammar', 'Clarity'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing: {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {phase === 'feedback' && feedback && (
        <div className="space-y-4 animate-fade-in">
          <AnswerFeedbackCard
            title={`Feedback · Q${(feedback.questionIndex ?? current.currentIndex) + 1}`}
            evaluation={feedback.evaluation}
            provider={feedback.provider}
            model={feedback.model}
          />

          <Button
            className="w-full"
            size="lg"
            onClick={handleContinue}
            disabled={endSession.isPending}
          >
            {endSession.isPending && feedback.isLast ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {feedback.isLast ? 'See Results' : 'Continue'}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {showEndMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">End this session?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save & review shows results here. Discard closes without keeping the session active.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={() => handleEndSession('review')}
                disabled={endSession.isPending}
              >
                {endSession.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save & Review'
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleEndSession('discard')}
                disabled={endSession.isPending}
              >
                Discard Session
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowEndMenu(false)}
                disabled={endSession.isPending}
              >
                Keep Practicing
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
