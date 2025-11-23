# Notification Service

Simple Notification Service to handle Email, SMS and Push notifications with a small CRUD API and an endpoint to accept system events and trigger notifications.

Features:
- Create / Read / Update / Delete notifications
- Mock providers for email, SMS and push (logs to console and a file) for local testing
- Accept generic system events (`/api/events`) to convert them into notifications

Quick start:

1. Install deps

```bash
cd notification-service
npm install
```

2. Run in development

```bash
npm run dev
```

3. Endpoints
- Health: GET /health
- Notifications CRUD: /api/notifications
- Events: POST /api/events { eventType, payload }

Example event:

POST /api/events
{
  "eventType": "order.created",
  "payload": {
    "orderId": "abcd-1234",
    "customerEmail": "user@example.com"
  }
}

This will create a notification and use mock providers to "send" it (logs and optional file write).
