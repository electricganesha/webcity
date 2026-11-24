import { TileId, type Cell } from "../game/types";
import { useMemo } from "react";

type TileProps = {
  cell: Cell;
  x: number;
  y: number;
  onPointerDown: (x: number, y: number) => void;
};

export const Tile: React.FC<TileProps> = ({ cell, x, y, onPointerDown }) => {
  const { ground, network, zone, building, growthStage, isPowered } = cell;

  const color = useMemo(() => {
    switch (ground) {
      case TileId.Water:
        return "#1e40af";
      case TileId.Tree:
        return "#15803d";
      case TileId.Grass:
      default:
        return "#3f6212";
    }
  }, [ground]);

  // Determine building geometry
  const buildingHeight = growthStage * 0.5 + 0.1;
  const buildingColor = useMemo(() => {
    if (building) {
      if (zone === TileId.ZoneR) return "#16a34a";
      if (zone === TileId.ZoneC) return "#2563eb";
      if (zone === TileId.ZoneI) return "#ca8a04";
    }
    if (zone === TileId.ZoneR) return "#14532d";
    if (zone === TileId.ZoneC) return "#1e3a8a";
    if (zone === TileId.ZoneI) return "#713f12";
    return "#333";
  }, [building, zone]);

  return (
    <group position={[x, 0, y]}>
      {/* Ground Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(x, y);
        }}
      >
        <planeGeometry args={[0.95, 0.95]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Network (Road/Rail) */}
      {network === TileId.Road && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      )}

      {/* Buildings */}
      {building && (
        <mesh position={[0, buildingHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, buildingHeight, 0.7]} />
          <meshStandardMaterial
            color={buildingColor}
            emissive={buildingColor}
            emissiveIntensity={isPowered ? 0.2 : 0}
          />
        </mesh>
      )}

      {/* Zoning Indicator */}
      {zone && !building && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 0.8]} />
          <meshStandardMaterial
            color={buildingColor}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};
