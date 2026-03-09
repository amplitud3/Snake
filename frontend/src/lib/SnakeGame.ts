import * as PIXI from 'pixi.js';

// ─── Types ───────────────────────────────────────────────────────────────────
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point { x: number; y: number; }

export interface FoodItem {
  point: Point;
  type: 'normal' | 'bonus' | 'super';
  sprite: PIXI.Graphics;
  pulseTimer: number;
  value: number;
  ttl?: number; // time-to-live in ticks for bonus food
}

export type GameEvent =
  | { type: 'score'; value: number }
  | { type: 'level'; value: number }
  | { type: 'gameover'; score: number }
  | { type: 'levelup'; level: number };

export type EventCallback = (event: GameEvent) => void;

// ─── Constants ────────────────────────────────────────────────────────────────
const CELL = 24;
const GRID_W = 28;
const GRID_H = 22;
const CANVAS_W = CELL * GRID_W;
const CANVAS_H = CELL * GRID_H;

const COLORS = {
  bg:         0x030a0f,
  grid:       0x0a1a10,
  snakeHead:  0x00ff88,
  snakeBody:  0x00cc66,
  snakeTail:  0x008844,
  food:       0xff3366,
  bonus:      0xffea00,
  superFood:  0x00e5ff,
  wall:       0x112233,
  gridLine:   0x061510,
  text:       0xe0ffe8,
};

const SPEED_BY_DIFFICULTY = {
  easy:   200,
  normal: 130,
  hard:   75,
};

const SPEED_LEVEL_FACTOR = 8; // ms faster per level

// ─── SnakeGame Class ──────────────────────────────────────────────────────────
export class SnakeGame {
  private app: PIXI.Application;
  private gameLayer!: PIXI.Container;
  private uiLayer!: PIXI.Container;

  private snake: Point[] = [];
  private direction: Direction = 'RIGHT';
  private nextDirection: Direction = 'RIGHT';
  private directionQueue: Direction[] = [];

  private foods: FoodItem[] = [];
  private particles: ParticleEffect[] = [];

  private score = 0;
  private level = 1;
  private snakeLength = 4;
  private tickAccum = 0;
  private tickSpeed = 130;
  private paused = false;
  private dead = false;

  private difficulty: 'easy' | 'normal' | 'hard' = 'normal';
  private bonusFoodTimer = 0;
  private bonusFoodInterval = 200;

  private eventCb?: EventCallback;

  // Sprite pools
  private snakeSprites: PIXI.Graphics[] = [];
  private gridGraphics!: PIXI.Graphics;
  private bgGraphics!: PIXI.Graphics;

  constructor(container: HTMLElement, difficulty: 'easy' | 'normal' | 'hard' = 'normal') {
    this.difficulty = difficulty;
    this.tickSpeed = SPEED_BY_DIFFICULTY[difficulty];

    this.app = new PIXI.Application({
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: COLORS.bg,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    container.appendChild(this.app.view as HTMLCanvasElement);

    this.setupLayers();
    this.drawBackground();
    this.initSnake();
    this.spawnFood('normal');

    this.app.ticker.add(this.update.bind(this));

    // Keyboard input
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  onEvent(cb: EventCallback) {
    this.eventCb = cb;
  }

  private emit(event: GameEvent) {
    this.eventCb?.(event);
  }

  // ─── Setup ──────────────────────────────────────────────────────────────────
  private setupLayers() {
    this.gameLayer = new PIXI.Container();
    this.uiLayer = new PIXI.Container();
    this.app.stage.addChild(this.gameLayer);
    this.app.stage.addChild(this.uiLayer);
  }

  private drawBackground() {
    this.bgGraphics = new PIXI.Graphics();
    this.gridGraphics = new PIXI.Graphics();

    // Background
    this.bgGraphics.beginFill(COLORS.bg);
    this.bgGraphics.drawRect(0, 0, CANVAS_W, CANVAS_H);
    this.bgGraphics.endFill();

    // Subtle grid
    this.gridGraphics.lineStyle(1, COLORS.gridLine, 0.6);
    for (let x = 0; x <= GRID_W; x++) {
      this.gridGraphics.moveTo(x * CELL, 0);
      this.gridGraphics.lineTo(x * CELL, CANVAS_H);
    }
    for (let y = 0; y <= GRID_H; y++) {
      this.gridGraphics.moveTo(0, y * CELL);
      this.gridGraphics.lineTo(CANVAS_W, y * CELL);
    }

    // Border glow
    this.gridGraphics.lineStyle(2, COLORS.snakeBody, 0.5);
    this.gridGraphics.drawRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);

    this.gameLayer.addChild(this.bgGraphics);
    this.gameLayer.addChild(this.gridGraphics);
  }

  private initSnake() {
    this.snake = [];
    const startX = Math.floor(GRID_W / 2) - 2;
    const startY = Math.floor(GRID_H / 2);

    for (let i = 0; i < this.snakeLength; i++) {
      this.snake.push({ x: startX + i, y: startY });
    }
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.directionQueue = [];
    this.renderSnake();
  }

  // ─── Food ────────────────────────────────────────────────────────────────────
  private spawnFood(type: FoodItem['type']) {
    let pos: Point;
    let attempts = 0;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_W),
        y: Math.floor(Math.random() * GRID_H),
      };
      attempts++;
    } while (
      attempts < 100 &&
      (this.snake.some(s => s.x === pos.x && s.y === pos.y) ||
       this.foods.some(f => f.point.x === pos.x && f.point.y === pos.y))
    );

