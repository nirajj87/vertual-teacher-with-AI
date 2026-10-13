import { Link } from 'react-router-dom';
import { History, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePracticeHistory } from '@/hooks/usePractice';
import { formatScore } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/date';

export function HistoryPage() {
  const { data, isLoading } = usePracticeHistory();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Practice History</h1>
        <p className="text-muted-foreground">Review your past practice sessions</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !data?.sessions?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <History className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">No practice history yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Complete a session to see it here</p>
            <Link to="/learn/practice/setup" className="mt-4 text-sm text-primary hover:underline">
              Start practicing
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.sessions.map((session: {
            id: string;
            totalQuestions: number;
            averageScore: number | null;
            difficulty: string;
            completedAt: string | null;
            topic: string | null;
          }) => (
            <Link key={session.id} to={`/learn/practice/${session.id}/summary`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">
                      {session.topic || 'Practice Session'} — {session.totalQuestions} questions
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.difficulty.toLowerCase()} ·{' '}
                      {session.completedAt
                        ? formatDistanceToNow(session.completedAt)
                        : 'In progress'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.averageScore != null && (
                      <span className="font-semibold text-primary">
                        {formatScore(session.averageScore)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
