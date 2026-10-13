# API Specification — Phase 1

Base URL: `/api/v1`

## Response Format

### Success
```json
{
  "success": true,
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## Auth (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login, returns access token |
| POST | `/auth/logout` | Yes | Revoke refresh token |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/forgot-password` | No | Send reset email |
| POST | `/auth/reset-password` | No | Reset with token |
| POST | `/auth/verify-email` | No | Verify email token |
| POST | `/auth/resend-verification` | Yes | Resend verification |

### POST `/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### POST `/auth/login`
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

---

## Users (`/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/me` | Yes | Get current user + profile |
| PATCH | `/users/me` | Yes | Update profile |
| PATCH | `/users/me/password` | Yes | Change password |
| POST | `/users/me/avatar` | Yes | Upload profile photo |
| DELETE | `/users/me/avatar` | Yes | Remove profile photo |

### PATCH `/users/me`
```json
{
  "name": "John Doe",
  "preferredLanguage": "en",
  "englishLevel": "B1",
  "learningGoal": "Interview preparation",
  "experienceLevel": "MID",
  "targetRole": "Full Stack Developer",
  "preferredAiProvider": "GEMINI",
  "voicePreference": "FEMALE"
}
```

---

## Settings (`/settings`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/settings` | Yes | Get user settings |
| PATCH | `/settings` | Yes | Update settings |

### Settings Schema
```json
{
  "theme": { "mode": "system", "accentColor": "blue" },
  "notifications": {
    "email": true,
    "practiceReminders": true,
    "weeklyReport": true
  },
  "practice": {
    "defaultDifficulty": "MEDIUM",
    "questionsPerSession": 20,
    "showHints": true,
    "autoAdvance": false
  },
  "ai": {
    "provider": "gemini",
    "maxTokens": 1024,
    "temperature": 0.7
  },
  "voice": {
    "enabled": true,
    "speed": 1.0,
    "autoPlayQuestions": false
  }
}
```

---

## Dashboard (`/dashboard`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/stats` | Yes | Dashboard overview stats |
| GET | `/dashboard/streak` | Yes | Learning streak info |

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Service health check |
