# Push Notification API Documentation

This document describes the API endpoints for managing FCM tokens and push notifications in your application.

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication

- **tRPC endpoints**: Use NextAuth session authentication
- **REST endpoints**: No authentication required (for anonymous users) or include user session

## API Endpoints

### 1. Register FCM Token

#### REST Endpoint

```http
POST /api/push-notifications/register
Content-Type: application/json

{
  "fcmToken": "string (required)",
  "deviceId": "string (optional)",
  "platform": "android|ios|web (required)",
  "appVersion": "string (optional)",
  "osVersion": "string (optional)",
  "deviceModel": "string (optional)",
  "userId": "string (optional)"
}
```

#### tRPC Endpoint

```typescript
// For anonymous users
api.pushNotifications.registerToken.useMutation({
  fcmToken: "string",
  deviceId: "string",
  platform: "android",
  appVersion: "1.0.0",
  osVersion: "13",
  deviceModel: "Pixel 7",
});

// For authenticated users
api.pushNotifications.registerTokenWithUser.useMutation({
  fcmToken: "string",
  deviceId: "string",
  platform: "android",
  appVersion: "1.0.0",
  osVersion: "13",
  deviceModel: "Pixel 7",
});
```

#### Response

```json
{
  "success": true,
  "message": "Token registered successfully",
  "data": {
    "id": "cuid",
    "fcmToken": "string",
    "platform": "android",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Subscribe to Topic

#### REST Endpoint

```http
POST /api/push-notifications/subscribe
Content-Type: application/json

