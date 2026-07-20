"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, ChefHat, User, Trash2, Sparkles, Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Message, SavedRecipe } from "@/interfaces/type";
import { apiFetch, ApiError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import { useProductStore, useSavedRecipeStore } from "@/store/useVFridgeStore";


interface ParsedRecipeBlock {
  preText: string;
  recipeName: string;
  recipeDescription: string;
  ingredients: string[];
  steps: string[];
  postText: string;
  hasRecipe: boolean;
  fullRecipeText: string;
}

function extractRecipeData(content: string): ParsedRecipeBlock {
  const codeBlockMatch = content.match(/```(?:recipe)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    const rawBlock = codeBlockMatch[1];
    const preText = content.slice(0, codeBlockMatch.index).trim();
    const postText = content.slice(codeBlockMatch.index! + codeBlockMatch[0].length).trim();

    let name = "Рецепт від AI Шефа";
    let description = "";
    const ingredients: string[] = [];
    const steps: string[] = [];

    const lines = rawBlock.split("\n").map((l) => l.trim()).filter(Boolean);
    let section: "none" | "ingredients" | "steps" = "none";

    for (const line of lines) {
      if (/^(?:Title|Name|Назва|Рецепт):/i.test(line)) {
        name = line.replace(/^(?:Title|Name|Назва|Рецепт):\s*/i, "").replace(/[*#]/g, "").trim();
      } else if (/^(?:Description|Опис):/i.test(line)) {
        description = line.replace(/^(?:Description|Опис):\s*/i, "").trim();
      } else if (/^(?:Ingredients|Інгредієнти):/i.test(line)) {
        section = "ingredients";
      } else if (/^(?:Steps|Кроки|Приготування):/i.test(line)) {
        section = "steps";
      } else if (line.startsWith("-") || line.startsWith("*")) {
        const item = line.replace(/^[-*]\s*/, "").trim();
        if (section === "steps") steps.push(item);
        else ingredients.push(item);
      } else if (/^\d+\./.test(line)) {
        steps.push(line.replace(/^\d+\.\s*/, "").trim());
      } else {
        if (section === "ingredients") ingredients.push(line);
        else if (section === "steps") steps.push(line);
        else if (!description) description = line;
      }
    }

    return {
      preText,
      recipeName: name,
      recipeDescription: description,
      ingredients,
      steps,
      postText,
      hasRecipe: true,
      fullRecipeText: rawBlock,
    };
  }

  const ingIndex = content.search(/(?:Інгредієнти|Ingredients):/i);
  if (ingIndex !== -1) {
    const preText = content.slice(0, ingIndex).trim();
    const recipeText = content.slice(ingIndex).trim();

    let name = "Рецепт від AI Шефа";
    const titleMatch = preText.match(/\*\*(.*?)\*\*/) || preText.match(/^#+\s*(.*)/m);
    if (titleMatch) {
      name = titleMatch[1].replace(/[*#]/g, "").trim();
    } else {
      const preLines = preText.split("\n").map((l) => l.trim()).filter(Boolean);
      if (preLines.length > 0) name = preLines[preLines.length - 1].replace(/[*#]/g, "").trim();
    }

    const ingredients: string[] = [];
    const steps: string[] = [];
    const lines = recipeText.split("\n").map((l) => l.trim()).filter(Boolean);
    let section: "ingredients" | "steps" = "ingredients";

    for (const line of lines) {
      if (/(?:Кроки|Приготування|Steps):/i.test(line)) {
        section = "steps";
        continue;
      }
      if (/(?:Інгредієнти|Ingredients):/i.test(line)) {
        section = "ingredients";
        continue;
      }
      if (line.startsWith("-") || line.startsWith("*")) {
        const item = line.replace(/^[-*]\s*/, "").trim();
        if (section === "steps") steps.push(item);
        else ingredients.push(item);
      } else if (/^\d+\./.test(line)) {
        steps.push(line.replace(/^\d+\.\s*/, "").trim());
      }
    }

    return {
      preText,
      recipeName: name,
      recipeDescription: "",
      ingredients,
      steps,
      postText: "",
      hasRecipe: true,
      fullRecipeText: recipeText,
    };
  }

  return {
    preText: content,
    recipeName: "",
    recipeDescription: "",
    ingredients: [],
    steps: [],
    postText: "",
    hasRecipe: false,
    fullRecipeText: "",
  };
}

export default function Chat() {
  const t = useTranslations() as unknown as (key: string, values?: Record<string, string | number>) => string;
  const products = useProductStore((state) => state.products);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSaveRecipeCard = async (parsed: ParsedRecipeBlock) => {
    const name = parsed.recipeName || "Рецепт від AI Шефа";
    try {
      const saved = await apiFetch<SavedRecipe>("/saved-recipes", {
        method: "POST",
        body: {
          name,
          description: parsed.recipeDescription || null,
          ingredients: parsed.ingredients,
          steps: parsed.steps,
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
        },
      });
      useSavedRecipeStore.getState().addSavedRecipe(saved);
      toast.success(t("recipeSavedSuccess", { name }));
    } catch (err) {
      toast.error(getErrorMessage(err, "Не вдалося зберегти рецепт."));
    }
  };

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
                const prompt = t(pd.key);
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
          const parsed = isAI ? extractRecipeData(m.content) : null;

          return (
            <div
              key={i}
              className={`flex ${isAI ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-2.5 max-w-[92%] sm:max-w-[85%] ${isAI ? "flex-row" : "flex-row-reverse"}`}>
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
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                      isAI
                        ? "bg-card border-border/60 rounded-tl-md text-card-foreground"
                        : "bg-primary text-primary-foreground border-primary rounded-tr-md"
                    }`}
                  >
                    {isAI && parsed && parsed.hasRecipe ? (
                      <div className="space-y-3">
                        {/* Pre-recipe text */}
                        {parsed.preText && (
                          <div className="prose prose-sm max-w-none wrap-break-word">
                            <ReactMarkdown>{parsed.preText}</ReactMarkdown>
                          </div>
                        )}

                        {/* Framed Recipe Block */}
                        <div className="rounded-3xl border-2 border-primary/30 bg-primary/5 p-4 md:p-5 space-y-3 shadow-xs my-2">
                          <div className="flex items-center justify-between border-b border-primary/15 pb-2.5">
                            <div className="flex items-center gap-2">
                              <ChefHat className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-xs font-black uppercase tracking-widest text-primary">
                                Рецепт
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSaveRecipeCard(parsed)}
                              className="rounded-xl text-xs font-bold gap-1.5 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              <Bookmark className="h-3.5 w-3.5 text-primary" />
                              <span>{t("recipeSaveAction")}</span>
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-base md:text-lg font-black tracking-tight leading-snug text-foreground">
                              {parsed.recipeName}
                            </h4>
                            {parsed.recipeDescription && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {parsed.recipeDescription}
                              </p>
                            )}

                            {/* Ingredients */}
                            {parsed.ingredients.length > 0 && (
                              <div className="space-y-1.5 pt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  {t("plannerIngredientsLabel")}
                                </span>
                                <ul className="grid grid-cols-1 gap-1 text-xs font-medium">
                                  {parsed.ingredients.map((ing, ix) => (
                                    <li key={ix} className="flex items-center gap-2 text-foreground/90">
                                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                      <span>{ing}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Steps */}
                            {parsed.steps.length > 0 && (
                              <div className="space-y-2 pt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  {t("plannerStepsLabel")}
                                </span>
                                <ol className="relative border-l border-primary/20 ml-2.5 space-y-2">
                                  {parsed.steps.map((step, ix) => (
                                    <li key={ix} className="pl-5 relative text-xs">
                                      <div className="absolute -left-2.5 top-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-[9px] font-black text-primary select-none">
                                        {ix + 1}
                                      </div>
                                      <span className="text-foreground/90 leading-relaxed">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Post-recipe text */}
                        {parsed.postText && (
                          <div className="prose prose-sm max-w-none wrap-break-word">
                            <ReactMarkdown>{parsed.postText}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    ) : (
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
                    )}
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
