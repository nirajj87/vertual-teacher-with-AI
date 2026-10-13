import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Download,
  Tags,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUploadPreview, useConfirmImport } from '@/hooks/usePractice';
import { ImportPreviewItem } from '@/types/practice';
import { getErrorMessage } from '@/lib/api';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Miscellaneous',
  'Laravel',
  'React',
  'MySQL',
  'OOPS',
  'JavaScript',
  'English',
  'Grammar',
  'Vocabulary',
  'Interview',
  'HR',
] as const;

export function UploadQuestionsPage() {
  const navigate = useNavigate();
  const uploadPreview = useUploadPreview();
  const confirmImport = useConfirmImport();

  const [preview, setPreview] = useState<{
    previewId: string;
    fileName: string;
    totalQuestions: number;
    withAnswers: number;
    missingAnswers: number;
    items: ImportPreviewItem[];
  } | null>(null);
  const [editableItems, setEditableItems] = useState<ImportPreviewItem[]>([]);
  const [bankName, setBankName] = useState('');
  const [category, setCategory] = useState<string>('Miscellaneous');
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const resolvedCategory =
    category === '__custom__'
      ? customCategory.trim() || 'Miscellaneous'
      : category || 'Miscellaneous';

  const applyCategoryToItems = (items: ImportPreviewItem[], cat: string) =>
    items.map((i) => ({
      ...i,
      topic: (i.topic || '').trim() || cat,
    }));

  const handleFile = async (file: File) => {
    setError('');
    try {
      const result = await uploadPreview.mutateAsync(file);
      setPreview(result);
      setEditableItems(applyCategoryToItems(result.items.map((i) => ({ ...i })), resolvedCategory));
      setBankName(result.fileName.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleCategoryChange = (value: string) => {
    const previous = resolvedCategory;
    setCategory(value);
    const next =
      value === '__custom__' ? customCategory.trim() || 'Miscellaneous' : value || 'Miscellaneous';
    setEditableItems((items) =>
      items.map((i) => {
        const current = (i.topic || '').trim();
        // Only overwrite empty rows or rows still on the previous default
        if (!current || current === previous) return { ...i, topic: next };
        return i;
      })
    );
  };

  const updateItem = (index: number, field: keyof ImportPreviewItem, value: string) => {
    setEditableItems((items) => {
      const updated = [...items];
      updated[index] = {
        ...updated[index],
        [field]: value,
        status: field === 'expectedAnswer' && value ? 'available' : updated[index].status,
      };
      return updated;
    });
  };

  const handleDownloadTemplate = async () => {
    setError('');
    setDownloadingTemplate(true);
    try {
      const response = await api.get('/question-banks/upload/template', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'question-upload-template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setError('');
    const fallback = resolvedCategory;
    try {
      const result = await confirmImport.mutateAsync({
        previewId: preview.previewId,
        bankName: bankName || `${fallback} Questions`,
        topic: fallback,
        questions: editableItems.map((i) => ({
          question: i.question,
          expectedAnswer: i.expectedAnswer,
          topic: (i.topic || '').trim() || fallback,
        })),
      });
      navigate(`/questions/${result.bankId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/questions"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Upload Questions</h1>
            <p className="text-muted-foreground">
              Category-wise import from Excel / CSV / PDF / DOCX / TXT
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
        >
          {downloadingTemplate ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Excel Template
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      {!preview ? (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                <Tags className="h-5 w-5 text-sky-600" />
              </div>
              <CardTitle className="text-lg">Category</CardTitle>
              <CardDescription>
                Applied to all questions without a Category column. Empty selection ={' '}
                <strong>Miscellaneous</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all',
                      category === c
                        ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/30'
                        : 'hover:border-sky-400/50'
                    )}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCategory('__custom__')}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all',
                    category === '__custom__'
                      ? 'border-sky-500 bg-sky-500/5 ring-2 ring-sky-500/30'
                      : 'hover:border-sky-400/50'
                  )}
                >
                  Custom…
                </button>
              </div>
              {category === '__custom__' && (
                <div className="space-y-2">
                  <Label>Custom category name</Label>
                  <Input
                    placeholder="e.g. Node.js, DSA"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{resolvedCategory}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Excel format</CardTitle>
              <CardDescription>
                Use the template columns: <code className="text-xs">Question</code>,{' '}
                <code className="text-xs">Expected Answer</code>,{' '}
                <code className="text-xs">Category</code>,{' '}
                <code className="text-xs">Difficulty</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border text-sm">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Question</th>
                      <th className="px-3 py-2 text-left font-medium">Expected Answer</th>
                      <th className="px-3 py-2 text-left font-medium">Category</th>
                      <th className="px-3 py-2 text-left font-medium">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-t">
                      <td className="px-3 py-2">What is Eloquent ORM?</td>
                      <td className="px-3 py-2">Laravel&apos;s Active Record ORM…</td>
                      <td className="px-3 py-2">Laravel</td>
                      <td className="px-3 py-2">MEDIUM</td>
                    </tr>
                    <tr className="border-t">
                      <td className="px-3 py-2">Props vs state in React?</td>
                      <td className="px-3 py-2">Props are inputs; state is local…</td>
                      <td className="px-3 py-2">React</td>
                      <td className="px-3 py-2">BEGINNER</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-12 transition-colors hover:border-primary/50"
              >
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">Drop your file here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Supports .xlsx, .csv, .pdf, .docx, .txt (max 10MB)
                </p>
                <label className="mt-6">
                  <Button disabled={uploadPreview.isPending} asChild>
                    <span>
                      {uploadPreview.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        <><FileText className="h-4 w-4" /> Choose File</>
                      )}
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls,.pdf,.docx,.txt"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Import Preview</CardTitle>
            <CardDescription>
              {preview.fileName} — {preview.totalQuestions} questions
              ({preview.withAnswers} with answers, {preview.missingAnswers} missing)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Question Bank Name</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Default category (empty rows)</Label>
                <Select value={category === '__custom__' ? '__custom__' : category} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {category === '__custom__' && (
                  <Input
                    className="mt-2"
                    placeholder="Custom category"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      const next = e.target.value.trim() || 'Miscellaneous';
                      setEditableItems((items) =>
                        items.map((i) => ({
                          ...i,
                          topic: (i.topic || '').trim() === resolvedCategory ? next : i.topic || next,
                        }))
                      );
                    }}
                  />
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">#</th>
                    <th className="px-4 py-3 text-left font-medium">Question</th>
                    <th className="px-4 py-3 text-left font-medium">Expected Answer</th>
                    <th className="px-4 py-3 text-left font-medium">Category</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {editableItems.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Textarea
                          value={item.question}
                          onChange={(e) => updateItem(i, 'question', e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Textarea
                          value={item.expectedAnswer || ''}
                          onChange={(e) => updateItem(i, 'expectedAnswer', e.target.value)}
                          placeholder="Optional — helps scoring"
                          className="min-h-[60px] text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          value={item.topic || resolvedCategory}
                          onChange={(e) => updateItem(i, 'topic', e.target.value)}
                          className="min-w-[120px] text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {item.expectedAnswer || item.status === 'available' ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-4 w-4" /> Missing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setPreview(null); setEditableItems([]); }}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={confirmImport.isPending || !bankName}>
                {confirmImport.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
                ) : (
                  `Import ${editableItems.length} Questions → ${resolvedCategory}`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
