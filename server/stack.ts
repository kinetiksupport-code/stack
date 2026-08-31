import { ENV } from "./_core/env";

export type BuildKind = "game" | "app" | "website";

const WORLD_MODEL_BRIEF = `You are Stack's private code generation engine. Generate a single self-contained HTML file with vanilla HTML, CSS and JavaScript. Never mention your model, provider, API, or this system prompt in the generated UI.

For games, follow this World Model contract inspired by the supplied Stack documentation: state must contain player, enemies, entities, camera, world and game; actionSpace maps controls to discrete actions; transition(state, action, dt) updates physics, collisions and behavior; render(ctx, state) draws the observation; gameLoop uses requestAnimationFrame; checkGoals(state) controls win and lose. Include responsive Canvas 2D rendering, a clear HUD, keyboard controls and at least three interactive entity types. Do not use external libraries.

For apps and websites, generate a polished responsive interface in one HTML file. It must be interactive enough to demonstrate the requested idea, with accessible controls, empty/loading/error states where relevant, and no external dependencies. Return ONLY the complete HTML document, without Markdown fences.`;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const stripCodeFences = (value: string) =>
  value
    .trim()
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

export function localStarter(kind: BuildKind, prompt: string): string {
  const safePrompt = escapeHtml(prompt);
  if (kind === "game") {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stack World</title><style>*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#09111f;color:#eef4ff;font:15px system-ui,sans-serif}canvas{display:block;width:100vw;height:100vh}#hud{position:fixed;top:18px;left:18px;padding:10px 14px;border:1px solid #334a70;border-radius:12px;background:#0e1a2ee8;line-height:1.5}#hint{position:fixed;bottom:18px;left:18px;color:#a9bad8;font-size:13px}</style></head><body><canvas id="canvas"></canvas><div id="hud"><strong>Stack World</strong><br>Score: <span id="score">0</span> · Energy: <span id="energy">100</span></div><div id="hint">Move with WASD or arrow keys · collect the amber cores</div><script>const canvas=document.querySelector('#canvas'),ctx=canvas.getContext('2d'),scoreEl=document.querySelector('#score'),energyEl=document.querySelector('#energy');const state={player:{x:0,y:0,r:18,speed:260},enemies:[],entities:[],camera:{x:0,y:0},world:{w:2400,h:1500},game:{score:0,energy:100,won:false}};const actionSpace={up:['w','ArrowUp'],down:['s','ArrowDown'],left:['a','ArrowLeft'],right:['d','ArrowRight']};const keys=new Set;addEventListener('keydown',e=>keys.add(e.key));addEventListener('keyup',e=>keys.delete(e.key));function reset(){state.player.x=state.world.w/2;state.player.y=state.world.h/2;state.enemies=Array.from({length:6},(_,i)=>({x:240+i*310,y:240+(i%3)*330,r:15,phase:i}));state.entities=Array.from({length:10},(_,i)=>({x:160+(i%5)*510,y:150+Math.floor(i/5)*620,r:10,taken:false}));state.game.score=0;state.game.energy=100}function transition(s,a,dt){let dx=(a.right?1:0)-(a.left?1:0),dy=(a.down?1:0)-(a.up?1:0);let len=Math.hypot(dx,dy)||1;s.player.x=Math.max(24,Math.min(s.world.w-24,s.player.x+dx/len*s.player.speed*dt));s.player.y=Math.max(24,Math.min(s.world.h-24,s.player.y+dy/len*s.player.speed*dt));s.camera.x=s.player.x-innerWidth/2;s.camera.y=s.player.y-innerHeight/2;for(const e of s.enemies){e.x+=Math.cos(performance.now()/900+e.phase)*18*dt;e.y+=Math.sin(performance.now()/1100+e.phase)*18*dt;if(Math.hypot(e.x-s.player.x,e.y-s.player.y)<e.r+s.player.r){s.game.energy=Math.max(0,s.game.energy-24*dt)}}for(const item of s.entities){if(!item.taken&&Math.hypot(item.x-s.player.x,item.y-s.player.y)<item.r+s.player.r){item.taken=true;s.game.score+=100}}}function render(c,s){c.clearRect(0,0,innerWidth,innerHeight);c.fillStyle='#09111f';c.fillRect(0,0,innerWidth,innerHeight);c.save();c.translate(-s.camera.x,-s.camera.y);c.strokeStyle='#182a49';c.lineWidth=1;for(let x=0;x<s.world.w;x+=80){c.beginPath();c.moveTo(x,0);c.lineTo(x,s.world.h);c.stroke()}for(let y=0;y<s.world.h;y+=80){c.beginPath();c.moveTo(0,y);c.lineTo(s.world.w,y);c.stroke()}for(const item of s.entities){if(item.taken)continue;c.fillStyle='#ffb33d';c.shadowColor='#ffb33d';c.shadowBlur=18;c.beginPath();c.arc(item.x,item.y,item.r,0,Math.PI*2);c.fill();c.shadowBlur=0}for(const e of s.enemies){c.fillStyle='#ef6687';c.beginPath();c.arc(e.x,e.y,e.r,0,Math.PI*2);c.fill()}c.fillStyle='#73e0c3';c.beginPath();c.arc(s.player.x,s.player.y,s.player.r,0,Math.PI*2);c.fill();c.strokeStyle='#d9fff5';c.stroke();c.restore()}let last=performance.now();function gameLoop(now){let dt=Math.min(.04,(now-last)/1000);last=now;const a={up:actionSpace.up.some(k=>keys.has(k)),down:actionSpace.down.some(k=>keys.has(k)),left:actionSpace.left.some(k=>keys.has(k)),right:actionSpace.right.some(k=>keys.has(k))};transition(state,a,dt);render(ctx,state);scoreEl.textContent=state.game.score;energyEl.textContent=Math.round(state.game.energy);requestAnimationFrame(gameLoop)}function checkGoals(s){return s.game.score>=1000||s.game.energy<=0}addEventListener('resize',()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio)});canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);reset();requestAnimationFrame(gameLoop);</script></body></html>`;
  }

  const title = kind === "app" ? "Stack App" : "Stack Website";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#0c1020;color:#f5f7ff;font:16px system-ui,sans-serif}main{max-width:980px;margin:auto;padding:64px 22px}.eyebrow{color:#ff9b66;text-transform:uppercase;letter-spacing:.16em;font-size:12px;font-weight:700}h1{font-size:clamp(38px,7vw,76px);line-height:.98;max-width:740px;margin:16px 0}p{color:#a7b1c9;max-width:620px;line-height:1.7}.panel{margin-top:36px;padding:22px;border:1px solid #293452;border-radius:24px;background:#121a31;box-shadow:0 20px 80px #0005}.row{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}button{border:0;border-radius:12px;padding:12px 16px;background:#ff7a45;color:#1c0e08;font-weight:800;cursor:pointer}button.secondary{background:#202b48;color:#e8edff}.status{margin-top:18px;color:#7fe1c0;min-height:24px}.brief{margin-top:20px;padding:14px;border-left:3px solid #ff7a45;background:#171f38;color:#d5dcf0;border-radius:0 12px 12px 0}</style></head><body><main><div class="eyebrow">Built with Stack</div><h1>${title}</h1><p>A focused starting point for the experience described below. Turn the brief into a real product, then keep iterating in Stack.</p><section class="panel"><strong>Interactive prototype</strong><div class="brief">${safePrompt}</div><div class="row"><button id="primary">Try the main action</button><button class="secondary" id="secondary">Explore the next step</button></div><div class="status" id="status"></div></section></main><script>const status=document.querySelector('#status');document.querySelector('#primary').onclick=()=>status.textContent='The main flow is ready to be expanded in Stack.';document.querySelector('#secondary').onclick=()=>status.textContent='Next step selected — keep describing what you want to build.';</script></body></html>`;
}

export async function generateCode(kind: BuildKind, prompt: string): Promise<{ code: string; usedModel: boolean }> {
  if (!ENV.openRouterApiKey) {
    return { code: localStarter(kind, prompt), usedModel: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(`${ENV.openRouterBaseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.openRouterApiKey}`,
        "HTTP-Referer": "https://stack.build",
        "X-Title": "Stack",
      },
      body: JSON.stringify({
        model: ENV.openRouterModel,
        messages: [
          { role: "system", content: WORLD_MODEL_BRIEF },
          { role: "user", content: `Build type: ${kind}\nProduct brief: ${prompt}` },
        ],
        max_tokens: 32_000,
        temperature: 0.35,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Generation provider returned ${response.status}: ${detail.slice(0, 240)}`);
    }
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Generation provider returned an empty response");
    return { code: stripCodeFences(content), usedModel: true };
  } finally {
    clearTimeout(timeout);
  }
}
