import { Link } from 'react-router-dom';
import { Plus, FileQuestion, Upload, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestionBanks } from '@/hooks/usePractice';

export function QuestionBankPage() {
  const { data, isLoading } = useQuestionBanks();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground">Manage your practice questions</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/questions/upload">
              <Upload className="h-4 w-4" />
              Upload
            </Link>
          </Button>
          <Button asChild>
            <Link to="/questions/upload">
              <Plus className="h-4 w-4" />
              Add Questions
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : data?.banks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No question banks yet</h3>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Upload a file or create questions manually to start practicing.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild variant="outline">
                <Link to="/questions/upload">Upload Questions</Link>
              </Button>
              <Button asChild>
                <Link to="/learn/practice/setup">Start AI Practice</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.banks.map((bank) => (
            <Link key={bank.id} to={`/questions/${bank.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    {bank.topic && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{bank.topic}</span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{bank.name}</CardTitle>
                  {bank.description && (
                    <CardDescription className="line-clamp-2">{bank.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {bank._count?.questions ?? 0} questions
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
