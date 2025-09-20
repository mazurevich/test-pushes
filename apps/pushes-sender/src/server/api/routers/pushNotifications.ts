import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { notificationService } from "~/server/services/notificationService";

// Input validation schemas
const deviceInfoSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
  deviceId: z.string().optional(),
  platform: z.enum(["android", "ios", "web"]),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
  deviceModel: z.string().optional(),
});

const topicSubscriptionSchema = z.object({
  topicName: z.string().min(1, "Topic name is required"),
});

const notificationPreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  marketingEnabled: z.boolean().optional(),
  newsEnabled: z.boolean().optional(),
  reminderEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  timezone: z.string().optional(),
});

const notificationPayloadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  data: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().url().optional(),
  clickAction: z.string().optional(),
});

const sendNotificationSchema = z.object({
  payload: notificationPayloadSchema,
  dryRun: z.boolean().optional().default(false),
});

const sendToUserSchema = sendNotificationSchema.extend({
  userId: z.string().min(1, "User ID is required"),
});

const sendToTokensSchema = sendNotificationSchema.extend({
  fcmTokens: z.array(z.string()).min(1, "At least one FCM token is required"),
});

const sendToTopicSchema = sendNotificationSchema.extend({
  topicName: z.string().min(1, "Topic name is required"),
});

const sendToPlatformSchema = sendNotificationSchema.extend({
  platform: z.enum(["android", "ios", "web"]),
});

