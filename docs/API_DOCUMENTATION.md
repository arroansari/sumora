# API Documentation

## Base URL
Development: `http://localhost:5000/api`

## Authentication & Headers
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

---

## Health Check
### `GET /api/health`
Verify that the Sumora backend service, database, and Redis connections are operating normally.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "sumora-backend",
  "timestamp": "2026-11-11T10:00:00.000Z",
  "environment": "development",
  "uptime": 12.34
}
```

---

## Planned Endpoints (Future Phases)

### Sources & Integrations
- `GET /api/integrations/status` - Current connected provider status (YouTube, etc.)
- `POST /api/integrations/youtube/connect` - Exchange OAuth code for tokens
- `GET /api/sources/subscriptions` - List aggregated subscriptions

### Summaries & Videos
- `GET /api/videos/feed` - Latest aggregated video summaries feed with pagination
- `GET /api/summaries/:id` - Full summary, key points, and transcript highlights

### Push & Notifications
- `POST /api/notifications/register-token` - Register mobile FCM/APNs device token
- `GET /api/notifications` - Notification history

