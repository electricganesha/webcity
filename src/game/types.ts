export enum Layer {
  Ground,
  Network,
  Zone,
  Building,
}

export enum TileId {
  None = 0,
  // Terrain
  Grass = 1,
  Water = 2,
  Tree = 3,
  Dirt = 4,

  // Infrastructure (10-29)
  Road = 10,
  RoadH = 11,
  RoadV = 12,
  RoadX = 13,
  Rail = 14,
  RailH = 15,
  RailV = 16,
  RailX = 17,
  PowerLine = 20,
  PowerH = 21,
  PowerV = 22,
  PowerX = 23,
  PowerPlantCoal = 25,
  PowerPlantNuclear = 26,

  // Public Services (30-39)
  Police = 30,
  Fire = 31,
  Park = 32,
  Stadium = 33,
  Seaport = 34,
  Airport = 35,

  // Zones (40-49)
  ZoneR = 40,
  ZoneC = 41,
  ZoneI = 42,

  // R Buildings (50-59)
  House = 50,
  House2 = 54,
  House3 = 55,
  Apartment = 51,
  Apartment2 = 56,
  ApartmentLarge = 52,
  ApartmentLarge2 = 57,
  SkyscraperR = 53,
  SkyscraperR2 = 58,

  // C Buildings (60-69)
  ShopSmall = 60,
  ShopSmall2 = 65,
  ShopMedium = 61,
  ShopMedium2 = 66,
  OfficeSmall = 62,
  OfficeSmall2 = 67,
  OfficeLarge = 63,
  OfficeLarge2 = 68,
  SkyscraperC = 64,
  SkyscraperC2 = 69,

  // I Buildings (70-79)
  FactorySmall = 70,
  FactorySmall2 = 74,
  FactoryMedium = 71,
  FactoryMedium2 = 75,
  Wholesale = 72,
  Wholesale2 = 76,
  FactoryLarge = 73,
  FactoryLarge2 = 77,

  // Animation/Dynamic (80-89)
  Car = 80,
  Car2 = 81,
  Smoke = 85,
}

export type Car = {
  id: string;
  x: number;
  y: number;
  dir: "n" | "s" | "e" | "w";
  speed: number;
  progress: number; // 0 to 1 within a cell
  cellX: number;
  cellY: number;
  targetX: number;
  targetY: number;
};

export type Cell = {
  ground: TileId;
  network?: TileId;
  zone?: TileId;
  building?: TileId;
  hasPowerLine?: boolean;

  // Simulation Data
  pollution: number;
  crime: number;
  landValue: number;
  isPowered: boolean;
  traffic: number;

  // Additional metadata
  growthStage: number; // 0 to max for that zone type
  age: number; // How long it's been in current stage
  parentOrigin?: { x: number; y: number }; // For multi-tile buildings, points to the owner
};

export type GridSize = { w: number; h: number };

export type Tool =
  | "pan"
  | "road"
  | "rail"
  | "power-line"
  | "power-plant-coal"
  | "power-plant-nuclear"
  | "zone-r"
  | "zone-c"
  | "zone-i"
  | "police"
  | "fire"
  | "park"
  | "stadium"
  | "seaport"
  | "airport"
  | "bulldoze";

export const BuildingSizes: Partial<Record<TileId, { w: number; h: number }>> = {
  [TileId.PowerPlantCoal]: { w: 4, h: 4 },
  [TileId.PowerPlantNuclear]: { w: 4, h: 4 },
  [TileId.Stadium]: { w: 4, h: 4 },
  [TileId.Seaport]: { w: 4, h: 2 },
  [TileId.Airport]: { w: 6, h: 4 },
};

export type Stats = {
  funds: number;
  population: number;
  commercial: number;
  industrial: number;
  demand: { r: number; c: number; i: number };
  year: number;
  month: number;
  message: string;
};
