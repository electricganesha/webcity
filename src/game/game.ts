// Local pointer type for internal use
interface Pointer {
  x: number;
  y: number;
  down: boolean;
}
import { Application, Container, Sprite, Texture } from "pixi.js";
import { TileId, type GridSize, type Tool } from "./types";
import { makeTileTexture, makeNoPowerTexture } from "./sprites";
import { makeGrid, idx, forEachNeighbor, generateTerrain } from "./grid";
export class Game {
  camera = { x: 0, y: 0, scale: 1 };
  pointer = { x: 0, y: 0, down: false } as Pointer;
  tool: Tool = "pan";
  gridSize = { w: 128, h: 128 } as GridSize;
  grid = makeGrid({ w: 128, h: 128 });
  sprites: Sprite[] = [];
  noPowerSprites: Sprite[] = [];
  pLineSprites: Sprite[] = [];
  textures: Record<number, Texture> = {};
  noPowerTexture!: Texture;
  app: Application;
  worldContainer: Container;
  tileSize = 32;
  _time = 0;
  _lastGrowth = 0;

  cityStats = {
    funds: 20000,
    population: 0,
    commercial: 0,
    industrial: 0,
    demand: { r: 50, c: 50, i: 50 },
    year: 1900,
    month: 1,
    message: "Welcome to WebCity!",
  };

