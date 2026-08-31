import { useState } from "react";
import { useLocation } from "wouter";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4";
const POSTER_URL = "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60";

function FlowerMark({ dark = false }: { dark?: boolean }) {
  const petals = Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 4;
    return { x: 16 + Math.cos(angle) * 10, y: 16 + Math.sin(angle) * 10 };
  });
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-label="Stack logo" role="img">
      {petals.map((petal, index) => <circle key={index} cx={petal.x} cy={petal.y} r="3.5" fill={dark ? "#ef4d23" : "#ef4d23"} />)}
      <circle cx="16" cy="16" r="3.5" fill="#ef4d23" />
    </svg>
  );
}

function Gauge({ value, color = "#ef4d23", showLabels = false, min = "389K", max = "425K" }: { value: number; color?: string; showLabels?: boolean; min?: string; max?: string }) {
  const ticks = Array.from({ length: 40 }, (_, index) => {
    const angle = Math.PI + (index / 39) * Math.PI;
    const active = index < Math.round((value / 100) * 40);
    const x1 = 100 + Math.cos(angle) * 68;
    const y1 = 100 + Math.sin(angle) * 68;
    const x2 = 100 + Math.cos(angle) * 80;
    const y2 = 100 + Math.sin(angle) * 80;
    return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={active ? color : "#d4d4d8"} strokeWidth="2.5" strokeLinecap="round" />;
  });
  return (
    <div className="mx-auto mt-1 max-w-[220px]">
      <svg viewBox="0 0 200 120" className="w-full" aria-label={`${value}% complete`}>
        {ticks}
        <text x="100" y="105" textAnchor="middle" fontSize="22" fontWeight="600" fill="#171717">{value}%</text>
      </svg>
      {showLabels && <div className="-mt-2 flex justify-between text-[10px] text-neutral-400"><span>{min}</span><span>{max}</span></div>}
    </div>
  );
}

function MiniToggle({ active, secondary }: { active: string; secondary: string }) {
  return <div className="mt-4 flex rounded-full bg-neutral-100 p-1 text-[10px] font-medium text-neutral-400"><span className="rounded-full bg-white px-3 py-1.5 text-neutral-800 shadow-sm">{active}</span><span className="px-3 py-1.5">{secondary}</span></div>;
}

