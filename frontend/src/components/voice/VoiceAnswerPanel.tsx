import { useState } from 'react';
import { Mic, Square, Loader2, Send, Edit3, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AudioWaveform } from './AudioWaveform';
import { useVoiceRecorder, formatDuration } from '@/hooks/useVoiceRecorder';
import { useBrowserSpeechRecognition } from '@/hooks/useBrowserSpeechRecognition';
import { useSpeechConfig, useTranscribeAudio } from '@/hooks/useSpeech';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

type VoicePhase = 'idle' | 'recording' | 'transcribing' | 'review';

interface VoiceAnswerPanelProps {
  sessionId?: string;
  onSubmit: (transcript: string) => void;
  onSwitchToText: () => void;
  disabled?: boolean;
}

export function VoiceAnswerPanel({
  sessionId,
  onSubmit,
  onSwitchToText,
  disabled,
}: VoiceAnswerPanelProps) {
  const recorder = useVoiceRecorder();
  const browserStt = useBrowserSpeechRecognition();
  const transcribe = useTranscribeAudio();
  const { data: speechConfig } = useSpeechConfig();

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  // Default to browser STT unless server Whisper is configured
  const useBrowserStt = !speechConfig || speechConfig.sttProvider === 'browser';

  const livePreview = [browserStt.finalTranscript, browserStt.interimTranscript]
    .filter(Boolean)
    .join(' ')
    .trim();

  const handleStart = async () => {
    setError('');
    setTranscript('');
    browserStt.reset();

    await recorder.startRecording();

    if (useBrowserStt) {
      if (!browserStt.isSupported) {
        recorder.cancelRecording();
        setError('Speech recognition needs Chrome or Edge. Or set STT_PROVIDER=openai with an API key.');
        return;
      }
      browserStt.start('en-US');
    }

    setPhase('recording');
  };

  const handleStop = async () => {
    const blob = await recorder.stopRecording();

    if (useBrowserStt) {
      const text = browserStt.stop();
      if (!text) {
        setPhase('idle');
        setError('No speech detected. Please try again and speak clearly.');
        return;
      }
      setTranscript(text);
      setPhase('review');
      return;
    }

    if (!blob || blob.size === 0) {
      setPhase('idle');
      setError('No audio recorded. Please try again.');
      return;
    }

    setPhase('transcribing');
    try {
      const result = await transcribe.mutateAsync({ blob, sessionId });
      setTranscript(result.transcript);
      setPhase('review');
    } catch (err) {
      setError(getErrorMessage(err));
      setPhase('idle');
    }
  };

  const handleCancel = () => {
    browserStt.abort();
    recorder.cancelRecording();
    setPhase('idle');
    setTranscript('');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {(recorder.error || browserStt.error) && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {recorder.error || browserStt.error}
        </div>
      )}

      {phase === 'idle' && (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-10">
          <button
            type="button"
            onClick={handleStart}
            disabled={disabled || !recorder.isSupported}
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95',
              disabled && 'opacity-50 pointer-events-none'
            )}
            aria-label="Start recording"
          >
            <Mic className="h-8 w-8" />
          </button>
          <p className="mt-4 font-medium">Answer by Voice</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {useBrowserStt
              ? 'Uses browser speech recognition (Chrome / Edge)'
              : 'Records audio and converts with server STT'}
          </p>
          <Button variant="link" size="sm" className="mt-3" onClick={onSwitchToText}>
            <Keyboard className="h-4 w-4" />
            Type instead
          </Button>
        </div>
      )}

      {phase === 'recording' && (
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
              <span className="text-sm font-medium">Listening...</span>
            </div>
            <span className="font-mono text-lg font-semibold">{formatDuration(recorder.duration)}</span>
          </div>

          <AudioWaveform levels={recorder.waveform} isActive className="mb-4" />

          {useBrowserStt && livePreview && (
            <div className="mb-4 rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Live transcript</p>
              <p>{livePreview}</p>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleStop} variant="destructive">
              <Square className="h-4 w-4 fill-current" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {phase === 'transcribing' && (
        <div className="flex flex-col items-center rounded-xl border py-12">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="font-medium">Converting speech to text...</p>
          <p className="mt-1 text-sm text-muted-foreground">Audio is not sent to the AI evaluator</p>
        </div>
      )}

      {phase === 'review' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Edit3 className="h-4 w-4" />
            Review and edit your transcript before submitting
          </div>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-[140px] text-base"
            placeholder="Your spoken answer will appear here..."
          />
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => { setPhase('idle'); setTranscript(''); }}>
              Re-record
            </Button>
            <Button onClick={() => onSubmit(transcript)} disabled={!transcript.trim()}>
              <Send className="h-4 w-4" />
              Submit Answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