{
  "fcmToken": "string (required)",
  "topicName": "string (required)"
}
```

#### tRPC Endpoint

```typescript
api.pushNotifications.subscribeDeviceToTopic.useMutation({
  fcmToken: "string",
  topicName: "news",
});
```

#### Response

```json
{
  "success": true,
  "message": "Successfully subscribed to topic: news",
  "data": {
    "subscription": {
      "id": "cuid",
      "topicName": "news",
      "isActive": true,
      "subscribedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Unsubscribe from Topic

#### REST Endpoint

```http
POST /api/push-notifications/unsubscribe
Content-Type: application/json

{
  "fcmToken": "string (required)",
  "topicName": "string (required)"
}
```

#### tRPC Endpoint

```typescript
api.pushNotifications.unsubscribeFromTopic.useMutation({
  fcmToken: "string",
  topicName: "news",
});
```

#### Response

```json
{
  "success": true,
  "message": "Successfully unsubscribed from topic: news",
  "data": {
    "updatedCount": 1
  }
}
```

### 4. Get Device Subscriptions

#### REST Endpoint

```http
GET /api/push-notifications/subscriptions?fcmToken=string
```

#### tRPC Endpoint

```typescript
api.pushNotifications.getDeviceSubscriptions.useQuery({
  fcmToken: "string",
});
```

#### Response

```json
{
  "success": true,
  "data": {
    "deviceToken": {
      "id": "cuid",
      "platform": "android",
      "appVersion": "1.0.0",
      "osVersion": "13",
      "deviceModel": "Pixel 7",
      "isActive": true,
      "lastUsedAt": "2024-01-01T00:00:00.000Z"
    },
    "subscriptions": [
      {
        "id": "cuid",
        "topicName": "news",
        "topicDescription": "News updates",
        "subscribedAt": "2024-01-01T00:00:00.000Z",
        "isActive": true
      }
    ]
  }
}
```

### 5. Deactivate Token

#### REST Endpoint

```http
POST /api/push-notifications/deactivate
Content-Type: application/json

{
  "fcmToken": "string (required)"
}
```

#### tRPC Endpoint

```typescript
api.pushNotifications.deactivateToken.useMutation({
  fcmToken: "string",
});
```

#### Response

```json
{
  "success": true,
  "message": "Device token deactivated successfully",
  "data": {
    "id": "cuid",
    "fcmToken": "string",
    "isActive": false,
    "deactivatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Get User's Device Tokens (tRPC only)

```typescript
api.pushNotifications.getUserTokens.useQuery();
```

### 7. Get Available Topics (tRPC only)

```typescript
api.pushNotifications.getTopics.useQuery();
```

### 8. Get User Notification Preferences (tRPC only)

```typescript
api.pushNotifications.getNotificationPreferences.useQuery();
```

### 9. Update User Notification Preferences (tRPC only)

```typescript
api.pushNotifications.updateNotificationPreferences.useMutation({
  pushEnabled: true,
  marketingEnabled: false,
  newsEnabled: true,
  reminderEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  timezone: "America/New_York",
});
```

## Send Notification Endpoints

### 10. Send Notification to User

#### tRPC Endpoint

```typescript
api.pushNotifications.sendToUser.useMutation({
  userId: "user_id_here",
  payload: {
    title: "Notification Title",
    body: "Notification body text",
    data: {
      type: "test",
      timestamp: "2024-01-01T00:00:00.000Z",
    },
    imageUrl: "https://example.com/image.jpg", // optional
    clickAction: "OPEN_ACTIVITY", // optional
  },
  dryRun: false, // optional, default false
});
```

#### REST Endpoint

```http
POST /api/push-notifications/send
Content-Type: application/json

{
  "type": "user",
  "userId": "user_id_here",
  "payload": {
    "title": "Notification Title",
    "body": "Notification body text",
    "data": {
      "type": "test",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "imageUrl": "https://example.com/image.jpg",
    "clickAction": "OPEN_ACTIVITY"
  },
  "dryRun": false
}
```

### 11. Send Notification to FCM Tokens

#### tRPC Endpoint

```typescript
api.pushNotifications.sendToTokens.useMutation({
  fcmTokens: ["token1", "token2", "token3"],
  payload: {
    title: "Notification Title",
    body: "Notification body text",
    data: {
      type: "test",
    },
  },
  dryRun: false,
});
```

#### REST Endpoint

```http
POST /api/push-notifications/send
Content-Type: application/json

{
  "type": "tokens",
  "fcmTokens": ["token1", "token2", "token3"],
  "payload": {
    "title": "Notification Title",
    "body": "Notification body text",
    "data": {
      "type": "test"
    }
  },
  "dryRun": false
}
```

### 12. Send Notification to Topic

#### tRPC Endpoint

```typescript
api.pushNotifications.sendToTopic.useMutation({
  topicName: "news",
  payload: {
    title: "Breaking News",
    body: "Check out the latest news!",
    data: {
      type: "news",
      articleId: "123",
    },
  },
  dryRun: false,
});
```

#### REST Endpoint

```http
POST /api/push-notifications/send
Content-Type: application/json

{
  "type": "topic",
  "topicName": "news",
  "payload": {
    "title": "Breaking News",
    "body": "Check out the latest news!",
    "data": {
      "type": "news",
      "articleId": "123"
    }
  },
  "dryRun": false
}
```

### 13. Send Notification to All Devices

#### tRPC Endpoint

```typescript
api.pushNotifications.sendToAllDevices.useMutation({
  payload: {
    title: "Global Announcement",
    body: "Important update for all users!",
    data: {
      type: "announcement",
    },
  },
  dryRun: false,
});
```

#### REST Endpoint

```http
POST /api/push-notifications/send
Content-Type: application/json

{
  "type": "all",
  "payload": {
    "title": "Global Announcement",
    "body": "Important update for all users!",
    "data": {
      "type": "announcement"
    }
  },
  "dryRun": false
}
```

### 14. Send Notification to Platform

#### tRPC Endpoint

```typescript
api.pushNotifications.sendToPlatform.useMutation({
  platform: "android",
  payload: {
    title: "Android Update",
    body: "New features available for Android users!",
    data: {
      type: "platform_update",
      platform: "android",
    },
  },
  dryRun: false,
});
```

#### REST Endpoint

```http
POST /api/push-notifications/send
Content-Type: application/json

{
  "type": "platform",
  "platform": "android",
  "payload": {
    "title": "Android Update",
    "body": "New features available for Android users!",
    "data": {
      "type": "platform_update",
      "platform": "android"
    }
  },
  "dryRun": false
}
```

### 15. Get Notification Statistics

#### tRPC Endpoint

```typescript
api.pushNotifications.getNotificationStats.useQuery({
  startDate: new Date("2024-01-01"), // optional
  endDate: new Date("2024-12-31"), // optional
});
```

#### Response

```json
{
  "success": true,
  "stats": {
    "total": 1500,
    "sent": 1200,
    "delivered": 1100,
    "failed": 100,
    "pending": 200
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fcmToken",
      "message": "FCM token is required"
    }
  ]
}
```

## HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `404` - Not Found (token/topic not found)
- `500` - Internal Server Error

## Usage Examples

### Android App Integration

```typescript
// Register token when app starts
const registerToken = async (fcmToken: string) => {
  try {
    const response = await fetch("/api/push-notifications/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fcmToken,
        platform: "android",
        appVersion: "1.0.0",
        osVersion: "13",
        deviceModel: "Pixel 7",
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log("Token registered successfully");
    }
  } catch (error) {
    console.error("Failed to register token:", error);
  }
};

// Subscribe to topic
const subscribeToTopic = async (fcmToken: string, topicName: string) => {
  try {
    const response = await fetch("/api/push-notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fcmToken,
        topicName,
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log(`Subscribed to ${topicName}`);
    }
  } catch (error) {
    console.error("Failed to subscribe to topic:", error);
  }
};
```

## Best Practices

1. **Register token on app start** - Always register the FCM token when the app starts
2. **Handle token refresh** - FCM tokens can change, so listen for token refresh events
3. **Deactivate on logout** - Deactivate tokens when users log out
4. **Error handling** - Always handle API errors gracefully
5. **Retry logic** - Implement retry logic for failed requests
6. **Offline support** - Store token locally and sync when online
