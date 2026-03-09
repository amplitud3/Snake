<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchLeaderboard } from './api';
  export let highlightId: number | null = null;
  let entries: any[] = [];
  let loading = true;
  onMount(async () => { entries = await fetchLeaderboard(); loading = false; });
  function formatDate(iso: string) { return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' }); }
  const medals = ['🥇','🥈','🥉'];
</script>
<div class="lb">
  <h2 class="pixel title">HIGH SCORES</h2>
  {#if loading}
    <p class="pixel blink" style="color:var(--neon-green);font-size:0.5rem;text-align:center;padding:32px">LOADING...</p>
  {:else if entries.length === 0}
    <p style="color:var(--text-muted);text-align:center;padding:32px">No scores yet — be the first!</p>
  {:else}
    {#each entries as e, i}
      <div class="row" class:highlight={e.id === highlightId} class:top={i < 3}>
        <span class="rank">{i < 3 ? medals[i] : '#'+(i+1)}</span>
        <span class="name">{e.name}</span>
        <span class="lvl">LVL {e.level}</span>
        <span class="score pixel">{e.score.toString().padStart(6,'0')}</span>
        <span class="date">{formatDate(e.date)}</span>
      </div>
    {/each}
  {/if}
</div>
<style>
  .lb { width:100%; max-width:480px; }
  .title { font-size:0.7rem; color:var(--neon-green); text-shadow:0 0 10px var(--neon-green); text-align:center; margin-bottom:20px; }
  .row { display:grid; grid-template-columns:40px 1fr 60px 80px 50px; align-items:center; gap:8px; padding:8px 12px; background:var(--bg-card); border:1px solid rgba(0,255,136,0.08); border-radius:3px; margin-bottom:4px; font-size:0.9rem; }
  .row.top { border-color:rgba(0,255,136,0.2); background:rgba(0,255,136,0.04); }
  .row.highlight { border-color:var(--neon-cyan)!important; background:rgba(0,229,255,0.08)!important; }
  .rank { text-align:center; font-size:0.5rem; color:var(--text-muted); }
  .name { font-weight:600; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lvl { font-size:0.75rem; color:var(--text-muted); }
  .score { font-family:var(--font-pixel); font-size:0.6rem; color:var(--neon-green); text-align:right; }
  .date { font-size:0.72rem; color:var(--text-muted); text-align:right; }
  .blink { animation:blink 1s step-end infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
</style>
