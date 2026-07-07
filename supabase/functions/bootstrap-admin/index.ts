import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const ADMIN_EMAIL = "kalvithanschool@gmail.com";
    const ADMIN_PASSWORD = "Kalvithan@School2026";
    const ADMIN_NAME = "ARRUPE Master Admin";

    // Check if admin user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existing = existingUsers.users.find((u: any) => u.email === ADMIN_EMAIL);
    let adminId: string;

    if (existing) {
      adminId = existing.id;
      // Ensure profile exists with admin role
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: adminId,
          email: ADMIN_EMAIL,
          role: "admin",
          full_name: ADMIN_NAME,
          status: "active",
        }, { onConflict: "id" });

      if (profileError) {
        return new Response(JSON.stringify({ error: profileError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Create the admin user
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_NAME, role: "admin" },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      adminId = created.user.id;

      // Ensure profile has admin role (trigger should have created it, but enforce)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: adminId,
          email: ADMIN_EMAIL,
          role: "admin",
          full_name: ADMIN_NAME,
          status: "active",
        }, { onConflict: "id" });

      if (profileError) {
        return new Response(JSON.stringify({ error: profileError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, adminId, email: ADMIN_EMAIL, message: "Master admin ready" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
