// year
document.getElementById("y").textContent = new Date().getFullYear();

// --- Animated "stock market" background ---
const canvas = document.getElementById("market");
const ctx = canvas.getContext("2d");

function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function randn() {
  // quick-ish normal-ish random
  let u = 1 - Math.random();
  let v = 1 - Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

class Line {
  constructor(color, speed, amp) {
    this.color = color;
    this.speed = speed;
    this.amp = amp;
    this.reset();
  }
  reset() {
    this.x = -60;
    this.y = window.innerHeight * (0.25 + Math.random() * 0.55);
    this.points = [];
    this.v = (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.9);
    const step = 18;
    const n = Math.ceil((window.innerWidth + 120) / step);
    let yy = this.y;
    for (let i = 0; i < n; i++) {
      yy += randn() * this.amp;
      this.points.push(yy);
    }
  }
  tick(dt) {
    this.x += this.speed * dt;
    if (this.x > 60) {
      this.x = -60;
      // drift line up/down slowly
      this.y += randn() * (this.amp * 2);
    }
  }
  draw() {
    const step = 18;
    ctx.beginPath();
    for (let i = 0; i < this.points.length; i++) {
      const px = this.x + i * step;
      const py = this.points[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.65;
    ctx.stroke();

    // subtle glow
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

const lines = [
  new Line("rgba(37,99,235,1)", 20, 6),   // blue
  new Line("rgba(34,197,94,1)", 26, 7),   // green
  new Line("rgba(168,85,247,1)", 18, 5),  // purple
];

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // clear
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // faint gradient wash
  const g = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
  g.addColorStop(0, "rgba(37,99,235,0.06)");
  g.addColorStop(0.5, "rgba(34,197,94,0.04)");
  g.addColorStop(1, "rgba(168,85,247,0.05)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // draw lines
  for (const L of lines) {
    L.tick(dt);
    L.draw();
  }

  // tiny spark points like ticks
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
