# Push Notification Setup Guide

This guide will help you set up push notifications for your application using Firebase Cloud Messaging (FCM).

## Prerequisites

1. A Firebase project with Cloud Messaging enabled
2. Node.js and pnpm installed
3. A database (PostgreSQL recommended)

## 1. Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name and follow the setup wizard
4. Enable Google Analytics (optional but recommended)

### Step 2: Enable Cloud Messaging

1. In your Firebase project, go to "Project Settings" (gear icon)
2. Click on the "Cloud Messaging" tab
3. Note down your Server Key (you'll need this for testing)

### Step 3: Generate Service Account Key

1. In Firebase Console, go to "Project Settings" > "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file
4. **Keep this file secure** - it contains sensitive credentials

## 2. Environment Variables

Create a `.env` file in the `apps/pushes-sender` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/push_notifications"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id",...}'
FIREBASE_PROJECT_ID="your-project-id"
```

### Getting the Service Account Key

1. Copy the entire contents of the downloaded JSON file
2. Minify it (remove all whitespace and newlines)
3. Escape any quotes if needed
4. Paste it as the value for `FIREBASE_SERVICE_ACCOUNT_KEY`

Example:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"my-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xyz@my-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xyz%40my-project.iam.gserviceaccount.com"}'
```

## 3. Database Setup

### Step 1: Run Migrations

```bash
cd apps/pushes-sender
pnpm db:push
```

This will create all the necessary tables for push notifications.

### Step 2: Verify Tables

You should see these tables in your database:

- `User`
- `DeviceToken`
- `Topic`
- `DeviceTopicSubscription`
- `SentNotification`
- `NotificationTemplate`
- `UserNotificationPreferences`

## 4. Testing the Setup

### Step 1: Start the Development Server

```bash
cd apps/pushes-sender
pnpm dev
```

### Step 2: Test Token Registration

1. Open your app in a browser
2. Register a device token using the API
3. Check the database to verify the token was stored

### Step 3: Test Notification Sending

1. Go to the notification sender UI at `http://localhost:3000`
2. Use the "Dry Run" mode first to test without sending actual notifications
3. Once confirmed working, disable dry run to send real notifications

## 5. Mobile App Setup

### Android Setup

1. Add Firebase to your Android project
2. Add the `google-services.json` file to `android/app/`
3. Configure FCM in your Android app
4. Register for push notifications and get the FCM token
5. Send the token to your server using the registration endpoint

### iOS Setup

1. Add Firebase to your iOS project
2. Add the `GoogleService-Info.plist` file to your iOS project
3. Configure FCM in your iOS app
4. Register for push notifications and get the FCM token
5. Send the token to your server using the registration endpoint

### Web Setup

1. Add Firebase to your web project
2. Configure FCM in your web app
3. Register for push notifications and get the FCM token
4. Send the token to your server using the registration endpoint

## 6. API Usage Examples

### Register a Device Token

```typescript
// Using tRPC
const result = await api.pushNotifications.registerToken.mutate({
  fcmToken: "your-fcm-token-here",
  platform: "android",
  appVersion: "1.0.0",
  osVersion: "13",
  deviceModel: "Pixel 7",
  userId: "user-id-optional",
});

// Using REST API
const response = await fetch("/api/push-notifications/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fcmToken: "your-fcm-token-here",
    platform: "android",
    appVersion: "1.0.0",
    osVersion: "13",
    deviceModel: "Pixel 7",
    userId: "user-id-optional",
  }),
});
```

### Send Notification to User

```typescript
// Using tRPC
const result = await api.pushNotifications.sendToUser.mutate({
  userId: "user-id-here",
  payload: {
    title: "Hello!",
    body: "This is a test notification",
    data: {
      type: "test",
      timestamp: new Date().toISOString(),
    },
  },
  dryRun: false,
});

// Using REST API
const response = await fetch("/api/push-notifications/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "user",
    userId: "user-id-here",
    payload: {
      title: "Hello!",
      body: "This is a test notification",
      data: {
        type: "test",
        timestamp: new Date().toISOString(),
      },
    },
    dryRun: false,
  }),
});
```

## 7. Troubleshooting

### Common Issues

1. **"FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required"**
   - Make sure you've set the environment variable correctly
   - Ensure the JSON is properly formatted and escaped

2. **"Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format"**
   - Check that the JSON is valid and properly escaped
   - Try minifying the JSON again

3. **"No active device tokens found"**
   - Make sure devices have registered their FCM tokens
   - Check that tokens are marked as active in the database

4. **Notifications not received**
   - Verify the FCM token is correct
   - Check that the app has notification permissions
   - Ensure the app is properly configured for FCM

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=true
```

This will provide more detailed error messages in the console.

## 8. Production Considerations

1. **Security**
   - Keep your service account key secure
   - Use environment variables, never commit keys to version control
   - Consider using a secrets management service

2. **Rate Limiting**
   - Implement rate limiting for notification sending
   - Monitor FCM quotas and limits

3. **Monitoring**
   - Set up monitoring for notification delivery rates
   - Track failed notifications and retry logic
   - Monitor FCM service health

4. **Scaling**
   - Consider using FCM batch sending for large volumes
   - Implement queuing for high-volume scenarios
   - Monitor database performance

## 9. Next Steps

1. Set up notification templates for common messages
2. Implement user notification preferences
3. Add analytics and tracking
4. Set up automated testing
5. Configure monitoring and alerting

For more detailed API documentation, see [PUSH_NOTIFICATION_API.md](./PUSH_NOTIFICATION_API.md).
