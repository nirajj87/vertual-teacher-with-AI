import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVocabulary } from '@/hooks/useLearning';
import { useStartPractice } from '@/hooks/usePractice';
import { useState } from 'react';
import { getErrorMessage } from '@/lib/api';

export function VocabularyPage() {
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useVocabulary(6);
  const startPractice = useStartPractice();
  const [error, setError] = useState('');

  const handlePractice = async () => {
    setError('');
    try {
      const session = await startPractice.mutateAsync({
        difficulty: 'MEDIUM',
        questionCount: 5,
        topic: 'Vocabulary',
        source: 'ai',
        mode: 'VOCABULARY',
      });
      navigate(`/learn/practice/${session.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/learn/english"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Vocabulary</h1>
            <p className="text-muted-foreground">Learn words with meaning, examples, and practice</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>Refresh Words</Button>
          <Button onClick={handlePractice} disabled={startPractice.isPending}>
            {startPractice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Practice Vocabulary'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.words.map((w) => (
            <Card key={w.word}>
              <CardHeader className="pb-2">
                <div className="mb-1 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">{w.word}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">Meaning:</span> {w.meaning}</p>
                <p className="text-muted-foreground italic">"{w.example}"</p>
                <p><span className="font-medium">Synonyms:</span> {w.synonyms.join(', ')}</p>
                <p><span className="font-medium">Antonyms:</span> {w.antonyms.join(', ')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
