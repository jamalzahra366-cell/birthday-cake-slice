const STORAGE_KEY = "birthdayCakeSliceHighScore";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  scoreValue: document.getElementById("scoreValue"),
  comboValue: document.getElementById("comboValue"),
  livesValue: document.getElementById("livesValue"),
  pauseButton: document.getElementById("pauseButton"),
  startScreen: document.getElementById("startScreen"),
  startHighScore: document.getElementById("startHighScore"),
  startButton: document.getElementById("startButton"),
  pauseOverlay: document.getElementById("pauseOverlay"),
  resumeButton: document.getElementById("resumeButton"),
  gameOverScreen: document.getElementById("gameOverScreen"),
  finalScore: document.getElementById("finalScore"),
  finalCombo: document.getElementById("finalCombo"),
  playAgainButton: document.getElementById("playAgainButton"),
};

const state = {
  width: 900,
  height: 600,
  phase: "start",
  score: 0,
  combo: 0,
  bestCombo: 0,
  highScore: Number(localStorage.getItem(STORAGE_KEY) || 0),
  lives: 3,
  cakes: [],
  cakePieces: [],
  particles: [],
  floatingTexts: [],
  backgroundDecor: [],
  swipe: {
    active: false,
    points: [],
    lastX: 0,
    lastY: 0,
  },
  lastTime: 0,
  spawnTimer: 0,
  lastSpawnDelay: 1.1,
  screenShake: 0,
  flash: 0,
  pointerScreenX: 0,
  pointerScreenY: 0,
};

const sound = {
  context: null,
  enabled: true,
  ensure() {
    if (!this.context) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.context = new AudioCtx();
      }
    }
    if (this.context && this.context.state === "suspended") {
      this.context.resume();
    }
  },
  tone(freq, duration, type = "triangle", volume = 0.05, slide = 0) {
    if (!this.enabled || !this.context) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration);
  },
  slice() {
    this.ensure();
    this.tone(260, 0.08, "sawtooth", 0.06, -40);
    this.tone(170, 0.12, "triangle", 0.05, 40);
  },
  combo() {
    this.ensure();
    this.tone(520, 0.08, "triangle", 0.05, 80);
    this.tone(700, 0.11, "square", 0.04, 110);
  },
  miss() {
    this.ensure();
    this.tone(180, 0.15, "sawtooth", 0.05, -55);
    this.tone(120, 0.22, "triangle", 0.04, -20);
  },
  gameOver() {
    this.ensure();
    this.tone(180, 0.22, "triangle", 0.06, -70);
    this.tone(120, 0.35, "sawtooth", 0.05, -90);
  },
  click() {
    this.ensure();
    this.tone(650, 0.07, "triangle", 0.04, 60);
  },
  celebration() {
    this.ensure();
    this.tone(600, 0.08, "triangle", 0.06, 80);
    this.tone(760, 0.12, "square", 0.05, 120);
    this.tone(960, 0.18, "triangle", 0.04, 170);
  },
};

