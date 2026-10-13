import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute, GuestRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { QuestionBankPage } from '@/pages/questions/QuestionBankPage';
import { QuestionBankDetailPage } from '@/pages/questions/QuestionBankDetailPage';
import { UploadQuestionsPage } from '@/pages/questions/UploadQuestionsPage';
import { PracticeSetupPage } from '@/pages/practice/PracticeSetupPage';
import { PracticeSessionPage } from '@/pages/practice/PracticeSessionPage';
import { SessionSummaryPage } from '@/pages/practice/SessionSummaryPage';
import { HistoryPage } from '@/pages/history/HistoryPage';
import { EnglishTeacherPage } from '@/pages/english/EnglishTeacherPage';
import { GrammarPage } from '@/pages/english/GrammarPage';
import { VocabularyPage } from '@/pages/english/VocabularyPage';
import { ConversationPage } from '@/pages/english/ConversationPage';
import { InterviewSetupPage } from '@/pages/interview/InterviewSetupPage';
import { InterviewHistoryPage } from '@/pages/interview/InterviewHistoryPage';
import { InterviewAnalyticsPage } from '@/pages/interview/InterviewAnalyticsPage';
import { ProgressPage } from '@/pages/progress/ProgressPage';
import { WeakAreasPage } from '@/pages/progress/WeakAreasPage';
import { useEffect } from 'react';
import { applyTheme, useThemeStore } from '@/stores/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    applyTheme(mode);

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [mode]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />

                <Route path="/learn/practice/setup" element={<PracticeSetupPage />} />
                <Route path="/learn/practice/:sessionId/summary" element={<SessionSummaryPage />} />
                <Route path="/learn/practice/:sessionId" element={<PracticeSessionPage />} />

                <Route path="/learn/english" element={<EnglishTeacherPage />} />
                <Route path="/learn/english/conversation" element={<ConversationPage />} />
                <Route path="/learn/vocabulary" element={<VocabularyPage />} />
                <Route path="/learn/grammar" element={<GrammarPage />} />

                <Route path="/interview/setup" element={<InterviewSetupPage />} />
                <Route path="/interview/history" element={<InterviewHistoryPage />} />
                <Route path="/interview/analytics" element={<InterviewAnalyticsPage />} />

                <Route path="/questions" element={<QuestionBankPage />} />
                <Route path="/questions/upload" element={<UploadQuestionsPage />} />
                <Route path="/questions/:id" element={<QuestionBankDetailPage />} />

                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/progress/weak-areas" element={<WeakAreasPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
