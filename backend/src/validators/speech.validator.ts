import { z } from 'zod';

export const synthesizeSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.enum(['MALE', 'FEMALE', 'NEUTRAL']).optional(),
  speed: z.number().min(0.5).max(2).optional(),
});

export const saveTranscriptSchema = z.object({
  transcript: z.string().max(10000),
});

export type SynthesizeInput = z.infer<typeof synthesizeSchema>;