const CAKE_TYPES = [
  {
    id: "vanilla",
    name: "Vanilla",
    body: "#f7e7c0",
    frosting: "#fdf5ff",
    accent: "#fa9dc5",
    candle: "#ff6d6d",
    points: 10,
    minSize: 26,
    maxSize: 38,
    candleCount: 3,
    special: false,
  },
  {
    id: "chocolate",
    name: "Chocolate",
    body: "#9c684e",
    frosting: "#f4d5ea",
    accent: "#ffd166",
    candle: "#f4b942",
    points: 10,
    minSize: 28,
    maxSize: 41,
    candleCount: 3,
    special: false,
  },
  {
    id: "strawberry",
    name: "Strawberry",
    body: "#f2bfcb",
    frosting: "#fff6d5",
    accent: "#ff7da4",
    candle: "#ff7f50",
    points: 15,
    minSize: 30,
    maxSize: 42,
    candleCount: 4,
    special: false,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    body: "#f8b6d2",
    frosting: "#7fe7d4",
    accent: "#6cc8ff",
    candle: "#ffbe0b",
    points: 20,
    minSize: 30,
    maxSize: 44,
    candleCount: 4,
    special: false,
  },
  {
    id: "blue-frosting",
    name: "Blue Frosting",
    body: "#b2d9ff",
    frosting: "#b8e7ff",
    accent: "#5eaeff",
    candle: "#7bd8ff",
    points: 20,
    minSize: 31,
    maxSize: 45,
    candleCount: 4,
    special: false,
  },
  {
    id: "pink-frosting",
    name: "Pink Frosting",
    body: "#ffd1e4",
    frosting: "#ffd6eb",
    accent: "#ff77a8",
    candle: "#ff9f1c",
    points: 20,
    minSize: 30,
    maxSize: 43,
    candleCount: 4,
    special: false,
  },
  {
    id: "red-velvet",
    name: "Red Velvet",
    body: "#b2284d",
    frosting: "#f9f4ff",
    accent: "#ffcb77",
    candle: "#ff8f5e",
    points: 25,
    minSize: 34,
    maxSize: 48,
    candleCount: 5,
    special: false,
  },
  {
    id: "black-forest",
    name: "Black Forest",
    body: "#4b2d2f",
    frosting: "#e8f6ff",
    accent: "#ff8aa1",
    candle: "#ffd166",
    points: 25,
    minSize: 32,
    maxSize: 47,
    candleCount: 4,
    special: false,
  },
  {
    id: "confetti",
    name: "Confetti",
    body: "#f3d5a8",
    frosting: "#f2f0ff",
    accent: "#7ed957",
    candle: "#ff5fa2",
    points: 30,
    minSize: 32,
    maxSize: 46,
    candleCount: 5,
    special: false,
  },
  {
    id: "unicorn",
    name: "Unicorn",
    body: "#f0d5ff",
    frosting: "#ffe6f2",
    accent: "#90e0ef",
    candle: "#ffb703",
    points: 30,
    minSize: 31,
    maxSize: 45,
    candleCount: 4,
    special: false,
  },
  {
    id: "princess",
    name: "Princess",
    body: "#f5d3f0",
    frosting: "#ffe9fb",
    accent: "#b97cff",
    candle: "#ffdef0",
    points: 40,
    minSize: 34,
    maxSize: 47,
    candleCount: 5,
    special: false,
  },
  {
    id: "giant-tier",
    name: "Giant Tier",
    body: "#ffe0b7",
    frosting: "#ffedf8",
    accent: "#ff7ab6",
    candle: "#ffb703",
    points: 50,
    minSize: 40,
    maxSize: 58,
    candleCount: 6,
    special: true,
  },
  {
    id: "golden",
    name: "Golden Birthday",
    body: "#f8d249",
    frosting: "#fff0a6",
    accent: "#ffb800",
    candle: "#ffd166",
    points: 100,
    minSize: 36,
    maxSize: 52,
    candleCount: 5,
    special: true,
  },
  {
    id: "celebration",
    name: "Celebration",
    body: "#ffdeae",
    frosting: "#f1f8ff",
    accent: "#8ef1d3",
    candle: "#ff8ec7",
    points: 150,
    minSize: 42,
    maxSize: 62,
    candleCount: 7,
    special: true,
  },
];

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatComboText(value) {
  return `x${value}`;
}

function updateHighScoreDisplay() {
  ui.startHighScore.textContent = String(state.highScore);
}

function updateHUD() {
  ui.scoreValue.textContent = String(state.score);
  ui.comboValue.textContent = formatComboText(Math.max(1, state.combo));
  const hearts = Array.from({ length: 3 }, (_, index) => (index < state.lives ? "❤️" : "🖤")).join(" ");
  ui.livesValue.textContent = hearts;
  updateHighScoreDisplay();
}

function saveHighScore() {
  localStorage.setItem(STORAGE_KEY, String(state.highScore));
}

function resetGameState() {
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.lives = 3;
  state.cakes = [];
  state.cakePieces = [];
  state.particles = [];
  state.floatingTexts = [];
  state.swipe.points = [];
  state.swipe.active = false;
  state.spawnTimer = 0.45;
  state.lastSpawnDelay = 1.1;
  state.screenShake = 0;
  state.flash = 0;
  updateHUD();
}

function startGame() {
  sound.click();
  resetGameState();
  state.phase = "playing";
  ui.startScreen.classList.add("hidden");
  ui.gameOverScreen.classList.add("hidden");
  ui.pauseOverlay.classList.add("hidden");
  updateHUD();
}

