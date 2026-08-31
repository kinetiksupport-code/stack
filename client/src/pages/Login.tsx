import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase, supabaseConfigured } from "@/lib/supabase";

const FALCON_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260813_052122_e77a27e6-17f1-4794-889b-3ceaa0e9e8cb.mp4";
const POSTER = "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80";

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[18px]"><path fill="#EA4335" d="M24 9.5c3.2 0 5.4 1.4 6.7 2.6l4.9-4.8C32.6 4.6 28.8 3 24 3 14.8 3 7 8.3 3.2 15.9l5.7 4.4C10.7 15.1 16.7 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.9c-.3 2-1.8 5-5.1 7l5.6 4.3c4.9-4.5 9.1-11.1 9.1-19Z"/><path fill="#34A853" d="M8.9 28.3A14.7 14.7 0 0 1 8.1 24c0-1.5.3-3 .8-4.3l-5.7-4.4A21 21 0 0 0 1 24c0 3.4.8 6.7 2.2 9.6l5.7-4.3Z"/><path fill="#FBBC05" d="M24 45c5.8 0 10.6-1.9 14.1-5.2l-5.6-4.3c-1.5 1-3.7 1.8-8.5 1.8-7.3 0-13.3-5.6-15.1-13.2l-5.7 4.3C7 37.7 14.8 45 24 45Z"/></svg>;
}
function Logo() { return <span className="grid size-8 place-items-center rounded-full bg-[#ef4d23] text-sm font-bold text-white">S</span>; }

export default function Login() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (!supabase) return; const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (session) setLocation("/workspace"); }); return () => data.subscription.unsubscribe(); }, [setLocation]);
  const continueWithGoogle = async () => {
    if (!supabaseConfigured || !supabase) { toast.error("Supabase todavía no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para activar Google."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/login` } });
    if (error) { toast.error(error.message); setLoading(false); }
  };
  return <main className="min-h-screen bg-white text-[#11151d] lg:h-screen lg:overflow-hidden"><div className="grid min-h-screen lg:grid-cols-[57.1%_42.9%] lg:min-h-full">
    <section className="relative min-h-[370px] overflow-hidden bg-[#20242b] lg:min-h-full"><video className="absolute inset-0 h-full w-full object-cover object-[64%_48%]" autoPlay muted loop playsInline preload="auto" poster={POSTER} aria-label="Falcon in flight"><source src={FALCON_VIDEO} type="video/mp4" /></video><div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] via-black/[0.12] to-black/70 lg:hidden" /><div className="absolute inset-0 hidden bg-gradient-to-t from-black/25 to-transparent lg:block" /><div className="absolute bottom-7 left-6 right-6 text-white sm:bottom-10 sm:left-10 lg:bottom-14 lg:left-10 lg:max-w-[680px]"><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#2f2a27]/90 px-3.5 py-2 text-[11px] font-medium shadow-lg backdrop-blur-md"><Sparkles size={15} /> Built for fast-moving teams</div><h2 className="font-serif text-[clamp(36px,6vw,70px)] leading-[.94] tracking-[-.045em] drop-shadow-[0_2px_18px_rgba(0,0,0,.32)]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Find Signal to Action<br />Instantly</h2></div></section>
    <section className="relative flex min-h-[560px] items-center justify-center bg-[#fefefe] px-6 py-12 sm:px-10 lg:min-h-full lg:px-12"><div className="w-full max-w-[488px]"><div className="mb-8 flex items-center gap-3"><button onClick={() => setLocation("/")} className="flex items-center gap-2"><Logo /><span className="text-[17px] font-semibold tracking-[-.04em]">Stack</span></button><span className="text-xs text-neutral-300">/</span><span className="text-xs text-neutral-400">Workspace access</span></div><h1 className="text-[clamp(38px,4vw,54px)] font-semibold leading-none tracking-[-.07em] text-[#2c3343]">Welcome back.</h1><p className="mt-4 text-[15px] leading-6 text-[#797979]"><b className="font-semibold text-[#2c3343]">Log in</b> to continue building your worlds and apps.</p><button type="button" onClick={continueWithGoogle} disabled={loading} className="mt-9 flex h-[60px] w-full items-center justify-center gap-3 rounded-full border border-[#c8c8ca] bg-white text-[16px] font-medium text-[#232424] shadow-[0_1px_2px_rgba(0,0,0,.03)] transition hover:bg-[#fafafa] hover:shadow-[0_3px_12px_rgba(0,0,0,.07)] active:translate-y-px disabled:opacity-60"><GoogleMark />{loading ? "Connecting…" : "Continue with Google"}<ArrowRight size={16} className="ml-1" /></button><div className="my-9 flex items-center gap-3 text-[11px] font-bold tracking-[.18em] text-[#5a5a5b]"><span className="h-px flex-1 bg-[#b1b1b2]" /> OR <span className="h-px flex-1 bg-[#b1b1b2]" /></div><div className="rounded-2xl border border-[#ececec] bg-[#fafafa] p-4 text-sm leading-6 text-neutral-500"><div className="flex gap-3"><span className="mt-0.5 rounded-full bg-[#e7f5ec] p-1.5 text-[#31a56a]"><Check size={14} /></span><p>One secure Google account for your Stack workspace. No password to remember.</p></div></div><p className="mt-8 text-center text-sm text-[#606060]">New to Stack? <button onClick={() => setLocation("/")} className="font-bold text-black underline underline-offset-4">Explore the landing</button></p><p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">By continuing, you agree to use Stack responsibly while the private beta is open.</p></div></section>
  </div></main>;
}
