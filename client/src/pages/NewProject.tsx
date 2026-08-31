import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Bot, Check, Gamepad2, Globe2, Layers3, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import StackMark from "@/components/StackMark";

type Kind = "game" | "app" | "website";
type Message = { role: "assistant" | "user"; text: string };
const choices: Array<{ kind: Kind; label: string; description: string; icon: typeof Gamepad2 }> = [
  { kind: "game", label: "Interactive world", description: "Playable games and simulations", icon: Gamepad2 },
  { kind: "app", label: "Application", description: "Tools your team can use", icon: Layers3 },
  { kind: "website", label: "Website", description: "Stories, products and launches", icon: Globe2 },
];
const templates = ["2D platformer", "Space shooter", "SaaS dashboard", "Premium landing"];
const starterPrompts: Record<Kind, string> = {
  game: "Create a 2D platformer with a character, floating islands, collectibles and a clear goal.",
  app: "Create a focused team dashboard with projects, activity and a calm editorial interface.",
  website: "Create a premium launch website with a bold hero, benefits, proof and a strong call to action.",
};

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useSupabaseAuth();
  const generate = trpc.stack.generate.useMutation();
  const [kind, setKind] = useState<Kind>("game");
  const [template, setTemplate] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Tell me what you want to make. I’ll turn the direction into a first runnable version." },
  ]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("stack-pending-build");
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as { kind?: Kind; template?: string; prompt?: string };
      if (pending.kind) setKind(pending.kind);
      if (pending.template) setTemplate(pending.template);
      if (pending.prompt) { setPrompt(pending.prompt); setMessages([{ role: "assistant", text: "I kept your brief safe while you signed in. Review it below, then generate your first version." }, { role: "user", text: pending.prompt }]); }
    } catch { /* ignore malformed pending draft */ } finally { sessionStorage.removeItem("stack-pending-build"); }
  }, []);

  const selectKind = (next: Kind) => {
    setKind(next);
    setMessages(current => [...current, { role: "assistant", text: `Great — we’re shaping an ${next === "game" ? "interactive world" : next}. What should it do, feel like, or help someone accomplish?` }]);
  };
  const sendMessage = () => {
    const value = prompt.trim();
    if (value.length < 8) { toast.error("Write a little more detail so Stack has something to shape."); return; }
    setMessages(current => [...current, { role: "user", text: value }, { role: "assistant", text: "I’ve got it. You can keep refining the brief, or generate the first version when you’re ready." }]);
    setPrompt("");
  };
  const generateFirstVersion = async () => {
    const lastUser = [...messages].reverse().find(message => message.role === "user")?.text;
    const brief = (lastUser || prompt || starterPrompts[kind]).trim();
    if (brief.length < 8) { toast.error("Describe what you want to build first."); return; }
    if (!isAuthenticated) {
      sessionStorage.setItem("stack-pending-build", JSON.stringify({ kind, template, prompt: brief }));
      setLocation("/login");
      return;
    }
    setGenerating(true);
    try {
      const result = await generate.mutateAsync({ kind, prompt: brief });
      sessionStorage.setItem("stack-draft-code", JSON.stringify({ kind, prompt: brief, code: result.code }));
      setLocation(`/workspace?kind=${kind}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The build could not be started");
    } finally { setGenerating(false); }
  };

  return (
    <main className="min-h-screen bg-[#ededed] p-3 font-sans text-[#161616] sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1360px] flex-col overflow-hidden rounded-[24px] border border-black/[.07] bg-[#f7f5f1] shadow-[0_16px_70px_rgba(82,63,47,.12)] sm:min-h-[calc(100vh-32px)] sm:rounded-[30px]">
        <header className="flex items-center justify-between border-b border-black/[.08] bg-white/80 px-5 py-4 backdrop-blur-xl sm:px-8">
          <button onClick={() => setLocation("/workspace")} className="flex items-center gap-2 text-xs font-semibold text-neutral-500 transition hover:text-neutral-900"><ArrowLeft size={15} /> Back to workspace</button>
          <StackMark size="sm" showWordmark />
        </header>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_380px]">
          <section className="flex min-h-[620px] min-w-0 flex-col border-b border-black/[.08] lg:border-b-0 lg:border-r">
            <div className="border-b border-black/[.08] px-5 py-7 sm:px-10 sm:py-10">
              <div className="flex items-start justify-between gap-5"><div><div className="mb-4 inline-flex rounded-full bg-[#ef4d23]/10 p-3 text-[#ef4d23]"><Sparkles size={18} /></div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#ef4d23]">New build / 01</p><h1 className="mt-3 font-serif text-[clamp(42px,6vw,72px)] leading-[.9] tracking-[-.06em]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Make the first<br /><em>move.</em></h1><p className="mt-5 max-w-lg text-sm leading-6 text-neutral-500">Choose a canvas, then describe the outcome in your own words. Stack will shape the structure around your intent.</p></div><span className="hidden rounded-full border border-black/[.08] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 sm:block">Draft setup</span></div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-5 py-6 sm:px-10">
              <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400">Choose a canvas</span><span className="text-[10px] text-neutral-400">Step 1 of 2</span></div>
              <div className="grid gap-2 sm:grid-cols-3">{choices.map(choice => { const Icon = choice.icon; return <button key={choice.kind} onClick={() => selectKind(choice.kind)} className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${kind === choice.kind ? "border-[#ef4d23]/50 bg-[#ef4d23]/[.06] shadow-[0_8px_22px_rgba(239,77,35,.1)]" : "border-black/[.08] bg-white hover:border-black/20"}`}><span className={`mb-5 grid size-9 place-items-center rounded-xl ${kind === choice.kind ? "bg-[#ef4d23] text-white" : "bg-[#f5f2ee] text-neutral-500 group-hover:bg-[#ef4d23]/10 group-hover:text-[#ef4d23]"}`}><Icon size={17} /></span><span className="block text-xs font-semibold">{choice.label}</span><span className="mt-1 block text-[11px] leading-5 text-neutral-400">{choice.description}</span>{kind === choice.kind && <Check size={14} className="mt-3 text-[#ef4d23]" />}</button>; })}</div>
              <div className="mt-7 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400">Optional starting point</span><span className="text-[10px] text-neutral-400">{template || "Start blank"}</span></div>
              <div className="mt-3 flex flex-wrap gap-2">{templates.map(item => <button key={item} onClick={() => setTemplate(template === item ? "" : item)} className={`rounded-full border px-3 py-2 text-[11px] transition ${template === item ? "border-[#ef4d23] bg-[#ef4d23] text-white" : "border-neutral-200 bg-white text-neutral-600 hover:border-[#ef4d23]/50"}`}>{item}</button>)}</div>
              <div className="mt-auto flex items-center gap-2 pt-8 text-[11px] text-neutral-400"><span className="size-2 rounded-full bg-[#57b987]" /> Stack generation runtime ready <span className="ml-auto hidden sm:inline">Your private platform model key stays hidden.</span></div>
            </div>
          </section>
          <aside className="flex min-h-[620px] flex-col bg-white">
            <div className="border-b border-black/[.08] px-5 py-6 sm:px-7"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#ef4d23]"><Bot size={14} /> Stack guide</div><h2 className="mt-3 text-xl font-semibold tracking-[-.04em]">Shape your brief</h2><p className="mt-2 text-xs leading-5 text-neutral-500">A short conversation is enough. You can revise the idea before generating.</p></div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}><span className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full ${message.role === "user" ? "order-2 bg-[#0b0f1a] text-white" : "bg-[#ef4d23]/10 text-[#ef4d23]"}`}>{message.role === "user" ? <UserRound size={12} /> : <Sparkles size={12} />}</span><div className={`max-w-[82%] rounded-2xl px-3.5 py-3 text-xs leading-5 ${message.role === "user" ? "bg-[#0b0f1a] text-white" : "border border-black/[.07] bg-[#f7f5f1] text-neutral-600"}`}>{message.text}</div></div>)}<div className="rounded-2xl border border-dashed border-[#ef4d23]/30 bg-[#ef4d23]/[.04] p-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ef4d23]">Try this direction</p><button onClick={() => setPrompt(starterPrompts[kind])} className="mt-2 text-left text-xs leading-5 text-neutral-600 hover:text-neutral-900">{starterPrompts[kind]}</button></div></div>
            <div className="border-t border-black/[.08] bg-white p-4 sm:p-5"><div className="rounded-2xl border border-black/[.12] bg-[#fbfaf8] p-2 shadow-sm focus-within:border-[#ef4d23]/55"><textarea value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) sendMessage(); }} rows={4} placeholder="Describe the experience you want to make..." className="w-full resize-none bg-transparent px-2 py-1 text-xs leading-5 text-neutral-800 outline-none placeholder:text-neutral-400" /><div className="flex items-center justify-between px-1 pt-2"><span className="text-[10px] text-neutral-400">⌘ + Enter to send</span><button onClick={sendMessage} className="grid size-8 place-items-center rounded-full bg-[#0b0f1a] text-white transition hover:scale-105"><Send size={14} /></button></div></div><button onClick={generateFirstVersion} disabled={generating} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ef4d23] text-xs font-semibold text-white shadow-[0_8px_20px_rgba(239,77,35,.18)] transition hover:-translate-y-0.5 disabled:opacity-60">{generating ? <><Loader2 size={14} className="animate-spin" /> Shaping your first version…</> : <>Generate first version <ArrowRight size={14} /></>}</button></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
