import { Application, TextureStyle } from "pixi.js";
import { SIZE } from "./game_settings";
import { init_assets } from "./game_assets";
import { Scene } from "./scene";
export async function init_game(canvas: HTMLCanvasElement) {
  const app = new Application();
  await app.init({
    canvas: canvas,
    background: "#1099bb",
    ...SIZE
  });

  TextureStyle.defaultOptions.scaleMode = "nearest";

  await init_assets()
  app.stage.addChild(new Scene())
  // @ts-ignore
  globalThis.__PIXI_APP__ = app;



  // Add an animation loop callback to the application's ticker.
  app.ticker.add((time) => {
  });
}
