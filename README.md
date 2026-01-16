# TeamInsight

TeamInsight is a full-stack web platform for **student project teams** and a **lecturer/admin**. It supports:
- Team sign-in via a **signed httpOnly cookie session**
- **Team ↔ Lecturer messaging** (threads)
- Gemini-powered AI: **Free Chat** and **Guided Reflection** (saved to the database)
- Lecturer tools: teams overview, announcements, alerts, and analytics

---

## 🚀 Fast Setup (Local Run)

> **Important:** To run the app locally, this repository must include the runnable Next.js source code (e.g., `package.json`, `app/`, `lib/`, `models/`).
>
> If you cloned the repo and only see `Diagrams/` + `README.md`, you are looking at a **documentation-only snapshot**. In that case, you cannot run the app until the code is added (or until you switch to the branch/tag that contains the full project).

### Prerequisites
- **Node.js** (recommended: LTS)
- **npm**
- **MongoDB** (MongoDB Atlas or local MongoDB)
- **Gemini API key** (required for AI features)
- (Optional) Gmail SMTP credentials (only if email notifications are enabled)

### 1) Clone
```bash
git clone https://github.com/evyathar/TeamInsight.git
cd TeamInsight
```

### 2) Install dependencies
```bash
npm install
```

### 3) Create environment file
Create **`.env.local`** in the project root (same level as `package.json`).

You can copy from `.env.example`:
```bash
cp .env.example .env.local
```

### 4) Fill `.env.local`
```env
# =====================================================
# DATABASE
# =====================================================
MONGODB_URI=

# =====================================================
# AI / GEMINI
# =====================================================
GEMINI_API_KEY=

# =====================================================
# SESSION SECURITY
# =====================================================
TEAM_SESSION_SECRET=

# =====================================================
# EMAIL (Gmail SMTP)
# =====================================================
MAIL_USER=
MAIL_PASS=
```

### 5) Run
```bash
npm run dev
```

Open:
- http://localhost:3000

---

## Environment Variables (Detailed)

### `MONGODB_URI` (Required)
MongoDB connection string.

**Two common approaches:**
1) **MongoDB Atlas (recommended for reviewers)**
   - Pros: no local DB install, consistent across machines
   - Cons: requires Atlas setup + network allowlist
2) **Local MongoDB**
   - Pros: works offline, quick for personal development
   - Cons: reviewers must install MongoDB locally

Examples:
- Atlas:
  - `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbName>?retryWrites=true&w=majority`
- Local:
  - `mongodb://127.0.0.1:27017/teaminsight`

### `GEMINI_API_KEY` (Required for AI)
Gemini API key used for AI endpoints (Free Chat + Guided Reflection).

If missing/invalid:
- the app may still start, but AI features will fail (depending on how routes are guarded).

### `TEAM_SESSION_SECRET` (Required)
Secret used to sign/verify the `team_session` httpOnly cookie.

Generate a strong secret:

**Option A (Node, cross-platform):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option B (OpenSSL):**
```bash
openssl rand -base64 32
```

### `MAIL_USER` / `MAIL_PASS` (Optional)
Used for Gmail SMTP email notifications.

**Two approaches:**
1) **Enable email**
   - Pros: full feature coverage if the app sends notifications
   - Cons: requires Gmail configuration (recommended: 2FA + App Password)
2) **Disable email**
   - Pros: simpler setup for reviewers
   - Cons: email notifications won’t be sent

---

## System Overview

### Team Portal
- Join using `teamId + accessCode`
- Free AI chat
- Guided reflection flow (server-controlled question order, persisted to DB)
- Messages (threads) between team and lecturer

### Lecturer/Admin Portal
- Login (single lecturer concept)
- Teams overview + team details
- Insights / analytics
- Alerts and announcements
- Message threads with teams

---

## Architecture (High-Level)

- **Next.js App Router** provides both UI and API routes
- **MongoDB + Mongoose** for persistence
- **Team authentication** via signed httpOnly cookie (`team_session`)
- **Gemini** integration for AI flows

### Team Authentication (Cookie Session)
After a successful `POST /api/team/join`, the server sets an httpOnly cookie named `team_session`.
Subsequent requests (e.g., `GET /api/team/me`) validate that cookie.

---

## Data Model (MongoDB)

Core entities:
- **Lecturer**: system admin (auth, receives alerts)
- **Team**: team identity + access code + members + status
- **ReflectionChatSession**: guided reflection session per tab (`sessionId`), messages, answers, summary, status
- **Alert**: abnormal event history + email tracking
- **Announcement**: lecturer broadcasts tasks/updates
- **MessageThread**: a thread between team and lecturer
- **MessageMessage**: single message inside a thread

Relationships:
- Team → ReflectionChatSession (1:N)
- Team → Alert (1:N)
- Announcement → Team (broadcast / target list)
- Team → MessageThread (1:N)
- MessageThread → MessageMessage (1:N)

---

## API Routes (Overview)

### Auth
- `POST /api/lecturer/login`

### Team (cookie auth)
- `POST /api/team/join`
- `GET  /api/team/me`

### Team AI (Gemini)
- `POST /api/team/ai/free`
- `POST /api/team/ai/feedback`

### Guided Reflection
- `POST /api/team/reflection/start`
- `POST /api/team/reflection/message`
- `POST /api/team/reflection/submit`

### Team Messages
- `GET  /api/team/messages`
- `POST /api/team/messages`
- `GET  /api/team/messages/[threadId]`
- `POST /api/team/messages/[threadId]`

### Lecturer / Admin (Teams)
- `GET  /api/teams`
- `GET  /api/teams/[teamId]`
- `PUT  /api/teams/[teamId]`
- `GET  /api/teams/[teamId]/insights`
- `GET  /api/teams/[teamId]/chat`
- `POST /api/teams/[teamId]/chat`
- `GET  /api/teams/[teamId]/reflections`
- `GET  /api/teams/[teamId]/alerts`

### Announcements / Alerts / Analytics
- `POST /api/announcements`
- `GET  /api/announcements`
- `POST /api/alerts`
- `GET  /api/analytics/teams`
- `GET  /api/analytics/compare`

---

## Troubleshooting

### App starts, but API returns 500
- Usually DB connection issues:
  - Check `MONGODB_URI`
  - Atlas: verify IP/network allowlist and DB user credentials

### Team session always unauthorized
- Ensure `TEAM_SESSION_SECRET` is set
- Clear cookies for `localhost:3000` and retry

### AI endpoints fail
- Ensure `GEMINI_API_KEY` is set and valid

### Email sending fails
- Prefer Gmail App Passwords (2FA enabled)
- Or disable email by leaving `MAIL_USER` / `MAIL_PASS` empty (if supported)

---

## Diagrams
See `Diagrams/` for system and flow diagrams.
