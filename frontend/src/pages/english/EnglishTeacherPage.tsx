import { Link } from 'react-router-dom';
import { MessageSquare, BookOpen, SpellCheck, Loader2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEnglishOverview, useCorrectEnglish } from '@/hooks/useLearning';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { getErrorMessage } from '@/lib/api';

const modeIcons: Record<string, React.ElementType> = {
  ENGLISH: MessageSquare,
  GRAMMAR: SpellCheck,
  VOCABULARY: BookOpen,
};

export function EnglishTeacherPage() {
  const { data, isLoading } = useEnglishOverview();
  const correct = useCorrectEnglish();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleCorrect = async () => {
    setError('');
    try {
      await correct.mutateAsync(text);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">English Teacher</h1>
        <p className="text-muted-foreground">
          Level: <span className="font-medium text-foreground">{data?.englishLevel}</span> — practice grammar, vocabulary, and conversation
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(data?.modes || []).map((mode: { id: string; title: string; description: string; href: string }) => {
          const Icon = modeIcons[mode.id] || BookOpen;
          return (
            <Card key={mode.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{mode.title}</CardTitle>
                <CardDescription>{mode.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={mode.href}>
                    Start <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>English Correction</CardTitle>
          <CardDescription>Paste a sentence and get a clear correction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
          )}
          <Textarea
            placeholder='e.g. "I am working here since two years."'
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleCorrect} disabled={!text.trim() || correct.isPending}>
            {correct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Correct Sentence'}
          </Button>

          {correct.data && (
            <div className="space-y-3 rounded-xl border p-4 animate-fade-in">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Your Sentence</p>
                <p className="text-sm">{correct.data.original}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-green-600">Correct</p>
                <p className="text-sm font-medium">{correct.data.corrected}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Why</p>
                <p className="text-sm">{correct.data.explanation}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
