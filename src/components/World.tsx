import React, { useEffect, useState, useRef } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Game } from "../game/game";
import { Cars } from "./Cars";
import { idx } from "../game/grid";
import { TileId, BuildingSizes } from "../game/types";
import { startLoop } from "../game/loop";

type WorldProps = {
  game: Game;
};

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export const World: React.FC<WorldProps> = ({ game }) => {
  const { gridSize, grid } = game;
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const waterRef = useRef<THREE.InstancedMesh>(null);
  const roadRef = useRef<THREE.InstancedMesh>(null);
  const buildRef = useRef<THREE.InstancedMesh>(null);
  const zoneRef = useRef<THREE.InstancedMesh>(null);
  const pLineRef = useRef<THREE.InstancedMesh>(null);

  const [tick, setTick] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number } | null>(null);
  const isMouseDown = useRef(false);
  const lastActionCell = useRef<string | null>(null);

  const maxInstances = gridSize.w * gridSize.h;

  useEffect(() => {
    const stopLoop = startLoop({
      simulate: (dt) => {
        game.simulate(dt);
        setTick(t => t + 1);
      },
      render: () => {},
    });
    return () => stopLoop();
  }, [game]);

  useEffect(() => {
    let iGrass = 0, iWater = 0, iRoad = 0, iBuild = 0, iZone = 0, iPLine = 0;

    for (let y = 0; y < gridSize.h; y++) {
      for (let x = 0; x < gridSize.w; x++) {
        const cell = grid[idx(x, y, gridSize.w)];
        
        // 1. Ground
        tempObject.scale.set(1, 1, 1);
        tempObject.rotation.set(-Math.PI / 2, 0, 0);
        tempObject.position.set(x, 0, y);
        tempObject.updateMatrix();

        if (cell.ground === TileId.Water) {
          if (waterRef.current) waterRef.current.setMatrixAt(iWater++, tempObject.matrix);
        } else {
          if (grassRef.current) {
            grassRef.current.setMatrixAt(iGrass, tempObject.matrix);
            const color = cell.ground === TileId.Tree ? "#15803d" : "#3f6212";
            grassRef.current.setColorAt(iGrass++, tempColor.set(color));
          }
        }

        // 2. Power Lines
        if (cell.hasPowerLine) {
            tempObject.position.set(x, 0.2, y);
            tempObject.scale.set(0.1, 0.1, 0.5); // Simple wire representation
            tempObject.rotation.set(0, 0, 0);
            tempObject.updateMatrix();
            if (pLineRef.current) pLineRef.current.setMatrixAt(iPLine++, tempObject.matrix);
        }

        // 3. Infrastructure/Buildings
        if (cell.building) {
          const size = BuildingSizes[cell.building] || { w: 1, h: 1 };
          const height = cell.growthStage * 0.5 + 0.1 + (size.w > 1 ? 1 : 0);
          
          // Center the building over its footprint
          const cx = x + (size.w - 1) / 2;
          const cy = y + (size.h - 1) / 2;
          
          tempObject.position.set(cx, height / 2, cy);
          tempObject.rotation.set(0, 0, 0);
          tempObject.scale.set(size.w * 0.9, height, size.h * 0.9);
          tempObject.updateMatrix();

          if (buildRef.current) {
            buildRef.current.setMatrixAt(iBuild, tempObject.matrix);
            let bColor = "#555";
            if (cell.zone === TileId.ZoneR) bColor = "#16a34a";
            else if (cell.zone === TileId.ZoneC) bColor = "#2563eb";
            else if (cell.zone === TileId.ZoneI) bColor = "#ca8a04";
            else if (cell.building === TileId.PowerPlantCoal) bColor = "#171717";
            else if (cell.building === TileId.PowerPlantNuclear) bColor = "#e2e8f0";
            
            buildRef.current.setColorAt(iBuild++, tempColor.set(bColor));
          }
        } else if (cell.zone && !cell.parentOrigin) {
          tempObject.position.set(x, 0.02, y);
          tempObject.rotation.set(-Math.PI / 2, 0, 0);
          tempObject.scale.set(1, 1, 1);
          tempObject.updateMatrix();
          if (zoneRef.current) {
            zoneRef.current.setMatrixAt(iZone, tempObject.matrix);
            let zColor = "#333";
            if (cell.zone === TileId.ZoneR) zColor = "#14532d";
            else if (cell.zone === TileId.ZoneC) zColor = "#1e3a8a";
            else if (cell.zone === TileId.ZoneI) zColor = "#713f12";
            zoneRef.current.setColorAt(iZone++, tempColor.set(zColor));
          }
        }

        if (cell.network === TileId.Road) {
           tempObject.position.set(x, 0.01, y);
           tempObject.rotation.set(-Math.PI / 2, 0, 0);
           tempObject.scale.set(1, 1, 1);
           tempObject.updateMatrix();
           if (roadRef.current) roadRef.current.setMatrixAt(iRoad++, tempObject.matrix);
        }
      }
    }

    if (grassRef.current) {
        grassRef.current.count = iGrass;
        grassRef.current.instanceMatrix.needsUpdate = true;
        if (grassRef.current.instanceColor) grassRef.current.instanceColor.needsUpdate = true;
    }
    if (waterRef.current) {
        waterRef.current.count = iWater;
        waterRef.current.instanceMatrix.needsUpdate = true;
    }
    if (roadRef.current) {
        roadRef.current.count = iRoad;
        roadRef.current.instanceMatrix.needsUpdate = true;
    }
    if (buildRef.current) {
        buildRef.current.count = iBuild;
        buildRef.current.instanceMatrix.needsUpdate = true;
        if (buildRef.current.instanceColor) buildRef.current.instanceColor.needsUpdate = true;
    }
    if (zoneRef.current) {
        zoneRef.current.count = iZone;
        zoneRef.current.instanceMatrix.needsUpdate = true;
        if (zoneRef.current.instanceColor) zoneRef.current.instanceColor.needsUpdate = true;
    }
    if (pLineRef.current) {
        pLineRef.current.count = iPLine;
        pLineRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [grid, gridSize, tick]);

  const getCellFromEvent = (e: ThreeEvent<PointerEvent>) => {
    const x = Math.round(e.point.x + gridSize.w / 2);
    const y = Math.round(e.point.z + gridSize.h / 2);
    if (x >= 0 && x < gridSize.w && y >= 0 && y < gridSize.h) {
        return { x, y };
    }
    return null;
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    isMouseDown.current = true;
    const cell = getCellFromEvent(e);
    if (cell) {
        game.handleToolAction(cell.x, cell.y);
        lastActionCell.current = `${cell.x},${cell.y}`;
        setTick(t => t + 1);
    }
  };

  const handlePointerUp = () => {
    isMouseDown.current = false;
    lastActionCell.current = null;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    const cell = getCellFromEvent(e);
    setHoveredCell(cell);

    if (isMouseDown.current && cell) {
        const key = `${cell.x},${cell.y}`;
        if (lastActionCell.current !== key) {
            game.handleToolAction(cell.x, cell.y);
            lastActionCell.current = key;
            setTick(t => t + 1);
        }
    }
  };

  // Determine cursor size based on tool
  const getCursorSize = () => {
    if (game.tool === "power-plant-coal" || game.tool === "power-plant-nuclear") return { w: 4, h: 4 };
    if (game.tool === "stadium") return { w: 4, h: 4 };
    if (game.tool === "seaport") return { w: 4, h: 2 };
    if (game.tool === "airport") return { w: 6, h: 4 };
    return { w: 1, h: 1 };
  };

  const cursorSize = getCursorSize();

  return (
    <group 
        position={[-gridSize.w / 2, 0, -gridSize.h / 2]} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOut={() => setHoveredCell(null)}
    >
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[gridSize.w / 2 - 0.5, -0.01, gridSize.h / 2 - 0.5]} 
      >
        <planeGeometry args={[gridSize.w, gridSize.h]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {hoveredCell && (
        <mesh 
            position={[hoveredCell.x + (cursorSize.w - 1) / 2, 0.05, hoveredCell.y + (cursorSize.h - 1) / 2]} 
            rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[cursorSize.w, cursorSize.h]} />
          <meshStandardMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.4} 
            emissive="#ffffff"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* Grass/Ground */}
      <instancedMesh ref={grassRef} args={[undefined, undefined, maxInstances]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial />
      </instancedMesh>

      {/* Water */}
      <instancedMesh ref={waterRef} args={[undefined, undefined, maxInstances]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#1e40af" />
      </instancedMesh>

      {/* Roads */}
      <instancedMesh ref={roadRef} args={[undefined, undefined, maxInstances]} receiveShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color="#1f2937" />
      </instancedMesh>

      {/* Zones */}
      <instancedMesh ref={zoneRef} args={[undefined, undefined, maxInstances]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshStandardMaterial transparent opacity={0.3} />
      </instancedMesh>

      {/* Power Lines */}
      <instancedMesh ref={pLineRef} args={[undefined, undefined, maxInstances]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
      </instancedMesh>

      {/* Buildings */}
      <instancedMesh ref={buildRef} args={[undefined, undefined, maxInstances]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </instancedMesh>

      <Cars game={game} />
    </group>
  );
};
