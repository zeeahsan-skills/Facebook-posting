"use client";
import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import { card } from "../../components/ui";

type Group = {
  id: string; name: string; url: string;
  country: string | null; category: string | null;
};

export default function FoldersPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/groups").then((r) => r.json()).then((d) => setGroups(d.groups || []));
  }, []);

  // Build folders: "Country — Category", fallback to "Uncategorized"
  const folders = new Map<string, Group[]>();
  groups.forEach((g) => {
    const country = g.country?.trim() || "Other";
    const category = g.category?.trim() || "General";
    const key = `${country} · ${category}`;
    if (!folders.has(key)) folders.set(key, []);
    folders.get(key)!.push(g);
  });
  const sorted = [...folders.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <Shell>
      <h1 className="mb-1 text-2xl font-bold">Group Folders</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Groups auto-organized by country and category — like <b className="text-zinc-200">USA Jobs</b>,{" "}
        <b className="text-zinc-200">UK Dating</b>. Set country/category on the Groups page to file them.
      </p>

      {sorted.length === 0 ? (
        <div className={`${card} text-center text-sm text-zinc-500`}>
          No groups yet. Add some on the Facebook Groups page.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(([name, items]) => {
            const open = openFolder === name;
            return (
              <div key={name} className={card}>
                <button
                  onClick={() => setOpenFolder(open ? null : name)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{open ? "📂" : "📁"}</span>
                    <span className="font-semibold text-zinc-100">{name}</span>
                    <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                      {items.length}
                    </span>
                  </div>
                  <span className="text-zinc-500">{open ? "▲" : "▼"}</span>
                </button>
                {open && (
                  <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
                    {items.map((g) => (
                      <div key={g.id} className="flex items-center justify-between rounded-lg bg-zinc-950/60 px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{g.name}</p>
                          <a href={g.url} target="_blank" rel="noreferrer"
                            className="text-xs text-sky-300/80 hover:underline">
                            {g.url.replace("https://www.facebook.com/groups/", "fb.com/groups/")}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
