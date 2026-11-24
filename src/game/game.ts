import { TileId, BuildingSizes, type GridSize, type Tool, type Car } from "./types";
import { makeGrid, idx, forEachNeighbor, generateTerrain } from "./grid";

export class Game {
  tool: Tool = "pan";
  gridSize = { w: 64, h: 64 } as GridSize;
  grid = makeGrid({ w: 64, h: 64 });
  tileSize = 32;
  _time = 0;
  _lastGrowth = 0;
  _lastCarSpawn = 0;

  hoveredCell: { x: number; y: number } | null = null;
  cars: Car[] = [];

  cityStats = {
    funds: 20000,
    population: 0,
    commercial: 0,
    industrial: 0,
    demand: { r: 50, c: 50, i: 50 },
    year: 1900,
    month: 1,
    message: "Welcome to 3D WebCity!",
  };

  private constructor() {
    // Initial terrain generation
    generateTerrain(this.grid, this.gridSize);
  }

  static async init(): Promise<Game> {
    return new Game();
  }

  handleToolAction(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.gridSize.w || y >= this.gridSize.h) return;
    const i = idx(x, y, this.gridSize.w);
    const cell = this.grid[i];

    if (this.tool === "pan") return;

    if (this.tool === "bulldoze") {
      this.clearCell(x, y);
      return;
    }

    // Determine if we are placing a building with a footprint
    let buildingId: TileId | undefined;
    if (this.tool === "road") buildingId = TileId.Road; // Road is 1x1
    else if (this.tool === "rail") buildingId = TileId.Rail;
    else if (this.tool === "power-line") {
        cell.hasPowerLine = true;
        return;
    }
    else if (this.tool === "power-plant-coal") buildingId = TileId.PowerPlantCoal;
    else if (this.tool === "power-plant-nuclear") buildingId = TileId.PowerPlantNuclear;
    else if (this.tool === "zone-r") buildingId = TileId.ZoneR;
    else if (this.tool === "zone-c") buildingId = TileId.ZoneC;
    else if (this.tool === "zone-i") buildingId = TileId.ZoneI;
    else if (this.tool === "police") buildingId = TileId.Police;
    else if (this.tool === "fire") buildingId = TileId.Fire;
    else if (this.tool === "park") buildingId = TileId.Park;
    else if (this.tool === "stadium") buildingId = TileId.Stadium;
    else if (this.tool === "seaport") buildingId = TileId.Seaport;
    else if (this.tool === "airport") buildingId = TileId.Airport;

    if (!buildingId) return;

    const size = BuildingSizes[buildingId] || { w: 1, h: 1 };

