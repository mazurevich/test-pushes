import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";

// Input validation schema
const subscribeSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
  topicName: z.string().min(1, "Topic name is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);

    // Find device token
    const deviceToken = await db.deviceToken.findUnique({
      where: { fcmToken: validatedData.fcmToken },
    });

    if (!deviceToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Device token not found. Please register your device first.",
        },
        { status: 404 },
      );
    }

    // Find or create topic
    let topic = await db.topic.findUnique({
      where: { name: validatedData.topicName },
    });

    if (!topic) {
      topic = await db.topic.create({
        data: {
          name: validatedData.topicName,
          description: `Auto-created topic: ${validatedData.topicName}`,
        },
      });
    }

    // Create or update subscription
    const subscription = await db.deviceTopicSubscription.upsert({
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

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to topic: ${validatedData.topicName}`,
      data: {
        subscription: {
          id: subscription.id,
          topicName: topic.name,
          isActive: subscription.isActive,
          subscribedAt: subscription.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error subscribing to topic:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: z.treeifyError(error) ?? "",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to subscribe to topic",
      },
      { status: 500 },
    );
  }
}
