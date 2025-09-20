import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";

// Input validation schema
const deactivateSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = deactivateSchema.parse(body);

    // Find and deactivate token
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

    // Deactivate token
    const updatedToken = await db.deviceToken.update({
      where: { fcmToken: validatedData.fcmToken },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Also deactivate all subscriptions for this device
    await db.deviceTopicSubscription.updateMany({
      where: { deviceId: deviceToken.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device token deactivated successfully",
      data: {
        id: updatedToken.id,
        fcmToken: updatedToken.fcmToken,
        isActive: updatedToken.isActive,
        deactivatedAt: updatedToken.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error deactivating token:", error);

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
        message: "Failed to deactivate token",
      },
      { status: 500 },
    );
  }
}
