import { Assets } from "pixi.js"

export const AssetsURLs = {
  bunny: "https://pixijs.com/assets/bunny.png",
  snake_head: "/tileset.webp"
}
export async function init_assets() {
  for (const url of Object.values(AssetsURLs))
    await Assets.load(url)
}
