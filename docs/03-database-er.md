# Database ER Diagram

## Phase 1 Core Entities

```mermaid
erDiagram
    User ||--o| UserProfile : has
    User ||--o{ RefreshToken : has
    User ||--o{ UserSettings : has
    User ||--o{ Notification : receives

    User {
        uuid id PK
        string email UK
        string passwordHash
        enum role
        boolean emailVerified
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    UserProfile {
        uuid id PK
        uuid userId FK
        string name
        string profilePhoto
        string preferredLanguage
        enum englishLevel
        string learningGoal
        enum experienceLevel
        string targetRole
        enum preferredAiProvider
        enum voicePreference
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        datetime expiresAt
        datetime createdAt
        boolean revoked
    }

    UserSettings {
        uuid id PK
        uuid userId FK
        json theme
        json notifications
        json practice
        json ai
        json voice
        datetime updatedAt
    }

    Notification {
        uuid id PK
        uuid userId FK
        string type
        string title
        string message
        boolean read
        datetime createdAt
    }
```

## Full Schema (Future Phases)

```mermaid
erDiagram
    User ||--o{ QuestionBank : owns
    QuestionBank ||--o{ Question : contains
    Question ||--o| QuestionAnswer : has
    User ||--o{ PracticeSession : starts
    PracticeSession ||--o{ PracticeQuestion : includes
    PracticeQuestion ||--o| UserAnswer : has
    UserAnswer ||--o| AnswerEvaluation : has
    User ||--o{ InterviewSession : conducts
    InterviewSession ||--o{ InterviewQuestion : includes
    InterviewSession ||--o| InterviewEvaluation : has
    User ||--o{ UserTopicProgress : tracks
    User ||--o{ WeakArea : has
    User ||--o{ UserAchievement : earns
    Achievement ||--o{ UserAchievement : awarded
    User ||--o{ AIUsage : generates
```

## Indexes Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| User | email | Login lookup |
| RefreshToken | tokenHash, userId | Token validation |
| PracticeSession | userId, status | Active session lookup |
| UserAnswer | sessionId | Session answers |
| AIUsage | userId, createdAt | Usage analytics |
| Question | bankId, topicId | Question listing |
