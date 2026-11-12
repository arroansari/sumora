# Sumora - Project Overview

> **Tagline:** All your content. One place. Smarter insights.

Sumora is an AI-powered social media content aggregator designed to centralize and distill video content and creator updates into actionable, smart summaries.

## Core Value Proposition
- **Unified Stream:** Aggregate content from multiple sources (starting with YouTube subscriptions) in one single dashboard.
- **Automated Ingestion:** Automatically detect newly published creator videos.
- **Accurate Transcripts:** Retrieve and normalize authorized captions and transcripts.
- **AI-Powered Summaries:** Extract key takeaways, chapter-wise timestamps, and core insights using modular AI services.
- **Real-Time Push Notifications:** Instant delivery of digested insights to mobile clients via FCM (Android) and APNs (iOS).

## Target Stack Overview
- **Mobile Client:** Bare React Native (via React Native Community CLI), TypeScript, React Navigation (Native Stack + Bottom Tabs).
- **Backend Application:** Node.js, Express.js (Modular JavaScript architecture).
- **Persistence Layer:** PostgreSQL with Prisma ORM.
- **Asynchronous Task Queue:** Redis + BullMQ for resilient ingestion and background summarization.
- **Push Engine:** Firebase Cloud Messaging (FCM) & Apple Push Notification service (APNs).
- **AI Orchestration:** Pluggable AI provider adapters for summarization.

