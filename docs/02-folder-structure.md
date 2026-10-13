# Folder Structure

```
vertual_teacher/
├── docs/                          # Architecture & planning docs
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   ├── mysql/
│   │   └── init.sql
│   └── redis/
│       └── redis.conf
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── database.ts
│   │   │   └── redis.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── settings.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── token.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── settings.service.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.ts
│   │   │   └── refreshToken.repository.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── settings.routes.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   └── validate.middleware.ts
│   │   ├── validators/
│   │   │   ├── auth.validator.ts
│   │   │   └── user.validator.ts
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   │   ├── base.provider.ts
│   │   │   │   ├── gemini.provider.ts
│   │   │   │   └── openai.provider.ts
│   │   │   ├── factory.ts
│   │   │   └── types.ts
│   │   ├── cache/
│   │   │   └── cache.service.ts
│   │   ├── utils/
│   │   │   ├── apiResponse.ts
│   │   │   ├── logger.ts
│   │   │   └── hash.ts
│   │   ├── types/
│   │   │   └── express.d.ts
│   │   └── app.ts
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn components
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   └── auth/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   └── themeStore.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```
