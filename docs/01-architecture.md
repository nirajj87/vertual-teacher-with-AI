# AI Virtual Teacher — System Architecture

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend (React + Vite)"]
        UI[UI Components]
        RQ[TanStack Query]
        ZS[Zustand Store]
        WS[Socket.IO Client]
    end

    subgraph Gateway["Nginx Reverse Proxy"]
        NG[Load Balancer / SSL]
    end

    subgraph Backend["Backend (Node.js + Express)"]
        API[REST API]
        WSS[WebSocket Server]
        AUTH[Auth Middleware]
        RL[Rate Limiter]
        subgraph Layers
            CTRL[Controllers]
            SVC[Services]
            REPO[Repositories]
        end
        subgraph AI["AI Layer"]
            AIF[AI Provider Factory]
            GEM[Gemini Provider]
            OAI[OpenAI Provider]
            OLL[Ollama Provider]
        end
        subgraph Speech["Speech Layer"]
            STT[Speech-to-Text]
            TTS[Text-to-Speech]
        end
    end

    subgraph Data["Data Layer"]
        MYSQL[(MySQL)]
        REDIS[(Redis Cache)]
    end

    UI --> NG
    NG --> API
    NG --> WSS
    API --> AUTH --> RL --> CTRL
    CTRL --> SVC --> REPO
    SVC --> AIF
    AIF --> GEM
    AIF --> OAI
    AIF --> OLL
    SVC --> STT
    SVC --> TTS
    REPO --> MYSQL
    SVC --> REDIS
    WS --> WSS
```

## Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant N as Nginx
    participant B as Backend
    participant R as Redis
    participant D as MySQL
    participant A as AI Provider

    U->>F: Submit Answer
    F->>N: POST /api/practice/answer
    N->>B: Forward Request
    B->>B: Validate JWT
    B->>R: Check evaluation cache
    alt Cache Hit
        R-->>B: Cached evaluation
    else Cache Miss
        B->>A: Evaluate (structured JSON)
        A-->>B: Evaluation response
        B->>R: Cache evaluation
        B->>D: Persist answer + evaluation
    end
    B-->>F: Structured response
    F-->>U: Score + feedback UI
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Controllers | HTTP handling, request/response mapping |
| Services | Business logic, orchestration |
| Repositories | Database access via Prisma |
| Validators | Zod schemas for input validation |
| Middleware | Auth, rate limit, error handling |
| AI Layer | Provider-agnostic AI operations |
| Cache Layer | Redis TTL-based caching |

## Security Boundaries

- API keys never exposed to frontend
- JWT access tokens (short-lived) + refresh tokens (httpOnly cookie)
- File uploads validated server-side, stored outside web root
- Rate limiting at IP, user, and AI request levels
