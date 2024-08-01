import { Container, Sprite, Texture } from "pixi.js";
import { SIZE, TILE_SIZE } from "./game_settings";

export function create_rectangle(width: number, height: number, tint: string | number) {
  const rectangle = Sprite.from(Texture.WHITE);
  rectangle.width = TILE_SIZE;
  rectangle.height = TILE_SIZE;
  rectangle.tint = tint;
  return rectangle
}
export function center(container: Container) {
  container.x = SIZE.width / 2
  container.y = SIZE.height / 2
}
