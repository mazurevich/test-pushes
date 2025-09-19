import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";

// Input validation schema
const registerTokenSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
  deviceId: z.string().optional(),
  platform: z.enum(["android", "ios", "web"]),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  userId: z.string().optional(), // Optional for anonymous users
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerTokenSchema.parse(body);

    // Check if token already exists
    const existingToken = await db.deviceToken.findUnique({
      where: { fcmToken: validatedData.fcmToken },
    });

    let deviceToken;

    if (existingToken) {
      // Update existing token
      deviceToken = await db.deviceToken.update({
        where: { fcmToken: validatedData.fcmToken },
        data: {
          userId: validatedData.userId || existingToken.userId,
          deviceId: validatedData.deviceId,
          platform: validatedData.platform,
          appVersion: validatedData.appVersion,
          osVersion: validatedData.osVersion,
          deviceModel: validatedData.deviceModel,
          isActive: true,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new token
      deviceToken = await db.deviceToken.create({
        data: {
          fcmToken: validatedData.fcmToken,
          userId: validatedData.userId,
          deviceId: validatedData.deviceId,
          platform: validatedData.platform,
          appVersion: validatedData.appVersion,
          osVersion: validatedData.osVersion,
          deviceModel: validatedData.deviceModel,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingToken
        ? "Token updated successfully"
        : "Token registered successfully",
      data: {
        id: deviceToken.id,
        fcmToken: deviceToken.fcmToken,
        platform: deviceToken.platform,
        isActive: deviceToken.isActive,
        createdAt: deviceToken.createdAt,
        updatedAt: deviceToken.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error registering FCM token:", error);

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
        message: "Failed to register FCM token",
      },
      { status: 500 },
    );
  }
}
