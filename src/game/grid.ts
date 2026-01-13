import { TileId, type Cell, type GridSize } from "./types";

export function makeGrid(size: GridSize): Cell[] {
  const N = size.w * size.h;
  const grid: Cell[] = new Array(N);
  for (let i = 0; i < N; i++) {
    grid[i] = {
      ground: TileId.Grass,
      pollution: 0,
      crime: 0,
      landValue: 0,
      isPowered: false,
      traffic: 0,
      growthStage: 0,
      age: 0,
    };
  }
  return grid;
}

export const idx = (x: number, y: number, w: number) => y * w + x;

export function inBounds(x: number, y: number, size: GridSize) {
  return x >= 0 && y >= 0 && x < size.w && y < size.h;
}

export function forEachNeighbor(
  x: number,
  y: number,
  size: GridSize,
  fn: (nx: number, ny: number) => void
) {
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const [dx, dy] of dirs) {
    const nx = x + dx,
      ny = y + dy;
    if (inBounds(nx, ny, size)) fn(nx, ny);
  }
}

export function generateTerrain(grid: Cell[], size: GridSize) {
  const { w, h } = size;

  // 1. Generate Water Blobs
  for (let i = 0; i < 5; i++) {
    const cx = Math.floor(Math.random() * w);
    const cy = Math.floor(Math.random() * h);
    const radius = 5 + Math.random() * 10;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < radius) {
          grid[idx(x, y, w)].ground = TileId.Water;
        }
      }
    }
  }

  // 2. Generate Tree Clusters
  for (let i = 0; i < 10; i++) {
    const cx = Math.floor(Math.random() * w);
    const cy = Math.floor(Math.random() * h);
    const radius = 3 + Math.random() * 5;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const cell = grid[idx(x, y, w)];
        if (dist < radius && cell.ground === TileId.Grass) {
          cell.ground = TileId.Tree;
        }
      }
    }
  }
}
