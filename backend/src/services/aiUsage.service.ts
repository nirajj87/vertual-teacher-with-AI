import { prisma } from '../config/database';

export class AIUsageService {
  async logUsage(params: {
    userId: string;
    provider: string;
    model: string;
    requestType: string;
    inputTokens?: number;
    outputTokens?: number;
    responseTimeMs: number;
  }) {
    const inputTokens = params.inputTokens ?? 0;
    const outputTokens = params.outputTokens ?? 0;
    await prisma.aIUsage.create({
      data: {
        userId: params.userId,
        provider: params.provider,
        model: params.model,
        requestType: params.requestType,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost: this.estimateCost(params.provider, inputTokens, outputTokens),
        responseTimeMs: params.responseTimeMs,
      },
    });
  }

  private estimateCost(provider: string, input: number, output: number): number {
    const rates: Record<string, { in: number; out: number }> = {
      gemini: { in: 0.0000001, out: 0.0000004 },
      openai: { in: 0.00000015, out: 0.0000006 },
      mock: { in: 0, out: 0 },
    };
    const rate = rates[provider] || rates.mock;
    return input * rate.in + output * rate.out;
  }
}

export const aiUsageService = new AIUsageService();
