import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import ScrollLayout from "@/components/ui/ScrollLayout";
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

  const today = new Date().toISOString().split("T")[0];
  // Solo preguntas desde el día que se registró el usuario
  const signupDate = user.created_at.split("T")[0];

  // IDs de preguntas ya respondidas por el usuario
  const { data: answers } = await supabase
    .from("daily_answers")
    .select("question_id")
    .eq("user_id", user.id);
  const answeredIds = (answers ?? []).map((a) => (a as { question_id: string }).question_id);

  // Preguntas pendientes desde el día de registro hasta hoy (más antiguas primero)
  let questionsQuery = supabase
    .from("daily_questions")
    .select("id, question_text, options, active_date")
    .gte("active_date", signupDate)
    .lte("active_date", today)
    .order("active_date", { ascending: true });

  if (answeredIds.length > 0) {
    questionsQuery = questionsQuery.not("id", "in", `(${answeredIds.join(",")})`);
  }

  const { data: pendingQuestions } = await questionsQuery;

  // Historial de respuestas
  const { data: rawHistory } = await supabase
    .from("daily_answers")
    .select("answer, question_id, daily_questions(question_text, active_date)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history = (rawHistory ?? []).map((row: any) => {
    const q = Array.isArray(row.daily_questions)
      ? row.daily_questions[0]
      : row.daily_questions;
    return {
      answer: row.answer as string,
      question_text: (q?.question_text ?? "") as string,
      active_date: (q?.active_date ?? "") as string,
    };
  }).filter((r) => r.question_text);

  const questions = (pendingQuestions ?? []) as {
    id: string;
    question_text: string;
    options: string[];
    active_date: string;
  }[];

  return (
    <MobileShell>
      <ScrollLayout topbarRight="Hoy">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-2">
            Pregunta del día
          </p>
          <h1 className="font-serif text-[24px] text-ink font-medium leading-[1.25] mb-4">
            La pregunta diaria nos ayuda a{" "}
            <em className="italic text-rose">entenderte mejor</em>.
          </h1>

          <DailyQuestion questions={questions} history={history} />
        </div>
      </ScrollLayout>
    </MobileShell>
  );
}
