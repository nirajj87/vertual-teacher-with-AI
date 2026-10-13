import { useQuery } from '@tanstack/react-query';
import {
  Flame,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { DashboardStats } from '@/types';
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

const mockChartData = [
  { day: 'Mon', score: 6.5 },
  { day: 'Tue', score: 7.0 },
  { day: 'Wed', score: 7.2 },
  { day: 'Thu', score: 6.8 },
  { day: 'Fri', score: 7.5 },
  { day: 'Sat', score: 8.0 },
  { day: 'Sun', score: 7.8 },
];

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<{ data: DashboardStats }>('/dashboard/stats');
      return data.data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">
          {stats?.greeting || 'Good Morning'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {stats?.recommendedPractice || 'Ready to continue your learning journey?'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Learning Streak"
              value={stats?.streak ? `${stats.streak} Days` : 'Start today!'}
              icon={Flame}
              subtitle={stats?.streak ? 'Keep it going!' : 'Practice to begin'}
            />
            <StatCard
              title="Practice Time"
              value={stats?.practiceTime || '0m'}
              icon={Clock}
            />
            <StatCard
              title="Questions Answered"
              value={stats?.questionsAnswered || 0}
              icon={Target}
            />
            <StatCard
              title="Average Score"
              value={stats?.averageScore ? formatScore(stats.averageScore) : '—'}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis domain={[0, 10]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weak Areas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {(stats?.weakAreas || ['Grammar', 'Vocabulary']).map((area) => (
                  <li
                    key={area}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span>{area}</span>
                    <span className="text-xs text-muted-foreground">Needs practice</span>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link to="/progress/weak-areas">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="group cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <BookOpen className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Start Practice</h3>
              <p className="text-sm text-muted-foreground">Answer questions with AI feedback</p>
            </div>
            <Button asChild size="sm">
              <Link to="/learn/practice/setup">Start</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <MessageSquare className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Mock Interview</h3>
              <p className="text-sm text-muted-foreground">Practice with AI interviewer</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/interview/setup">Start</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">English Teacher</h3>
              <p className="text-sm text-muted-foreground">Improve grammar & vocabulary</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/learn/english">Learn</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
