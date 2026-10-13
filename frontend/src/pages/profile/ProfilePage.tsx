import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api, { getErrorMessage } from '@/lib/api';
import { UserProfile } from '@/types';
import { useState } from 'react';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data.data;
    },
  });

  const [form, setForm] = useState<Partial<UserProfile>>({});

  const profile = userData?.profile;
  const currentForm = { ...profile, ...form };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const { data: res } = await api.patch('/users/me', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-me'] });
      setMessage('Profile updated successfully');
      setError('');
      setForm({});
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
      setMessage('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and learning preferences</p>
      </div>

      {message && (
        <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and learning goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={currentForm.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={userData?.email || ''} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningGoal">Learning Goal</Label>
            <Input
              id="learningGoal"
              placeholder="e.g., Interview preparation, Improve English"
              value={currentForm.learningGoal || ''}
              onChange={(e) => setForm({ ...form, learningGoal: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetRole">Target Role</Label>
            <Input
              id="targetRole"
              placeholder="e.g., Full Stack Developer"
              value={currentForm.targetRole || ''}
              onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Preferences</CardTitle>
          <CardDescription>Configure your English level and experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>English Level</Label>
              <Select
                value={currentForm.englishLevel || 'A2'}
                onValueChange={(v) => setForm({ ...form, englishLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select
                value={currentForm.experienceLevel || 'FRESHER'}
                onValueChange={(v) => setForm({ ...form, experienceLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'].map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0) + level.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred AI Provider</Label>
              <Select
                value={currentForm.preferredAiProvider || 'GEMINI'}
                onValueChange={(v) => setForm({ ...form, preferredAiProvider: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GEMINI">Gemini</SelectItem>
                  <SelectItem value="OPENAI">OpenAI</SelectItem>
                  <SelectItem value="OLLAMA">Ollama (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Voice Preference</Label>
              <Select
                value={currentForm.voicePreference || 'FEMALE'}
                onValueChange={(v) => setForm({ ...form, voicePreference: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isPending || Object.keys(form).length === 0}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
