// Footer year
const y = document.getElementById("y");
if (y) y.textContent = new Date().getFullYear();

const market = document.getElementById("market");
const fx = document.getElementById("fx");
const mctx = market.getContext("2d");
const fctx = fx.getContext("2d");

function fit(canvas, ctx){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function resize(){
  fit(market, mctx);
  fit(fx, fctx);
}
window.addEventListener("resize", resize);
resize();

// ---------- Candlestick sim ----------
function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function randn(){
  let u = 1 - Math.random(), v = 1 - Math.random();
  return Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
}

const candles = [];
const candleW = 10;
const gap = 6;
let scrollX = 0;

let price = 100;
function makeCandle(){
  const o = price;
  const move = randn() * 1.2;                // volatility
  const c = o + move;
  const hi = Math.max(o, c) + Math.abs(randn()) * 1.2;
  const lo = Math.min(o, c) - Math.abs(randn()) * 1.2;
  price = c;

  return { o, h:hi, l:lo, c };
}

function initCandles(){
  candles.length = 0;
  price = 100;
  const n = Math.ceil((window.innerWidth + 240) / (candleW + gap));
  for(let i=0;i<n;i++) candles.push(makeCandle());
}
initCandles();

// Map price -> y coordinate
function scaleY(p, minP, maxP, top, bottom){
  const t = (p - minP) / (maxP - minP + 1e-9);
  return bottom - t * (bottom - top);
}

function drawGrid(){
  const w = window.innerWidth, h = window.innerHeight;
  mctx.save();
  mctx.globalAlpha = 0.12;
  mctx.strokeStyle = "rgba(234,240,255,1)";
  mctx.lineWidth = 1;

  const step = 70;
  for(let x=0; x<=w; x+=step){
    mctx.beginPath(); mctx.moveTo(x,0); mctx.lineTo(x,h); mctx.stroke();
  }
  for(let y=0; y<=h; y+=step){
    mctx.beginPath(); mctx.moveTo(0,y); mctx.lineTo(w,y); mctx.stroke();
  }
  mctx.restore();
}

function drawCandles(dt){
  const w = window.innerWidth, h = window.innerHeight;

  // chart area
  const top = 110;
  const bottom = h - 120;

  // compute visible range min/max
  let minP = Infinity, maxP = -Infinity;
  for(const c of candles){
    minP = Math.min(minP, c.l);
    maxP = Math.max(maxP, c.h);
  }

  // scrolling speed
  scrollX += dt * 60; // pixels per second-ish
  const stepX = candleW + gap;

  // when scrolled enough, shift and append new candle
  while(scrollX >= stepX){
    scrollX -= stepX;
    candles.shift();
    candles.push(makeCandle());
  }

  // draw
  for(let i=0; i<candles.length; i++){
    const c = candles[i];
    const x = i*stepX - scrollX + 30;

    const yo = scaleY(c.o, minP, maxP, top, bottom);
    const yc = scaleY(c.c, minP, maxP, top, bottom);
    const yh = scaleY(c.h, minP, maxP, top, bottom);
    const yl = scaleY(c.l, minP, maxP, top, bottom);

    const up = c.c >= c.o;
    const bodyTop = Math.min(yo, yc);
    const bodyBot = Math.max(yo, yc);
    const bodyH = Math.max(3, bodyBot - bodyTop);

    // neon colors
    const col = up ? "rgba(34,197,94,1)" : "rgba(239,68,68,1)";
    const glow = up ? "rgba(34,197,94,.35)" : "rgba(239,68,68,.35)";

    // wick
    mctx.save();
    mctx.globalAlpha = 0.9;
    mctx.strokeStyle = col;
    mctx.lineWidth = 2;
    mctx.beginPath();
    mctx.moveTo(x + candleW/2, yh);
    mctx.lineTo(x + candleW/2, yl);
    mctx.stroke();

    // body (glow)
    mctx.globalAlpha = 0.35;
    mctx.fillStyle = glow;
    mctx.fillRect(x-2, bodyTop-2, candleW+4, bodyH+4);

    // body (solid)
    mctx.globalAlpha = 0.95;
    mctx.fillStyle = col;
    mctx.fillRect(x, bodyTop, candleW, bodyH);

    mctx.restore();
  }
}

// ---------- Anime / gaming cursor FX ----------
const mouse = { x: window.innerWidth/2, y: window.innerHeight/2, vx:0, vy:0 };
window.addEventListener("mousemove", (e)=>{
  const nx = e.clientX, ny = e.clientY;
  mouse.vx = nx - mouse.x;
  mouse.vy = ny - mouse.y;
  mouse.x = nx; mouse.y = ny;
});

const particles = [];
function spawnParticles(){
  const speed = Math.min(18, Math.hypot(mouse.vx, mouse.vy));
  const n = clamp(Math.floor(speed/2), 2, 10);
  for(let i=0;i<n;i++){
    particles.push({
      x: mouse.x + randn()*2,
      y: mouse.y + randn()*2,
      vx: randn()*1.4 + mouse.vx*0.03,
      vy: randn()*1.4 + mouse.vy*0.03,
      life: 1,
      r: 1.2 + Math.random()*2.2
    });
  }
  // cap
  while(particles.length > 220) particles.shift();
}

function drawFX(dt){
  const w = window.innerWidth, h = window.innerHeight;

  // fade (trail)
  fctx.fillStyle = "rgba(5,4,10,0.12)";
  fctx.fillRect(0,0,w,h);

  // cursor bloom
  const g = fctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
  g.addColorStop(0, "rgba(34,211,238,0.22)");
  g.addColorStop(0.5, "rgba(124,58,237,0.14)");
  g.addColorStop(1, "rgba(251,113,133,0.00)");
  fctx.fillStyle = g;
  fctx.beginPath();
  fctx.arc(mouse.x, mouse.y, 120, 0, Math.PI*2);
  fctx.fill();

  // particles
  spawnParticles();
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.life -= dt*1.6;
    if(p.life <= 0){ particles.splice(i,1); continue; }
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96; p.vy *= 0.96;

    const a = p.life;
    fctx.fillStyle = `rgba(34,211,238,${0.35*a})`;
    fctx.fillRect(p.x, p.y, p.r, p.r);

    fctx.fillStyle = `rgba(124,58,237,${0.22*a})`;
    fctx.fillRect(p.x+1, p.y+1, p.r*0.8, p.r*0.8);
  }

  // cursor crosshair (gaming HUD)
  fctx.save();
  fctx.globalAlpha = 0.45;
  fctx.strokeStyle = "rgba(234,240,255,1)";
  fctx.lineWidth = 1;
  fctx.beginPath();
  fctx.arc(mouse.x, mouse.y, 10, 0, Math.PI*2);
  fctx.stroke();
  fctx.beginPath();
  fctx.moveTo(mouse.x-18, mouse.y); fctx.lineTo(mouse.x-6, mouse.y);
  fctx.moveTo(mouse.x+6, mouse.y);  fctx.lineTo(mouse.x+18, mouse.y);
  fctx.moveTo(mouse.x, mouse.y-18); fctx.lineTo(mouse.x, mouse.y-6);
  fctx.moveTo(mouse.x, mouse.y+6);  fctx.lineTo(mouse.x, mouse.y+18);
  fctx.stroke();
  fctx.restore();
}

// ---------- Main loop ----------
let last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now-last)/1000);
  last = now;

  // clear market with subtle gradient wash
  const w = window.innerWidth, h = window.innerHeight;
  mctx.clearRect(0,0,w,h);

  const bg = mctx.createLinearGradient(0,0,w,h);
  bg.addColorStop(0, "rgba(124,58,237,0.06)");
  bg.addColorStop(0.5, "rgba(34,211,238,0.05)");
  bg.addColorStop(1, "rgba(251,113,133,0.04)");
  mctx.fillStyle = bg;
  mctx.fillRect(0,0,w,h);

  drawGrid();
  drawCandles(dt);
  drawFX(dt);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
