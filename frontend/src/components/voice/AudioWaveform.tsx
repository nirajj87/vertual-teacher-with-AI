import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  levels: number[];
  isActive?: boolean;
  className?: string;
}

export function AudioWaveform({ levels, isActive = false, className }: AudioWaveformProps) {
  return (
    <div className={cn('flex h-12 items-center justify-center gap-[3px]', className)}>
      {levels.map((level, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-75',
            isActive ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
          style={{
            height: `${Math.max(4, level * 48)}px`,
            opacity: isActive ? 0.6 + level * 0.4 : 0.4,
          }}
        />
      ))}
    </div>
  );
}
