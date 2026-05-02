import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import BottomNav from "@/components/ui/BottomNav";
import DailyQuestion from "./DailyQuestion";

export default async function QuestionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.onboarding_completed) redirect("/welcome");

  // Pregunta del día (hoy o la más reciente pasada)
  const today = new Date().toISOString().split("T")[0];
  const { data: question } = await supabase
    .from("daily_questions")
    .select("*")
    .lte("active_date", today)
    .order("active_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Respuesta ya enviada hoy (si existe)
  const existingAnswer = question
    ? await supabase
        .from("daily_answers")
        .select("answer")
        .eq("user_id", user.id)
        .eq("question_id", question.id)
        .maybeSingle()
        .then(({ data }) => data?.answer ?? null)
    : null;

  // Historial de respuestas anteriores
  const { data: rawHistory } = await supabase
    .from("daily_answers")
    .select("answer, question_id, daily_questions(question_text, active_date)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const history = (rawHistory ?? [])
    .map((row: { answer: string; daily_questions: { question_text: string; active_date: string } | null }) => ({
      answer: row.answer,
      question_text: row.daily_questions?.question_text ?? "",
      active_date: row.daily_questions?.active_date ?? "",
    }))
    .filter((r) => r.question_text);

  return (
    <MobileShell>
      <Topbar right="Hoy" />

      <main className="flex-1 overflow-y-auto px-5 pt-5 pb-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-2">
          Pregunta del día
        </p>
        <h1 className="font-serif text-[24px] text-ink font-medium leading-[1.25] mb-4">
          La pregunta diaria nos ayuda a{" "}
          <em className="italic text-rose">entenderte mejor</em>.
        </h1>

        {question ? (
          <DailyQuestion
            questionId={question.id}
            questionText={question.question_text}
            options={question.options}
            initialAnswer={existingAnswer}
            history={history}
          />
        ) : (
          <div className="bg-bg-2 rounded-2xl p-5 text-center">
            <p className="font-serif italic text-[16px] text-ink-3">
              La pregunta de hoy llega pronto.
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </MobileShell>
  );
}
