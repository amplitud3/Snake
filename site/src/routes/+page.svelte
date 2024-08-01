<script lang="ts">
  import { onMount } from "svelte";
  import { init_game } from "$lib";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    init_game(canvas);
  });
</script>

<article>
  <canvas bind:this={canvas}></canvas>
</article>

<style lang="scss">
  canvas {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
  }
</style>
