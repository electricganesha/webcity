import { Graphics, RenderTexture, Texture } from "pixi.js";
import type { Renderer } from "pixi.js";
import { TileId } from "./types";
function drawNoise(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  count: number
) {
  for (let i = 0; i < count; i++) {
    const px = Math.floor(Math.random() * w);
    const py = Math.floor(Math.random() * h);
    g.rect(x + px, y + py, 1, 1).fill({ color, alpha: 0.5 });
  }
}

export function makeTileTexture(
  id: TileId,
  renderer: Renderer,
  size = 16
): Texture {
  const g = new Graphics();
  const s = size;

  if (id === TileId.Grass) {
    g.rect(0, 0, s, s).fill({ color: 0x2e5c3a });
    drawNoise(g, 0, 0, s, s, 0x1a3320, s * 2);
    drawNoise(g, 0, 0, s, s, 0x3a7349, s);
  } else if (id === TileId.Water) {
    g.rect(0, 0, s, s).fill({ color: 0x184d6e });
    // Dithering/Waves
    for (let i = 0; i < 4; i++) {
      const wy = Math.floor(Math.random() * s);
      const wx = Math.floor(Math.random() * (s - 4));
      g.rect(wx, wy, 3, 1).fill({ color: 0x3a7fb0, alpha: 0.6 });
    }
  } else if (id === TileId.Dirt) {
    g.rect(0, 0, s, s).fill({ color: 0x4a3b22 });
    drawNoise(g, 0, 0, s, s, 0x3d2b1f, s * 3);
  } else if (id === TileId.Tree) {
    // Grass base
    g.rect(0, 0, s, s).fill({ color: 0x2e5c3a });
    drawNoise(g, 0, 0, s, s, 0x1a3320, s);
    // Leafy top
    g.circle(s / 2, s / 2 - 1, s / 3).fill({ color: 0x1a5c28 });
    g.circle(s / 2 - 2, s / 2 - 2, s / 5).fill({ color: 0x258c35 }); // Highlight
    // Trunk
    g.rect(s / 2 - 1, s / 2 + 1, 2, 4).fill({ color: 0x3d2b1f });
  } else if (id === TileId.Road || id === TileId.RoadH) {
    g.rect(0, 0, s, s).fill({ color: 0x3a3a3a });
    g.rect(0, s / 2 - 1, s, 2).fill({ color: 0x5a5a5a }); // Center line
    drawNoise(g, 0, 0, s, s, 0x2a2a2a, s);
  } else if (id === TileId.RoadV) {
    g.rect(0, 0, s, s).fill({ color: 0x3a3a3a });
    g.rect(s / 2 - 1, 0, 2, s).fill({ color: 0x5a5a5a });
    drawNoise(g, 0, 0, s, s, 0x2a2a2a, s);
  } else if (id === TileId.RoadX) {
    g.rect(0, 0, s, s).fill({ color: 0x3a3a3a });
    g.rect(0, s / 2 - 1, s, 2).fill({ color: 0x5a5a5a });
    g.rect(s / 2 - 1, 0, 2, s).fill({ color: 0x5a5a5a });
    drawNoise(g, 0, 0, s, s, 0x2a2a2a, s);
  } else if (id === TileId.Rail || id === TileId.RailV) {
    g.rect(0, 0, s, s).fill({ color: 0x4a3b22 });
    for (let y = 1; y < s; y += 4)
      g.rect(1, y, s - 2, 2).fill({ color: 0x2d1f14 }); // Sleepers
    g.rect(4, 0, 1, s).fill({ color: 0x8c8c8c }); // Left rail
    g.rect(s - 5, 0, 1, s).fill({ color: 0x8c8c8c }); // Right rail
  } else if (id === TileId.RailH) {
    g.rect(0, 0, s, s).fill({ color: 0x4a3b22 });
    for (let x = 1; x < s; x += 4)
      g.rect(x, 1, 2, s - 2).fill({ color: 0x2d1f14 });
    g.rect(0, 4, s, 1).fill({ color: 0x8c8c8c });
    g.rect(0, s - 5, s, 1).fill({ color: 0x8c8c8c });
  } else if (id === TileId.RailX) {
    g.rect(0, 0, s, s).fill({ color: 0x4a3b22 });
    for (let i = 1; i < s; i += 4) {
      g.rect(1, i, s - 2, 1).fill({ color: 0x2d1f14 });
      g.rect(i, 1, 1, s - 2).fill({ color: 0x2d1f14 });
    }
    g.rect(4, 0, 1, s).fill({ color: 0x8c8c8c });
    g.rect(s - 5, 0, 1, s).fill({ color: 0x8c8c8c });
    g.rect(0, 4, s, 1).fill({ color: 0x8c8c8c });
    g.rect(0, s - 5, s, 1).fill({ color: 0x8c8c8c });
  } else if (id === TileId.PowerLine || id === TileId.PowerV) {
    g.moveTo(s / 2, 0)
      .lineTo(s / 2, s)
      .stroke({ width: 0.5, color: 0x222222 });
    g.rect(s / 2 - 3, s / 2 - 3, 6, 6).fill({ color: 0x4a4a4a }); // Tower base
    g.rect(s / 2 - 1, s / 2 - 1, 2, 2).fill({ color: 0x888888 }); // Insulator
  } else if (id === TileId.PowerH) {
    g.moveTo(0, s / 2)
      .lineTo(s, s / 2)
      .stroke({ width: 0.5, color: 0x222222 });
    g.rect(s / 2 - 3, s / 2 - 3, 6, 6).fill({ color: 0x4a4a4a });
    g.rect(s / 2 - 1, s / 2 - 1, 2, 2).fill({ color: 0x888888 });
  } else if (id === TileId.PowerX) {
    g.moveTo(s / 2, 0)
      .lineTo(s / 2, s)
      .stroke({ width: 0.5, color: 0x222222 });
    g.moveTo(0, s / 2)
      .lineTo(s, s / 2)
      .stroke({ width: 0.5, color: 0x222222 });
    g.rect(s / 2 - 3, s / 2 - 3, 6, 6).fill({ color: 0x4a4a4a });
    g.rect(s / 2 - 1, s / 2 - 1, 2, 2).fill({ color: 0x888888 });
  } else if (id === TileId.PowerPlantCoal) {
    g.rect(2, 4, s - 4, s - 6).fill({ color: 0x4a4a4a }); // Factory body
    g.rect(4, 2, 3, 4).fill({ color: 0x2a2a2a }); // Stack 1
    g.rect(10, 2, 3, 4).fill({ color: 0x2a2a2a }); // Stack 2
    g.rect(4, 1, 2, 1).fill({ color: 0x888888 }); // Smoke
  } else if (id === TileId.PowerPlantNuclear) {
    g.rect(2, 4, s - 4, s - 6).fill({ color: 0xcccccc });
    g.rect(s / 2 - 3, 1, 6, 4).fill({ color: 0xeaeaea }); // Dome
    g.rect(s / 2 - 2, 2, 1, 1).fill({ color: 0x00ff00 }); // Glow
  } else if (id === TileId.ZoneR) {
    g.rect(0, 0, s, s).fill({ color: 0x00ff00, alpha: 0.15 });
    g.rect(1, 1, s - 2, s - 2).stroke({
      width: 1,
      color: 0x00ff00,
      alpha: 0.4,
    });
  } else if (id === TileId.ZoneC) {
    g.rect(0, 0, s, s).fill({ color: 0x0000ff, alpha: 0.15 });
    g.rect(1, 1, s - 2, s - 2).stroke({
      width: 1,
      color: 0x0000ff,
      alpha: 0.4,
    });
  } else if (id === TileId.ZoneI) {
    g.rect(0, 0, s, s).fill({ color: 0xffff00, alpha: 0.15 });
    g.rect(1, 1, s - 2, s - 2).stroke({
      width: 1,
      color: 0xffff00,
      alpha: 0.4,
    });
  } else if (id === TileId.House) {
    // 3/4 perspective
    g.rect(3, 6, s - 8, s - 10).fill({ color: 0xeaeaea }); // Front
    g.rect(s - 5, 7, 2, s - 11).fill({ color: 0xaaaaaa }); // Side
    g.poly([2, 6, s / 2, 2, s - 4, 6, s - 2, 7, s / 2 + 2, 3, 4, 7]).fill({
      color: 0x8a3324,
    }); // Roof
  } else if (id === TileId.Apartment || id === TileId.ApartmentLarge) {
    g.rect(2, 4, s - 6, s - 6).fill({ color: 0xd2b48c }); // Front
    g.rect(s - 4, 6, 2, s - 8).fill({ color: 0x8b7355 }); // Side
    g.rect(2, 3, s - 6, 1).fill({ color: 0xcd853f }); // Roof
    // Windows
    for (let y = 6; y < s - 3; y += 3) {
      g.rect(4, y, 2, 1).fill({ color: 0xadd8e6 });
      g.rect(8, y, 2, 1).fill({ color: 0xadd8e6 });
    }
  } else if (id === TileId.SkyscraperR || id === TileId.SkyscraperC) {
    const baseColor = id === TileId.SkyscraperR ? 0x4682b4 : 0x2f4f4f;
    g.rect(2, 1, s - 6, s - 2).fill({ color: baseColor }); // Front
    g.rect(s - 4, 3, 2, s - 4).fill({ color: 0x1c1c1c, alpha: 0.5 }); // Side depth
    // Windows
    for (let y = 3; y < s - 2; y += 2) {
      for (let x = 4; x < s - 5; x += 3) {
        g.rect(x, y, 1, 1).fill({ color: 0xfdfd96 });
      }
    }
  } else if (id === TileId.ShopSmall || id === TileId.ShopMedium) {
    g.rect(2, 6, s - 4, s - 8).fill({ color: 0xf5f5dc });
    g.rect(2, 5, s - 4, 2).fill({ color: 0x8b0000 }); // Awning
    g.rect(4, 9, 3, 4).fill({ color: 0xadd8e6 }); // Window/Door
  } else if (id === TileId.OfficeSmall || id === TileId.OfficeLarge) {
    g.rect(2, 3, s - 4, s - 4).fill({ color: 0x708090 });
    for (let y = 5; y < s - 2; y += 3) {
      g.rect(4, y, s - 8, 1).fill({ color: 0x1c1c1c, alpha: 0.3 }); // Window bands
    }
  } else if (
    id === TileId.FactorySmall ||
    id === TileId.FactoryMedium ||
    id === TileId.FactoryLarge
  ) {
    g.rect(2, 6, s - 6, s - 8).fill({ color: 0x696969 }); // Main
    g.rect(s - 4, 8, 2, s - 10).fill({ color: 0x333333 }); // Side
    // Sawtooth roof
    for (let x = 2; x < s - 6; x += 4) {
      g.poly([x, 6, x + 4, 6, x + 2, 3]).fill({ color: 0x555555 });
    }
    g.rect(4, 2, 2, 6).fill({ color: 0x2a2a2a }); // Smokestack
  } else if (id === TileId.Wholesale) {
    g.rect(1, 5, s - 2, s - 6).fill({ color: 0xbc8f8f });
    g.rect(4, 10, 4, 3).fill({ color: 0x4a4a4a }); // Loading dock
  } else if (id === TileId.Stadium) {
    g.ellipse(s / 2, s / 2 + 1, s / 2 - 2, s / 3).fill({ color: 0x2e8b57 }); // Field
    g.ellipse(s / 2, s / 2, s / 2 - 1, s / 3 + 1).stroke({
      width: 2,
      color: 0xdcdcdc,
    }); // Stands
    // Lights
    g.rect(2, 2, 1, 2).fill({ color: 0x4a4a4a });
    g.rect(s - 3, 2, 1, 2).fill({ color: 0x4a4a4a });
  } else if (id === TileId.Police) {
    g.rect(2, 4, s - 4, s - 6).fill({ color: 0x000080 }); // Dark blue
    g.rect(3, 5, s - 6, s - 8).stroke({
      width: 0.5,
      color: 0xffffff,
      alpha: 0.3,
    });
    // "PD" Label
    g.rect(4, 7, 3, 3).fill({ color: 0xffffff });
    g.rect(5, 8, 1, 1).fill({ color: 0x000080 }); // Roughly 'P'
    g.rect(9, 7, 3, 3).fill({ color: 0xffffff }); // Roughly 'D'
  } else if (id === TileId.Fire) {
    g.rect(2, 4, s - 4, s - 6).fill({ color: 0x800000 }); // Dark red
    g.rect(4, 8, 3, 5).fill({ color: 0x1c1c1c }); // Main door
    g.rect(9, 8, 3, 5).fill({ color: 0x1c1c1c }); // Second door
  } else if (id === TileId.Park) {
    g.rect(0, 0, s, s).fill({ color: 0x228b22 });
    drawNoise(g, 0, 0, s, s, 0x006400, s);
    g.circle(s / 2, s / 2, s / 4).fill({ color: 0x4682b4 }); // Fountain/Pond
    g.circle(4, 4, 1.5).fill({ color: 0xff69b4 }); // Flowers
    g.circle(12, 12, 1.5).fill({ color: 0xffd700 });
  } else if (id === TileId.Seaport) {
    g.rect(0, 2, s, 6).fill({ color: 0x8b4513 }); // Wood pier
    for (let x = 2; x < s; x += 4) g.rect(x, 2, 1, 6).fill({ color: 0x5c2e0a }); // Planks
    g.rect(4, 0, 4, 4).fill({ color: 0x4a4a4a }); // Warehouse
  } else if (id === TileId.Airport) {
    g.rect(0, 0, s, s).fill({ color: 0x5a5a5a });
    g.rect(2, s / 2 - 1, s - 4, 2).fill({ color: 0xffffff }); // Runway marks
    g.rect(s - 8, 2, 4, 4).fill({ color: 0x333333 }); // Control tower
    g.rect(s - 7, 1, 2, 1).fill({ color: 0xadd8e6 }); // Tower windows
  } else {
    // Default fallback
    g.rect(0, 0, s, s).fill({ color: 0xff00ff });
  }

  const rt = RenderTexture.create({ width: s, height: s });
  try {
    renderer.render({ container: g, target: rt });
  } catch (e) {
    console.warn("Tile texture render failed", id, e);
  }
  g.destroy();
  return rt;
}

export function makeNoPowerTexture(renderer: Renderer, size = 16): Texture {
  const g = new Graphics();
  const s = size;
  // Red box background with border
  g.rect(1, 1, s - 2, s - 2).fill({ color: 0xff0000 });
  g.rect(1, 1, s - 2, s - 2).stroke({ width: 1, color: 0x000000 });

  // Yellow lightning bolt (simplified classic shape)
  g.poly([
    s * 0.6,
    s * 0.2,
    s * 0.3,
    s * 0.5,
    s * 0.5,
    s * 0.5,
    s * 0.4,
    s * 0.8,
    s * 0.7,
    s * 0.4,
    s * 0.5,
    s * 0.4,
  ]).fill({ color: 0xffff00 });

  const rt = RenderTexture.create({ width: s, height: s });
  renderer.render({ container: g, target: rt });
  g.destroy();
  return rt;
}