export const pushNotificationRouter = createTRPCRouter({
  // Register or update FCM token
  registerToken: publicProcedure
    .input(deviceInfoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if token already exists
        const existingToken = await ctx.db.deviceToken.findUnique({
          where: { fcmToken: input.fcmToken },
        });

        if (existingToken) {
          // Update existing token
          const updatedToken = await ctx.db.deviceToken.update({
            where: { fcmToken: input.fcmToken },
            data: {
              deviceId: input.deviceId,
              platform: input.platform,
              appVersion: input.appVersion,
              osVersion: input.osVersion,
              deviceModel: input.deviceModel,
              isActive: true,
              lastUsedAt: new Date(),
              updatedAt: new Date(),
            },
          });

          return {
            success: true,
            message: "Token updated successfully",
            deviceToken: updatedToken,
          };
        } else {
          // Create new token
          const newToken = await ctx.db.deviceToken.create({
            data: {
              fcmToken: input.fcmToken,
              deviceId: input.deviceId,
              platform: input.platform,
              appVersion: input.appVersion,
              osVersion: input.osVersion,
              deviceModel: input.deviceModel,
              isActive: true,
            },
          });

          return {
            success: true,
            message: "Token registered successfully",
            deviceToken: newToken,
          };
        }
      } catch (error) {
        console.error("Error registering FCM token:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register FCM token",
        });
      }
    }),

  // Register token with user account (for authenticated users)
  registerTokenWithUser: protectedProcedure
    .input(deviceInfoSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;

        // Check if user already has this token
        const existingToken = await ctx.db.deviceToken.findFirst({
          where: {
            fcmToken: input.fcmToken,
            userId: userId,
          },
        });

        if (existingToken) {
          // Update existing token
          const updatedToken = await ctx.db.deviceToken.update({
            where: { id: existingToken.id },
            data: {
              deviceId: input.deviceId,
              platform: input.platform,
              appVersion: input.appVersion,
              osVersion: input.osVersion,
              deviceModel: input.deviceModel,
              isActive: true,
              lastUsedAt: new Date(),
              updatedAt: new Date(),
            },
          });

          return {
            success: true,
            message: "Token updated successfully",
            deviceToken: updatedToken,
          };
        } else {
          // Create new token for user
          const newToken = await ctx.db.deviceToken.create({
            data: {
              fcmToken: input.fcmToken,
              userId: userId,
              deviceId: input.deviceId,
              platform: input.platform,
              appVersion: input.appVersion,
              osVersion: input.osVersion,
              deviceModel: input.deviceModel,
              isActive: true,
            },
          });

          return {
            success: true,
            message: "Token registered successfully",
            deviceToken: newToken,
          };
        }
      } catch (error) {
        console.error("Error registering FCM token with user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to register FCM token",
        });
      }
    }),

  getUsersTokens: protectedProcedure.query(async ({ ctx }) => {
    try {
      const tokens = await ctx.db.deviceToken.findMany({
        where: { isActive: true },
      });

      return tokens;
    } catch (error) {
      console.error("Error fetching users tokens:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch users tokens",
      });
    }
  }),

  // Get user's device tokens
  getUserTokens: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;

      const tokens = await ctx.db.deviceToken.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
        orderBy: {
          lastUsedAt: "desc",
        },
      });

      return {
        success: true,
        tokens,
      };
    } catch (error) {
      console.error("Error fetching user tokens:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch device tokens",
      });
    }
  }),

  // Deactivate/remove token
  deactivateToken: publicProcedure
    .input(z.object({ fcmToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedToken = await ctx.db.deviceToken.update({
          where: { fcmToken: input.fcmToken },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          message: "Token deactivated successfully",
          deviceToken: updatedToken,
        };
      } catch (error) {
        console.error("Error deactivating token:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deactivate token",
        });
      }
    }),

  // Subscribe to topic
  subscribeToTopic: publicProcedure
    .input(topicSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Find or create topic
        let topic = await ctx.db.topic.findUnique({
          where: { name: input.topicName },
        });

        topic ??= await ctx.db.topic.create({
          data: {
            name: input.topicName,
            description: `Auto-created topic: ${input.topicName}`,
          },
        });

        // This would need the deviceId from the request context
        // For now, we'll return the topic info
        return {
          success: true,
          message: `Subscribed to topic: ${input.topicName}`,
          topic,
        };
      } catch (error) {
        console.error("Error subscribing to topic:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to subscribe to topic",
        });
      }
    }),

  // Subscribe device to topic (requires device token)
  subscribeDeviceToTopic: publicProcedure
    .input(
      z.object({
        fcmToken: z.string(),
        topicName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find device token
        const deviceToken = await ctx.db.deviceToken.findUnique({
          where: { fcmToken: input.fcmToken },
        });

        if (!deviceToken) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Device token not found",
          });
        }

        // Find or create topic
        let topic = await ctx.db.topic.findUnique({
          where: { name: input.topicName },
        });

        topic ??= await ctx.db.topic.create({
          data: {
            name: input.topicName,
            description: `Auto-created topic: ${input.topicName}`,
          },
        });

        // Create subscription
        const subscription = await ctx.db.deviceTopicSubscription.upsert({
          where: {
            deviceId_topicId: {
              deviceId: deviceToken.id,
              topicId: topic.id,
            },
          },
          update: {
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            deviceId: deviceToken.id,
            topicId: topic.id,
            isActive: true,
          },
        });

        return {
          success: true,
          message: `Device subscribed to topic: ${input.topicName}`,
          subscription,
        };
      } catch (error) {
        console.error("Error subscribing device to topic:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to subscribe to topic",
        });
      }
    }),

  // Unsubscribe from topic
  unsubscribeFromTopic: publicProcedure
    .input(
      z.object({
        fcmToken: z.string(),
        topicName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find device token
        const deviceToken = await ctx.db.deviceToken.findUnique({
          where: { fcmToken: input.fcmToken },
        });

        if (!deviceToken) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Device token not found",
          });
        }

        // Find topic
        const topic = await ctx.db.topic.findUnique({
          where: { name: input.topicName },
        });

        if (!topic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Topic not found",
          });
        }

        // Update subscription
        const subscription = await ctx.db.deviceTopicSubscription.updateMany({
          where: {
            deviceId: deviceToken.id,
            topicId: topic.id,
          },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          message: `Unsubscribed from topic: ${input.topicName}`,
          updatedCount: subscription.count,
        };
      } catch (error) {
        console.error("Error unsubscribing from topic:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unsubscribe from topic",
        });
      }
    }),

  // Get user's notification preferences
  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;

      let preferences = await ctx.db.userNotificationPreferences.findUnique({
        where: { userId },
      });

      // Create default preferences if none exist
      preferences ??= await ctx.db.userNotificationPreferences.create({
        data: {
          userId,
        },
      });

      return {
        success: true,
        preferences,
      };
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch notification preferences",
      });
    }
  }),

  // Update user's notification preferences
  updateNotificationPreferences: protectedProcedure
    .input(notificationPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;

        const preferences = await ctx.db.userNotificationPreferences.upsert({
          where: { userId },
          update: {
            ...input,
            updatedAt: new Date(),
          },
          create: {
            userId,
            ...input,
          },
        });

        return {
          success: true,
          message: "Notification preferences updated successfully",
          preferences,
        };
      } catch (error) {
        console.error("Error updating notification preferences:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update notification preferences",
        });
      }
    }),

  // Get available topics
  getTopics: publicProcedure.query(async ({ ctx }) => {
    try {
      const topics = await ctx.db.topic.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      });

      return {
        success: true,
        topics,
      };
    } catch (error) {
      console.error("Error fetching topics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch topics",
      });
    }
  }),

  // Get device's subscriptions
  getDeviceSubscriptions: publicProcedure
    .input(z.object({ fcmToken: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const deviceToken = await ctx.db.deviceToken.findUnique({
          where: { fcmToken: input.fcmToken },
          include: {
            subscriptions: {
              where: { isActive: true },
              include: {
                topic: true,
              },
            },
          },
        });

        if (!deviceToken) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Device token not found",
          });
        }

        return {
          success: true,
          subscriptions: deviceToken.subscriptions,
        };
      } catch (error) {
        console.error("Error fetching device subscriptions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch device subscriptions",
        });
      }
    }),

  // Send notification to specific user
  sendToUser: protectedProcedure
    .input(sendToUserSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const results = await notificationService.sendToUser(
          input.userId,
          input.payload,
          input.dryRun,
        );

        // Log notification if not dry run
        if (!input.dryRun) {
          const user = await ctx.db.user.findUnique({
            where: { id: input.userId },
          });

          if (user) {
            await notificationService.logNotification(
              null, // deviceId - will be set per result
              null, // topicId
              input.payload,
              results,
              "sent",
            );
          }
        }

        return {
          success: true,
          message: `Notification sent to user ${input.userId}`,
          results,
          totalSent: results.filter((r) => r.success).length,
          totalFailed: results.filter((r) => !r.success).length,
        };
      } catch (error) {
        console.error("Error sending notification to user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to user",
        });
      }
    }),

  // Send notification to specific FCM tokens
  sendToTokens: protectedProcedure
    .input(sendToTokensSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const results = await notificationService.sendToTokens(
          input.fcmTokens,
          input.payload,
          input.dryRun,
        );

        // Log notification if not dry run
        if (!input.dryRun) {
          await notificationService.logNotification(
            null, // deviceId - will be set per result
            null, // topicId
            input.payload,
            results,
            "sent",
          );
        }

        return {
          success: true,
          message: `Notification sent to ${input.fcmTokens.length} tokens`,
          results,
          totalSent: results.filter((r) => r.success).length,
          totalFailed: results.filter((r) => !r.success).length,
        };
      } catch (error) {
        console.error("Error sending notification to tokens:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to tokens",
        });
      }
    }),

  // Send notification to topic subscribers
  sendToTopic: protectedProcedure
    .input(sendToTopicSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await notificationService.sendToTopic(
          input.topicName,
          input.payload,
          input.dryRun,
        );

        // Log notification if not dry run
        if (!input.dryRun && result.success) {
          const topic = await ctx.db.topic.findUnique({
            where: { name: input.topicName },
          });

          if (topic) {
            await notificationService.logNotification(
              null, // deviceId
              topic.id, // topicId
              input.payload,
              [
                {
                  success: result.success,
                  messageId: result.messageId,
                  error: result.error,
                },
              ],
              "sent",
            );
          }
        }

        return {
          success: result.success,
          message: result.success
            ? `Notification sent to topic: ${input.topicName}`
            : `Failed to send notification to topic: ${input.topicName}`,
          messageId: result.messageId,
          error: result.error,
        };
      } catch (error) {
        console.error("Error sending notification to topic:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to topic",
        });
      }
    }),

  // Send notification to all devices
  sendToAllDevices: protectedProcedure
    .input(sendNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const results = await notificationService.sendToAllDevices(
          input.payload,
          input.dryRun,
        );

        // Log notification if not dry run
        if (!input.dryRun) {
          await notificationService.logNotification(
            null, // deviceId - will be set per result
            null, // topicId
            input.payload,
            results,
            "sent",
          );
        }

        return {
          success: true,
          message: `Notification sent to all devices`,
          results,
          totalSent: results.filter((r) => r.success).length,
          totalFailed: results.filter((r) => !r.success).length,
        };
      } catch (error) {
        console.error("Error sending notification to all devices:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to all devices",
        });
      }
    }),

  // Send notification to specific platform
  sendToPlatform: protectedProcedure
    .input(sendToPlatformSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const results = await notificationService.sendToPlatform(
          input.platform,
          input.payload,
          input.dryRun,
        );

        // Log notification if not dry run
        if (!input.dryRun) {
          await notificationService.logNotification(
            null, // deviceId - will be set per result
            null, // topicId
            input.payload,
            results,
            "sent",
          );
        }

        return {
          success: true,
          message: `Notification sent to ${input.platform} devices`,
          results,
          totalSent: results.filter((r) => r.success).length,
          totalFailed: results.filter((r) => !r.success).length,
        };
      } catch (error) {
        console.error("Error sending notification to platform:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to platform",
        });
      }
    }),

  // Get notification statistics
  getNotificationStats: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const stats = await notificationService.getNotificationStats(
          input.startDate,
          input.endDate,
        );

        return {
          success: true,
          stats,
        };
      } catch (error) {
        console.error("Error fetching notification stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notification statistics",
        });
      }
    }),
});
