import { Link } from 'react-router-dom';
import { Loader2, TrendingUp, Flame, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProgressOverview, useLearningPlan } from '@/hooks/useLearning';
import { formatScore } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export function ProgressPage() {
  const { data, isLoading } = useProgressOverview();
  const { data: plan } = useLearningPlan();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const topicChart = (data?.topicProgress || []).map((t: { topic: string; averageScore: number }) => ({
    topic: t.topic.length > 12 ? `${t.topic.slice(0, 12)}…` : t.topic,
    score: Math.round(t.averageScore * 10) / 10,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance</h1>
          <p className="text-muted-foreground">Your learning analytics and recommendations</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/progress/weak-areas">View Weak Areas</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Flame className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-2xl font-bold">{data?.streak || 0} days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Sessions</p>
              <p className="text-2xl font-bold">{data?.totalSessions || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Score</p>
              <p className="text-2xl font-bold">
                {data?.averageScore ? formatScore(data.averageScore) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <BriefcaseIcon />
            <div>
              <p className="text-sm text-muted-foreground">Interviews</p>
              <p className="text-2xl font-bold">{data?.interviewCount || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {(data?.scoreTrend || []).length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Complete sessions to see trends</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.scoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Topic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {topicChart.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No topic data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicChart}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="topic" className="text-xs" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {plan?.plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended Learning Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.plan.map((step: { step: number; focus: string; reason?: string; suggestedMode: string; minutes: number }) => (
              <div key={step.step} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">
                    {step.step}. {step.focus}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {step.reason || step.suggestedMode} · ~{step.minutes} min
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link
                    to={
                      step.suggestedMode === 'GRAMMAR'
                        ? '/learn/grammar'
                        : step.suggestedMode === 'VOCABULARY'
                          ? '/learn/vocabulary'
                          : step.suggestedMode === 'ENGLISH'
                            ? '/learn/english/conversation'
                            : step.suggestedMode === 'INTERVIEW'
                              ? '/interview/setup'
                              : '/learn/practice/setup'
                    }
                  >
                    Practice
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
