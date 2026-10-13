# AI Virtual Teacher — User Manual

End-user guide for practice, English, interviews, and progress tracking.

---

## 1. What is AI Virtual Teacher?

AI Virtual Teacher is a learning app that helps you:

- Practise technical topics (Laravel, React, MySQL, OOPS, JavaScript)
- Improve English (grammar, tenses, translation, WH questions, vocabulary)
- Prepare for interviews with scored feedback
- Track weak areas and improve over time

Answers can be checked by AI (e.g. Gemini) or by saved model answers to save tokens.

---

## 2. Getting started

### 2.1 Open the app

1. Start backend and frontend (see [README](../README.md)).
2. Open the frontend URL (default: **http://localhost:5174**).
3. Register a new account, or log in.

### 2.2 Default admin (after seed)

| Field    | Value                    |
|----------|--------------------------|
| Email    | `admin@virtualteacher.ai` |
| Password | `Admin@123456`           |

Change this password after first login in production.

### 2.3 First login checklist

1. Go to **Profile** — set name, English level, learning goals.
2. Go to **Settings** — theme, practice defaults, AI provider (if available).
3. Open **Dashboard** — see stats and quick actions.

---

## 3. Dashboard

The dashboard shows:

- Recent practice activity and scores
- Weak areas summary
- Shortcuts to Practice, English, Interview, Question Banks

Use it as your home base after every session.

---

## 4. Practice sessions

### 4.1 Start a session

1. Go to **Learn → Practice** (or Practice setup).
2. Choose:
   - **Topic / bank** (seeded public banks or your own)
   - **Difficulty** — Beginner / Medium / Advanced
   - **Number of questions**
   - **Source** — bank, AI, or mixed (as offered in UI)
3. Click **Start**.

### 4.2 During the session

1. Read the question carefully.
2. Type your answer (or use voice if speech is enabled).
3. Submit to get **score + short feedback**.
4. You can **end / close the session anytime** — results still show.
5. After the last question (or when you stop), see an **inline summary**.

### 4.3 After results

- **Close** — return to the previous screen.
- **Continue** — start another session on the **same category / topic**.

Scores are typically on a **0–10** scale with notes on correctness, clarity, and grammar where relevant.

---

## 5. English Teacher

Path: **Learn → English**

### 5.1 Modes

| Mode        | Path / area        | What you practise                          |
|-------------|--------------------|--------------------------------------------|
| Grammar     | `/learn/grammar`   | Tenses, translation, WH family, voice, etc.|
| Vocabulary  | `/learn/vocabulary`| Words, synonyms, confusions                |
| Conversation| Conversation page  | Speaking / dialogue style prompts          |

### 5.2 Grammar topics

On **Grammar Studio**, pick one focus per session:

| Topic            | Practice idea                                      |
|------------------|----------------------------------------------------|
| **Tenses**       | Forms, corrections, fill-in-the-blanks             |
| **Translation**  | Hindi → English and English → Hindi (50–50), all 12 tenses |
| **WH Family**    | What, Where, When, Why, Who, Which, Whose, Whom, How |
| **Voice**        | Active ↔ passive                                   |
| **Narration**    | Direct ↔ indirect speech                           |
| **Introduction** | Self-intro & speaking openers                      |
| Articles / Prepositions / Conditionals / SVA | Rule drills        |

**Tip:** For Translation, write the full translated sentence. Compare with the expected answer in feedback.

### 5.3 English correction

On the English Teacher home page you can paste a sentence and request a **correction** (when the feature is available on your build).

---

## 6. Interview Coach

Paths:

- `/interview/setup` — start a mock interview  
- `/interview/history` — past interviews  
- `/interview/analytics` — patterns and scores  

### How to use

1. Open **Interview setup**.
2. Choose role / focus (as shown in UI) and start.
3. Answer like a real interview — clear, structured (STAR where useful).
4. Review scores and tips after each answer / session.
5. Revisit **History** and **Analytics** to see improvement.

Seeded **Interview** bank covers HR + technical (Laravel, React, MySQL, OOPS).

---

## 7. Question banks

Paths:

- `/questions` — list banks  
- `/questions/upload` — import questions  
- `/questions/:id` — bank detail  

### 7.1 Public seeded banks (examples)

- Laravel, React, MySQL, OOPS, JavaScript  
- English — Tenses, Voice & Narration, Introduction & Speaking  
- English — **Translation** (100 Qs), **WH Family** (35 Qs)  
- Grammar, Vocabulary, Interview  

### 7.2 Upload your own questions

1. Go to **Questions → Upload**.
2. Choose or create a **category / bank**.
3. Use the **Excel / CSV template** if provided.
4. Preview rows → confirm import.
5. Practise from that bank in Practice setup.

Supported import types depend on the uploader (Excel/CSV and common document formats where enabled).

---

## 8. Progress & weak areas

| Page              | Use for                                      |
|-------------------|----------------------------------------------|
| `/progress`       | Overall progress charts and trends           |
| `/progress/weak-areas` | Topics where scores are lower + tips    |
| `/history`        | Past practice sessions                       |

### Recommended loop

1. Practise a topic.  
2. Check **Weak areas**.  
3. Re-practise the same category with **Continue**.  
4. Watch scores improve on the dashboard.

---

## 9. Profile & settings

### Profile

- Display name  
- English level (e.g. A2–C1 style levels if offered)  
- Goals and preferred AI provider  

### Settings

- Theme (light / dark)  
- Default difficulty and question count  
- Notifications / voice options (if enabled)  
- AI-related preferences  

---

## 10. Scoring & feedback

Typical feedback includes:

- Overall **score** (0–10)  
- Short **strengths** and **improvements**  
- A **model / expected answer** when available  

The app may reuse **stored Q&A** (seed + previous AI answers) so repeated practice uses fewer AI calls.

---

## 11. Tips for better practice

1. **One topic per session** — Grammar Studio is designed this way.  
2. **Translation** — keep tense labels in mind (Present Perfect, Past Continuous, etc.).  
3. **WH Family** — practise forming questions, not only answering them.  
4. **Interview** — answer in full sentences; mention impact and examples.  
5. **End early if stuck** — closing a session is OK; review summary and retry.  
6. **Upload custom banks** for company-specific or exam-specific drills.

---

## 12. Troubleshooting

| Problem                         | What to try                                      |
|---------------------------------|--------------------------------------------------|
| Cannot log in                   | Check email/password; use Forgot password        |
| “Active session” error          | Continue or abandon the existing session         |
| No questions / empty bank       | Run seed (`npm run db:seed`) or upload a bank    |
| AI slow or failing              | Check `AI_PROVIDER` + API key in `backend/.env`  |
| Frontend cannot reach API       | Backend on port **4000**; frontend **5174**      |
| Scores look wrong               | Ensure expected answers exist for bank questions |

For developer setup, see the root [README](../README.md).

---

## 13. Privacy & safety notes

- Do not commit real API keys or passwords.  
- Use strong passwords in production.  
- Uploaded files stay on the server under upload storage — treat them as private data.

---

## 14. Quick reference — main URLs

| Screen           | URL                         |
|------------------|-----------------------------|
| Login            | `/login`                    |
| Dashboard        | `/dashboard`                |
| Practice setup   | `/learn/practice/setup`     |
| English          | `/learn/english`            |
| Grammar          | `/learn/grammar`            |
| Vocabulary       | `/learn/vocabulary`         |
| Interview setup  | `/interview/setup`          |
| Question banks   | `/questions`                |
| Upload questions | `/questions/upload`         |
| Progress         | `/progress`                 |
| Weak areas       | `/progress/weak-areas`      |
| History          | `/history`                  |
| Profile          | `/profile`                  |
| Settings         | `/settings`                 |
