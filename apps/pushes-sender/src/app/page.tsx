import { SessionProvider } from "next-auth/react";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { LoginButton } from "./_components/login-button";
import { SendButton } from "./_components/send-button";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  const sendSimpleNotification = async () => {
    const tokens = await api.pushNotifications.getUserTokens();
    console.log(tokens);
  };

  return (
    <HydrateClient>
      <SessionProvider>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        
        {!session?.user && <div>You are not logged in</div>}
        <LoginButton />
        {session?.user && <SendButton />}
      </main>
      </SessionProvider>
    </HydrateClient>
  );
}
