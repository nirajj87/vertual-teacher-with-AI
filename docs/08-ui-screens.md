# UI Screen List

## Phase 1 Screens

| Screen | Route | Status |
|--------|-------|--------|
| Login | `/login` | Phase 1 |
| Register | `/register` | Phase 1 |
| Forgot Password | `/forgot-password` | Phase 1 |
| Reset Password | `/reset-password` | Phase 1 |
| Dashboard | `/dashboard` | Phase 1 |
| Profile | `/profile` | Phase 1 |
| Settings | `/settings` | Phase 1 |
| Email Verification | `/verify-email` | Phase 1 |

## Phase 2+ Screens

| Screen | Route | Phase |
|--------|-------|-------|
| Practice Setup | `/learn/practice/setup` | 2 |
| Practice Session | `/learn/practice/:sessionId` | 2 |
| Session Summary | `/learn/practice/:sessionId/summary` | 2 |
| Question Bank | `/questions` | 2 |
| Upload Questions | `/questions/upload` | 2 |
| Question Preview | `/questions/upload/preview` | 2 |
| English Teacher | `/learn/english` | 4 |
| Grammar Practice | `/learn/grammar` | 4 |
| Vocabulary | `/learn/vocabulary` | 4 |
| Mock Interview Setup | `/interview/setup` | 5 |
| Interview Session | `/interview/:sessionId` | 5 |
| Interview Summary | `/interview/:sessionId/summary` | 5 |
| Interview History | `/interview/history` | 5 |
| Progress Analytics | `/progress` | 6 |
| Weak Areas | `/progress/weak-areas` | 6 |
| Question Review | `/history/:answerId` | 2 |
| Admin Dashboard | `/admin` | 7 |

## Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Header (search, notifications, theme, profile)  │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │ Main Content Area                    │
│          │                                      │
│ Dashboard│                                      │
│ Learn    │                                      │
│ Interview│                                      │
│ Questions│                                      │
│ Progress │                                      │
│ History  │                                      │
│ Settings │                                      │
└──────────┴──────────────────────────────────────┘
```

Mobile: Sidebar → Drawer, bottom nav for key actions.

## Design System

- **Font**: Inter (UI), JetBrains Mono (code)
- **Colors**: CSS variables, light/dark mode
- **Spacing**: 4px base unit
- **Radius**: sm=6px, md=8px, lg=12px
- **Shadows**: subtle, layered
- **Animations**: 150-300ms transitions