function openPausedScreen() {
  ui.pauseOverlay.classList.remove("hidden");
}

function hidePausedScreen() {
  ui.pauseOverlay.classList.add("hidden");
}

function togglePause() {
  if (state.phase === "playing") {
    state.phase = "paused";
    openPausedScreen();
  } else if (state.phase === "paused") {
    state.phase = "playing";
    hidePausedScreen();
  }
}

function endGame() {
  state.phase = "gameover";
  state.highScore = Math.max(state.highScore, state.score);
  saveHighScore();
  ui.gameOverScreen.classList.remove("hidden");
  ui.finalScore.textContent = String(state.score);
  ui.finalCombo.textContent = formatComboText(state.bestCombo || 1);
  ui.startHighScore.textContent = String(state.highScore);
  sound.gameOver();
}

function onPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
}

function addSwipePoint(x, y) {
  const previous = state.swipe.points[state.swipe.points.length - 1];
  if (previous && Math.hypot(previous.x - x, previous.y - y) < 8) {
    return;
  }

  state.swipe.points.push({ x, y });
  if (state.swipe.points.length > 16) {
    state.swipe.points.shift();
  }

  state.swipe.lastX = x;
  state.swipe.lastY = y;
  state.pointerScreenX = x;
  state.pointerScreenY = y;

  for (let i = 0; i < state.swipe.points.length - 1; i += 1) {
    const a = state.swipe.points[i];
    const b = state.swipe.points[i + 1];
    checkSegmentAgainstCakes(a.x, a.y, b.x, b.y);
  }
}

function handlePointerDown(event) {
  const pos = onPointerPosition(event);
  if (state.phase !== "playing") {
    return;
  }

  event.preventDefault();
  sound.ensure();
  state.swipe.active = true;
  state.swipe.points = [{ x: pos.x, y: pos.y }];
  state.swipe.lastX = pos.x;
  state.swipe.lastY = pos.y;
  state.pointerScreenX = pos.x;
  state.pointerScreenY = pos.y;
}

function handlePointerMove(event) {
  if (!state.swipe.active || state.phase !== "playing") return;
  const pos = onPointerPosition(event);
  addSwipePoint(pos.x, pos.y);
}

function handlePointerUp() {
  if (!state.swipe.active) return;
  state.swipe.active = false;
  state.swipe.points = [];
}

function segmentIntersectsCircle(x1, y1, x2, y2, circleX, circleY, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const a = dx * dx + dy * dy;

  if (a === 0) {
    return Math.hypot(x1 - circleX, y1 - circleY) <= radius;
  }

  const t = clamp(((x1 - circleX) * dx + (y1 - circleY) * dy) / -a, 0, 1);
  const closestX = x1 + (x2 - x1) * t;
  const closestY = y1 + (y2 - y1) * t;
  return Math.hypot(closestX - circleX, closestY - circleY) <= radius;
}

function checkSegmentAgainstCakes(x1, y1, x2, y2) {
  for (let i = state.cakes.length - 1; i >= 0; i -= 1) {
    const cake = state.cakes[i];
    if (segmentIntersectsCircle(x1, y1, x2, y2, cake.x, cake.y, cake.radius)) {
      sliceCake(cake, i);
      return;
    }
  }
}

function spawnParticles(x, y, color, count = 16) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: randomRange(-120, 120),
      vy: randomRange(-180, 40),
      life: randomRange(0.6, 1.2),
      maxLife: randomRange(0.6, 1.2),
      radius: randomRange(3, 7),
      color,
      gravity: randomRange(220, 360),
    });
  }
}

function spawnFloatingText(value, x, y, color = "#ffffff") {
  state.floatingTexts.push({
    text: value,
    x,
    y,
    color,
    life: 0.9,
    maxLife: 0.9,
    vy: -22,
  });
}

function createSlicePieces(cake) {
  const base = cake.style;
  for (let side = 0; side < 2; side += 1) {
    state.cakePieces.push({
      x: cake.x,
      y: cake.y,
      rotation: cake.rotation,
      spin: cake.spin + randomRange(-1.2, 1.2),
      size: cake.size,
      vx: cake.vx * 0.7 + (side === 0 ? -80 : 80) + randomRange(-30, 30),
      vy: cake.vy * 0.5 + randomRange(-40, 60),
      side,
      body: base.body,
      frosting: base.frosting,
      accent: base.accent,
      candle: base.candle,
      special: cake.special,
      life: 1.6,
    });
  }
}

