import { TRPCError } from "@trpc/server";
import { db } from "../db";
import { messaging } from "../firebase-admin";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

export interface SendNotificationOptions {
  userId?: string;
  fcmTokens?: string[];
  topicName?: string;
  payload: NotificationPayload;
  dryRun?: boolean;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  token?: string;
}

export class NotificationService {
  /**
   * Send notification to specific FCM tokens
   */
  async sendToTokens(
    tokens: string[],
    payload: NotificationPayload,
    dryRun = false,
  ): Promise<NotificationResult[]> {
    if (tokens.length === 0) {
      return [];
    }

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        notification: {
          clickAction: payload.clickAction,
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
        },
      },
      tokens,
      dryRun,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      const results: NotificationResult[] = [];

      response.responses.forEach((resp: any, idx: number) => {
        if (resp.success) {
          results.push({
            success: true,
            messageId: resp.messageId,
            token: tokens[idx],
          });
        } else {
          results.push({
            success: false,
            error: resp.error?.message || "Unknown error",
            token: tokens[idx],
          });
        }
      });

      return results;
    } catch (error) {
      console.error("Error sending multicast message:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send notification",
      });
    }
  }

  /**
   * Send notification to a specific user's devices
   */
  async sendToUser(
    userId: string,
    payload: NotificationPayload,
    dryRun = false,
  ): Promise<NotificationResult[]> {
    // Get user's active device tokens
    const deviceTokens = await db.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        fcmToken: true,
        platform: true,
      },
    });

    if (deviceTokens.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active device tokens found for user",
      });
    }

    const tokens = deviceTokens.map((dt) => dt.fcmToken);
    return this.sendToTokens(tokens, payload, dryRun);
  }

  /**
   * Send notification to all devices subscribed to a topic
   */
  async sendToTopic(
    topicName: string,
    payload: NotificationPayload,
    dryRun = false,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        notification: {
          clickAction: payload.clickAction,
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
        },
      },
      topic: topicName,
      dryRun,
    };

    try {
      const messageId = await messaging.send(message);
      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error("Error sending topic message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send notification to all active devices
   */
  async sendToAllDevices(
    payload: NotificationPayload,
    dryRun = false,
  ): Promise<NotificationResult[]> {
    // Get all active device tokens
    const deviceTokens = await db.deviceToken.findMany({
      where: {
        isActive: true,
      },
      select: {
        fcmToken: true,
        platform: true,
      },
    });

    if (deviceTokens.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active device tokens found",
      });
    }

    const tokens = deviceTokens.map((dt) => dt.fcmToken);
    return this.sendToTokens(tokens, payload, dryRun);
  }

  /**
   * Send notification to devices by platform
   */
  async sendToPlatform(
    platform: "android" | "ios" | "web",
    payload: NotificationPayload,
    dryRun = false,
  ): Promise<NotificationResult[]> {
    // Get device tokens for specific platform
    const deviceTokens = await db.deviceToken.findMany({
      where: {
        platform,
        isActive: true,
      },
      select: {
        fcmToken: true,
        platform: true,
      },
    });

    if (deviceTokens.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No active device tokens found for platform: ${platform}`,
      });
    }

    const tokens = deviceTokens.map((dt) => dt.fcmToken);
    return this.sendToTokens(tokens, payload, dryRun);
  }

  /**
   * Log notification to database for tracking
   */
  async logNotification(
    deviceId: string | null,
    topicId: string | null,
    payload: NotificationPayload,
    results: NotificationResult[],
    status: "sent" | "delivered" | "failed" | "pending",
  ): Promise<void> {
    try {
      // Log each result
      for (const result of results) {
        await db.sentNotification.create({
          data: {
            deviceId,
            topicId,
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            notificationId: result.messageId || null,
            status,
            errorMessage: result.error || null,
            sentAt: new Date(),
            deliveredAt: status === "delivered" ? new Date() : null,
          },
        });
      }
    } catch (error) {
      console.error("Error logging notification:", error);
      // Don't throw error here as it's just for tracking
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  }> {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.sentAt = {};
      if (startDate) whereClause.sentAt.gte = startDate;
      if (endDate) whereClause.sentAt.lte = endDate;
    }

    const [total, sent, delivered, failed, pending] = await Promise.all([
      db.sentNotification.count({ where: whereClause }),
      db.sentNotification.count({ where: { ...whereClause, status: "sent" } }),
      db.sentNotification.count({
        where: { ...whereClause, status: "delivered" },
      }),
      db.sentNotification.count({
        where: { ...whereClause, status: "failed" },
      }),
      db.sentNotification.count({
        where: { ...whereClause, status: "pending" },
      }),
    ]);

    return {
      total,
      sent,
      delivered,
      failed,
      pending,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
