# Redis Caching Strategy

## Key Patterns

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `session:{userId}` | 24h | Active practice session state |
| `eval:{qHash}:{aHash}` | 7d | Answer evaluation cache |
| `question:{hash}` | 30d | Generated question cache |
| `tts:{textHash}` | 30d | TTS audio metadata |
| `transcript:{sessionId}` | 1h | Temporary STT transcript |
| `rate:ip:{ip}` | 1m | IP rate limit counter |
| `rate:user:{userId}` | 1m | User rate limit counter |
| `rate:ai:{userId}` | 1h | AI request rate limit |
| `refresh:{tokenHash}` | 7d | Refresh token blacklist |
| `user:settings:{userId}` | 1h | User settings cache |
| `dashboard:stats:{userId}` | 5m | Dashboard stats cache |

## Session Recovery

```json
// session:{userId}
{
  "sessionId": "uuid",
  "mode": "PRACTICE",
  "currentIndex": 7,
  "totalQuestions": 20,
  "draftAnswer": "...",
  "startedAt": "ISO8601"
}
```

## Evaluation Cache

Only cache when:
- Same question hash + answer hash
- No expected answer ambiguity flag
- Confidence >= 0.8

Never cache:
- Passwords, tokens, PII
- Interview sessions with personalized follow-ups

## Rate Limiting

```
rate:login:{ip}     → 5 attempts / 15 min
rate:ai:{userId}    → configurable per plan
rate:upload:{userId} → 10 / hour
```

## Invalidation

| Event | Invalidate |
|-------|------------|
| User updates profile | `user:settings:{userId}`, `dashboard:stats:{userId}` |
| Session completed | `session:{userId}` |
| Settings changed | `user:settings:{userId}` |
| Logout | `session:{userId}` |

## Fallback

If Redis unavailable:
- Rate limiting: in-memory fallback (single instance)
- Cache: skip cache, hit database/AI directly
- Session recovery: database persistence as backup
