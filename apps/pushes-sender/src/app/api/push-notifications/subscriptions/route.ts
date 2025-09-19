import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";

// Input validation schema
const getSubscriptionsSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fcmToken = searchParams.get("fcmToken");

    if (!fcmToken) {
      return NextResponse.json(
        {
          success: false,
          message: "FCM token is required",
        },
        { status: 400 },
      );
    }

    // Validate input
    const validatedData = getSubscriptionsSchema.parse({ fcmToken });

    // Find device token with subscriptions
    const deviceToken = await db.deviceToken.findUnique({
      where: { fcmToken: validatedData.fcmToken },
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
      return NextResponse.json(
        {
          success: false,
          message: "Device token not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        deviceToken: {
          id: deviceToken.id,
          platform: deviceToken.platform,
          appVersion: deviceToken.appVersion,
          osVersion: deviceToken.osVersion,
          deviceModel: deviceToken.deviceModel,
          isActive: deviceToken.isActive,
          lastUsedAt: deviceToken.lastUsedAt,
        },
        subscriptions: deviceToken.subscriptions.map((sub) => ({
          id: sub.id,
          topicName: sub.topic.name,
          topicDescription: sub.topic.description,
          subscribedAt: sub.createdAt,
          isActive: sub.isActive,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching device subscriptions:", error);

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
        message: "Failed to fetch device subscriptions",
      },
      { status: 500 },
    );
  }
}
