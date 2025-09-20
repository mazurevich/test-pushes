import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { z } from "zod";

// auth_provider_x509_cert_url
// :
// "https://www.googleapis.com/oauth2/v1/certs"
// auth_uri
// :
// "https://accounts.google.com/o/oauth2/auth"
// client_email
// :
// "firebase-adminsdk-fbsvc@push-listener.iam.gserviceaccount.com"
// client_id
// :
// "105695583911327218231"
// client_x509_cert_url
// :
// "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40push-listener.iam.gserviceaccount.com"
// private_key
// :
// "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCbex4TrUjEwKQP\nDX5jCPoIvnbgvYD3sDz1c8n9H0jPglKwmvdVtOZgrt6Z+bfG8Qp88M3DRwkoU5Kz\nkTfc9HVtcKTVE0v43wKAZF3KthHVRMAxV9NbHSFGVbanmekdSDmfb8L1FmlKiqc8\n1kjT/z4cjb8Qt7TkrYJ8y4yMac+Ofq26oRkXPgsJMZ9W6ca0S1A9GnHxIv33e196\nP/DYO1DQJEhFZquC6zPImHQ3oZcK5KFOqtiB2jp+NG9ySJTPgjqkw8b1i0ArRr0y\nG7aQfsioOnE/T2WfoImS2BOTpnUYzRrPJm/r3u/HfVf4gKNQd0xxsIm7dYUJ2ltG\n+ZxGbvfrAgMBAAECggEAHBz04UXx5HGYuIgOFEYpP6+Auz5ItYCOZStcmIIxniPI\nY9qBYmPlTBISefDnQ/eNl+3KpsaPZ1VFL2bQnQkuum0lwMlOcV+Rijmbo+2r584Y\nmlNxCgaIX7lb34460mqe0K9apwo4W5wahSuR25NJXcxbgeBVuwuMjpgXf8QaHX+O\nLok2iT2D14XdsqP9h/sOujCG6ou7ZBVm0Tc4OButcgDZWYgfyNvKhiSPrFbGXp09\n7FiBGi+SzwQvpPDkS36gN4JdW7ZiEyLjqh08V7qUZvIBourJYbr7fjuW+po+dxkF\nRfmrD7mHh5mg11/HtcmAkk5crXFcJBPG0Y2EsVEz8QKBgQDKM2CMpt/GUqKNpQDK\nTlVWIcQAUZ3JjQk9l29IGlKPISH/cq/p/AlevkkY5Z2fHGeNWmR5ulObf0JOxq2f\nSebddl88L+pA1YSouiluvLNYltoc25xlW4hjeOzHi1oGbDuA4Er8g8WeMxOqesA+\nNwqEXaX7yTzsaKWk5T1TXQQgdQKBgQDE2XzXkNC+MCYjAopnE42H7XfcqpE3tBih\nuLAM3cxLAGdyCLvTb7uFaWJ1RKep3sUMfQPYAKx97hLdM0NPH9XJJufJEw+cfQMh\nzDksSKYlwzTZ4NwrrXe9K0PNLFmLSosy3QkkIqcjq3XPK7tQ+Wz9ZklmKC99E3JD\nQBH1YAWq3wKBgHzX2/T7046P1u29ww8l7mqPzoSj39hhzCLLLVpHZlIZEvS1ywed\nJevpcRh+LSPgVc9g0EiYUqbfnAEnimufJXv3ajWvH+OH8bB7wLkuqU05VtIahiXO\nrhc8wnUyBROSH+sikSn38jwLLUlFIQ1IzqWLbMBZL9SHiD6Xi5W9CJ9BAoGAD2Gz\nOKDvPr1CbZ/oMq+7cnCi2hJV8JVZC2IEF61JJl8stiNqkdX8QCuA7wrjUwm+OgCW\nyU0cLWbqAHDeBJPHP8WTfQnJQYAfO4fau9Qdb3v2aEQC0ELoxVZZIPIjORglEl9l\nNHakusvOE9cl9ujWlGJmv93KACsB1bFu9c6AAt8CgYBBovjF+7u6mZ8t7PWL7uGS\n7UI+I4NDQp7w3oU3rBnex6rLzdRveT5g0pc1jC1L9fzBAjvSONjb6Ddw2loyZNCc\nj8B0w/ThD2LZ1BxOVkOJkowwM0lswbKbVaK40vZF5+/Nk/Gzpg8+wZjtoQuQKKk6\nfK4o48PoOtw2ZAgJPKuWFg==\n-----END PRIVATE KEY-----\n"
// private_key_id
// :
// "a5d0b487b1f39caa44c1cbbdf445fbf706a9c030"
// project_id
// :
// "push-listener"
// token_uri
// :
// "https://oauth2.googleapis.com/token"
// type
// :
// "service_account"
// universe_domain
// :
// "googleapis.com"
const serviceAccountSchema = z
  .object({
    auth_provider_x509_cert_url: z.string(),
    auth_uri: z.string(),
    client_email: z.string(),
    client_id: z.string(),
    client_x509_cert_url: z.string(),
    private_key: z.string(),
    private_key_id: z.string(),
    project_id: z.string(),
    token_uri: z.string(),
    type: z.string(),
    universe_domain: z.string(),
  })
  .transform((data) => {
    return {
      projectId: data.project_id,
      clientEmail: data.client_email,
      clientId: data.client_id,
      privateKeyId: data.private_key_id,
      privateKey: data.private_key.replace(/\\n/g, "\n"),
    };
  });

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

  let serviceAccount: ServiceAccount;
  try {
    serviceAccount = serviceAccountSchema.parse(JSON.parse(serviceAccountKey));
  } catch {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format");
  }

  return initializeApp({
    credential: cert(serviceAccount),
    // Optional: Add your project ID if not included in service account
    projectId: process.env.FIREBASE_PROJECT_ID ?? serviceAccount.projectId,
  });
};

// Initialize Firebase Admin
const app = initializeFirebaseAdmin();

// Export messaging instance
export const messaging = getMessaging(app);

export default app;
