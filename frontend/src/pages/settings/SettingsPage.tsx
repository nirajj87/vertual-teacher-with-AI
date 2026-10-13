import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import api, { getErrorMessage } from '@/lib/api';
import { UserSettings } from '@/types';
import { useThemeStore, applyTheme } from '@/stores/themeStore';
import { useState } from 'react';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { setMode } = useThemeStore();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserSettings }>('/settings');
      return data.data;
    },
  });

  const [localSettings, setLocalSettings] = useState<Partial<UserSettings>>({});

  const defaultSettings: UserSettings = {
    theme: { mode: 'system', accentColor: 'blue' },
    notifications: { email: true, practiceReminders: true, weeklyReport: true },
    practice: { defaultDifficulty: 'MEDIUM', questionsPerSession: 20, showHints: true, autoAdvance: false },
    ai: { provider: 'gemini', maxTokens: 1024, temperature: 0.7 },
    voice: { enabled: true, speed: 1.0, autoPlayQuestions: false, sttProvider: 'browser', ttsProvider: 'browser' },
  };

  const current: UserSettings = {
    theme: { ...defaultSettings.theme, ...settings?.theme, ...localSettings.theme },
    notifications: { ...defaultSettings.notifications, ...settings?.notifications, ...localSettings.notifications },
    practice: { ...defaultSettings.practice, ...settings?.practice, ...localSettings.practice },
    ai: { ...defaultSettings.ai, ...settings?.ai, ...localSettings.ai },
    voice: { ...defaultSettings.voice, ...settings?.voice, ...localSettings.voice },
  };

  const patchSettings = (patch: Partial<UserSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...patch }));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const { data: res } = await api.patch('/settings', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      if (data.theme?.mode) {
        applyTheme(data.theme.mode);
        setMode(data.theme.mode);
      }
      setMessage('Settings saved successfully');
      setError('');
      setLocalSettings({});
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleSave = () => {
    if (Object.keys(localSettings).length > 0) {
      updateMutation.mutate(localSettings);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your app preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending || Object.keys(localSettings).length === 0}
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      {message && (
        <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Tabs defaultValue="appearance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={current.theme?.mode || 'system'}
                  onValueChange={(v) =>
                    patchSettings({
                      theme: { ...current.theme, mode: v as 'light' | 'dark' | 'system' },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practice" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Practice Settings</CardTitle>
              <CardDescription>Configure default practice session options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Difficulty</Label>
                <Select
                  value={current.practice?.defaultDifficulty || 'MEDIUM'}
                  onValueChange={(v) =>
                    patchSettings({
                      practice: {
                        ...current.practice,
                        defaultDifficulty: v as 'BEGINNER' | 'MEDIUM' | 'ADVANCED',
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Questions per Session</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={current.practice?.questionsPerSession || 20}
                  onChange={(e) =>
                    patchSettings({
                      practice: {
                        ...current.practice,
                        questionsPerSession: parseInt(e.target.value) || 20,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Hints</Label>
                  <p className="text-sm text-muted-foreground">Allow hints during practice</p>
                </div>
                <Switch
                  checked={current.practice?.showHints ?? true}
                  onCheckedChange={(checked) =>
                    patchSettings({
                      practice: { ...current.practice, showHints: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Advance</Label>
                  <p className="text-sm text-muted-foreground">Automatically go to next question</p>
                </div>
                <Switch
                  checked={current.practice?.autoAdvance ?? false}
                  onCheckedChange={(checked) =>
                    patchSettings({
                      practice: { ...current.practice, autoAdvance: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Configure AI provider and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>AI Provider</Label>
                <Select
                  value={current.ai?.provider || 'gemini'}
                  onValueChange={(v) =>
                    patchSettings({
                      ai: { ...current.ai, provider: v as 'gemini' | 'openai' | 'ollama' },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Output Tokens</Label>
                <Input
                  type="number"
                  min={256}
                  max={4096}
                  value={current.ai?.maxTokens || 1024}
                  onChange={(e) =>
                    patchSettings({
                      ai: { ...current.ai, maxTokens: parseInt(e.target.value) || 1024 },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Temperature ({current.ai?.temperature ?? 0.7})</Label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={current.ai?.temperature ?? 0.7}
                  onChange={(e) =>
                    patchSettings({
                      ai: { ...current.ai, temperature: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Voice Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable voice questions and answers</p>
                </div>
                <Switch
                  checked={current.voice?.enabled ?? true}
                  onCheckedChange={(checked) =>
                    patchSettings({
                      voice: { ...current.voice, enabled: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-play Questions</Label>
                  <p className="text-sm text-muted-foreground">Automatically read questions aloud</p>
                </div>
                <Switch
                  checked={current.voice?.autoPlayQuestions ?? false}
                  onCheckedChange={(checked) =>
                    patchSettings({
                      voice: { ...current.voice, autoPlayQuestions: checked },
                    })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Speech-to-Text Provider</Label>
                  <Select
                    value={current.voice?.sttProvider || 'browser'}
                    onValueChange={(v) =>
                      patchSettings({
                        voice: { ...current.voice, sttProvider: v as 'browser' | 'openai' | 'whisper' | 'mock' },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Browser (Web Speech API)</SelectItem>
                      <SelectItem value="openai">OpenAI Whisper</SelectItem>
                      <SelectItem value="mock">Mock (Development)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Text-to-Speech Provider</Label>
                  <Select
                    value={current.voice?.ttsProvider || 'browser'}
                    onValueChange={(v) =>
                      patchSettings({
                        voice: { ...current.voice, ttsProvider: v as 'browser' | 'openai' | 'mock' },
                      })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="browser">Browser (Web Speech)</SelectItem>
                      <SelectItem value="openai">OpenAI TTS</SelectItem>
                      <SelectItem value="mock">Mock (Development)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Playback Speed ({current.voice?.speed ?? 1}x)</Label>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.25}
                  value={current.voice?.speed ?? 1}
                  onChange={(e) =>
                    patchSettings({
                      voice: { ...current.voice, speed: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'email' as const, label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'practiceReminders' as const, label: 'Practice Reminders', desc: 'Daily practice reminders' },
                { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Weekly progress summary' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label>{label}</Label>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={current.notifications?.[key] ?? true}
                    onCheckedChange={(checked) =>
                      patchSettings({
                        notifications: { ...current.notifications, [key]: checked },
                      })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
