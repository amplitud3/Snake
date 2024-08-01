import { Container, Sprite, Ticker } from "pixi.js";
import { AssetsURLs } from "./game_assets";
import { SIZE } from "./game_settings";
import { create_rectangle } from "./helper";
import { GameMap } from "./game_map";
import { Snake } from "./snake";

export class Scene extends Container {
  can = false;
  map: GameMap;
  player: Snake;
  bunny: Sprite;

  constructor() {
    super()
    this.map = new GameMap(10, 10)
    this.addChild(this.map)

    this.player = new Snake()

    this.player.position = this.map.player_spawn_point()
    this.addChild(this.player)

    // Create a new Sprite from an image path.
    this.bunny = Sprite.from(AssetsURLs.bunny);

    // Add to stage.
    this.addChild(this.bunny);

    // Center the sprite's anchor point.
    this.bunny.anchor.set(0.5);

    // Move the sprite to the center of the screen.
    this.bunny.x = SIZE.width / 2;
    this.bunny.y = SIZE.height / 2;

    window.onkeydown = (ev: KeyboardEvent) => {
      if (ev.key == " ") this.can = true;
    };
    Ticker.shared.add(this.update.bind(this))
  }
  update(time: Ticker) {
    if (this.can) this.bunny.rotation += 0.02 * time.deltaTime;
  }
}
