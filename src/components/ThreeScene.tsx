import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { World } from "./World";
import { Game } from "../game/game";

type ThreeSceneProps = {
  game: Game;
};

export const ThreeScene: React.FC<ThreeSceneProps> = ({ game }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [50, 50, 50], fov: 45 }}
      style={{ background: "#111" }}
    >
      <Suspense fallback={null}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[100, 100, 50]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        
        <World game={game} />
        
        <OrbitControls 
            makeDefault 
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={10} 
            maxDistance={200}
            mouseButtons={{
                LEFT: undefined, // Liberate left click
                MIDDLE: THREE.MOUSE.PAN,
                RIGHT: THREE.MOUSE.ROTATE
            }}
        />
        
        <Environment preset="city" />
        <ContactShadows 
            position={[0, -0.01, 0]} 
            opacity={0.4} 
            scale={200} 
            blur={2} 
            far={1} 
        />
      </Suspense>
    </Canvas>
  );
};
