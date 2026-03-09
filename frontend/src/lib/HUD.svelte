<script lang="ts">
  export let score = 0;
  export let highScore = 0;
  export let level = 1;
  export let paused = false;
  $: displayScore = score.toString().padStart(6, '0');
  $: displayHigh = highScore.toString().padStart(6, '0');
</script>
<div class="hud">
  <div class="hud-block">
    <span class="label">SCORE</span>
    <span class="value pixel">{displayScore}</span>
  </div>
  <div class="hud-center">
    <div class="level-badge">
      <span class="label">LVL</span>
      <span class="level-num pixel">{level}</span>
    </div>
    {#if paused}<span class="pause pixel blink">⏸ PAUSED</span>{/if}
  </div>
  <div class="hud-block">
    <span class="label">BEST</span>
    <span class="value pixel" style="color:var(--neon-cyan)">{displayHigh}</span>
  </div>
</div>
<style>
  .hud { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; background:var(--bg-panel); border:1px solid rgba(0,255,136,0.2); border-bottom:none; border-radius:4px 4px 0 0; gap:16px; }
  .hud-block { display:flex; flex-direction:column; gap:2px; }
  .hud-center { display:flex; flex-direction:column; align-items:center; gap:4px; }
  .label { font-family:var(--font-ui); font-size:0.65rem; font-weight:700; letter-spacing:0.15em; color:var(--text-muted); text-transform:uppercase; }
  .value { font-family:var(--font-pixel); font-size:0.85rem; color:var(--neon-green); text-shadow:0 0 10px var(--neon-green); }
  .level-badge { display:flex; align-items:center; gap:8px; background:rgba(0,255,136,0.08); border:1px solid rgba(0,255,136,0.2); border-radius:20px; padding:4px 14px; }
  .level-num { font-family:var(--font-pixel); font-size:0.9rem; color:var(--neon-yellow); text-shadow:0 0 8px var(--neon-yellow); }
  .pause { font-family:var(--font-pixel); font-size:0.5rem; color:var(--neon-pink); }
  .blink { animation:blink 1s step-end infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
</style>
