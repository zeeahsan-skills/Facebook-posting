import Shell from "../../components/Shell";
import { card } from "../../components/ui";

const STEPS = [
  {
    title: "1. Create a Supabase project",
    body: "Go to supabase.com → New project → pick a name and region → wait ~2 minutes. The free tier is enough.",
  },
  {
    title: "2. Run the database migration",
    body: "In Supabase: SQL Editor → New query → paste the contents of supabase/migrations/001_schema.sql from the GitHub repo → Run. This creates groups, campaigns, tasks, click_events, activity_log and worker_control tables with Row Level Security.",
  },
  {
    title: "3. Get your API keys",
    body: "In Supabase: Project Settings → API → copy the Project URL, the anon public key, and the service_role key (keep the service key secret).",
  },
  {
    title: "4. Add environment variables in Vercel",
    body: "Vercel → your project → Settings → Environment Variables → add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY → Redeploy.",
  },
  {
    title: "5. Create your account",
    body: "Open the site → Sign up with your email and password → start adding groups and campaigns.",
  },
  {
    title: "6. Background worker (posting)",
    body: "The web app manages data; a separate worker performs the actual Facebook posting on a machine with an authorized browser session. See README 'Worker Setup' for the cron-based worker that reads tasks from Supabase.",
  },
];

export default function SetupPage() {
  return (
    <Shell>
      <h1 className="mb-2 text-2xl font-bold">Setup Guide</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Connect Supabase to activate the full tool. Takes about 5 minutes.
      </p>
      <div className="max-w-3xl space-y-4">
        {STEPS.map((s) => (
          <div key={s.title} className={card}>
            <p className="font-semibold text-zinc-100">{s.title}</p>
            <p className="mt-2 text-sm text-zinc-400">{s.body}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}
