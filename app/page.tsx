import { redirect } from "next/navigation";
import StudentWorkspace from "@/components/StudentWorkspace";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <StudentWorkspace />;
}
