'use client';

import { signIn, signOut, useSession } from "next-auth/react";

export const LoginButton = () => {
  const session = useSession();

  if (session?.data?.user) {
    return <button className="bg-amber-700 text-white py-2 px-4 rounded-md hover:bg-amber-800" onClick={() => void signOut()}>Sign out</button>;
  }
  return <button className="bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200" onClick={() => void signIn()}>Sign in</button>;
}/*  */;