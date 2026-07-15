import { redirect } from "next/navigation";
import { getDefaultAppLandingPath } from "@/lib/auth/post-auth-path";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(await getDefaultAppLandingPath(supabase, user.id));
    }
  }

  redirect(LOGIN_PATH);
}
