import { useMemo, useState } from "react";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import {
  ArrowUp,
  Boxes,
  Check,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  Gamepad2,
  Globe2,
  Layers3,
  LogOut,
  Menu,
  MonitorPlay,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

type BuildKind = "game" | "app" | "website";
type View = "preview" | "code" | "world";

const kindLabels: Record<BuildKind, string> = {
  game: "Videojuego",
  app: "Aplicación",
  website: "Web",
};

const starterPrompts = [
  { label: "Plataforma 2D", kind: "game" as BuildKind, prompt: "Crea un videojuego de plataformas 2D con exploración, enemigos, coleccionables y un objetivo final." },
  { label: "Shooter espacial", kind: "game" as BuildKind, prompt: "Crea un shooter espacial arcade con oleadas de enemigos, power-ups y una nave controlable." },
  { label: "Dashboard SaaS", kind: "app" as BuildKind, prompt: "Crea un dashboard SaaS para equipos que muestre proyectos, actividad reciente, métricas y estados editables." },
  { label: "Landing premium", kind: "website" as BuildKind, prompt: "Crea una landing premium para una startup de IA con hero, beneficios, prueba social y CTA." },
];

const demoCode = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stack preview</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1020;color:#f6f7ff;font:16px system-ui}main{max-width:560px;padding:48px}span{color:#ff9165}button{margin-top:20px;border:0;border-radius:12px;padding:12px 18px;background:#ff7b49;font-weight:800;cursor:pointer}</style></head><body><main><small>STACK PREVIEW</small><h1>Your next <span>world</span> starts here.</h1><p>Describe what you want to build and Stack will turn the brief into a runnable experience.</p><button onclick="this.textContent='Ready to build'">Start exploring</button></main></body></html>`;

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "Ahora";
  return new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [kind, setKind] = useState<BuildKind>("game");
  const [view, setView] = useState<View>("preview");
  const [code, setCode] = useState(demoCode);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; content: string }>>([
    { role: "ai", content: "Hola. Soy Stack. Describe un videojuego, una aplicación o una web y prepararé una primera versión ejecutable." },
  ]);

  const projectsQuery = trpc.stack.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const generateMutation = trpc.stack.generate.useMutation();
  const createMutation = trpc.stack.create.useMutation({
    onSuccess: project => {
      if (project) {
        setActiveProjectId(project.id);
        projectsQuery.refetch();
        toast.success("Proyecto guardado en tu workspace");
      }
    },
    onError: error => toast.error(error.message),
  });
  const updateMutation = trpc.stack.update.useMutation({
    onSuccess: project => {
      if (project) {
        setCode(project.code);
        projectsQuery.refetch();
        toast.success("Cambios guardados");
      }
    },
    onError: error => toast.error(error.message),
  });

  const activeProject = useMemo(
    () => projectsQuery.data?.find(project => project.id === activeProjectId),
    [activeProjectId, projectsQuery.data],
  );

  const selectStarter = (starter: (typeof starterPrompts)[number]) => {
    setKind(starter.kind);
    setPrompt(starter.prompt);
  };

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast("Inicia sesión para crear y guardar proyectos", { action: { label: "Entrar", onClick: startLogin } });
      return;
    }
    if (prompt.trim().length < 8) {
      toast.error("Describe primero qué quieres construir");
      return;
    }
    const submittedPrompt = prompt.trim();
    setMessages(current => [...current, { role: "user", content: submittedPrompt }]);
    setPrompt("");
    try {
      const result = await generateMutation.mutateAsync({ kind, prompt: submittedPrompt });
      setCode(result.code);
      setView("preview");
      setMessages(current => [
        ...current,
        {
          role: "ai",
          content: result.usedModel
            ? `He preparado una primera versión de tu ${kindLabels[kind].toLowerCase()} con el motor de Stack.`
            : `He preparado una demo local de tu ${kindLabels[kind].toLowerCase()}. Añade la clave de generación del servidor para activar builds completos.`,
        },
      ]);
      createMutation.mutate({
        kind,
        prompt: submittedPrompt,
        code: result.code,
        name: `${kindLabels[kind]} — ${new Date().toLocaleDateString("es-ES")}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar el build");
      setMessages(current => [...current, { role: "ai", content: "No he podido completar este build. Revisa la configuración del motor y vuelve a intentarlo." }]);
    }
  };

  const handleOpenProject = (project: NonNullable<typeof projectsQuery.data>[number]) => {
    setActiveProjectId(project.id);
    setKind(project.kind as BuildKind);
    setPrompt(project.prompt);
    setCode(project.code);
    setView("preview");
    setMessages([{ role: "ai", content: `Proyecto cargado: **${project.name}**. Puedes seguir iterando sobre él.` }]);
  };

  const saveCurrent = () => {
    if (!activeProjectId) {
      toast("Genera un proyecto para guardarlo en tu workspace");
      return;
    }
    updateMutation.mutate({ id: activeProjectId, code, status: "ready" });
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1600);
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-[#f7f8fc] selection:bg-[#ff7a45]/30">
      <header className="flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#0b0f1b]/90 px-4 backdrop-blur-xl lg:px-6">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-white/60 hover:bg-white/[0.06] lg:hidden" onClick={() => setMobileNav(true)} aria-label="Abrir navegación"><Menu size={20} /></button>
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-[10px] bg-[#ff7a45] text-sm font-black text-[#241008] shadow-[0_0_28px_rgba(255,122,69,.24)]">S</div>
            <span className="text-[17px] font-bold tracking-[-0.04em]">Stack</span>
          </div>
          <span className="hidden rounded-full border border-[#ff7a45]/30 bg-[#ff7a45]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffae8e] sm:inline-flex">Private beta</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/65 transition hover:bg-white/[0.06] md:flex" onClick={() => toast("La publicación en un dominio propio llegará en la siguiente fase")}> <ExternalLink size={14} /> Publicar</button>
          {isAuthenticated ? (
            <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-3 text-xs" onClick={() => logout()}>
              <span className="grid size-6 place-items-center rounded-full bg-[#24314e] text-[10px] font-bold text-[#cbd6f2]">{(user?.name || user?.email || "S").slice(0, 1).toUpperCase()}</span>
              <span className="hidden max-w-28 truncate text-white/70 sm:inline">{user?.name || user?.email || "Cuenta"}</span>
              <LogOut size={13} className="text-white/40" />
            </button>
          ) : (
            <button className="rounded-lg bg-[#ff7a45] px-3.5 py-2 text-xs font-bold text-[#241008] shadow-[0_8px_30px_rgba(255,122,69,.18)] transition hover:bg-[#ff9165]" onClick={startLogin}>Continuar</button>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)] min-h-[650px]">
        <aside className={`${mobileNav ? "fixed inset-y-0 left-0 z-50 flex w-[300px]" : "hidden"} flex-col border-r border-white/[0.08] bg-[#0b0f1b] lg:relative lg:flex lg:w-[284px]`}>
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-4 lg:hidden"><span className="font-semibold">Workspace</span><button onClick={() => setMobileNav(false)}><X size={18} /></button></div>
          <div className="border-b border-white/[0.07] p-3">
            <button onClick={() => { setActiveProjectId(null); setCode(demoCode); setPrompt(""); setMessages([{ role: "ai", content: "Nuevo proyecto listo. ¿Qué quieres construir?" }]); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/[0.1]"><Plus size={16} /> Nuevo build</button>
          </div>
          <div className="flex items-center justify-between px-4 pb-2 pt-5"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Tus proyectos</span><span className="text-[11px] text-white/30">{projectsQuery.data?.length || 0}</span></div>
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {!isAuthenticated && <div className="m-2 rounded-xl border border-[#ff7a45]/20 bg-[#ff7a45]/[0.07] p-3 text-xs leading-5 text-[#ffc0a7]">Inicia sesión para sincronizar tus builds y volver a ellos desde cualquier dispositivo.</div>}
            {projectsQuery.isLoading && <div className="space-y-2 p-2"><div className="h-12 animate-pulse rounded-xl bg-white/[0.05]" /><div className="h-12 animate-pulse rounded-xl bg-white/[0.05]" /></div>}
            {projectsQuery.data?.map(project => <button key={project.id} onClick={() => handleOpenProject(project)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeProjectId === project.id ? "bg-[#ff7a45]/10 text-[#ffae8e]" : "text-white/55 hover:bg-white/[0.05] hover:text-white/80"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${activeProjectId === project.id ? "bg-[#ff7a45]/15 text-[#ff9b73]" : "bg-white/[0.06] text-white/45"}`}>{project.kind === "game" ? <Gamepad2 size={15} /> : project.kind === "app" ? <Layers3 size={15} /> : <Globe2 size={15} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{project.name}</span><span className="mt-0.5 block text-[10px] text-white/30">{kindLabels[project.kind as BuildKind]} · {formatDate(project.updatedAt)}</span></span><ChevronRight size={14} className="opacity-0 transition group-hover:opacity-60" /></button>)}
            {isAuthenticated && !projectsQuery.isLoading && !projectsQuery.data?.length && <div className="p-4 text-center text-xs leading-5 text-white/30">Aún no tienes builds. Describe una idea para empezar.</div>}
          </div>
          <div className="border-t border-white/[0.07] p-4"><div className="flex items-center gap-2 text-xs text-white/45"><span className="size-2 rounded-full bg-[#6ee7b7] shadow-[0_0_10px_#6ee7b7]" /> Motor listo para crear</div><div className="mt-2 flex items-center gap-2 text-[10px] text-white/25"><Boxes size={13} /> World Model runtime</div></div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col lg:flex-row">
          <section className="flex min-w-0 flex-1 flex-col border-r border-white/[0.08]">
            <div className="flex items-center gap-1 border-b border-white/[0.08] px-4 py-2.5 lg:px-6"><span className="mr-3 text-xs font-semibold text-white/70">Build space</span>{(["preview", "code", "world"] as View[]).map(item => <button key={item} onClick={() => setView(item)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${view === item ? "bg-white/[0.09] text-white" : "text-white/35 hover:text-white/65"}`}>{item === "preview" ? "Preview" : item === "code" ? "Code" : "World Model"}</button>)}<div className="ml-auto flex items-center gap-1.5"><button className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white" onClick={() => setCode(demoCode)} title="Reset preview"><RefreshCw size={14} /></button><button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 hover:bg-white/[0.06]" onClick={saveCurrent}><Save size={13} /> <span className="hidden sm:inline">Guardar</span></button></div></div>
            <div className="relative flex-1 overflow-hidden bg-[#070a12]">
              {view === "preview" && <div className="absolute inset-0 p-3 sm:p-5"><div className="h-full overflow-hidden rounded-xl border border-white/[0.1] bg-black shadow-2xl"><iframe title="Stack preview" srcDoc={code} sandbox="allow-scripts" className="h-full w-full border-0 bg-white" /></div></div>}
              {view === "code" && <div className="absolute inset-0 flex flex-col"><div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0b0f1b] px-4 py-2 text-[11px] text-white/40"><span className="flex items-center gap-2"><Code2 size={13} /> index.html</span><button className="flex items-center gap-1.5 hover:text-white" onClick={copyCode}>{isCopied ? <Check size={13} /> : <Copy size={13} />} {isCopied ? "Copiado" : "Copiar"}</button></div><textarea value={code} onChange={event => setCode(event.target.value)} spellCheck={false} className="min-h-0 flex-1 resize-none bg-[#080b14] p-5 font-mono text-xs leading-6 text-[#b9c7e6] outline-none" /></div>}
              {view === "world" && <div className="absolute inset-0 overflow-y-auto p-5 sm:p-8"><div className="mx-auto max-w-2xl"><div className="mb-8 flex items-start justify-between"><div><div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-[#ff7a45]/10 text-[#ff956c]"><Sparkles size={21} /></div><h2 className="text-2xl font-bold tracking-[-0.04em]">World Model runtime</h2><p className="mt-2 text-sm leading-6 text-white/45">La estructura que hace que cada mundo responda de forma consistente a las acciones del jugador.</p></div><span className="rounded-full border border-[#6ee7b7]/20 bg-[#6ee7b7]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8df2c7]">v0.1 ready</span></div><div className="space-y-2">{[{name:"State space", detail:"player · enemies · entities · camera · world", icon:"01"},{name:"Action space", detail:"keyboard → discrete actions", icon:"02"},{name:"Transition", detail:"physics · collisions · behavior", icon:"03"},{name:"Observation / render", detail:"Canvas 2D → pixels", icon:"04"},{name:"Goals", detail:"score · lives · win / lose", icon:"05"}].map((node,index)=><div key={node.name} className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"><span className="grid size-9 place-items-center rounded-xl bg-white/[0.06] font-mono text-xs text-[#ff9b73]">{node.icon}</span><div><div className="text-sm font-semibold text-white/85">{node.name}</div><div className="mt-1 font-mono text-[11px] text-white/35">{node.detail}</div></div>{index<4 && <span className="ml-auto text-white/20">↓</span>}</div>)}</div></div></div>}
            </div>
          </section>

          <section className="flex w-full flex-col bg-[#0b0f1b] lg:w-[390px] xl:w-[430px]">
            <div className="border-b border-white/[0.08] px-5 py-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/35"><WandSparkles size={14} className="text-[#ff956c]" /> Stack assistant</div><h1 className="mt-3 text-xl font-bold tracking-[-0.04em]">What are you building?</h1><p className="mt-1.5 text-xs leading-5 text-white/40">Games, worlds, apps, and websites — turn a brief into a runnable first version.</p></div>
            <div className="flex-1 overflow-y-auto p-4"><div className="space-y-4">{messages.map((message,index)=><div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}><div className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-xs leading-5 ${message.role === "user" ? "bg-[#ff7a45] font-medium text-[#241008]" : "border border-white/[0.08] bg-white/[0.035] text-white/65"}`}>{message.role === "ai" ? <Streamdown>{message.content}</Streamdown> : message.content}</div></div>)}</div>{!messages.some(message => message.role === "user") && <div className="mt-7"><div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">Start with a template</div><div className="grid grid-cols-2 gap-2">{starterPrompts.map(starter=><button key={starter.label} onClick={() => selectStarter(starter)} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-left text-[11px] font-medium text-white/55 transition hover:border-[#ff7a45]/35 hover:bg-[#ff7a45]/[0.06] hover:text-[#ffb398]"><span className="mb-2 block text-[#ff956c]">{starter.kind === "game" ? <Gamepad2 size={15} /> : starter.kind === "app" ? <Layers3 size={15} /> : <Globe2 size={15} />}</span>{starter.label}</button>)}</div></div>}</div>
            <div className="border-t border-white/[0.08] p-4"><div className="mb-2 flex gap-1.5">{(Object.keys(kindLabels) as BuildKind[]).map(item=><button key={item} onClick={() => setKind(item)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${kind === item ? "bg-[#ff7a45]/15 text-[#ffad8f]" : "text-white/30 hover:text-white/65"}`}>{kindLabels[item]}</button>)}</div><div className="rounded-2xl border border-white/[0.1] bg-[#111726] p-2 shadow-[0_10px_40px_rgba(0,0,0,.18)] focus-within:border-[#ff7a45]/45"><textarea value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) handleGenerate(); }} placeholder="Describe lo que quieres construir..." rows={3} className="w-full resize-none bg-transparent px-2 py-1 text-xs leading-5 text-white/85 outline-none placeholder:text-white/25" /><div className="flex items-center justify-between px-1 pt-2"><span className="text-[10px] text-white/25">⌘ + Enter para crear</span><button onClick={handleGenerate} disabled={generateMutation.isPending || authLoading} className="grid size-8 place-items-center rounded-xl bg-[#ff7a45] text-[#241008] transition hover:bg-[#ff956c] disabled:cursor-wait disabled:opacity-50" aria-label="Crear"><ArrowUp size={16} strokeWidth={2.5} /></button></div></div><div className="mt-3 flex items-center justify-between text-[10px] text-white/25"><span className="flex items-center gap-1.5"><MonitorPlay size={12} /> Preview seguro en sandbox</span><span>{activeProject ? "Guardado" : "Demo local"}</span></div></div>
          </section>
        </main>
      </div>
      {!isAuthenticated && <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-[#141b2c]/95 px-4 py-3 text-xs shadow-2xl backdrop-blur-xl"><span className="hidden text-white/55 sm:inline">Guarda tus builds y continúa desde cualquier lugar</span><button onClick={startLogin} className="flex items-center gap-1.5 rounded-lg bg-[#ff7a45] px-3 py-2 font-bold text-[#241008]">Empezar <ChevronRight size={14} /></button></div>}
    </div>
  );
}
