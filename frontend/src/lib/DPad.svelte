<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  function press(dir: string) { dispatch('direction', dir); }
</script>
<div class="dpad">
  <div class="row"><button class="btn" on:click={() => press('UP')}>▲</button></div>
  <div class="row">
    <button class="btn" on:click={() => press('LEFT')}>◀</button>
    <div class="center"></div>
    <button class="btn" on:click={() => press('RIGHT')}>▶</button>
  </div>
  <div class="row"><button class="btn" on:click={() => press('DOWN')}>▼</button></div>
</div>
<style>
  .dpad { display:flex; flex-direction:column; align-items:center; gap:2px; padding:8px; }
  .row { display:flex; justify-content:center; gap:2px; align-items:center; }
  .center { width:44px; height:44px; background:var(--bg-panel); }
  .btn { width:44px; height:44px; background:var(--bg-card); border:1px solid rgba(0,255,136,0.25); color:var(--neon-green); font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.1s; }
  .btn:active { background:rgba(0,255,136,0.15); }
</style>
