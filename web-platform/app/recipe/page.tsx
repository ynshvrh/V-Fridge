"use client";
import Chat from "@/components/chat";

export default function RecipePage() {
  return (
    <div className="h-full w-full flex flex-col p-3 md:p-6">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <main className="flex-1 min-h-0 relative flex flex-col">
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-secondary/40 via-transparent to-primary/10 blur-2xl opacity-60" />
          <div className="flex-1 h-full w-full rounded-3xl border border-border/60 shadow-2xl shadow-primary/5 bg-card overflow-hidden flex flex-col">
            <Chat />
          </div>
        </main>
      </div>
    </div>
  );
}