  private constructor(app: Application) {
    this.app = app;
    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.app.canvas.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        const rect = this.app.canvas.getBoundingClientRect();
        const rx = e.clientX - rect.left;
        const ry = e.clientY - rect.top;

        const worldX = (rx - this.camera.x) / this.camera.scale;
        const worldY = (ry - this.camera.y) / this.camera.scale;

        const s0 = this.camera.scale;
        const s1 = s0 * (e.deltaY > 0 ? 0.9 : 1.1);

        this.camera.scale = s1;
        this.camera.x = rx - worldX * this.camera.scale;
        this.camera.y = ry - worldY * this.camera.scale;

        this.clampCamera();
      },
      { passive: true }
    );
  }

  static async init(container: HTMLElement): Promise<Game> {
    const app = new Application();
    await app.init({
      background: "#1099bb",
      resizeTo: container,
      antialias: true,
    });
    console.log(
      "PixiJS Application initialized",
      app.renderer.width,
      app.renderer.height
    );

    // Instead of wiping the container, we just append the canvas.
    // Ensure it's behind other elements by setting style or using a dedicated div.
    app.canvas.style.position = "absolute";
    app.canvas.style.top = "0";
    app.canvas.style.left = "0";
    app.canvas.style.zIndex = "0";
    container.appendChild(app.canvas);

    const game = new Game(app);
    // Initial terrain generation
    generateTerrain(game.grid, game.gridSize);

    game.noPowerTexture = makeNoPowerTexture(app.renderer, game.tileSize);

    for (const tid of Object.values(TileId)) {
      if (typeof tid === "number" && tid !== 0) {
        game.textures[tid] = makeTileTexture(
          tid as TileId,
          app.renderer,
          game.tileSize
        );
      }
    }
    for (let y = 0; y < game.gridSize.h; y++) {
      for (let x = 0; x < game.gridSize.w; x++) {
        const i = idx(x, y, game.gridSize.w);
        const cell = game.grid[i];

        // Main sprite
        const tid = cell.ground ?? TileId.Grass;
        const sprite = new Sprite(game.textures[tid]);
        sprite.x = x * game.tileSize;
        sprite.y = y * game.tileSize;
        sprite.width = game.tileSize;
        sprite.height = game.tileSize;
        game.sprites[i] = sprite;
        game.worldContainer.addChild(sprite);

        // No Power overlay
        const npSprite = new Sprite(game.noPowerTexture);
        npSprite.x = x * game.tileSize;
        npSprite.y = y * game.tileSize;
        npSprite.width = game.tileSize;
        npSprite.height = game.tileSize;
        npSprite.visible = false;
        game.noPowerSprites[i] = npSprite;
        game.worldContainer.addChild(npSprite);

        // Power Line layer
        const plSprite = new Sprite(game.textures[TileId.PowerLine]);
        plSprite.x = x * game.tileSize;
        plSprite.y = y * game.tileSize;
        plSprite.width = game.tileSize;
        plSprite.height = game.tileSize;
        plSprite.visible = false;
        game.pLineSprites[i] = plSprite;
        game.worldContainer.addChild(plSprite);
      }
    }
    return game;
  }

  resize() {
    this.clampCamera();
  }

  clampCamera() {
    const rw = this.app.renderer.width;
    const rh = this.app.renderer.height;
    if (rw === 0 || rh === 0) return;

    const mapWidth = this.gridSize.w * this.tileSize;
    const mapHeight = this.gridSize.h * this.tileSize;

    // 1. Clamp Scale
    // We want the map to at least fill the viewport (no black bars)
    const minScale = Math.max(rw / mapWidth, rh / mapHeight);
    this.camera.scale = Math.max(minScale, Math.min(3, this.camera.scale));

    // 2. Clamp Translation
    const scaledWidth = mapWidth * this.camera.scale;
    const scaledHeight = mapHeight * this.camera.scale;

    // Constrain X: [rw - scaledWidth, 0] if scaledWidth > rw
    if (scaledWidth > rw) {
      this.camera.x = Math.max(rw - scaledWidth, Math.min(0, this.camera.x));
    } else {
      // Center if smaller (shouldn't happen with minScale but for safety)
      this.camera.x = (rw - scaledWidth) / 2;
    }

    // Constrain Y: [rh - scaledHeight, 0] if scaledHeight > rh
    if (scaledHeight > rh) {
      this.camera.y = Math.max(rh - scaledHeight, Math.min(0, this.camera.y));
    } else {
      this.camera.y = (rh - scaledHeight) / 2;
    }
  }

  cellAtScreen(x: number, y: number): { x: number; y: number } {
    // Map screen (client) coordinates to grid cell, accounting for camera and scale
    const rect = this.app.canvas.getBoundingClientRect();
    const px = (x - rect.left - this.camera.x) / this.camera.scale;
    const py = (y - rect.top - this.camera.y) / this.camera.scale;
    const cellX = Math.floor(px / this.tileSize);
    const cellY = Math.floor(py / this.tileSize);
    return { x: cellX, y: cellY };
  }

  onPointer(e: PointerEvent) {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    if (this.tool === "pan") {
      if (this.pointer.down) {
        this.camera.x += e.movementX;
        this.camera.y += e.movementY;
        this.clampCamera();
      }
      return;
    }
    if (!this.pointer.down) return;
    const { x, y } = this.cellAtScreen(e.clientX, e.clientY);
    if (x < 0 || y < 0 || x >= this.gridSize.w || y >= this.gridSize.h) return;
    const i = idx(x, y, this.gridSize.w);
    const cell = this.grid[i];

    if (this.tool === "bulldoze") {
      cell.network = undefined;
      cell.zone = undefined;
      cell.building = undefined;
      cell.hasPowerLine = false;
      cell.growthStage = 0;
    } else if (this.tool === "road") {
      cell.network = TileId.Road;
    } else if (this.tool === "rail") {
      cell.network = TileId.Rail;
    } else if (this.tool === "power-line") {
      cell.hasPowerLine = true;
    } else if (this.tool === "power-plant-coal") {
      cell.building = TileId.PowerPlantCoal;
    } else if (this.tool === "power-plant-nuclear") {
      cell.building = TileId.PowerPlantNuclear;
    } else if (this.tool === "zone-r") {
      cell.zone = TileId.ZoneR;
    } else if (this.tool === "zone-c") {
      cell.zone = TileId.ZoneC;
    } else if (this.tool === "zone-i") {
      cell.zone = TileId.ZoneI;
    } else if (this.tool === "police") {
      cell.building = TileId.Police;
    } else if (this.tool === "fire") {
      cell.building = TileId.Fire;
    } else if (this.tool === "park") {
      cell.building = TileId.Park;
    } else if (this.tool === "stadium") {
      cell.building = TileId.Stadium;
    } else if (this.tool === "seaport") {
      cell.building = TileId.Seaport;
    } else if (this.tool === "airport") {
      cell.building = TileId.Airport;
    }
  }

  simulate(dt: number) {
    this._time += dt;
    if (this._time - this._lastGrowth < 1000) return;
    this._lastGrowth = this._time;

    const { w, h } = this.gridSize;

    // 1. Reset Power
    for (const cell of this.grid) {
      cell.isPowered = false;
    }

    // 2. Propagate Power (Simplified BFS)
    const powerStack: { x: number; y: number }[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = this.grid[idx(x, y, w)];
        if (
          cell.building === TileId.PowerPlantCoal ||
          cell.building === TileId.PowerPlantNuclear
        ) {
          cell.isPowered = true;
          powerStack.push({ x, y });
        }
      }
    }

    while (powerStack.length > 0) {
      const { x, y } = powerStack.pop()!;
      forEachNeighbor(x, y, this.gridSize, (nx, ny) => {
        const ncell = this.grid[idx(nx, ny, w)];
        if (
          !ncell.isPowered &&
          (ncell.hasPowerLine || ncell.building || ncell.zone)
        ) {
          ncell.isPowered = true;
          // Power lines and buildings conduct power
          if (ncell.hasPowerLine || ncell.building) {
            powerStack.push({ x: nx, y: ny });
          }
        }
      });
    }
    // Correcting the BFS bug above: it should be powerStack.push({ x: nx, y: ny })
    // Re-writing the loop slightly cleaner below

    // 3. Update Simulation Data (Pollution, Crime, etc.)
    let pop = 0;
    let com = 0;
    let ind = 0;
    let totalUnpoweredZones = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = this.grid[idx(x, y, w)];

        if (cell.zone && !cell.isPowered) {
          totalUnpoweredZones++;
        }
        // Pollution from industry and power plants
        if (
          cell.zone === TileId.ZoneI ||
          cell.building === TileId.PowerPlantCoal
        ) {
          cell.pollution = Math.min(100, cell.pollution + 5);
        } else {
          cell.pollution = Math.max(0, cell.pollution - 2);
        }

        // Stats
        if (cell.zone === TileId.ZoneR) pop += cell.growthStage * 10;
        if (cell.zone === TileId.ZoneC) com += cell.growthStage * 10;
        if (cell.zone === TileId.ZoneI) ind += cell.growthStage * 10;

        // 4. Growth logic
        const demand =
          cell.zone === TileId.ZoneR
            ? this.cityStats.demand.r
            : cell.zone === TileId.ZoneC
              ? this.cityStats.demand.c
              : cell.zone === TileId.ZoneI
                ? this.cityStats.demand.i
                : 0;

        if (cell.zone && cell.isPowered && this.hasAdjacentRoad(x, y)) {
          if (!cell.building && demand > 0) {
            cell.building = this.getBuildingForZone(cell.zone, 1);
            cell.growthStage = 1;
            this.cityStats.funds -= 100; // Zoning cost
          } else if (
            cell.growthStage < 4 &&
            demand > 20 &&
            Math.random() > 0.7
          ) {
            cell.growthStage++;
            cell.building = this.getBuildingForZone(
              cell.zone,
              cell.growthStage
            );
          }
        } else if (
          cell.building &&
          cell.zone &&
          (!cell.isPowered || !this.hasAdjacentRoad(x, y) || demand < -20)
        ) {
          // Abandonment logic
          if (Math.random() > 0.9) {
            cell.growthStage = 0;
            cell.building = undefined;
          }
        }
      }
    }

    this.cityStats.population = pop;
    this.cityStats.commercial = com;
    this.cityStats.industrial = ind;

    // 5. Adjust Demand (RCI)
    // Very simplified: Demand goes up if supply is low relative to others
    this.cityStats.demand.r = Math.max(
      -100,
      Math.min(100, 100 - (pop - (com + ind)))
    );
    this.cityStats.demand.c = Math.max(-100, Math.min(100, pop - com));
    this.cityStats.demand.i = Math.max(-100, Math.min(100, pop - ind));

    // 6. Time and Budget
    this.cityStats.month++;
    if (this.cityStats.month > 12) {
      this.cityStats.month = 1;
      this.cityStats.year++;
      // Taxes (simplified)
      this.cityStats.funds += Math.floor(pop * 0.1 + com * 0.2 + ind * 0.2);
    }

    // 7. Feedback Messages
    if (totalUnpoweredZones > 5) {
      this.cityStats.message = "Inadequate power system.";
    } else if (this.cityStats.demand.r > 50) {
      this.cityStats.message = "Residents demand more zones.";
    } else if (this.cityStats.demand.c > 50) {
      this.cityStats.message = "Commercial demand is up.";
    } else if (this.cityStats.demand.i > 50) {
      this.cityStats.message = "Industrial demand is up.";
    } else {
      this.cityStats.message = "City is running smoothly.";
    }
  }

  getBuildingForZone(zone: TileId, stage: number): TileId | undefined {
    if (zone === TileId.ZoneR) {
      if (stage === 1) return TileId.House;
      if (stage === 2) return TileId.Apartment;
      if (stage === 3) return TileId.ApartmentLarge;
      if (stage === 4) return TileId.SkyscraperR;
    } else if (zone === TileId.ZoneC) {
      if (stage === 1) return TileId.ShopSmall;
      if (stage === 2) return TileId.ShopMedium;
      if (stage === 3) return TileId.OfficeSmall;
      if (stage === 4) return TileId.OfficeLarge;
      if (stage === 5) return TileId.SkyscraperC;
    } else if (zone === TileId.ZoneI) {
      if (stage === 1) return TileId.FactorySmall;
      if (stage === 2) return TileId.FactoryMedium;
      if (stage === 3) return TileId.Wholesale;
      if (stage === 4) return TileId.FactoryLarge;
    }
    return undefined;
  }

  isPowered(x: number, y: number) {
    return this.grid[idx(x, y, this.gridSize.w)].isPowered;
  }

  hasAdjacentRoad(x: number, y: number) {
    const { w, h } = this.gridSize;
    if (x > 0 && this.grid[idx(x - 1, y, w)].network === TileId.Road)
      return true;
    if (x < w - 1 && this.grid[idx(x + 1, y, w)].network === TileId.Road)
      return true;
    if (y > 0 && this.grid[idx(x, y - 1, w)].network === TileId.Road)
      return true;
    if (y < h - 1 && this.grid[idx(x, y + 1, w)].network === TileId.Road)
      return true;
    return false;
  }

  render() {
    this.clampCamera();
    // 1. Update Camera Transform
    this.app.stage.position.set(this.camera.x, this.camera.y);
    this.app.stage.scale.set(this.camera.scale);

    const flicker = this._time % 1000 > 500;

    // 2. Update Sprites
    // Optimization: Only update visible sprites (simple cull)
    const rw = this.app.renderer.width;
    const rh = this.app.renderer.height;

    // If renderer hasn't sized yet, don't cull or render
    if (rw === 0 || rh === 0) return;

    const bounds = {
      x: -this.camera.x / this.camera.scale,
      y: -this.camera.y / this.camera.scale,
      w: rw / this.camera.scale,
      h: rh / this.camera.scale,
    };

    for (let i = 0; i < this.grid.length; i++) {
      const cell = this.grid[i];
      const cx_grid = i % this.gridSize.w;
      const cy_grid = Math.floor(i / this.gridSize.w);
      const x = cx_grid * this.tileSize;
      const y = cy_grid * this.tileSize;

      // Simple Cull
      if (
        x + this.tileSize < bounds.x ||
        x > bounds.x + bounds.w ||
        y + this.tileSize < bounds.y ||
        y > bounds.y + bounds.h
      ) {
        this.sprites[i].visible = false;
        this.noPowerSprites[i].visible = false;
        this.pLineSprites[i].visible = false;
        continue;
      }

      const s = this.sprites[i];
      const np = this.noPowerSprites[i];
      const pl = this.pLineSprites[i];
      s.visible = true;

      // 1. Determine Tile for main layer
      let tid = cell.ground ?? TileId.Grass;
      if (cell.network) {
        tid = cell.network;
        if (tid === TileId.Road) {
          // Auto-tiling Road
          const l =
            cx_grid > 0 &&
            this.grid[idx(cx_grid - 1, cy_grid, this.gridSize.w)].network ===
              TileId.Road;
          const r =
            cx_grid < this.gridSize.w - 1 &&
            this.grid[idx(cx_grid + 1, cy_grid, this.gridSize.w)].network ===
              TileId.Road;
          const u =
            cy_grid > 0 &&
            this.grid[idx(cx_grid, cy_grid - 1, this.gridSize.w)].network ===
              TileId.Road;
          const d =
            cy_grid < this.gridSize.h - 1 &&
            this.grid[idx(cx_grid, cy_grid + 1, this.gridSize.w)].network ===
              TileId.Road;

          const horiz = l || r;
          const vert = u || d;

          if (horiz && vert) tid = TileId.RoadX;
          else if (horiz) tid = TileId.RoadH;
          else if (vert) tid = TileId.RoadV;
          else tid = TileId.RoadV; // Default V
        } else if (tid === TileId.Rail) {
          // Auto-tiling Rail
          const l =
            cx_grid > 0 &&
            this.grid[idx(cx_grid - 1, cy_grid, this.gridSize.w)].network ===
              TileId.Rail;
          const r =
            cx_grid < this.gridSize.w - 1 &&
            this.grid[idx(cx_grid + 1, cy_grid, this.gridSize.w)].network ===
              TileId.Rail;
          const u =
            cy_grid > 0 &&
            this.grid[idx(cx_grid, cy_grid - 1, this.gridSize.w)].network ===
              TileId.Rail;
          const d =
            cy_grid < this.gridSize.h - 1 &&
            this.grid[idx(cx_grid, cy_grid + 1, this.gridSize.w)].network ===
              TileId.Rail;

          const horiz = l || r;
          const vert = u || d;

          if (horiz && vert) tid = TileId.RailX;
          else if (horiz) tid = TileId.RailH;
          else if (vert) tid = TileId.RailV;
          else tid = TileId.RailV;
        }
      }
      if (cell.zone) tid = cell.zone;
      if (cell.building) tid = cell.building;

      const tex = this.textures[tid]!;
      if (s.texture !== tex) s.texture = tex;

      // 2. Handle Power Line layer
      if (cell.hasPowerLine) {
        pl.visible = true;
        // Auto-tiling Power
        const l =
          cx_grid > 0 &&
          this.grid[idx(cx_grid - 1, cy_grid, this.gridSize.w)].hasPowerLine;
        const r =
          cx_grid < this.gridSize.w - 1 &&
          this.grid[idx(cx_grid + 1, cy_grid, this.gridSize.w)].hasPowerLine;
        const u =
          cy_grid > 0 &&
          this.grid[idx(cx_grid, cy_grid - 1, this.gridSize.w)].hasPowerLine;
        const d =
          cy_grid < this.gridSize.h - 1 &&
          this.grid[idx(cx_grid, cy_grid + 1, this.gridSize.w)].hasPowerLine;

        const horiz = l || r;
        const vert = u || d;

        let ptid = TileId.PowerLine;
        if (horiz && vert) ptid = TileId.PowerX;
        else if (horiz) ptid = TileId.PowerH;
        else if (vert) ptid = TileId.PowerV;
        else ptid = TileId.PowerV;

        const ptex = this.textures[ptid]!;
        if (pl.texture !== ptex) pl.texture = ptex;
      } else {
        pl.visible = false;
      }

      // 3. Handle no-power icon
      const needsPower = cell.zone || cell.building;
      const showNoPower = needsPower && !cell.isPowered && flicker;
      np.visible = !!showNoPower;
    }

    // PixiJS ticker usually handles this, but we're calling it from a custom loop.
    // In Pixi 8, this might be necessary if autoStart is false or ticker is not used.
    try {
      this.app.renderer.render({ container: this.app.stage });
    } catch (e) {
      console.error("Render failed", e);
    }
  }
}
