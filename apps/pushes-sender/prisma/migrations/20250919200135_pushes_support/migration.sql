-- CreateTable
CREATE TABLE "public"."DeviceToken" (
    "id" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "userId" TEXT,
    "deviceId" TEXT,
    "platform" TEXT NOT NULL,
    "appVersion" TEXT,
    "osVersion" TEXT,
    "deviceModel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeviceTopicSubscription" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceTopicSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SentNotification" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT,
    "topicId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "notificationId" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "SentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserNotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "newsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_fcmToken_key" ON "public"."DeviceToken"("fcmToken");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "public"."DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "DeviceToken_fcmToken_idx" ON "public"."DeviceToken"("fcmToken");

-- CreateIndex
CREATE INDEX "DeviceToken_isActive_idx" ON "public"."DeviceToken"("isActive");

-- CreateIndex
CREATE INDEX "DeviceToken_platform_idx" ON "public"."DeviceToken"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "public"."Topic"("name");

-- CreateIndex
CREATE INDEX "Topic_name_idx" ON "public"."Topic"("name");

-- CreateIndex
CREATE INDEX "Topic_isActive_idx" ON "public"."Topic"("isActive");

-- CreateIndex
CREATE INDEX "DeviceTopicSubscription_deviceId_idx" ON "public"."DeviceTopicSubscription"("deviceId");

-- CreateIndex
CREATE INDEX "DeviceTopicSubscription_topicId_idx" ON "public"."DeviceTopicSubscription"("topicId");

-- CreateIndex
CREATE INDEX "DeviceTopicSubscription_isActive_idx" ON "public"."DeviceTopicSubscription"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceTopicSubscription_deviceId_topicId_key" ON "public"."DeviceTopicSubscription"("deviceId", "topicId");

-- CreateIndex
CREATE INDEX "SentNotification_deviceId_idx" ON "public"."SentNotification"("deviceId");

-- CreateIndex
CREATE INDEX "SentNotification_topicId_idx" ON "public"."SentNotification"("topicId");

-- CreateIndex
CREATE INDEX "SentNotification_status_idx" ON "public"."SentNotification"("status");

-- CreateIndex
CREATE INDEX "SentNotification_sentAt_idx" ON "public"."SentNotification"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON "public"."NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_name_idx" ON "public"."NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_isActive_idx" ON "public"."NotificationTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationPreferences_userId_key" ON "public"."UserNotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserNotificationPreferences_userId_idx" ON "public"."UserNotificationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "public"."DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceTopicSubscription" ADD CONSTRAINT "DeviceTopicSubscription_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."DeviceToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeviceTopicSubscription" ADD CONSTRAINT "DeviceTopicSubscription_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SentNotification" ADD CONSTRAINT "SentNotification_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."DeviceToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SentNotification" ADD CONSTRAINT "SentNotification_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNotificationPreferences" ADD CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
