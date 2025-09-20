#!/usr/bin/env node

console.log("=== Environment Variables Check ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PWD:", process.env.PWD);
console.log("VERCEL:", process.env.VERCEL);
console.log("VERCEL_ENV:", process.env.VERCEL_ENV);
console.log("---");
console.log("GITHUB_ID:", process.env.GITHUB_ID ? "SET" : "NOT SET");
console.log(
  "FIREBASE_SERVICE_ACCOUNT_KEY:",
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? "SET" : "NOT SET",
);
console.log(
  "FIREBASE_PROJECT_ID:",
  process.env.FIREBASE_PROJECT_ID ? "SET" : "NOT SET",
);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("AUTH_SECRET:", process.env.AUTH_SECRET ? "SET" : "NOT SET");
console.log("---");
console.log(
  "All env vars starting with GITHUB:",
  Object.keys(process.env).filter((key) => key.startsWith("GITHUB")),
);
console.log(
  "All env vars starting with FIREBASE:",
  Object.keys(process.env).filter((key) => key.startsWith("FIREBASE")),
);
console.log("=====================================");

// Show actual values (truncated for security)
if (process.env.GITHUB_ID) {
  console.log(
    "GITHUB_ID value:",
    process.env.GITHUB_ID.substring(0, 10) + "...",
  );
}
if (process.env.FIREBASE_PROJECT_ID) {
  console.log("FIREBASE_PROJECT_ID value:", process.env.FIREBASE_PROJECT_ID);
}
if (process.env.DATABASE_URL) {
  console.log(
    "DATABASE_URL value:",
    process.env.DATABASE_URL.substring(0, 20) + "...",
  );
}
