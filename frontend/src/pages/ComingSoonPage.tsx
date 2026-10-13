import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <Card className="max-w-md text-center">
        <CardContent className="p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Construction className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-muted-foreground">
            {description || 'This feature is coming in the next development phase.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
