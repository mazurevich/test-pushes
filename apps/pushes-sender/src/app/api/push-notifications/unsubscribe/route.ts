import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";

// Input validation schema
const unsubscribeSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
  topicName: z.string().min(1, "Topic name is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const validatedData = unsubscribeSchema.parse(body);

    // Find device token
    const deviceToken = await db.deviceToken.findUnique({
      where: { fcmToken: validatedData.fcmToken },
    });

    if (!deviceToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Device token not found",
        },
        { status: 404 },
      );
    }

    // Find topic
    const topic = await db.topic.findUnique({
      where: { name: validatedData.topicName },
    });

    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          message: "Topic not found",
        },
        { status: 404 },
      );
    }

    // Update subscription to inactive
    const result = await db.deviceTopicSubscription.updateMany({
      where: {
        deviceId: deviceToken.id,
        topicId: topic.id,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully unsubscribed from topic: ${validatedData.topicName}`,
      data: {
        updatedCount: result.count,
      },
    });
  } catch (error) {
    console.error("Error unsubscribing from topic:", error);

    if (error instanceof z.ZodError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      console.log(z.prettifyError(error));
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to unsubscribe from topic",
      },
      { status: 500 },
    );
  }
}
