"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, ChefHat, User, Trash2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Message } from "@/interfaces/type";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";

const QUICK_PROMPTS = [
  "Що приготувати на вечерю?",
  "Швидкий сніданок за 10 хвилин",
  "Що зробити з того, що скоро зіпсується?",
  "Корисний обід без м'яса",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<Message[]>("/chat")
      .then((data) => { if (Array.isArray(data)) setMessages(data.slice(-20)); })
      .catch((err) => console.error("Помилка завантаження історії:", err));
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
        toast.warning("Забагато запитів. Спробуйте через хвилину.");
      } else {
        toast.error(getErrorMessage(err, "Не вдалося надіслати повідомлення"));
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
    if (!confirm("Видалити всю історію переписки?")) return;
    try {
      await apiFetch("/chat", { method: "DELETE" });
      setMessages([]);
      toast.success("Історію очищено");
    } catch (err) {
      toast.error(getErrorMessage(err, "Не вдалося очистити чат"));
    }
  };

  return (
    <div className="flex flex-col h-full w-full font-sans">
      <div className="flex-none px-4 py-3 border-b border-border/60 bg-card/80 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Шеф V-Fridge</h3>
            <span className="flex items-center gap-1.5 text-[11px] text-success font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> онлайн і готовий
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearHistory}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
          title="Очистити чат"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-muted/30 custom-scrollbar"
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-5 py-8">
            <div className="h-16 w-16 rounded-2xl bg-secondary grid place-items-center shadow-sm">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="font-bold text-lg">Привіт! Я ваш кулінарний помічник 👨‍🍳</h4>
              <p className="text-sm text-muted-foreground">
                Скажіть, що ви хочете приготувати — я підкажу рецепт із ваших продуктів.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm px-4 py-3 rounded-xl border border-border/70 bg-card hover:bg-secondary hover:border-primary/30 transition-colors"
                >
                  {prompt}
                </button>
              ))}
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
              <span className="text-sm font-medium text-muted-foreground">Шеф готує відповідь…</span>
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
          placeholder="Спитайте рецепт або що приготувати…"
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
