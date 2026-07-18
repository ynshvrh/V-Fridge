"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, ChefHat, User, Trash2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Message } from "@/interfaces/type";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { useProductStore } from "@/store/useVFridgeStore";


export default function Chat() {
  const t = useTranslations();
  const products = useProductStore((state) => state.products);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<Message[]>("/chat")
      .then((data) => { if (Array.isArray(data)) setMessages(data.slice(-20)); })
      .catch((err) => console.error("Failed to load chat history:", err));
  }, []);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const data = await apiFetch<Message>("/chat", { method: "POST", body: { content: text } });
      setMessages((prev) => [...prev, data].slice(-20));
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.warning(t("chatRateLimit"));
      } else {
        toast.error(getErrorMessage(err, t("chatSendFailed")));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearHistory = async () => {
    if (!confirm(t("chatClearTitle"))) return;
    try {
      await apiFetch("/chat", { method: "DELETE" });
      setMessages([]);
      toast.success(t("settingsChatCleared"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("chatClearFailed")));
    }
  };

  const promptDetails = [
    { key: "chatPrompt1", icon: "🍲", bg: "hover:bg-primary/10 hover:border-primary/40" },
    { key: "chatPrompt2", icon: "⏰", bg: "hover:bg-amber-500/10 hover:border-amber-500/40" },
    { key: "chatPrompt3", icon: "⚡", bg: "hover:bg-cyan-500/10 hover:border-cyan-500/40" },
    { key: "chatPrompt4", icon: "🌱", bg: "hover:bg-emerald-500/10 hover:border-emerald-500/40" },
  ];

  return (
    <div className="flex flex-col h-full w-full font-sans">
      <div className="flex-none px-4 py-3 border-b border-border/60 bg-card/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{t("chatHeader")}</h3>
            <span className="flex items-center gap-1.5 text-[11px] text-success font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> {t("chatSubtitle")}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearHistory}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
          title={t("chatClearAction")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Active Inventory Bar */}
      <div className="flex-none px-4 py-2 bg-primary/10 border-b border-primary/10 text-[11px] font-bold text-primary flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 animate-pulse text-primary" />
          <span>Шеф бачить ваш холодильник: {products.length} {t("dashboardItemsCount", { count: products.length })}</span>
        </div>
        <span className="opacity-80 hidden sm:inline">Аналіз активований</span>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-muted/30 custom-scrollbar"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-5 py-8">
            <div className="h-16 w-16 rounded-2xl bg-secondary grid place-items-center shadow-sm">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="font-bold text-lg inline-flex items-center gap-2">
                {t("chatGreeting")}
                <ChefHat className="h-5 w-5 text-primary" />
              </h4>
              <p className="text-sm text-muted-foreground">
                {t("chatEmpty")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {promptDetails.map((pd) => {
                const prompt = t(pd.key as never);
                return (
                  <button
                    key={pd.key}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className={`text-left rounded-2xl border border-border/70 bg-glass hover:scale-[1.02] active:scale-[0.98] transition-all p-4 shadow-2xs hover:shadow-xs cursor-pointer flex gap-3 items-start ${pd.bg}`}
                  >
                    <span className="text-xl shrink-0 leading-none">{pd.icon}</span>
                    <span className="font-bold text-sm text-foreground leading-tight">
                      {prompt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          const isAI = m.role === "assistant" || m.role === "model";
          return (
            <div
              key={i}
              className={`flex ${isAI ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-2.5 max-w-[88%] ${isAI ? "flex-row" : "flex-row-reverse"}`}>
                <Avatar className="h-8 w-8 shrink-0 border border-border/60 shadow-sm">
                  <AvatarFallback
                    className={
                      isAI
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }
                  >
                    {isAI ? <ChefHat size={14} /> : <User size={14} />}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col gap-1 ${isAI ? "items-start" : "items-end"}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                      isAI
                        ? "bg-card border-border/60 rounded-tl-md text-card-foreground"
                        : "bg-primary text-primary-foreground border-primary rounded-tr-md"
                    }`}
                  >
                    <div className={`prose prose-sm max-w-none wrap-break-word ${isAI ? "" : "prose-invert"}`}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-normal">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          strong: ({ children }) => (
                            <span className={`font-bold ${isAI ? "text-primary" : "text-primary-foreground underline underline-offset-2 decoration-white/40"}`}>
                              {children}
                            </span>
                          ),
                          li: ({ children }) => <li className="ml-1">{children}</li>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-card border border-border/60 p-3 px-4 rounded-2xl rounded-tl-md flex items-center gap-2.5 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t("chatThinking")}</span>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex-none p-3 md:p-4 bg-card/90 backdrop-blur border-t border-border/60 flex gap-2"
      >
        <Input
          className="rounded-xl border-border/70 focus-visible:ring-primary h-11 transition-all placeholder:text-muted-foreground/70"
          placeholder={t("chatInputHint")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-primary hover:bg-primary/90 h-11 w-11 p-0 shrink-0 transition-transform active:scale-95 shadow-md shadow-primary/20"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
