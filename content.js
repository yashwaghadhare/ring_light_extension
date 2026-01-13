let enabled = false;

let settings = {
  brightness: 0.9,
  tone: 0.5,
  width: 0.045
};

// Canvas
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

Object.assign(canvas.style, {
  position: "fixed",
  top: "0",
  left: "0",
  width: "100vw",
  height: "100vh",
  pointerEvents: "none",
  zIndex: "999999"
});

document.documentElement.appendChild(canvas);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Rounded rectangle path
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!enabled) {
    requestAnimationFrame(draw);
    return;
  }

  const w = canvas.width;
  const h = canvas.height;

  const margin = Math.min(w, h) * 0.055;
  const radius = Math.min(w, h) * 0.14;
  const tube = Math.min(w, h) * settings.width;

  const x = margin;
  const y = margin;
  const rw = w - margin * 2;
  const rh = h - margin * 2;

  // Expanded cool ↔ warm range
  const cool = { r: 200, g: 225, b: 255 };
  const neutral = { r: 255, g: 255, b: 255 };
  const warm = { r: 255, g: 200, b: 150 };

  const t = settings.tone;
  let r, g, b;

  if (t < 0.5) {
    const k = t * 2;
    r = cool.r * (1 - k) + neutral.r * k;
    g = cool.g * (1 - k) + neutral.g * k;
    b = cool.b * (1 - k) + neutral.b * k;
  } else {
    const k = (t - 0.5) * 2;
    r = neutral.r * (1 - k) + warm.r * k;
    g = neutral.g * (1 - k) + warm.g * k;
    b = neutral.b * (1 - k) + warm.b * k;
  }

  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  ctx.strokeStyle = `rgba(${r},${g},${b},${settings.brightness})`;
  ctx.lineWidth = tube;
  ctx.shadowColor = `rgba(${r},${g},${b},${settings.brightness})`;
  ctx.shadowBlur = tube * 3.2;

  roundedRect(ctx, x, y, rw, rh, radius);
  ctx.stroke();

  ctx.restore();

  requestAnimationFrame(draw);
}

draw();

// Message handler
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "applyState") {
    enabled = msg.enabled;
    canvas.style.display = enabled ? "block" : "none";
  }

  if (msg.action === "update") {
    settings[msg.key] = msg.value;
  }
});
