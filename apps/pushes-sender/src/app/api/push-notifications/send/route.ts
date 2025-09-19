import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notificationService } from "~/server/services/notificationService";

// Input validation schema
const sendNotificationSchema = z.object({
  type: z.enum(["user", "tokens", "topic", "all", "platform"]),
  payload: z.object({
    title: z.string().min(1, "Title is required"),
    body: z.string().min(1, "Body is required"),
    data: z.record(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    clickAction: z.string().optional(),
  }),
  dryRun: z.boolean().optional().default(false),
  // Type-specific parameters
  userId: z.string().optional(),
  fcmTokens: z.array(z.string()).optional(),
  topicName: z.string().optional(),
  platform: z.enum(["android", "ios", "web"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = sendNotificationSchema.parse(body);

    let result;

    switch (validatedData.type) {
      case "user":
        if (!validatedData.userId) {
          return NextResponse.json(
            { success: false, message: "userId is required for user type" },
            { status: 400 },
          );
        }
        result = await notificationService.sendToUser(
          validatedData.userId,
          validatedData.payload,
          validatedData.dryRun,
        );
        break;

      case "tokens":
        if (!validatedData.fcmTokens || validatedData.fcmTokens.length === 0) {
          return NextResponse.json(
            {
              success: false,
              message: "fcmTokens is required for tokens type",
            },
            { status: 400 },
          );
        }
        result = await notificationService.sendToTokens(
          validatedData.fcmTokens,
          validatedData.payload,
          validatedData.dryRun,
        );
        break;

      case "topic":
        if (!validatedData.topicName) {
          return NextResponse.json(
            { success: false, message: "topicName is required for topic type" },
            { status: 400 },
          );
        }
        result = await notificationService.sendToTopic(
          validatedData.topicName,
          validatedData.payload,
          validatedData.dryRun,
        );
        break;

      case "all":
        result = await notificationService.sendToAllDevices(
          validatedData.payload,
          validatedData.dryRun,
        );
        break;

      case "platform":
        if (!validatedData.platform) {
          return NextResponse.json(
            {
              success: false,
              message: "platform is required for platform type",
            },
            { status: 400 },
          );
        }
        result = await notificationService.sendToPlatform(
          validatedData.platform,
          validatedData.payload,
          validatedData.dryRun,
        );
        break;

      default:
        return NextResponse.json(
          { success: false, message: "Invalid type" },
          { status: 400 },
        );
    }

    // Calculate success/failure counts
    const totalSent = Array.isArray(result)
      ? result.filter((r) => r.success).length
      : result.success
        ? 1
        : 0;
    const totalFailed = Array.isArray(result)
      ? result.filter((r) => !r.success).length
      : result.success
        ? 0
        : 1;

    return NextResponse.json({
      success: true,
      message: `Notification sent successfully`,
      type: validatedData.type,
      totalSent,
      totalFailed,
      results: result,
    });
  } catch (error) {
    console.error("Error sending notification:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
