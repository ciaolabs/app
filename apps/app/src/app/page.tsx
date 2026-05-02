import { redirect } from "next/navigation";

import { getCurrentUserId } from "@ciaobang/auth";

export default async function HomePage() {
  const userId = await getCurrentUserId();

  if (userId) {
    redirect("/chat");
  }

  redirect("/sign-in");
}
