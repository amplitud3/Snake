import { Container, Sprite, Texture, Ticker, type TextureSourceLike } from "pixi.js";
import { TILE_SIZE } from "./game_settings";
import { AssetsURLs } from "./game_assets";

type Direction = 'up' | 'down' | 'right' | 'left'
type BodyType = 'head' | 'body' | 'tail'
class BodyPart extends Sprite {
  #direction!: Direction
  constructor(type: BodyType, direction: Direction = 'up') {
    let asset_url = ''
    switch (type) {
      case 'head': asset_url = AssetsURLs.snake_head; break
      default: break;
    }
    super(Sprite.from(asset_url))
    this.anchor = 0.5
    this.position = { x: 20, y: 30 }
    this.direction = direction
  }

  public get direction(): Direction { return this.#direction }
  public set direction(v: Direction) {
    switch (v) {
      case 'right': this.rotation = Math.PI / 2; break
      case 'left': this.rotation = -Math.PI / 2; break
      case 'up': this.rotation = 0; break
      case 'down': this.rotation = Math.PI; break
    }
    this.#direction = v;
  }
  public move() {
    this.x += 1
  }

}
export class Snake extends Container {
  last_time: number = 0
  body: BodyPart[]
  public get head() { return this.body[0] }

  constructor(public readonly step_frequency = 250) {
    super()
    const head: BodyPart = new BodyPart('head', 'right')
    this.addChild(head)
    this.body = [head]

    Ticker.shared.add(this.update.bind(this))

    window.addEventListener("keydown", this.proces_input.bind(this))
  }
  proces_input(ev: KeyboardEvent) {
    switch (ev.key) {
      case "w": this.head.direction = "up"; break;
      case "s": this.head.direction = "down"; break;
      case "a": this.head.direction = "left"; break;
      case "d": this.head.direction = "right"; break;
      default: break;
    }
  }
  move() {
    for (let index = this.body.length - 1; index >= 0; index--) {
      const part = this.body[index];
      part.move()
      if (index == 0) {
        switch (part.direction) {
          case "up": part.y -= TILE_SIZE; break;
          case "down": part.y += TILE_SIZE; break;
          case "right": part.x += TILE_SIZE; break;
          case "left": part.x -= TILE_SIZE; break;
        }
      }
      else {
        const next_part = this.body[index - 1];
        part.x = next_part.x
        part.y = next_part.y
      }
    }
  }
  update(time: Ticker) {
    this.last_time += time.deltaMS
    if (this.last_time > this.step_frequency) {
      this.last_time = 0
      this.move()

    }

  }
}