function DashboardPreview() {
  return (
    <div className="mx-auto w-full max-w-[880px] rounded-[24px] bg-[#f5f2ee] p-3 shadow-[0_30px_80px_rgba(75,58,44,.14)] sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        <article className="min-h-[244px] rounded-[18px] bg-white p-4 shadow-[0_2px_12px_rgba(20,20,20,.04)] sm:p-5">
          <div className="flex items-center justify-between text-[11px]"><span className="font-semibold text-[#ef4d23]">Worlds</span><span className="text-neutral-400">This month</span></div>
          <div className="mt-4 flex items-center gap-2"><span className="text-[28px] font-semibold tracking-[-.06em] text-neutral-900">6,896</span><span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-500"><TrendingDown size={11} /> -3,382</span></div>
          <div className="mt-1 text-[10px] text-neutral-400">Compared to yesterday</div>
          <div className="mt-3 text-center text-[10px] text-neutral-500">World targets achieved</div>
          <Gauge value={92} showLabels />
          <MiniToggle active="Games" secondary="Apps" />
        </article>
        <article className="min-h-[244px] rounded-[18px] bg-white p-4 shadow-[0_2px_12px_rgba(20,20,20,.04)] sm:p-5">
          <div className="flex items-center justify-between text-[11px]"><span className="font-semibold text-[#ef4d23]">Build brief</span><span className="text-neutral-400">Quick setup</span></div>
          <div className="mt-4 space-y-3"><label className="block text-[10px] font-medium text-neutral-500">Build type<span className="mt-1 flex items-center justify-between rounded-lg border border-neutral-200 px-2.5 py-2 text-[11px] font-semibold text-neutral-800">Interactive world <ChevronDown size={13} className="text-neutral-400" /></span></label><label className="block text-[10px] font-medium text-neutral-500">Experience<span className="mt-1 flex items-center justify-between rounded-lg border border-neutral-200 px-2.5 py-2 text-[11px] font-semibold text-neutral-800">Web application <ChevronDown size={13} className="text-neutral-400" /></span></label></div>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3"><button className="rounded-lg bg-[#ef4d23] px-4 py-2 text-[10px] font-semibold text-white">Save</button><button className="text-[10px] font-medium text-neutral-500 underline underline-offset-2">Cancel</button><X size={14} className="ml-auto text-neutral-300" /></div>
        </article>
        <article className="min-h-[244px] rounded-[18px] bg-white p-4 shadow-[0_2px_12px_rgba(20,20,20,.04)] sm:p-5">
          <div className="flex items-center justify-between text-[11px]"><span className="font-semibold text-[#ef4d23]">Builds</span><span className="text-neutral-400">Today</span></div>
          <div className="mt-4 flex items-center gap-2"><span className="text-[28px] font-semibold tracking-[-.06em] text-neutral-900">0</span><span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold text-neutral-500"><TrendingUp size={11} /> 0</span></div>
          <div className="mt-1 text-[10px] text-neutral-400">Compared to yesterday</div>
          <div className="mt-4"><Gauge value={68} color="#9ca3af" /></div>
          <MiniToggle active="Applications" secondary="Websites" />
        </article>
      </div>
    </div>
  );
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const goToWorkspace = () => { setMenuOpen(false); setLocation("/workspace"); };

  return (
    <main className="min-h-screen w-full bg-[#ededed] p-3 font-sans sm:p-4">
      <section className="relative min-h-[720px] w-full overflow-hidden rounded-[24px] bg-[#d9d9d9] sm:min-h-[calc(100vh-32px)] sm:rounded-[30px]">
        <video className="absolute inset-0 h-full w-full object-cover opacity-50" autoPlay loop muted playsInline preload="auto" disableRemotePlayback poster={POSTER_URL} aria-hidden="true"><source src={VIDEO_URL} type="video/mp4" /></video>
        <div className="absolute inset-0 bg-white/55" />
        <div className="relative z-10 flex min-h-[720px] flex-col sm:min-h-[calc(100vh-32px)]">
          <nav className="flex justify-center px-3 pt-4 sm:px-4 sm:pt-6">
            <div className="relative flex w-full max-w-[760px] items-center rounded-full border border-neutral-200 bg-white py-1.5 pl-2 pr-2 shadow-sm">
              <button onClick={() => setLocation("/")} className="shrink-0 rounded-full transition hover:bg-neutral-100"><FlowerMark /></button>
              <div className="ml-4 hidden items-center gap-6 text-[12px] font-medium text-neutral-500 md:flex"><button className="flex items-center gap-1.5 text-neutral-900"><span className="size-1.5 rounded-full bg-black" /> Workspace</button><button>Capabilities</button><button>About</button><button className="flex items-center gap-1 text-[#ef4d23]">Docs <ChevronDown size={13} /></button></div>
              <div className="ml-auto flex items-center gap-2"><ShoppingCart size={16} className="mr-2 hidden text-neutral-500 sm:block" /><button onClick={goToWorkspace} className="flex items-center gap-2 rounded-full bg-[#ef4d23] py-1.5 pl-4 pr-1.5 text-[11px] font-semibold text-white transition hover:bg-[#db421b] sm:pl-5"> <span className="hidden sm:inline">Start building</span><span className="sm:hidden">Build</span><span className="grid size-6 place-items-center rounded-full bg-white/20"><ChevronRight size={14} /></span></button><button className="ml-1 rounded-full p-2 text-neutral-700 md:hidden" onClick={() => setMenuOpen(open => !open)} aria-label="Open menu">{menuOpen ? <X size={17} /> : <Menu size={17} />}</button></div>
              {menuOpen && <div className="absolute left-2 right-2 top-full z-20 mt-2 rounded-2xl border border-neutral-200 bg-white p-3 text-sm text-neutral-700 shadow-xl md:hidden"><button className="block w-full rounded-xl px-3 py-2 text-left font-medium text-neutral-900">Workspace</button><button className="block w-full rounded-xl px-3 py-2 text-left">Capabilities</button><button className="block w-full rounded-xl px-3 py-2 text-left">About</button><button className="block w-full rounded-xl px-3 py-2 text-left text-[#ef4d23]">Docs</button></div>}
            </div>
          </nav>
          <div className="flex flex-col items-center px-4 pb-8 pt-10 text-center sm:pb-12 sm:pt-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm"><span className="size-1.5 rounded-full bg-[#ef4d23]" /> Stack</div>
            <h1 className="mt-5 max-w-4xl text-[clamp(40px,8vw,76px)] font-medium leading-[1.02] tracking-[-.055em] text-[#131313] sm:mt-6">Build <span className="font-serif italic font-normal" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Worlds</span><br />and apps of tomorrow</h1>
            <p className="mt-4 max-w-[520px] px-2 text-[clamp(13px,3.5vw,16px)] leading-6 text-neutral-700 sm:mt-6">The AI workspace for building games, applications, and websites.</p>
            <button onClick={goToWorkspace} className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#0b0f1a] py-2 pl-6 pr-2.5 text-[12px] font-medium text-white transition hover:bg-[#1d2433] sm:mt-8 sm:pl-7 sm:text-[13px]">Start building <span className="grid size-7 place-items-center rounded-full bg-white/15"><ChevronRight size={15} /></span></button>
          </div>
          <div className="mt-auto px-3 sm:px-4"><DashboardPreview /></div>
        </div>
      </section>
    </main>
  );
}