function sliceCake(cake, index) {
  if (cake.sliced) return;
  cake.sliced = true;

  const comboTier = Math.max(1, state.combo + 1);
  state.combo = comboTier;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const pointsEarned = Math.round(cake.points * (1 + (comboTier - 1) * 0.25));
  state.score += pointsEarned;

  if (state.combo > 1) {
    sound.combo();
  } else {
    sound.slice();
  }

  spawnParticles(cake.x, cake.y, cake.style.frosting, 18);
  spawnParticles(cake.x, cake.y, cake.style.accent, 12);
  spawnFloatingText(`+${pointsEarned}`, cake.x, cake.y - 12, "#fff6d6");
  createSlicePieces(cake);
  state.cakes.splice(index, 1);

  if (state.score > state.highScore) {
    state.highScore = state.score;
    saveHighScore();
    ui.startHighScore.textContent = String(state.highScore);
    sound.celebration();
  }

  updateHUD();
}

function addMissLife() {
  state.combo = 0;
  state.lives -= 1;
  state.screenShake = 0.75;
  state.flash = 0.5;
  sound.miss();
  spawnFloatingText("Miss!", state.width * 0.5, 68, "#ff5b6e");
  updateHUD();

  if (state.lives <= 0) {
    endGame();
  }
}

function updateCakes(dt) {
  for (let i = state.cakes.length - 1; i >= 0; i -= 1) {
    const cake = state.cakes[i];
    cake.vy += cake.gravity * dt;
    cake.x += cake.vx * dt;
    cake.y += cake.vy * dt;
    cake.rotation += cake.spin * dt;

    if (cake.y > state.height + cake.size + 60) {
      state.cakes.splice(i, 1);
      addMissLife();
    }
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += particle.gravity * dt;
    particle.life -= dt;

    if (particle.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function updateCakePieces(dt) {
  for (let i = state.cakePieces.length - 1; i >= 0; i -= 1) {
    const piece = state.cakePieces[i];
    piece.x += piece.vx * dt;
    piece.y += piece.vy * dt;
    piece.vy += 280 * dt;
    piece.rotation += piece.spin * dt;
    piece.life -= dt;

    if (piece.life <= 0) {
      state.cakePieces.splice(i, 1);
    }
  }
}

function updateFloatingTexts(dt) {
  for (let i = state.floatingTexts.length - 1; i >= 0; i -= 1) {
    const text = state.floatingTexts[i];
    text.y += text.vy * dt;
    text.life -= dt;
    if (text.life <= 0) {
      state.floatingTexts.splice(i, 1);
    }
  }
}

function createCakeInstance(typeKey) {
  const cakeType = CAKE_TYPES.find((entry) => entry.id === typeKey) || CAKE_TYPES[0];
  const size = randomRange(cakeType.minSize, cakeType.maxSize);
  const x = randomRange(size * 1.4, state.width - size * 1.4);
  const y = state.height + size + 24;
  const idleX = randomRange(-125, 125) * (1 + state.score / 900);
  const lift = 290 + state.score * 0.08;

  const cake = {
    x,
    y,
    vx: idleX,
    vy: -(randomRange(330, 425) + state.score * 0.14),
    gravity: 410 + state.score * 0.06,
    rotation: randomRange(-1.3, 1.3),
    spin: randomRange(-2.3, 2.3),
    size,
    radius: size * 0.78,
    points: cakeType.points,
    style: {
      body: cakeType.body,
      frosting: cakeType.frosting,
      accent: cakeType.accent,
      candle: cakeType.candle,
      decoration: cakeType.id,
    },
    special: cakeType.special,
    sliced: false,
    candleCount: cakeType.candleCount,
    type: cakeType.id,
    lift,
  };

  return cake;
}

function spawnCake() {
  const regular = CAKE_TYPES.filter((type) => !type.special);
  const specials = CAKE_TYPES.filter((type) => type.special);
  const useSpecial = state.score > 180 && Math.random() < 0.18 + Math.min(0.2, state.score / 3000);
  const options = useSpecial ? specials.concat(regular) : regular;
  const selected = options[Math.floor(Math.random() * options.length)];
  state.cakes.push(createCakeInstance(selected.id));
}

function updateSpawner(dt) {
  const difficultyBoost = 1 + state.score / 900;
  const nextDelay = clamp(1.35 / difficultyBoost, 0.56, 1.3);
  state.lastSpawnDelay = nextDelay;
  state.spawnTimer -= dt;

  if (state.spawnTimer <= 0) {
    spawnCake();
    state.spawnTimer = nextDelay * randomRange(0.85, 1.35);
    if (Math.random() < clamp(0.2 + state.score / 2200, 0.2, 0.45)) {
      spawnCake();
    }
  }
}

function drawRoundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, state.height);
  sky.addColorStop(0, "#dff4ff");
  sky.addColorStop(0.35, "#ffd7eb");
  sky.addColorStop(1, "#f7f5d5");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, state.width, state.height);

  for (let i = 0; i < 22; i += 1) {
    const x = (i * 107 + 33) % state.width;
    const y = ((i * 77) % 210) + 16;
    const size = 2 + (i % 3);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const balloonColors = ["#ff6fae", "#ffbe0b", "#7bd8ff", "#7ce7b9", "#c197ff", "#ff8a5b"];
  for (let i = 0; i < 10; i += 1) {
    const x = (i * 93 + 50) % state.width;
    const y = 44 + (i % 3) * 54 + (i % 2) * 10;
    const balloon = balloonColors[i % balloonColors.length];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = balloon;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 24, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(0, 42);
    ctx.strokeStyle = "rgba(60,40,80,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < 100; i += 1) {
    const x = (i * 39) % state.width;
    const y = ((i * 53) % 230) + 110;
    const c = i % 3 === 0 ? "#f9d66b" : i % 2 === 0 ? "#ff7aad" : "#76d9ff";
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 4, 4);
  }

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(0, state.height - 38, state.width, 38);
}

