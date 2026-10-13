import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuestionSpeakerProps {
  text: string;
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  onSpeak: () => void;
  onPause: () => void;
  onResume: () => void;
  onReplay: () => void;
  onSpeedChange: (speed: number) => void;
  className?: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

export function QuestionSpeaker({
  isPlaying,
  isPaused,
  speed,
  onSpeak,
  onPause,
  onResume,
  onReplay,
  onSpeedChange,
  className,
}: QuestionSpeakerProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={isPlaying && !isPaused ? onPause : isPaused ? onResume : onSpeak}
      >
        {isPlaying && !isPaused ? (
          <><Pause className="h-4 w-4" /> Pause</>
        ) : isPaused ? (
          <><Play className="h-4 w-4" /> Resume</>
        ) : (
          <><Volume2 className="h-4 w-4" /> Listen</>
        )}
      </Button>

      <Button variant="ghost" size="sm" onClick={onReplay} disabled={!isPlaying && !isPaused}>
        <RotateCcw className="h-4 w-4" />
        Replay
      </Button>

      <div className="flex items-center gap-1 rounded-md border px-2 py-1">
        <span className="text-xs text-muted-foreground mr-1">Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            className={cn(
              'rounded px-2 py-0.5 text-xs transition-colors',
              speed === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
