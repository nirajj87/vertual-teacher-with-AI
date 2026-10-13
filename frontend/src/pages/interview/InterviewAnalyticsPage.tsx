import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInterviewAnalytics } from '@/hooks/useLearning';
import { formatScore } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function InterviewAnalyticsPage() {
  const { data, isLoading } = useInterviewAnalytics();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const skills = data?.skills || { communication: 0, technical: 0, clarity: 0 };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Interview Analytics</h1>
        <p className="text-muted-foreground">Performance across mock interviews</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Total Interviews</p>
            <p className="mt-1 text-3xl font-bold">{data?.totalInterviews || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="mt-1 text-3xl font-bold">
              {data?.averageScore ? formatScore(data.averageScore) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Communication</p>
            <p className="mt-1 text-3xl font-bold">
              {skills.communication ? formatScore(skills.communication) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Communication', value: skills.communication },
              { label: 'Technical', value: skills.technical },
              { label: 'Clarity', value: skills.clarity },
            ].map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-medium">{s.value ? formatScore(s.value) : '—'}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (s.value || 0) * 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {(data?.trend || []).length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  Complete interviews to see trends
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis domain={[0, 10]} className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {data?.tips && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interview Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.tips.map((tip: string) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-primary">•</span> {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