    const color = type === 'normal' ? COLORS.food
      : type === 'bonus' ? COLORS.bonus
      : COLORS.superFood;

    const value = type === 'normal' ? 10
      : type === 'bonus' ? 30
      : 60;

    const sprite = new PIXI.Graphics();
    this.drawFoodSprite(sprite, type, 1.0);
    sprite.x = pos.x * CELL + CELL / 2;
    sprite.y = pos.y * CELL + CELL / 2;

    this.gameLayer.addChild(sprite);

    const food: FoodItem = {
      point: pos,
      type,
      sprite,
      pulseTimer: 0,
      value,
      ttl: type !== 'normal' ? 120 : undefined,
    };

    this.foods.push(food);
  }

  private drawFoodSprite(g: PIXI.Graphics, type: FoodItem['type'], scale: number) {
    g.clear();
    const color = type === 'normal' ? COLORS.food
      : type === 'bonus' ? COLORS.bonus
      : COLORS.superFood;

    const r = (CELL / 2 - 3) * scale;

    if (type === 'super') {
      // Diamond shape
      g.beginFill(color, 0.9);
      g.moveTo(0, -r);
      g.lineTo(r, 0);
      g.lineTo(0, r);
      g.lineTo(-r, 0);
      g.closePath();
      g.endFill();
      // Glow inner
      g.beginFill(0xffffff, 0.4);
      g.moveTo(0, -r * 0.4);
      g.lineTo(r * 0.4, 0);
      g.lineTo(0, r * 0.4);
      g.lineTo(-r * 0.4, 0);
      g.closePath();
      g.endFill();
    } else if (type === 'bonus') {
      // Star shape
      g.beginFill(color, 0.95);
      const points = 5;
      const outerR = r;
      const innerR = r * 0.45;
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? outerR : innerR;
        if (i === 0) g.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        else g.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      g.closePath();
      g.endFill();
    } else {
      // Circle food
      g.beginFill(color, 0.95);
      g.drawCircle(0, 0, r);
      g.endFill();
      g.beginFill(0xffffff, 0.25);
      g.drawCircle(-r * 0.25, -r * 0.25, r * 0.35);
      g.endFill();
    }
  }

  // ─── Snake Rendering ─────────────────────────────────────────────────────────
  private renderSnake() {
    // Remove old sprites
    this.snakeSprites.forEach(s => this.gameLayer.removeChild(s));
    this.snakeSprites = [];

    for (let i = 0; i < this.snake.length; i++) {
      const seg = this.snake[i];
      const g = new PIXI.Graphics();
      const isHead = i === this.snake.length - 1;
      const isTail = i === 0;

      const t = i / this.snake.length;
      const color = isHead ? COLORS.snakeHead
        : interpolateColor(COLORS.snakeBody, COLORS.snakeTail, 1 - t);

      const padding = isHead ? 1 : isTail ? 4 : 2;
      const radius = isHead ? 5 : 3;

      g.beginFill(color, isHead ? 1 : 0.9);
      g.drawRoundedRect(
        seg.x * CELL + padding,
        seg.y * CELL + padding,
        CELL - padding * 2,
        CELL - padding * 2,
        radius
      );
      g.endFill();

      // Head eyes
      if (isHead) {
        this.drawEyes(g, seg);
      }

      this.gameLayer.addChild(g);
      this.snakeSprites.push(g);
    }
  }

  private drawEyes(g: PIXI.Graphics, head: Point) {
    const cx = head.x * CELL + CELL / 2;
    const cy = head.y * CELL + CELL / 2;
    const eyeR = 2.5;
    const eyeOffset = 4;

    let e1x = cx, e1y = cy, e2x = cx, e2y = cy;

    switch (this.direction) {
      case 'RIGHT': e1x = cx + 4; e1y = cy - eyeOffset; e2x = cx + 4; e2y = cy + eyeOffset; break;
      case 'LEFT':  e1x = cx - 4; e1y = cy - eyeOffset; e2x = cx - 4; e2y = cy + eyeOffset; break;
      case 'UP':    e1x = cx - eyeOffset; e1y = cy - 4; e2x = cx + eyeOffset; e2y = cy - 4; break;
      case 'DOWN':  e1x = cx - eyeOffset; e1y = cy + 4; e2x = cx + eyeOffset; e2y = cy + 4; break;
    }

    // Eye whites
    g.beginFill(0xffffff, 0.9);
    g.drawCircle(e1x - head.x * CELL, e1y - head.y * CELL, eyeR);
    g.drawCircle(e2x - head.x * CELL, e2y - head.y * CELL, eyeR);
    g.endFill();

    // Pupils
    g.beginFill(0x000000, 1);
    g.drawCircle(e1x - head.x * CELL, e1y - head.y * CELL, eyeR * 0.55);
    g.drawCircle(e2x - head.x * CELL, e2y - head.y * CELL, eyeR * 0.55);
    g.endFill();
  }

  // ─── Game Loop ────────────────────────────────────────────────────────────────
  private update(delta: number) {
    if (this.paused || this.dead) return;

    const ms = (delta / PIXI.settings.TARGET_FPMS) / 1000 * 1000;
    this.tickAccum += ms;

    // Animate food
    this.foods.forEach(food => {
      food.pulseTimer += delta * 0.05;
      const pulse = 0.85 + Math.sin(food.pulseTimer) * 0.15;
      food.sprite.scale.set(pulse);

      if (food.ttl !== undefined) {
        food.ttl--;
        if (food.ttl <= 20) {
          // Flicker when about to expire
          food.sprite.alpha = food.ttl % 4 < 2 ? 0.3 : 1;
        }
        if (food.ttl <= 0) {
          this.removeFood(food);
        }
      }
    });

    // Animate particles
    this.particles = this.particles.filter(p => {
      p.update(delta);
      if (p.isDead()) {
        this.gameLayer.removeChild(p.container);
        return false;
      }
      return true;
    });

    // Bonus food timer
    this.bonusFoodTimer++;
    if (this.bonusFoodTimer >= this.bonusFoodInterval) {
      this.bonusFoodTimer = 0;
      this.bonusFoodInterval = 150 + Math.floor(Math.random() * 200);
      const roll = Math.random();
      if (roll < 0.6 && this.foods.filter(f => f.type === 'bonus').length < 2) {
        this.spawnFood('bonus');
      } else if (roll >= 0.6 && this.foods.filter(f => f.type === 'super').length < 1) {
        this.spawnFood('super');
      }
    }

    if (this.tickAccum >= this.tickSpeed) {
      this.tickAccum -= this.tickSpeed;
      this.tick();
    }
  }

  private tick() {
    // Process direction queue
    if (this.directionQueue.length > 0) {
      this.direction = this.directionQueue.shift()!;
    }

    const head = this.snake[this.snake.length - 1];
    const newHead = this.move(head, this.direction);

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_W || newHead.y < 0 || newHead.y >= GRID_H) {
      this.die();
      return;
    }

    // Self collision (skip the tail as it will move)
    if (this.snake.slice(1).some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.die();
      return;
    }

    // Move snake
    this.snake.push(newHead);

    // Check food
    let ate = false;
    for (const food of [...this.foods]) {
      if (food.point.x === newHead.x && food.point.y === newHead.y) {
        ate = true;
        this.score += food.value * this.level;
        this.emit({ type: 'score', value: this.score });

        // Particle burst
        this.spawnParticles(newHead, food.type);

        this.removeFood(food);
        this.spawnFood('normal');

        // Level up every 100 base points
        const newLevel = Math.floor(this.score / (100 * this.level)) + 1;
        if (newLevel > this.level) {
          this.level = newLevel;
          this.tickSpeed = Math.max(
            40,
            SPEED_BY_DIFFICULTY[this.difficulty] - (this.level - 1) * SPEED_LEVEL_FACTOR
          );
          this.emit({ type: 'levelup', value: this.level });
        }

        break;
      }
    }

    if (!ate) {
      this.snake.shift();
    }

    this.renderSnake();
  }

  private move(point: Point, dir: Direction): Point {
    switch (dir) {
      case 'UP':    return { x: point.x, y: point.y - 1 };
      case 'DOWN':  return { x: point.x, y: point.y + 1 };
      case 'LEFT':  return { x: point.x - 1, y: point.y };
      case 'RIGHT': return { x: point.x + 1, y: point.y };
    }
  }

  private removeFood(food: FoodItem) {
    this.gameLayer.removeChild(food.sprite);
    this.foods = this.foods.filter(f => f !== food);
  }

  private die() {
    this.dead = true;

    // Flash effect
    let flashes = 0;
    const flashInterval = setInterval(() => {
      this.snakeSprites.forEach(s => { s.alpha = flashes % 2 === 0 ? 0 : 1; });
      flashes++;
      if (flashes > 8) {
        clearInterval(flashInterval);
        this.snakeSprites.forEach(s => this.gameLayer.removeChild(s));
        this.snakeSprites = [];
        this.emit({ type: 'gameover', score: this.score });
      }
    }, 80);
  }

  // ─── Particles ────────────────────────────────────────────────────────────────
  private spawnParticles(pos: Point, type: FoodItem['type']) {
    const colors = type === 'super' ? [0x00e5ff, 0xffffff, 0x66ffff]
      : type === 'bonus' ? [0xffea00, 0xffa500, 0xffffff]
      : [0xff3366, 0xff6688, 0xffffff];

    const p = new ParticleEffect(
      pos.x * CELL + CELL / 2,
      pos.y * CELL + CELL / 2,
      colors,
      type === 'super' ? 16 : type === 'bonus' ? 12 : 8
    );
    this.gameLayer.addChild(p.container);
    this.particles.push(p);
  }

  // ─── Input ────────────────────────────────────────────────────────────────────
  private onKeyDown(e: KeyboardEvent) {
    const keyMap: Partial<Record<string, Direction>> = {
      ArrowUp: 'UP', w: 'UP', W: 'UP',
      ArrowDown: 'DOWN', s: 'DOWN', S: 'DOWN',
      ArrowLeft: 'LEFT', a: 'LEFT', A: 'LEFT',
      ArrowRight: 'RIGHT', d: 'RIGHT', D: 'RIGHT',
    };

    const newDir = keyMap[e.key];
    if (newDir) {
      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'
      };
      const last = this.directionQueue.length > 0
        ? this.directionQueue[this.directionQueue.length - 1]
        : this.direction;

      if (newDir !== opposites[last] && this.directionQueue.length < 3) {
        this.directionQueue.push(newDir);
      }
    }

    if (e.key === ' ' || e.key === 'Escape') {
      this.togglePause();
    }
  }

  // ─── Public Controls ─────────────────────────────────────────────────────────
  pause()  { this.paused = true; }
  resume() { this.paused = false; }

  togglePause() {
    this.paused = !this.paused;
    this.emit({ type: 'score', value: this.score }); // trigger UI refresh
  }

  isPaused() { return this.paused; }
  getScore() { return this.score; }
  getLevel() { return this.level; }

  setDirection(dir: Direction) {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'
    };
    const last = this.directionQueue.length > 0
      ? this.directionQueue[this.directionQueue.length - 1]
      : this.direction;

    if (dir !== opposites[last] && this.directionQueue.length < 3) {
      this.directionQueue.push(dir);
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    this.app.destroy(true, { children: true });
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }
}

// ─── Particle Effect ──────────────────────────────────────────────────────────
class ParticleEffect {
  container: PIXI.Container;
  private particles: Array<{
    g: PIXI.Graphics;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    r: number;
  }> = [];

  constructor(x: number, y: number, colors: number[], count: number) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      const g = new PIXI.Graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      const r = 2 + Math.random() * 3;
      g.beginFill(color, 1);
      g.drawCircle(0, 0, r);
      g.endFill();
      this.container.addChild(g);
      this.particles.push({
        g, r,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.floor(Math.random() * 20),
        maxLife: 30 + Math.floor(Math.random() * 20),
      });
    }
  }

  update(delta: number) {
    this.particles.forEach(p => {
      p.g.x += p.vx * delta;
      p.g.y += p.vy * delta;
      p.vy += 0.15 * delta;
      p.life -= delta;
      p.g.alpha = Math.max(0, p.life / p.maxLife);
      const s = 0.5 + (p.life / p.maxLife) * 0.5;
      p.g.scale.set(s);
    });
  }

  isDead() {
    return this.particles.every(p => p.life <= 0);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function interpolateColor(c1: number, c2: number, t: number): number {
  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}
