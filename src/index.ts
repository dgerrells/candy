import "./styles.css";
import colors from "./colors.json";

type WindowHandle = Window & {
  _gameFrame?: number;
};
const winContext = window as WindowHandle;

type GameState = {
  frame: number;
  prevFrameStartTime: number;
  deltaTime: number;
  particles: Array<{
    size: number;
    x: number;
    y: number;
    z: number;
    dx: number;
    dy: number;
    dz: number;
    color: string;
  }>;
  touchDown: boolean;
  touchX: number;
  touchY: number;
  touchZ: number;
  renderContainerSize: number;
  palette: string[];
};
type GameFunction = (state: GameState) => void;

const gameState: GameState = {
  frame: 0,
  prevFrameStartTime: 0,
  deltaTime: 0,
  particles: [],
  touchDown: false,
  touchX: 0,
  touchY: 0,
  touchZ: 0,
  renderContainerSize: 32,
  palette: []
};

const spawnParticles = (state: GameState, count: number) => {
  // const sizes = [6, 6, 6, 6, 6, 5, 4, 5, 10];
  for (let i = count; i > 0; i--) {
    state.particles.push({
      size: 6, //sizes[Math.floor(Math.random() * sizes.length)],
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 100,
      dx: Math.random() * 60,
      dy: Math.random() * 60,
      dz: Math.random() * 60,
      color: state.palette[Math.floor(Math.random() * state.palette.length)]
    });
  }
};

const setRandomPalette = (state: GameState) => {
  state.palette = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < state.particles.length; i++) {
    state.particles[i].color =
      state.palette[Math.floor(Math.random() * state.palette.length)];
  }
};

const setup: GameFunction = (state) => {
  const queryCount = ~~window.location.search.split("=")?.[1] || 300;
  const particleSpawnCount = queryCount;
  spawnParticles(state, particleSpawnCount);
  setRandomPalette(state);
};

const updateParticles: GameFunction = (state) => {
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;
  const { touchX, touchY, touchZ } = state;

  for (const p of state.particles) {
    const halfSize = p.size / 2;
    if (p.x < halfSize || p.x > maxWidth - halfSize) {
      p.x = Math.max(halfSize, Math.min(maxWidth - halfSize, p.x));
      p.dx *= -1;
    } else {
      p.x += p.dx * state.deltaTime;
    }
    if (p.y < halfSize || p.y > maxHeight - halfSize) {
      p.y = Math.max(halfSize, Math.min(maxHeight - halfSize, p.y));
      p.dy *= -1;
    } else {
      p.y += p.dy * state.deltaTime;
    }
    if (p.z < 0 || p.z > 400) {
      p.z = Math.max(0, Math.min(400, p.z));
      p.dz *= -1;
    } else {
      p.z += p.dz * state.deltaTime;
    }

    const friction = 0.99999 * (1 - state.deltaTime);
    p.dx *= friction;
    p.dy *= friction;
    p.dz *= friction;
    // p.dx = Math.max(-1100, Math.min(1100, p.dx));
    // p.dy = Math.max(-1100, Math.min(1100, p.dy));
    // p.dz = Math.max(-1100, Math.min(1100, p.dz));

    if (state.touchDown) {
      const dist = Math.sqrt(
        Math.pow(p.x - touchX, 2) +
          Math.pow(p.y - touchY, 2) +
          Math.pow(p.z - touchZ, 2)
      );
      const dirX = (touchX - p.x) / dist;
      const dirY = (touchY - p.y) / dist;
      const dirZ = (touchZ - p.z) / dist;
      const grav = 2 * Math.min(1600, 25830000 / (dist * dist));
      p.dx += dirX * state.deltaTime * grav;
      p.dy += dirY * state.deltaTime * grav;
      p.dz += dirZ * state.deltaTime * grav;
    }
  }
};

const renderParticles: GameFunction = (state) => {
  const boxShadowString = state.particles
    .sort((a, b) => b.z - a.z)
    .map((p) => {
      const zIndexScale = 1 + p.z / 30;
      const size = p.size * zIndexScale;
      const halfSize = (size - state.renderContainerSize) / 2;
      const hcs = state.renderContainerSize / 2;
      // if (p.z < 50) blur = Math.min(2, 50 / p.z);
      // if (p.z > 200) blur = Math.min(80, (p.z - 200) / 6);
      // return `${p.x + hcs}px ${p.y + hcs}px 0 ${halfSize}px ${p.color}`;
      return [
        p.x + hcs,
        "px ",
        p.y + hcs,
        "px 0 ",
        halfSize,
        "px ",
        p.color
      ].join("");
    })
    .join(",");
  const renderEl = document.getElementById("render");
  if (renderEl) {
    renderEl.style.boxShadow = boxShadowString;
  }
};

const tick = (timestamp: number) => {
  gameState.frame++;
  gameState.deltaTime = Math.min(
    (timestamp - gameState.prevFrameStartTime) / 1000,
    2
  );
  gameState.prevFrameStartTime = timestamp;
  updateParticles(gameState);
  renderParticles(gameState);
  winContext._gameFrame = window.requestAnimationFrame(tick);
};

const setMouseCoords = (
  inputEvent: MouseEvent | TouchEvent,
  isTouchStart = true
) => {
  let event = inputEvent as MouseEvent & TouchEvent;
  event.preventDefault();
  if (event.type !== "mousemove") {
    gameState.touchDown = true;
  }
  gameState.touchX = event.clientX;
  gameState.touchY = event.clientY;
  if (isTouchStart) {
    gameState.touchZ = 10 + 25 * Math.random();
  }
  if (event?.touches?.[0]) {
    gameState.touchX = event.touches[0].clientX;
    gameState.touchY = event.touches[0].clientY;
  }
};

const touchEnd = () => {
  gameState.touchDown = false;
};

window.addEventListener("mousemove", (event) => setMouseCoords(event));
window.addEventListener("mousedown", (event) => setMouseCoords(event, true));
window.addEventListener("mouseup", touchEnd);
window.addEventListener("touchstart", (event) => setMouseCoords(event, true));
window.addEventListener("touchmove", (event) => setMouseCoords(event));
window.addEventListener("touchend", touchEnd);
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    spawnParticles(gameState, 5);
  }
  if (e.code === "KeyC") {
    setRandomPalette(gameState);
  }
});

if (winContext._gameFrame) {
  winContext.cancelAnimationFrame(winContext._gameFrame);
}

setup(gameState);
tick(0);

(document.getElementById("app") as any).innerHTML = `
<div id="render" style="
  position: absolute;
  left: -${gameState.renderContainerSize}px;
  top: -${gameState.renderContainerSize}px;
  width: ${gameState.renderContainerSize}px;
  height: ${gameState.renderContainerSize}px;
  overflow: visible;
  border-radius: 500px;
"></div>`;