function drawCakeShadow(cake) {
  ctx.fillStyle = "rgba(40, 19, 43, 0.18)";
  ctx.beginPath();
  ctx.ellipse(cake.x, cake.y + cake.size * 0.9, cake.size * 1.1, cake.size * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCake(cake) {
  ctx.save();
  ctx.translate(cake.x, cake.y);
  ctx.rotate(cake.rotation);

  drawCakeShadow(cake);

  const bodyWidth = cake.size * 1.8;
  const bodyHeight = cake.size * 1.2;
  const frostingHeight = cake.size * 0.46;

  // Body layers
  const layers = 2 + (cake.type.includes("tier") ? 2 : 0);
  for (let i = 0; i < layers; i += 1) {
    const layerY = -bodyHeight * 0.35 + i * 18;
    const layerW = bodyWidth - i * 7;
    ctx.fillStyle = cake.style.body;
    drawRoundedRect(-layerW / 2, layerY, layerW, 22, 8);
    ctx.fill();
  }

  ctx.fillStyle = cake.style.frosting;
  drawRoundedRect(-bodyWidth / 2, -bodyHeight * 0.45, bodyWidth, frostingHeight, 12);
  ctx.fill();

  // Frosting decoration swirls
  ctx.fillStyle = cake.style.accent;
  for (let i = 0; i < 5; i += 1) {
    const x = -bodyWidth / 2 + 18 + i * 28;
    const y = -bodyHeight * 0.52 + (i % 2) * 9;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sprinkles
  ctx.fillStyle = cake.style.accent;
  for (let i = 0; i < 16; i += 1) {
    const x = -bodyWidth / 2 + 12 + (i * 19) % (bodyWidth - 24);
    const y = -bodyHeight * 0.18 + (i % 4) * 12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i % 5) * 0.8);
    ctx.fillRect(0, 0, 8, 3);
    ctx.restore();
  }

  // Candles
  const candleCount = cake.candleCount;
  for (let i = 0; i < candleCount; i += 1) {
    const x = -bodyWidth / 2 + 18 + i * ((bodyWidth - 36) / Math.max(1, candleCount - 1));
    const candleY = -bodyHeight * 0.82;
    ctx.fillStyle = cake.style.candle;
    ctx.fillRect(x - 3, candleY, 6, 18);
    ctx.fillStyle = "#ffdd7a";
    ctx.beginPath();
    ctx.arc(x, candleY - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 172, 74, 0.8)";
    ctx.beginPath();
    ctx.moveTo(x, candleY - 16);
    ctx.quadraticCurveTo(x + 8, candleY - 32, x, candleY - 40);
    ctx.quadraticCurveTo(x - 8, candleY - 32, x, candleY - 16);
    ctx.fill();
  }

  // Top edges
  ctx.strokeStyle = "rgba(94, 55, 73, 0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-bodyWidth / 2, -bodyHeight * 0.45, bodyWidth, frostingHeight);
  ctx.restore();
}

function drawPiece(piece) {
  ctx.save();
  ctx.translate(piece.x, piece.y);
  ctx.rotate(piece.rotation);

  const width = piece.size * 1.25;
  const height = piece.size * 1.1;
  const offset = piece.side === 0 ? -1 : 1;

  ctx.fillStyle = piece.body;
  drawRoundedRect(-offset * width * 0.44, -height * 0.62, width * 0.9, height * 0.7, 10);
  ctx.fill();

  ctx.fillStyle = piece.frosting;
  drawRoundedRect(-offset * width * 0.42, -height * 0.62, width * 0.8, height * 0.24, 9);
  ctx.fill();

  ctx.restore();
}

function drawSwipeTrail() {
  if (state.swipe.points.length < 2) return;

  for (let i = 1; i < state.swipe.points.length; i += 1) {
    const prev = state.swipe.points[i - 1];
    const curr = state.swipe.points[i];

    const alpha = clamp((i / state.swipe.points.length) * 0.8, 0.2, 0.9);
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(255, 120, 170, ${alpha})`;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha + 0.08})`;
    ctx.stroke();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  for (const text of state.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = clamp(text.life / text.maxLife, 0, 1);
    ctx.fillStyle = text.color;
    ctx.font = "700 22px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }
}

function render() {
  ctx.clearRect(0, 0, state.width, state.height);

  drawBackground();
  drawSwipeTrail();

  for (const cake of state.cakes) {
    drawCake(cake);
  }

  for (const piece of state.cakePieces) {
    drawPiece(piece);
  }

  drawParticles();
  drawFloatingTexts();

  if (state.phase === "gameover") {
    ctx.fillStyle = "rgba(6, 2, 14, 0.18)";
    ctx.fillRect(0, 0, state.width, state.height);
  }
}

function update(dt) {
  if (state.phase === "playing") {
    updateSpawner(dt);
    updateCakes(dt);
  }

  updateParticles(dt);
  updateCakePieces(dt);
  updateFloatingTexts(dt);
}

function gameLoop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const dt = clamp((timestamp - state.lastTime) / 1000, 0.008, 0.033);
  state.lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  state.width = rect.width;
  state.height = rect.height;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function bindEvents() {
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (state.phase === "start") {
        startGame();
      } else if (state.phase === "playing") {
        togglePause();
      } else if (state.phase === "paused") {
        togglePause();
      } else if (state.phase === "gameover") {
        startGame();
      }
    }

    if (event.code === "KeyP") {
      event.preventDefault();
      if (state.phase === "playing" || state.phase === "paused") {
        togglePause();
      }
    }

    if (event.code === "KeyR") {
      event.preventDefault();
      if (state.phase === "gameover" || state.phase === "start") {
        startGame();
      }
    }
  });

  ui.startButton.addEventListener("click", () => {
    startGame();
  });

  ui.pauseButton.addEventListener("click", () => {
    if (state.phase === "playing") {
      togglePause();
    }
  });

  ui.resumeButton.addEventListener("click", () => {
    if (state.phase === "paused") {
      togglePause();
    }
  });

  ui.playAgainButton.addEventListener("click", () => {
    startGame();
  });

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerUp);

  window.addEventListener("resize", resizeCanvas);
}

function initializeBackgroundDecor() {
  // No-op placeholder for future visuals; keeps code structure clear.
}

function init() {
  resizeCanvas();
  bindEvents();
  initializeBackgroundDecor();
  updateHighScoreDisplay();
  updateHUD();
  requestAnimationFrame(gameLoop);
}

init();
