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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: profile } = await userClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: string[] = [];

    // Create demo teacher
    const { data: teacher, error: tErr } = await supabase.auth.admin.createUser({
      email: "teacher@kalvithan.edu",
      password: "TeacherPass2026",
      email_confirm: true,
      user_metadata: { full_name: "Priya Sharma", role: "teacher", phone: "+919876543210" },
    });
    if (tErr && !tErr.message.includes("already")) results.push(`Teacher: ${tErr.message}`);
    else if (teacher?.user) {
      await supabase.from("profiles").upsert({
        id: teacher.user.id, email: "teacher@kalvithan.edu", role: "teacher",
        full_name: "Priya Sharma", phone: "+919876543210", status: "active",
      }, { onConflict: "id" });
      results.push("Teacher created: teacher@kalvithan.edu / TeacherPass2026");

      // Assign teacher to Grade 6-A class subjects
      const { data: cls } = await supabase.from("classes").select("id").eq("name", "Grade 6-A").maybeSingle();
      const { data: mathSub } = await supabase.from("subjects").select("id").eq("code", "MATH").maybeSingle();
      const { data: sciSub } = await supabase.from("subjects").select("id").eq("code", "SCI").maybeSingle();
      if (cls && mathSub) {
        await supabase.from("class_subjects").upsert({
          class_id: cls.id, subject_id: mathSub.id, teacher_id: teacher.user.id,
        }, { onConflict: "class_id,subject_id" });
      }
      if (cls && sciSub) {
        await supabase.from("class_subjects").upsert({
          class_id: cls.id, subject_id: sciSub.id, teacher_id: teacher.user.id,
        }, { onConflict: "class_id,subject_id" });
      }
      if (cls) {
        await supabase.from("classes").update({ class_teacher_id: teacher.user.id }).eq("id", cls.id);
      }
    }

    // Create demo parent
    const { data: parent, error: pErr } = await supabase.auth.admin.createUser({
      email: "parent@kalvithan.edu",
      password: "ParentPass2026",
      email_confirm: true,
      user_metadata: { full_name: "Rajesh Kumar", role: "parent", phone: "+919876543211" },
    });
    if (pErr && !pErr.message.includes("already")) results.push(`Parent: ${pErr.message}`);
    else if (parent?.user) {
      await supabase.from("profiles").upsert({
        id: parent.user.id, email: "parent@kalvithan.edu", role: "parent",
        full_name: "Rajesh Kumar", phone: "+919876543211", status: "active",
      }, { onConflict: "id" });
      results.push("Parent created: parent@kalvithan.edu / ParentPass2026");

      // Create demo student linked to this parent
      const { data: cls } = await supabase.from("classes").select("id").eq("name", "Grade 6-A").maybeSingle();
      if (cls) {
        const { data: studentUser, error: sErr } = await supabase.auth.admin.createUser({
          email: "student@kalvithan.edu",
          password: "StudentPass2026",
          email_confirm: true,
          user_metadata: { full_name: "Aarav Kumar", role: "student", phone: "+919876543212" },
        });
        if (!sErr && studentUser?.user) {
          await supabase.from("profiles").upsert({
            id: studentUser.user.id, email: "student@kalvithan.edu", role: "student",
            full_name: "Aarav Kumar", phone: "+919876543212", status: "active",
          }, { onConflict: "id" });
          await supabase.from("students").insert({
            user_id: studentUser.user.id,
            roll_number: "01",
            full_name: "Aarav Kumar",
            class_id: cls.id,
            parent_id: parent.user.id,
            admission_number: "ADM2026-001",
            gender: "male",
          });
          results.push("Student created: student@kalvithan.edu / StudentPass2026");

          // Seed some attendance
          const today = new Date();
          for (let i = 0; i < 10; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const { data: existingStudent } = await supabase.from("students").select("id").eq("user_id", studentUser.user.id).maybeSingle();
            if (existingStudent) {
              await supabase.from("attendance").insert({
                student_id: existingStudent.id,
                class_id: cls.id,
                date: d.toISOString().slice(0, 10),
                status: i % 7 === 0 ? "absent" : "present",
                marked_by: teacher.user?.id ?? null,
              }).then(({ error }) => { if (error && !error.message.includes("duplicate")) {} });
            }
          }

          // Seed some marks
          const { data: terms } = await supabase.from("exam_terms").select("*").order("sort_order").limit(1);
          if (terms && terms.length > 0) {
            const { data: existingStudent } = await supabase.from("students").select("id").eq("user_id", studentUser.user.id).maybeSingle();
            const { data: subjects } = await supabase.from("subjects").select("id, code").in("code", ["MATH", "ENG", "SCI"]);
            if (existingStudent && subjects) {
              const marksData = [
                { code: "MATH", marks: 78 },
                { code: "ENG", marks: 85 },
                { code: "SCI", marks: 92 },
              ];
              for (const m of marksData) {
                const sub = subjects.find((s: any) => s.code === m.code);
                if (sub) {
                  await supabase.from("marks").insert({
                    student_id: existingStudent.id,
                    subject_id: sub.id,
                    exam_term_id: terms[0].id,
                    academic_year: "2025-2026",
                    class_id: cls.id,
                    marks_obtained: m.marks,
                    max_marks: 100,
                    published: true,
                    entered_by: teacher.user?.id ?? null,
                  });
                }
              }
              results.push("Sample marks seeded for Term 1");
            }
          }

          // Seed an invoice
          const { data: existingStudent } = await supabase.from("students").select("id").eq("user_id", studentUser.user.id).maybeSingle();
          if (existingStudent) {
            await supabase.from("invoices").insert({
              invoice_number: `INV-DEMO-${Date.now().toString().slice(-6)}`,
              student_id: existingStudent.id,
              term: "Term 1",
              academic_year: "2025-2026",
              tuition_fee: 5000,
              library_fee: 500,
              lab_fee: 500,
              sports_fee: 300,
              other_fee: 200,
              total_amount: 6500,
              amount_paid: 3000,
              status: "partial",
              due_date: "2026-08-31",
            });
            results.push("Sample invoice seeded");
          }
        }
      }
    }

    // Create demo accountant
    const { data: accountant, error: aErr } = await supabase.auth.admin.createUser({
      email: "accountant@kalvithan.edu",
      password: "Accountant2026",
      email_confirm: true,
      user_metadata: { full_name: "Meena Iyer", role: "accountant", phone: "+919876543213" },
    });
    if (aErr && !aErr.message.includes("already")) results.push(`Accountant: ${aErr.message}`);
    else if (accountant?.user) {
      await supabase.from("profiles").upsert({
        id: accountant.user.id, email: "accountant@kalvithan.edu", role: "accountant",
        full_name: "Meena Iyer", phone: "+919876543213", status: "active",
      }, { onConflict: "id" });
      results.push("Accountant created: accountant@kalvithan.edu / Accountant2026");
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
