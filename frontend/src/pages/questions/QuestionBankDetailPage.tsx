import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestionBank } from '@/hooks/usePractice';

export function QuestionBankDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: bank, isLoading } = useQuestionBank(id!);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!bank) {
    return <div>Question bank not found</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/questions"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{bank.name}</h1>
            <p className="text-muted-foreground">
              {bank.questions?.length ?? 0} questions
              {bank.topic && ` · ${bank.topic}`}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/learn/practice/setup?bankId=${bank.id}`}>
            <Play className="h-4 w-4" />
            Practice This Bank
          </Link>
        </Button>
      </div>

      {bank.description && (
        <p className="text-muted-foreground">{bank.description}</p>
      )}

      <div className="space-y-3">
        {bank.questions?.map((q: { id: string; text: string; topic: string | null; answer?: { text: string } | null }, i: number) => (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-start justify-between text-base font-medium">
                <span>Q{i + 1}. {q.text}</span>
                {q.topic && (
                  <span className="ml-2 shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-normal">
                    {q.topic}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            {q.answer?.text && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Expected: </span>
                  {q.answer.text}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
