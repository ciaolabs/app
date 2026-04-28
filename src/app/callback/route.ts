import { handleAuth } from "@workos-inc/authkit-nextjs";

import { SURVEYS_ROUTE } from "@/lib/survey/routes";

export const GET = handleAuth({ returnPathname: SURVEYS_ROUTE });
