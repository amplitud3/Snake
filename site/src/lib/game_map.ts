import { Container, Point } from "pixi.js";
import { TILE_SIZE } from "./game_settings";
import { center, create_rectangle } from "./helper";

export class GameMap extends Container {
  floor = () => create_rectangle(TILE_SIZE, TILE_SIZE, 'orange')
  wall = () => create_rectangle(TILE_SIZE, TILE_SIZE, 'red')
  map: Container[][]
  constructor(public readonly map_width: number, public readonly map_height: number) {
    super()
    this.map = Array.from(Array(map_height), _ => Array(map_width))
    for (let row = 0; row < map_height; row++) {
      for (let col = 0; col < map_width; col++) {
        const tile =
          (row == 0 || row == map_height - 1) ||
            (col == 0 || col == map_width - 1) ?
            this.wall() : this.floor()

        tile.position = { x: TILE_SIZE * col, y: TILE_SIZE * row }
        this.map[row][col] = tile
        this.addChild(tile)
      }

    }
    this.pivot.set(this.width / 2, this.height / 2)
    center(this)
  }
  player_spawn_point(): Point {
    return this.map[1][1].getGlobalPosition()
  }
}
