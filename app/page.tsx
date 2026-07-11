import { redirect } from "next/navigation";
import { APP_HOME_PATH, LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect(APP_HOME_PATH);
    }
  }

  redirect(LOGIN_PATH);
}
