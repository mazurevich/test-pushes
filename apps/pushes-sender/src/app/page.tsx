import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import { SendButton } from "./_components/send-button";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        {session?.user && <SendButton />}
      </main>
    </HydrateClient>
  );
}
