<script lang="ts">
  import '../app.css';
  import { tick } from 'svelte';
  import GameCanvas from '$lib/GameCanvas.svelte';
  import HUD from '$lib/HUD.svelte';
  import Leaderboard from '$lib/Leaderboard.svelte';
  import DPad from '$lib/DPad.svelte';
  import { submitScore } from '$lib/api';
  import { highScore, playerName, settings } from '../stores/game';
  import type { Direction } from '$lib/SnakeGame';

  type Screen = 'menu' | 'playing' | 'gameover' | 'leaderboard';

  let screen: Screen = 'menu';
  let currentScore = 0;
  let currentLevel = 1;
  let paused = false;
  let gameComponent: GameCanvas;
  let finalScore = 0;
  let finalLevel = 1;
  let submittedId: number | null = null;
  let rank: number | null = null;
  let submitting = false;
  let nameInput = '';
  let selectedDifficulty: 'easy' | 'normal' | 'hard' = 'normal';

  $: nameInput = $playerName;

  async function startGame() {
    screen = 'playing';
    currentScore = 0;
    currentLevel = 1;
    paused = false;
    await tick();
  }

  function onScore(e: CustomEvent<number>) {
    currentScore = e.detail;
    if (currentScore > $highScore) {
      highScore.set(currentScore);
    }
  }

  function onLevel(e: CustomEvent<number>) {
    currentLevel = e.detail;
  }

  async function onGameOver(e: CustomEvent<{ score: number; level: number }>) {
    finalScore = e.detail.score;
    finalLevel = e.detail.level;
    screen = 'gameover';
  }

  function onPause(e: CustomEvent<boolean>) {
    paused = e.detail;
  }

  function onDPad(e: CustomEvent<Direction>) {
    gameComponent?.sendDirection(e.detail);
  }

  async function submitAndShowBoard() {
    const name = nameInput.trim() || 'ANONYMOUS';
    playerName.set(name);
    submitting = true;
    const result = await submitScore(name, finalScore, finalLevel);
    submitting = false;
    if (result) {
      submittedId = result.id;
      rank = result.rank;
    }
    screen = 'leaderboard';
  }

  function restart() {
    screen = 'menu';
    submittedId = null;
    rank = null;
  }
  function setDifficulty(key: string) {
    selectedDifficulty = key as 'easy' | 'normal' | 'hard';
  }

  const difficultyInfo = {
    easy:   { label: 'EASY',   desc: 'Slow speed, forgiving', color: '#00ff88' },
    normal: { label: 'NORMAL', desc: 'Classic experience',    color: '#ffea00' },
    hard:   { label: 'HARD',   desc: 'Fast & unforgiving',    color: '#ff3366' },
  };
</script>

<svelte:head>
  <title>🐍 SNAKE — Neon Edition</title>
</svelte:head>

