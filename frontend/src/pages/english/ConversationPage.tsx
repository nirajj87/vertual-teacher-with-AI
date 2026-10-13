import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStartPractice } from '@/hooks/usePractice';
import { getErrorMessage } from '@/lib/api';

export function ConversationPage() {
  const navigate = useNavigate();
  const startPractice = useStartPractice();
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [error, setError] = useState('');

  const handleStart = async () => {
    setError('');
    try {
      const session = await startPractice.mutateAsync({
        difficulty,
        questionCount: 5,
        topic: 'English Conversation',
        source: 'ai',
        mode: 'ENGLISH',
      });
      navigate(`/learn/practice/${session.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/learn/english"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Conversation Practice</h1>
          <p className="text-muted-foreground">Natural prompts — answer in writing or by voice</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Start Conversation Session</CardTitle>
          <CardDescription>
            AI asks everyday and professional prompts. Use Speak mode for oral practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner — simple language</SelectItem>
                <SelectItem value="MEDIUM">Medium — natural conversation</SelectItem>
                <SelectItem value="ADVANCED">Advanced — professional fluency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" size="lg" onClick={handleStart} disabled={startPractice.isPending}>
            {startPractice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Begin Conversation'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