    // Check if footprint is clear and within bounds
    for (let dy = 0; dy < size.h; dy++) {
      for (let dx = 0; dx < size.w; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= this.gridSize.w || ny >= this.gridSize.h) return;
        const ncell = this.grid[idx(nx, ny, this.gridSize.w)];
        if (ncell.building || ncell.network || ncell.zone || ncell.ground === TileId.Water) return;
      }
    }

    // Apply building to footprint
    for (let dy = 0; dy < size.h; dy++) {
      for (let dx = 0; dx < size.w; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        const ncell = this.grid[idx(nx, ny, this.gridSize.w)];
        
        if (dx === 0 && dy === 0) {
            // Origin cell logic
            if (this.tool === "road") ncell.network = TileId.Road;
            else if (this.tool === "rail") ncell.network = TileId.Rail;
            else if (this.tool.startsWith("zone-")) ncell.zone = buildingId;
            else ncell.building = buildingId;
        } else {
            // Slave cell logic
            ncell.parentOrigin = { x, y };
        }
      }
    }
  }

  clearCell(x: number, y: number) {
    const i = idx(x, y, this.gridSize.w);
    let cell = this.grid[i];

    // If it's a slave, find the origin
    if (cell.parentOrigin) {
      const origin = cell.parentOrigin;
      cell = this.grid[idx(origin.x, origin.y, this.gridSize.w)];
      this.clearFootprint(origin.x, origin.y, cell.building || cell.zone || cell.network);
    } else {
      this.clearFootprint(x, y, cell.building || cell.zone || cell.network);
    }
    
    // Always clear common fields
    cell.network = undefined;
    cell.zone = undefined;
    cell.building = undefined;
    cell.hasPowerLine = false;
    cell.growthStage = 0;
    cell.parentOrigin = undefined;
  }

  clearFootprint(x: number, y: number, id?: TileId) {
    if (!id) return;
    const size = BuildingSizes[id] || { w: 1, h: 1 };
    for (let dy = 0; dy < size.h; dy++) {
      for (let dx = 0; dx < size.w; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < this.gridSize.w && ny < this.gridSize.h) {
          const ncell = this.grid[idx(nx, ny, this.gridSize.w)];
          ncell.network = undefined;
          ncell.zone = undefined;
          ncell.building = undefined;
          ncell.hasPowerLine = false;
          ncell.growthStage = 0;
          ncell.parentOrigin = undefined;
        }
      }
    }
  }

  simulate(dt: number) {
    this._time += dt;
    this.simulateCars(dt);

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
          (ncell.hasPowerLine || ncell.building || ncell.zone || ncell.parentOrigin)
        ) {
          ncell.isPowered = true;
          if (ncell.hasPowerLine || ncell.building || ncell.parentOrigin) {
            powerStack.push({ x: nx, y: ny });
          }
        }
      });
    }

    // 3. Update Simulation Data
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
        if (
          cell.zone === TileId.ZoneI ||
          cell.building === TileId.PowerPlantCoal
        ) {
          cell.pollution = Math.min(100, cell.pollution + 5);
        } else {
          cell.pollution = Math.max(0, cell.pollution - 2);
        }

        if (cell.zone === TileId.ZoneR) pop += cell.growthStage * 10;
        if (cell.zone === TileId.ZoneC) com += cell.growthStage * 10;
        if (cell.zone === TileId.ZoneI) ind += cell.growthStage * 10;

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
            this.cityStats.funds -= 100;
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

    const industrialDemand = 40;
    const commercialDemand = Math.floor(pop / 100) + 10;
    const totalJobs = (com + ind) / 10;
    const residents = pop / 10;
    const laborRatioDemand = (totalJobs - residents) * 2;

    this.cityStats.demand.r = Math.max(
      -100,
      Math.min(100, 20 + laborRatioDemand)
    );
    this.cityStats.demand.c = Math.max(
      -100,
      Math.min(100, commercialDemand - com / 10)
    );
    this.cityStats.demand.i = Math.max(
      -100,
      Math.min(100, industrialDemand - ind / 20)
    );

    this.cityStats.month++;
    if (this.cityStats.month > 12) {
      this.cityStats.month = 1;
      this.cityStats.year++;
      const industrialTax = ind * 0.4;
      const commercialTax = com * 0.2;
      const residentialTax = pop * 0.1;
      this.cityStats.funds += Math.floor(
          residentialTax + commercialTax + industrialTax
      );
    }

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
    const pick = (ids: TileId[]) => ids[Math.floor(Math.random() * ids.length)];

    if (zone === TileId.ZoneR) {
      if (stage === 1)
        return pick([TileId.House, TileId.House2, TileId.House3]);
      if (stage === 2) return pick([TileId.Apartment, TileId.Apartment2]);
      if (stage === 3)
        return pick([TileId.ApartmentLarge, TileId.ApartmentLarge2]);
      if (stage === 4) return pick([TileId.SkyscraperR, TileId.SkyscraperR2]);
    } else if (zone === TileId.ZoneC) {
      if (stage === 1) return pick([TileId.ShopSmall, TileId.ShopSmall2]);
      if (stage === 2) return pick([TileId.ShopMedium, TileId.ShopMedium2]);
      if (stage === 3) return pick([TileId.OfficeSmall, TileId.OfficeSmall2]);
      if (stage === 4) return pick([TileId.OfficeLarge, TileId.OfficeLarge2]);
      if (stage === 5) return pick([TileId.SkyscraperC, TileId.SkyscraperC2]);
    } else if (zone === TileId.ZoneI) {
      if (stage === 1) return pick([TileId.FactorySmall, TileId.FactorySmall2]);
      if (stage === 2)
        return pick([TileId.FactoryMedium, TileId.FactoryMedium2]);
      if (stage === 3) return pick([TileId.Wholesale, TileId.Wholesale2]);
      if (stage === 4) return pick([TileId.FactoryLarge, TileId.FactoryLarge2]);
    }
    return undefined;
  }

  simulateCars(dt: number) {
    const maxCars = Math.min(
      50,
      Math.floor(this.cityStats.population / 10) + 2
    );
    if (
      this._time - this._lastCarSpawn > 2000 &&
      this.cars.length < maxCars &&
      this.cityStats.population > 0
    ) {
      this._lastCarSpawn = this._time;
      this.spawnCar();
    }

    for (let i = this.cars.length - 1; i >= 0; i--) {
      const car = this.cars[i];
      car.progress += car.speed * (dt / 1000);

      if (car.progress >= 1) {
        if (car.dir === "n") car.cellY--;
        else if (car.dir === "s") car.cellY++;
        else if (car.dir === "e") car.cellX++;
        else if (car.dir === "w") car.cellX--;

        const next = this.findNextRoad(car.cellX, car.cellY, car.dir);
        if (next) {
          car.dir = next.dir;
          car.progress = 0;
        } else {
          this.cars.splice(i, 1);
        }
      }
    }
  }

  spawnCar() {
    const roads: { x: number; y: number }[] = [];
    for (let y = 0; y < this.gridSize.h; y++) {
      for (let x = 0; x < this.gridSize.w; x++) {
        if (this.grid[idx(x, y, this.gridSize.w)].network === TileId.Road) {
          roads.push({ x, y });
        }
      }
    }
    if (roads.length === 0) return;
    const start = roads[Math.floor(Math.random() * roads.length)];

    const id = Math.random().toString(36).substr(2, 9);
    const dirs: ("n" | "s" | "e" | "w")[] = ["n", "s", "e", "w"];
    const valid: ("n" | "s" | "e" | "w")[] = [];
    for (const d of dirs) {
      let nx = start.x,
        ny = start.y;
      if (d === "n") ny--;
      if (d === "s") ny++;
      if (d === "e") nx++;
      if (d === "w") nx--;
      if (
        nx >= 0 &&
        nx < this.gridSize.w &&
        ny >= 0 &&
        ny < this.gridSize.h &&
        this.grid[idx(nx, ny, this.gridSize.w)].network === TileId.Road
      ) {
        valid.push(d);
      }
    }

    this.cars.push({
      id,
      cellX: start.x,
      cellY: start.y,
      dir:
        valid.length > 0
          ? valid[Math.floor(Math.random() * valid.length)]
          : "e",
      speed: 1.2 + Math.random() * 0.8,
      progress: 0,
      x: start.x * this.tileSize,
      y: start.y * this.tileSize,
      targetX: start.x * this.tileSize,
      targetY: start.y * this.tileSize,
    });
  }

  findNextRoad(
    x: number,
    y: number,
    currentDir: string
  ): { x: number; y: number; dir: "n" | "s" | "e" | "w" } | null {
    const dirs: ("n" | "s" | "e" | "w")[] = ["n", "s", "e", "w"];
    const valid: { x: number; y: number; dir: "n" | "s" | "e" | "w" }[] = [];

    for (const d of dirs) {
      if (d === "n" && currentDir === "s") continue;
      if (d === "s" && currentDir === "n") continue;
      if (d === "e" && currentDir === "w") continue;
      if (d === "w" && currentDir === "e") continue;

      let nx = x,
        ny = y;
      if (d === "n") ny--;
      if (d === "s") ny++;
      if (d === "e") nx++;
      if (d === "w") nx--;

      if (nx >= 0 && nx < this.gridSize.w && ny >= 0 && ny < this.gridSize.h) {
        if (this.grid[idx(nx, ny, this.gridSize.w)].network === TileId.Road) {
          valid.push({ x: nx, y: ny, dir: d });
        }
      }
    }

    if (valid.length === 0) return null;
    return valid[Math.floor(Math.random() * valid.length)];
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
}
