import React, { useMemo } from "react";
import { Game } from "../game/game";
import { type Car as CarType } from "../game/types";

type CarProps = {
  car: CarType;
};

const Car: React.FC<CarProps> = ({ car }) => {
  const position = useMemo(() => {
    let px = car.cellX;
    let py = car.cellY;

    if (car.dir === "n") py -= car.progress;
    else if (car.dir === "s") py += car.progress;
    else if (car.dir === "e") px += car.progress;
    else if (car.dir === "w") px -= car.progress;

    return [px, 0.1, py] as [number, number, number];
  }, [car.cellX, car.cellY, car.dir, car.progress]);

  const rotation = useMemo(() => {
    if (car.dir === "n") return [0, 0, 0];
    if (car.dir === "s") return [0, Math.PI, 0];
    if (car.dir === "e") return [0, -Math.PI / 2, 0];
    if (car.dir === "w") return [0, Math.PI / 2, 0];
    return [0, 0, 0];
  }, [car.dir]);

  return (
    <mesh position={position} rotation={rotation as [number, number, number]}>
      <boxGeometry args={[0.2, 0.15, 0.4]} />
      <meshStandardMaterial color={car.id.charCodeAt(0) % 2 === 0 ? "#ef4444" : "#3b82f6"} />
    </mesh>
  );
};

type CarsProps = {
  game: Game;
};

export const Cars: React.FC<CarsProps> = ({ game }) => {
  return (
    <group>
      {game.cars.map((car) => (
        <Car key={car.id} car={car} />
      ))}
    </group>
  );
};
