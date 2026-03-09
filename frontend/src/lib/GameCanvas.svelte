<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { SnakeGame } from './SnakeGame';
  export let difficulty: 'easy' | 'normal' | 'hard' = 'normal';
  const dispatch = createEventDispatcher();
  let container: HTMLDivElement;
  let game: SnakeGame | null = null;
  let paused = false;
  onMount(() => {
    game = new SnakeGame(container, difficulty);
    game.onEvent((e: any) => {
      if (e.type === 'score') dispatch('score', e.value);
      else if (e.type === 'levelup') dispatch('level', e.value);
      else if (e.type === 'gameover') dispatch('gameover', { score: e.score });
    });
  });
  onDestroy(() => game?.destroy());
  export function togglePause() { game?.togglePause(); paused = game?.isPaused() ?? false; dispatch('pause', paused); }
  export function sendDirection(dir: any) { game?.setDirection(dir); }
</script>
<div class="wrap">
  <div bind:this={container}></div>
  {#if paused}
    <div class="overlay"><p class="pixel" style="color:var(--neon-green)">PAUSED</p><p style="color:var(--text-muted);margin-top:8px;font-size:0.85rem">Press SPACE to resume</p></div>
  {/if}
</div>
<style>
  .wrap { position:relative; display:inline-block; border:1px solid rgba(0,255,136,0.3); box-shadow:0 0 30px rgba(0,255,136,0.15); border-radius:4px; }
  .overlay { position:absolute; inset:0; background:rgba(3,10,15,0.85); display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:4px; }
</style>
