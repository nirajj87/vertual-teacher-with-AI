import { cn } from '@/lib/utils';

export type AvatarState = 'idle' | 'speaking' | 'listening' | 'thinking';

interface AITeacherAvatarProps {
  state: AvatarState;
  className?: string;
}

const stateLabels: Record<AvatarState, string> = {
  idle: 'Ready',
  speaking: 'Speaking...',
  listening: 'Listening...',
  thinking: 'Thinking...',
};

const stateColors: Record<AvatarState, string> = {
  idle: 'bg-primary/10 text-primary',
  speaking: 'bg-blue-500/10 text-blue-500',
  listening: 'bg-green-500/10 text-green-500',
  thinking: 'bg-amber-500/10 text-amber-500',
};

export function AITeacherAvatar({ state, className }: AITeacherAvatarProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            stateColors[state]
          )}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-.99 2-1.55 3-1.55 1.66 0 3 1.34 3 3h2c0-2.76-2.24-5-5-5-1.1 0-2.12.36-2.95 1.01C8.61 12.82 12 14 12 14s3.39-1.18 5.95-2.99A5.978 5.978 0 0012 11c-2.76 0-5 2.24-5 5h2c0-1.66 1.34-3 3-3 1 0 2.97.56 3 1.55-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </div>
        {(state === 'speaking' || state === 'listening' || state === 'thinking') && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background',
              state === 'speaking' && 'animate-pulse bg-blue-500',
              state === 'listening' && 'animate-pulse bg-green-500',
              state === 'thinking' && 'animate-pulse bg-amber-500'
            )}
          />
        )}
      </div>
      <div>
        <p className="font-semibold">AI Teacher</p>
        <p className="text-xs text-muted-foreground">{stateLabels[state]}</p>
      </div>
    </div>
  );
}
