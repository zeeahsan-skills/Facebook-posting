"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/profiles", label: "Account Profiles", icon: "👤" },
  { href: "/groups", label: "Facebook Groups", icon: "👥" },
  { href: "/folders", label: "Group Folders", icon: "📁" },
  { href: "/import", label: "Spreadsheet", icon: "📥" },
  { href: "/campaigns", label: "Campaign Manager", icon: "📣" },
  { href: "/media", label: "Image Library", icon: "🖼️" },
  { href: "/scheduler", label: "Posting Scheduler", icon: "🗓️" },
  { href: "/control", label: "AI Agent Control", icon: "⏯️" },
  { href: "/worker", label: "Worker Health", icon: "💓" },
  { href: "/analytics", label: "Click Analytics", icon: "📈" },
  { href: "/history", label: "Posting History", icon: "🕘" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/whatsapp", label: "WhatsApp Control", icon: "💬" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-zinc-800 bg-zinc-950 md:flex">
        <div className="border-b border-zinc-800 px-6 py-5">
          <p className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-lg font-bold text-transparent">
            FB Posting Tool
          </p>
          <p className="mt-1 text-xs text-zinc-500">Group automation suite</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-600/20 text-indigo-200"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-800 p-4">
          <button
            onClick={logout}
            className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-10 border-b border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
        <p className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text font-bold text-transparent">
          FB Posting Tool
        </p>
      </div>

      <main className="flex-1 px-4 py-6 pt-16 md:ml-64 md:px-8 md:pt-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-zinc-800 bg-zinc-950 px-2 py-2 md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 flex-col items-center px-3 py-1 text-[10px] ${
                active ? "text-indigo-300" : "text-zinc-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
