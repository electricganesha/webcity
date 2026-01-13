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
  Apartment = 51,
  ApartmentLarge = 52,
  SkyscraperR = 53,

  // C Buildings (60-69)
  ShopSmall = 60,
  ShopMedium = 61,
  OfficeSmall = 62,
  OfficeLarge = 63,
  SkyscraperC = 64,

  // I Buildings (70-79)
  FactorySmall = 70,
  FactoryMedium = 71,
  Wholesale = 72,
  FactoryLarge = 73,
}

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
