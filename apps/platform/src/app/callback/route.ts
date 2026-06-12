import { handleAuth } from "@workos-inc/authkit-nextjs";

import { routes } from "@/lib/routes";

export const GET = handleAuth({
  returnPathname: routes.surveys,
  onError: ({ error }) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[callback] auth error:", message);
    return new Response(
      JSON.stringify({ error: { message: "Something went wrong", description: message } }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  },
});
