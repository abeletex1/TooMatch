"use server";

import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { redirect } from "next/navigation";

export async function confirmEmailAction(formData: FormData) {
  const code = formData.get("code") as string;
  const next = (formData.get("next") as string) || null;

  if (!code) redirect("/auth/error");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) redirect("/auth/error");

  const destination = next ?? (await getPostAuthRedirect());
  redirect(destination);
}
