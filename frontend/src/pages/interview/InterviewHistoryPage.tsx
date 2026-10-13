import { Link } from 'react-router-dom';
import { History, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useInterviewHistory } from '@/hooks/useLearning';
import { formatScore } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/date';

export function InterviewHistoryPage() {
  const { data, isLoading } = useInterviewHistory();

  const practice = data?.practiceInterviews || [];
  const sessions = data?.sessions || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Interview History</h1>
        <p className="text-muted-foreground">Past mock interviews and scores</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : practice.length === 0 && sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <History className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">No interviews yet</p>
            <Link to="/interview/setup" className="mt-4 text-sm text-primary hover:underline">
              Start your first mock interview
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {practice.map((s: {
            id: string;
            topic: string | null;
            averageScore: number | null;
            status: string;
            completedAt: string | null;
            totalQuestions: number;
            difficulty: string;
          }) => (
            <Link key={s.id} to={`/learn/practice/${s.id}/summary`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{s.topic || 'Mock Interview'}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.difficulty.toLowerCase()} · {s.totalQuestions} questions ·{' '}
                      {s.completedAt ? formatDistanceToNow(s.completedAt) : s.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.averageScore != null && (
                      <span className="font-semibold text-primary">{formatScore(s.averageScore)}</span>
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