<main class="app">

  <!-- ─── MENU ─────────────────────────────────────────────────────────────── -->
  {#if screen === 'menu'}
    <div class="screen menu-screen">
      <div class="menu-glow-bg"></div>
      <div class="menu-content">
        <div class="logo-area">
          <div class="snake-icon">🐍</div>
          <h1 class="game-title pixel">SNAKE</h1>
          <p class="subtitle">NEON EDITION</p>
        </div>

        <div class="difficulty-select">
          <p class="select-label">SELECT DIFFICULTY</p>
          <div class="diff-buttons">
            {#each Object.entries(difficultyInfo) as [key, info]}
              <button
                class="diff-btn"
                class:selected={selectedDifficulty === key}
                style="--accent: {info.color}"
                on:click={() => setDifficulty(key)}
              >
                <span class="diff-label pixel">{info.label}</span>
                <span class="diff-desc">{info.desc}</span>
              </button>
            {/each}
          </div>
        </div>

        <button class="btn-start pixel" on:click={startGame}>
          ▶ PLAY
        </button>

        <button class="btn-board" on:click={() => screen = 'leaderboard'}>
          LEADERBOARD
        </button>

        <div class="controls-hint">
          <p>WASD / Arrow Keys to move • SPACE to pause</p>
        </div>

        {#if $highScore > 0}
          <div class="prev-best">
            <span class="label">YOUR BEST</span>
            <span class="pixel" style="color: var(--neon-cyan)">{$highScore.toString().padStart(6, '0')}</span>
          </div>
        {/if}
      </div>
    </div>

  <!-- ─── PLAYING ───────────────────────────────────────────────────────────── -->
  {:else if screen === 'playing'}
    <div class="screen game-screen">
      <div class="game-area">
        <HUD
          score={currentScore}
          highScore={$highScore}
          level={currentLevel}
          {paused}
        />
        <GameCanvas
          bind:this={gameComponent}
          difficulty={selectedDifficulty}
          on:score={onScore}
          on:level={onLevel}
          on:gameover={onGameOver}
          on:pause={onPause}
        />
        <div class="game-footer">
          <DPad on:direction={onDPad} />
          <div class="game-actions">
            <button class="action-btn" on:click={() => gameComponent?.togglePause()}>
              {paused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
            <button class="action-btn quit" on:click={restart}>QUIT</button>
          </div>
        </div>
      </div>
    </div>

  <!-- ─── GAME OVER ─────────────────────────────────────────────────────────── -->
  {:else if screen === 'gameover'}
    <div class="screen over-screen">
      <div class="over-card">
        <div class="over-title">
          <span class="pixel" style="color: var(--neon-pink); font-size: 1.4rem;">GAME OVER</span>
        </div>

        <div class="score-display">
          <div class="score-row">
            <span class="s-label">SCORE</span>
            <span class="pixel s-val">{finalScore.toString().padStart(6, '0')}</span>
          </div>
          <div class="score-row">
            <span class="s-label">LEVEL</span>
            <span class="pixel s-val yellow">{finalLevel}</span>
          </div>
          {#if finalScore >= $highScore && finalScore > 0}
            <div class="new-best pixel blink">✨ NEW HIGH SCORE!</div>
          {/if}
        </div>

        <div class="name-entry">
          <label for="nameInput" class="s-label">YOUR NAME</label>
          <input
            id="nameInput"
            bind:value={nameInput}
            placeholder="ENTER NAME"
            maxlength="20"
            class="name-input pixel"
          />
        </div>

        <div class="over-buttons">
          <button class="btn-start pixel" on:click={submitAndShowBoard} disabled={submitting}>
            {submitting ? 'SAVING...' : '📋 LEADERBOARD'}
          </button>
          <button class="btn-board" on:click={startGame}>▶ PLAY AGAIN</button>
          <button class="btn-ghost" on:click={restart}>MAIN MENU</button>
        </div>
      </div>
    </div>

  <!-- ─── LEADERBOARD ───────────────────────────────────────────────────────── -->
  {:else if screen === 'leaderboard'}
    <div class="screen board-screen">
      <div class="board-card">
        {#if rank !== null}
          <div class="rank-announce pixel">
            {rank <= 3 ? '🏆' : '🎮'} YOU RANKED #{rank}
          </div>
        {/if}
        <Leaderboard highlightId={submittedId} />
        <div class="board-buttons">
          <button class="btn-start pixel" on:click={startGame}>▶ PLAY</button>
          <button class="btn-ghost" on:click={restart}>MENU</button>
        </div>
      </div>
    </div>
  {/if}

</main>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .screen {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── MENU ── */
  .menu-screen { position: relative; }

  .menu-glow-bg {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .menu-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    max-width: 460px;
    width: 100%;
  }

  .logo-area {
    text-align: center;
  }

  .snake-icon {
    font-size: 4rem;
    animation: float 3s ease-in-out infinite;
    display: block;
    margin-bottom: 12px;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .game-title {
    font-size: 2.5rem;
    color: var(--neon-green);
    text-shadow:
      0 0 20px var(--neon-green),
      0 0 40px rgba(0, 255, 136, 0.5),
      0 0 80px rgba(0, 255, 136, 0.2);
    letter-spacing: 0.2em;
    line-height: 1;
  }

  .subtitle {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.4em;
    color: var(--text-muted);
    margin-top: 6px;
  }

  .select-label {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--text-muted);
    text-align: center;
    margin-bottom: 10px;
  }

  .diff-buttons {
    display: flex;
    gap: 8px;
  }

  .diff-btn {
    flex: 1;
    padding: 12px 10px;
    background: var(--bg-card);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
  }

  .diff-btn.selected {
    border-color: var(--accent);
    background: rgba(255,255,255,0.04);
    box-shadow: 0 0 16px rgba(255,255,255,0.06);
    color: var(--accent);
  }

  .diff-label {
    font-size: 0.5rem;
    letter-spacing: 0.1em;
  }

  .diff-desc {
    font-family: var(--font-ui);
    font-size: 0.7rem;
    font-weight: 500;
  }

  .btn-start {
    width: 100%;
    padding: 16px 32px;
    background: var(--neon-green);
    color: var(--bg-deep);
    border: none;
    border-radius: 3px;
    font-size: 1rem;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
  }

  .btn-start:hover {
    background: #33ff99;
    box-shadow: 0 0 30px rgba(0, 255, 136, 0.6);
    transform: translateY(-1px);
  }

  .btn-start:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-board {
    width: 100%;
    padding: 12px 24px;
    background: transparent;
    color: var(--neon-cyan);
    border: 1px solid rgba(0, 229, 255, 0.3);
    border-radius: 3px;
    font-family: var(--font-ui);
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-board:hover {
    background: rgba(0, 229, 255, 0.08);
    border-color: var(--neon-cyan);
  }

  .btn-ghost {
    width: 100%;
    padding: 10px;
    background: transparent;
    color: var(--text-muted);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 3px;
    font-family: var(--font-ui);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-ghost:hover { color: var(--text-primary); border-color: rgba(255,255,255,0.15); }

  .controls-hint {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
    padding: 12px 16px;
    border: 1px solid rgba(255,255,255,0.04);
    border-radius: 3px;
  }

  .prev-best {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-ui);
  }

  .label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--text-muted);
  }

  /* ── GAME ── */
  .game-area {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .game-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 16px;
    background: var(--bg-panel);
    border: 1px solid rgba(0, 255, 136, 0.2);
    border-top: none;
    border-radius: 0 0 4px 4px;
  }

  .game-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .action-btn {
    padding: 8px 16px;
    background: var(--bg-card);
    border: 1px solid rgba(0, 255, 136, 0.2);
    color: var(--neon-green);
    font-family: var(--font-ui);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .action-btn:hover { background: rgba(0,255,136,0.1); }
  .action-btn.quit { color: var(--neon-pink); border-color: rgba(255, 0, 110, 0.2); }
  .action-btn.quit:hover { background: rgba(255, 0, 110, 0.1); }

  /* ── GAME OVER ── */
  .over-screen {}

  .over-card {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 40px;
    background: var(--bg-panel);
    border: 1px solid rgba(255, 0, 110, 0.3);
    box-shadow: 0 0 40px rgba(255, 0, 110, 0.08);
    border-radius: 6px;
    max-width: 380px;
    width: 100%;
  }

  .over-title { text-align: center; }

  .score-display {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    background: var(--bg-card);
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.05);
  }

  .score-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .s-label {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--text-muted);
  }

  .s-val {
    font-size: 0.85rem;
    color: var(--neon-green);
    text-shadow: 0 0 8px var(--neon-green);
  }

  .s-val.yellow {
    color: var(--neon-yellow);
    text-shadow: 0 0 8px var(--neon-yellow);
  }

  .new-best {
    text-align: center;
    color: var(--neon-yellow);
    font-size: 0.5rem;
    margin-top: 4px;
  }

  .blink { animation: blink 1s step-end infinite; }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .name-entry {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .name-input {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-card);
    border: 1px solid rgba(0, 255, 136, 0.3);
    border-radius: 3px;
    color: var(--neon-green);
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    outline: none;
    transition: border-color 0.2s;
  }

  .name-input:focus {
    border-color: var(--neon-green);
    box-shadow: 0 0 10px rgba(0, 255, 136, 0.2);
  }

  .name-input::placeholder { color: var(--text-muted); }

  .over-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* ── LEADERBOARD ── */
  .board-card {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 32px;
    background: var(--bg-panel);
    border: 1px solid rgba(0, 255, 136, 0.2);
    box-shadow: 0 0 40px rgba(0, 255, 136, 0.05);
    border-radius: 6px;
    max-width: 520px;
    width: 100%;
  }

  .rank-announce {
    text-align: center;
    font-size: 0.6rem;
    color: var(--neon-yellow);
    text-shadow: 0 0 10px var(--neon-yellow);
    padding: 10px;
    background: rgba(255, 234, 0, 0.06);
    border: 1px solid rgba(255, 234, 0, 0.2);
    border-radius: 3px;
  }

  .board-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .board-buttons .btn-start { flex: 2; }
  .board-buttons .btn-ghost { flex: 1; }
</style>
