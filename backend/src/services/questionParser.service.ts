export interface ParsedQuestionItem {
  question: string;
  expectedAnswer?: string;
  topic?: string;
  status: 'available' | 'missing';
}

const QUESTION_PATTERNS = [
  /(?:^|\n)\s*(?:question|q)\s*[:\.]?\s*(.+?)(?=(?:\n\s*(?:expected|answer|a)\s*[:\.]|\n\s*(?:question|q)\s*[:\.]|$))/gis,
  /(?:^|\n)\s*(\d+[\.\)]\s*.+?)(?=\n\s*\d+[\.\)]|\n\s*(?:expected|answer)|$)/gis,
];

const ANSWER_PATTERNS = [
  /(?:expected\s*answer|answer|expected|a)\s*[:\.]?\s*(.+?)(?=(?:\n\s*(?:question|q)\s*[:\.]|\n\s*(?:expected|answer)|$))/gis,
];

export function parseTextContent(content: string): ParsedQuestionItem[] {
  const items: ParsedQuestionItem[] = [];
  const blocks = content.split(/\n-{3,}\n|\n={3,}\n/).filter(Boolean);

  if (blocks.length > 1) {
    for (const block of blocks) {
      const item = parseBlock(block);
      if (item) items.push(item);
    }
    return items;
  }

  const qaPairs = content.split(/(?=(?:^|\n)\s*(?:question|q)\s*[:\.])/gim);
  for (const pair of qaPairs) {
    const item = parseBlock(pair);
    if (item) items.push(item);
  }

  if (items.length === 0) {
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length > 10 && !line.toLowerCase().startsWith('answer')) {
        items.push({ question: line.replace(/^\d+[\.\)]\s*/, ''), status: 'missing' });
      }
    }
  }

  return items;
}

function parseBlock(block: string): ParsedQuestionItem | null {
  const trimmed = block.trim();
  if (!trimmed) return null;

  let question = '';
  let expectedAnswer: string | undefined;

  const qMatch = trimmed.match(/(?:question|q)\s*[:\.]?\s*(.+?)(?=\n\s*(?:expected|answer|a)\s*[:\.]|$)/is);
  if (qMatch) {
    question = qMatch[1].trim();
    const aMatch = trimmed.match(/(?:expected\s*answer|answer|expected|a)\s*[:\.]?\s*(.+)/is);
    expectedAnswer = aMatch?.[1]?.trim();
  } else {
    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    question = lines[0]?.replace(/^\d+[\.\)]\s*/, '') || '';
    const answerLine = lines.find((l) => /^(expected|answer|a)\s*[:\.]/i.test(l));
    if (answerLine) {
      expectedAnswer = answerLine.replace(/^(expected\s*answer|answer|expected|a)\s*[:\.]?\s*/i, '');
    }
  }

  if (!question || question.length < 5) return null;

  return {
    question,
    expectedAnswer,
    status: expectedAnswer ? 'available' : 'missing',
  };
}

export function parseCSVContent(content: string): ParsedQuestionItem[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const header = lines[0].toLowerCase().split(delimiter).map((h) => h.trim().replace(/"/g, ''));

  const qIdx = header.findIndex((h) => /question|^q$/.test(h));
  const aIdx = header.findIndex((h) => /answer|expected/.test(h));
  const tIdx = header.findIndex((h) => /topic|subject|category|cat/.test(h));

  const startRow = qIdx >= 0 ? 1 : 0;
  const items: ParsedQuestionItem[] = [];

  for (let i = startRow; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    const question = cols[qIdx >= 0 ? qIdx : 0]?.trim();
    if (!question || question.length < 3) continue;

    const expectedAnswer = aIdx >= 0 ? cols[aIdx]?.trim() : cols[1]?.trim();
    const topic = tIdx >= 0 ? cols[tIdx]?.trim() : undefined;

    items.push({
      question,
      expectedAnswer: expectedAnswer || undefined,
      topic,
      status: expectedAnswer ? 'available' : 'missing',
    });
  }

  return items;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.replace(/^"|"$/g, ''));
  return result;
}

export async function parseFileBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ParsedQuestionItem[]> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (mimeType === 'text/plain' || ext === 'txt') {
    return parseTextContent(buffer.toString('utf-8'));
  }

  if (mimeType === 'text/csv' || ext === 'csv') {
    return parseCSVContent(buffer.toString('utf-8'));
  }

  if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
    return rows
      .map((row) => {
        const keys = Object.keys(row);
        const qKey = keys.find((k) => /question|^q$/i.test(k)) || keys[0];
        const aKey = keys.find((k) => /answer|expected/i.test(k));
        const tKey = keys.find((k) => /topic|subject|category|cat/i.test(k));
        const question = String(row[qKey] || '').trim();
        if (!question) return null;
        const expectedAnswer = aKey ? String(row[aKey] || '').trim() : undefined;
        const topicRaw = tKey ? String(row[tKey] || '').trim() : '';
        return {
          question,
          expectedAnswer: expectedAnswer || undefined,
          topic: topicRaw || undefined,
          status: (expectedAnswer ? 'available' : 'missing') as 'available' | 'missing',
        };
      })
      .filter(Boolean) as ParsedQuestionItem[];
  }

  if (ext === 'pdf' || mimeType === 'application/pdf') {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as { default: (buf: Buffer) => Promise<{ text: string }> }).default;
    const data = await pdfParse(buffer);
    return parseTextContent(data.text);
  }

  if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return parseTextContent(result.value);
  }

  throw new Error(`Unsupported file type: ${ext || mimeType}`);
}
