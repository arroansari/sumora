# Sumora - Production Setup & Deployment Guide

This guide details the complete configuration, verification, and deployment process for the Sumora AI-powered Social Media Activity Aggregator.

---

## 1. System Architecture Summary

```
                       ┌───────────────────────────────┐
                       │         Sumora Mobile         │
                       │ (Bare React Native CLI + TS)  │
                       │ Native Stack + Safe Area      │
                       └───────────────┬───────────────┘
                                       │
                         REST API / Bearer JWT Tokens
                                       ▼
                       ┌───────────────────────────────┐
                       │          Sumora API           │
                       │      (Node.js + Express)      │
                       └───────┬───────────────┬───────┘
                               │               │
                        Prisma │               │ Enqueue Jobs
                               ▼               ▼
                       ┌───────────────┐ ┌───────────────┐
                       │  PostgreSQL   │ │ Redis+BullMQ  │
                       │   Database    │ │ Background Q  │
                       └───────────────┘ └───────┬───────┘
                                                 │
            ┌────────────────────────────────────┼────────────────────────────────────┐
            ▼                                    ▼                                    ▼
┌───────────────────────┐            ┌───────────────────────┐            ┌───────────────────────┐
│   YouTube Connector   │            │  Transcript Engine    │            │ AI Summarizer Engine  │
│ - Google OAuth2       │            │ - YouTube Captions    │            │ - Gemini / OpenAI     │
│ - WebSub Hub Webhooks │            │ - Normalized Segments │            │ - Long-Chunking       │
│ - Subscriptions Sync  │            │ - Zero Hallucinations │            │ - 7 Structured Parts  │
└───────────────────────┘            └───────────────────────┘            └───────────────────────┘
```

---

## 2. Environment Variables Configuration

Copy `backend/.env.example` to `backend/.env` and populate credentials:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | API Server Port | `5000` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/sumora_dev?schema=public` |
| `REDIS_HOST` | Redis Server Host | `127.0.0.1` |
| `REDIS_PORT` | Redis Server Port | `6379` |
| `JWT_SECRET` | Secret for signing user tokens | `32+ character strong random secret` |
| `JWT_EXPIRES_IN` | Token validity | `7d` |
| `TOKEN_ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth Client ID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth Client Secret | `GOCSPX-xxxx` |
| `GOOGLE_REDIRECT_URI` | Backend OAuth callback endpoint | `http://localhost:5000/api/integrations/youtube/callback` |
| `WEBSUB_SECRET` | HMAC-SHA1 secret for YouTube Hub | `websub_secret_key_sumora` |
| `WEBSUB_CALLBACK_URL` | Public webhook callback URL | `https://your-domain.com/api/webhooks/youtube` |
| `AI_PROVIDER` | Active AI Provider | `gemini` or `openai` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `OPENAI_API_KEY` | OpenAI API Key (if using OpenAI) | `sk-...` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase Admin service account JSON | `/path/to/firebase-service-account.json` |

---

## 3. External Service Configuration

### A. Google Cloud Console (YouTube Data API v3 & OAuth 2.0)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g. `sumora-prod`).
3. Under **APIs & Services > Library**, enable:
   - **YouTube Data API v3**
4. Under **OAuth consent screen**:
   - Set User Type to **External**.
   - Add scopes:
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `openid`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
5. Under **Credentials > Create Credentials > OAuth client ID**:
   - Application Type: **Web Application**.
   - Authorized redirect URIs:
     - `http://localhost:5000/api/integrations/youtube/callback` (development)
     - `https://your-domain.com/api/integrations/youtube/callback` (production)
   - Save the Client ID and Client Secret in `backend/.env`.

### B. YouTube WebSub (PubSubHubbub) Real-Time Video Alerts
- YouTube WebSub automatically delivers real-time Atom XML notifications when subscribed channels upload new videos.
- For local testing, use a tunnel like ngrok or Cloudflare Tunnel:
  ```bash
  ngrok http 5000
  ```
  Set `WEBSUB_CALLBACK_URL=https://<your-subdomain>.ngrok-free.app/api/webhooks/youtube`.
- The WebSub handshake handles GET challenge requests with `hub.challenge` and validates incoming POST payloads with HMAC-SHA1 signatures via `X-Hub-Signature`.

---

## 4. Database Setup & Migrations

Sumora uses PostgreSQL with Prisma ORM.

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run Database Migrations
npm run prisma:migrate
```

---

## 5. Running the Backend & Background Workers

### Start Redis
Ensure Redis server is running:
```bash
redis-server
```

### Start Express API Server
```bash
cd backend
npm run dev
# Server listening on http://localhost:5000
# Health check available at: http://localhost:5000/api/health
```

---

## 6. Running the React Native Mobile Client

```bash
cd mobile

# Install dependencies (already completed)
npm install

# Start Metro Bundler
npm start

# Run on iOS Simulator (macOS only)
npm run ios

# Run on Android Emulator / Device
npm run android
```

---

## 7. Running the Automated Test Suite

Sumora includes comprehensive automated unit, module, and end-to-end integration test suites:

```bash
# 1. Run Complete Backend Test Suite (All 7 Test Suites)
cd backend
npm test

# 2. Run Complete Mobile Test Suite
cd ../mobile
npm test
```

### Backend Test Coverage Breakdown:
1. `tests/auth.test.js`: AES-256-GCM token encryption, JWT generation, bcrypt password hashing, and Zod input validation.
2. `tests/youtube_integration.test.js`: OAuth URL generation, WebSub topic URLs, Atom XML parsing, HMAC-SHA1 signature verification, and challenge handshakes.
3. `tests/transcript_engine.test.js`: Caption cleaning, unescaping entities, normalization, provider factory priority, and user SRT/plain text parsing.
4. `tests/ai_summarization.test.js`: Transcript chunking with overlap, structured 7-section Zod validation, provider switching, and empty caption rejection.
5. `tests/background_processing.test.js`: BullMQ queue options, retry backoff, deduplication job IDs, and 5-state lifecycle progression.
6. `tests/notifications.test.js`: Section 13 payload formatting, deep linking parameters, and multicast device token batching.
7. `tests/e2e_integration.test.js`: Complete 10-step user journey verification and negative anti-hallucination tests.

