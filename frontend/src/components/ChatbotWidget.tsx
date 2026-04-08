import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle, SendHorizontal, X } from "lucide-react";
import { useCookieConsent } from "@/context/CookieConsentContext";
import { chatApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatCitation = { title: string; url?: string };

const starterQuestions = [
  "How can I donate on this website?",
  "Where can I view impact and transparency info?",
  "How do I contact the team through the site?",
];

const hiddenPrefixes = ["/admin", "/donor", "/portal", "/login", "/register", "/account", "/logout"];

const ChatbotWidget = () => {
  const location = useLocation();
  const { hasConsented } = useCookieConsent();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<ChatCitation[]>([]);
  const [lastSubmittedAt, setLastSubmittedAt] = useState(0);

  const shouldHide = useMemo(
    () => hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix)),
    [location.pathname]
  );

  if (shouldHide) return null;

  const buttonBottomClass = hasConsented ? "bottom-[4.75rem] sm:bottom-[5.25rem]" : "bottom-[11.75rem] sm:bottom-[10.75rem]";
  const panelBottomClass = hasConsented ? "bottom-[8.75rem] sm:bottom-[9.25rem]" : "bottom-[15.75rem] sm:bottom-[14.75rem]";

  const askQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const now = Date.now();
    if (now - lastSubmittedAt < 700) return;
    setLastSubmittedAt(now);
    setError(null);

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await chatApi.ask(trimmed, nextMessages.slice(-8));

      setMessages((prev) => [...prev, { role: "assistant", content: response.answer }]);
      setCitations(response.citations ?? []);
    } catch {
      setError("I couldn't answer right now. Please try again or use our contact page.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await askQuestion(input);
  };

  return (
    <>
      {isOpen && (
        <div
          id="chatbot-panel"
          className={cn(
            "fixed right-4 z-30 w-[min(92vw,24rem)] rounded-2xl border border-border bg-white shadow-elevated sm:right-6",
            panelBottomClass
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-accent">Help Chat</p>
              <p className="font-body text-xs text-muted-foreground">Website navigation and public info</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Close chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="font-body text-sm text-foreground">Hello! How can we help you today?</p>
                <div className="flex flex-wrap gap-2">
                  {starterQuestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void askQuestion(prompt)}
                      className="rounded-full border border-border bg-secondary px-3 py-1.5 text-left font-body text-xs text-foreground transition-colors hover:bg-secondary/80"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[90%] rounded-xl px-3 py-2 font-body text-sm leading-relaxed",
                  message.role === "user" ? "ml-auto bg-navy text-white" : "bg-secondary text-foreground"
                )}
              >
                {message.content}
              </div>
            ))}

            {loading && <p className="font-body text-xs text-muted-foreground">Thinking...</p>}
            {error && <p className="font-body text-xs text-red-700">{error}</p>}
          </div>

          <div className="border-t border-border px-4 py-3">
            {citations.length > 0 && (
              <p className="mb-2 font-body text-[11px] text-muted-foreground">
                Sources:{" "}
                {citations.map((item, idx) => (
                  <span key={`${item.title}-${idx}`}>
                    {idx > 0 ? ", " : ""}
                    {item.url ? (
                      <a href={item.url} className="text-accent hover:underline">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </span>
                ))}
              </p>
            )}
            <form onSubmit={onSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about this website..."
                className="h-10 w-full rounded-lg border border-border px-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send message"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 font-body text-[11px] text-muted-foreground">
              Website-help assistant only. It cannot provide private or sensitive information. For urgent help, use our{" "}
              <Link to="/contact" className="text-accent hover:underline">
                contact page
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed right-4 z-30 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-3 font-body text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-elevated transition-colors hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:right-6",
          buttonBottomClass
        )}
        aria-expanded={isOpen}
        aria-controls="chatbot-panel"
        aria-label="Open help chatbot"
      >
        <MessageCircle className="h-4 w-4" />
        Help Chat
      </button>
    </>
  );
};

export default ChatbotWidget;
