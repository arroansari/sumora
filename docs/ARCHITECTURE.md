# Architecture Documentation

## System Topology

```
                  ┌──────────────────────────────────────────────┐
                  │                 Sumora Mobile                │
                  │        (Bare React Native + TypeScript)       │
                  │   Native Stack + Bottom Tabs (Atomic Design) │
                  └───────────────────────┬──────────────────────┘
                                          │
                            REST API / Push Tokens
                                          ▼
                  ┌──────────────────────────────────────────────┐
                  │                 Sumora API                   │
                  │              (Node.js + Express)             │
                  └──────┬──────────────────────┬─────────▲──────┘
                         │                      │         │
                 Prisma  │                      │ Enqueue │ Jobs
                         ▼                      ▼         │
                  ┌───────────────┐      ┌────────────────┴──────┐
                  │  PostgreSQL   │      │     Redis + BullMQ    │
                  │   Database    │      │    Background Worker  │
                  └───────────────┘      └──────────────┬────────┘
                                                        │
                         ┌──────────────────────────────┼──────────────────────────────┐
                         ▼                              ▼                              ▼
              ┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
              │  YouTube Collector  │        │ Transcript Service  │        │ AI Summarizer Engine│
              │ (OAuth / Poller)    │        │ (Authorized Captions│        │ (Modular AI Adaptor)│
              └─────────────────────┘        └─────────────────────┘        └─────────────────────┘
```

## Content Pipeline Flow

```
YouTube Account Connection
          ↓
  Retrieve Subscriptions
          ↓
 Detect New Video Uploads
          ↓
Retrieve Authorized Transcript
          ↓
   Normalize Transcript
          ↓
    AI Summarization
          ↓
      Save Summary
          ↓
 Send Push Notification
          ↓
Display Summary in React Native
```

## Modular Separation
1. **Transcripts Service:** Independent worker/service responsible for extracting authorized captions and raw transcripts.
2. **AI Engine:** Dedicated orchestration module supporting pluggable LLMs (OpenAI, Gemini, Anthropic, or local models).
3. **Queue System:** BullMQ on Redis guarantees retry policies, exponential backoff, rate limiting, and failure isolation.
4. **Mobile Client:** Fully decoupled from backend implementation, interfacing via REST API and FCM/APNs notifications.

