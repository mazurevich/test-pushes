import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  // Check if Firebase Admin is already initialized
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Get Firebase service account key from environment variables
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required",
    );
  }

  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format");
  }

  return initializeApp({
    credential: cert(serviceAccount),
    // Optional: Add your project ID if not included in service account
    projectId: process.env.FIREBASE_PROJECT_ID ?? serviceAccount.project_id,
  });
};

// Initialize Firebase Admin
const app = initializeFirebaseAdmin();

// Export messaging instance
export const messaging = getMessaging(app);

export default app;
