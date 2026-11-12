# Sumora (AI-Powered Social Media Content Aggregator)

> **"All your content. One place. Smarter insights."**

Sumora is an AI-powered aggregator and intelligence layer that ingests video content from creators across platforms (starting with YouTube), retrieves authorized transcripts, and generates structured, time-stamped executive summaries and digests delivered directly to your mobile device via real-time push notifications.

---

## Architecture Overview

Sumora is organized as a modular repository with two completely decoupled applications:

- **`mobile/`**: Bare React Native (initialized with React Native Community CLI), TypeScript, React Navigation (Native Stack + Bottom Tabs), Atomic Design UI system, dark/light theme engine, and zero Expo dependencies.
- **`backend/`**: Node.js, Express.js, PostgreSQL with Prisma ORM, Redis and BullMQ job processing queues, modular services for transcripts, AI summarization, and push notification dispatchers.
- **`docs/`**: Comprehensive documentation covering project overview, system architecture, database schema, API documentation, and future roadmap.

```
sumora/
│
├── mobile/                  # React Native CLI (Bare React Native + TypeScript)
│   ├── android/             # Native Android project (configured permissions & Gradle)
│   ├── ios/                 # Native iOS Xcode workspace & CocoaPods
│   ├── src/                 # Atomic design UI, theme, navigation, screens, services
│   ├── App.tsx              # Root app component (Theme & Safe Area Providers)
│   ├── index.js             # React Native entrypoint
│   └── package.json
│
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/          # Environment, Prisma DB, and Redis configurations
│   │   ├── modules/         # Modular domain logic (auth, integrations, transcripts, ai, etc.)
│   │   ├── jobs/            # BullMQ queues & background job handlers
│   │   ├── middlewares/     # Error handlers & security middlewares
│   │   ├── routes/          # Health check and modular API routes
│   │   ├── app.js           # Express app definition
│   │   └── server.js        # Server listener
│   ├── prisma/
│   │   └── schema.prisma    # PostgreSQL Prisma schema
│   ├── tests/               # Backend tests
│   ├── .env.example         # Environment template
│   └── package.json
│
├── docs/
│   ├── PROJECT_OVERVIEW.md  # Detailed product vision and goals
│   ├── ARCHITECTURE.md      # Data pipeline and component topology
│   ├── DATABASE.md          # PostgreSQL schemas and data relationships
│   ├── API_DOCUMENTATION.md # REST endpoints specification
│   └── DEVELOPMENT_ROADMAP.md # Future implementation phases
│
├── .gitignore
├── README.md
└── package.json
```

---

## Technology Stack

| Component | Technology | Details |
|---|---|---|
| **Mobile Core** | React Native CLI (Bare RN) | v0.88.1, Zero Expo footprint |
| **Language** | TypeScript (Mobile), JavaScript (Backend) | Strict type checking enabled |
| **Navigation** | React Navigation v7 | Native Stack + Bottom Tabs |
| **Backend API** | Express.js / Node.js | v22.x LTS compatible, modular architecture |
| **Database** | PostgreSQL | Prisma ORM v5.22 |
| **Queues / Cache** | Redis & BullMQ | Asynchronous workers for transcripts & AI |
| **Push** | Firebase Cloud Messaging & APNs | Android POST_NOTIFICATIONS configured |

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v22.x LTS
- **Package Manager**: npm or Yarn
- **Java**: OpenJDK 17
- **Android SDK**: `platform-tools`, Android 34/35 SDK installed (`ANDROID_HOME` configured)
- **Xcode & CocoaPods** (for macOS / iOS development): Xcode 15/16/27+, CocoaPods 1.15+

### 2. Backend Setup & Execution
```bash
cd backend
cp .env.example .env
npm install

# Generate Prisma Client
npm run prisma:generate

# Start Backend Server
npm start
# or development with auto-reload:
npm run dev
```

Verify backend health:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "sumora-backend",
  "environment": "development",
  "components": {
    "database": "configured",
    "redis": "configured",
    "queue": "configured"
  }
}
```

### 3. Mobile Setup & Execution

#### iOS:
```bash
cd mobile
npm install
cd ios && pod install && cd ..

# Run on iOS Simulator:
npm run ios
# or:
npx react-native run-ios --simulator="iPhone 15"
```

#### Android:
```bash
cd mobile
npm install

# Run on Android Emulator:
npm run android
# or:
npx react-native run-android
```

#### Start Metro Bundler:
```bash
cd mobile
npm start
```

---

## Initial Verification & Tests Completed
- [x] Bare React Native initialized via official `@react-native-community/cli`
- [x] TypeScript compiler passes with 0 errors (`npx tsc --noEmit`)
- [x] iOS and Android Metro bundles build successfully
- [x] CocoaPods integrated and linked for React Navigation & native dependencies
- [x] Android `POST_NOTIFICATIONS` and `INTERNET` permissions configured
- [x] Express backend initialized with health check endpoint verified (`GET /api/health`)
- [x] PostgreSQL & Prisma schema modeled and client generated
- [x] BullMQ & Redis queues configured
- [x] Monorepo documentation complete in `docs/`

