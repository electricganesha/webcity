import { useEffect, useRef, useState, type FC } from "react";
import { Game } from "./game/game";
import clsx from "classnames";
import type { Stats, Tool } from "./game/types";
import { startLoop } from "./game/loop";

type ToolButtonProps = {
  readonly label: string;
  readonly value: Tool;
  readonly tool: Tool;
  readonly setTool: (t: Tool) => void;
};
const Tool: FC<ToolButtonProps> = ({ label, value, tool, setTool }) => (
  <button
    className={clsx({ active: tool === value })}
    onClick={() => setTool(value)}
  >
    {label}
  </button>
);

const App: FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [tool, setTool] = useState<Tool>("pan");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let disposed = false;
    let stopLoop: (() => void) | undefined;
    const container = containerRef.current;

    // Captured listeners for cleanup
    let listeners: { name: string; fn: EventListener }[] = [];

    (async () => {
      if (!container) return;
      const g = await Game.init(container);

      if (disposed) {
        g.app.destroy(true, { children: true, texture: true });
        return;
      }
      gameRef.current = g;
      setGame(g);

      // Pointer event wiring
      const canvas = g.app.canvas;
      let pointerDown = false;

      const handlePointerDown = (e: PointerEvent) => {
        if (e.target !== canvas) return;
        pointerDown = true;
        g.pointer.down = true;
        g.onPointer(e);
      };
      const handlePointerMove = (e: PointerEvent) => {
        if (pointerDown || e.target === canvas) {
          g.onPointer(e);
        }
      };
      const handlePointerUp = (e: PointerEvent) => {
        pointerDown = false;
        g.pointer.down = false;
        g.onPointer(e);
      };

      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", handlePointerUp);

      listeners = [
        { name: "pointerdown", fn: handlePointerDown as EventListener },
        { name: "pointermove", fn: handlePointerMove as EventListener },
        { name: "pointerup", fn: handlePointerUp as EventListener },
      ];

      // Start simulation/render loop
      stopLoop = startLoop({
        simulate: (dt) => {
          if (disposed) return;
          g.simulate(dt);
          // Update stats in React every few frames
          if (Math.random() > 0.9) {
            setStats({ ...g.cityStats });
          }
        },
        render: () => {
          if (disposed) return;
          g.render();
        },
      });

      // Override cleanup inside the async block
      // But we already have the main cleanup below
    })();

    return () => {
      disposed = true;
      if (stopLoop) stopLoop();
      const g = gameRef.current;
      if (g) {
        const canvas = g.app.canvas;
        listeners.forEach((l) => canvas.removeEventListener(l.name, l.fn));
        g.app.destroy(true, { children: true, texture: true });
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (game) {
      game.tool = tool;
      console.log("tool changed", tool);
    }
  }, [tool, game]);

  return (
    <div
      className="canvas-wrap"
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#222",
      }}
    >
      <div
        className="pixi-container"
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

      {/* Toolbar overlays the canvas */}
      <div
        className="toolbar"
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          bottom: 16,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          background: "rgba(32,32,32,0.95)",
          borderRadius: 4,
          padding: "8px",
          overflowY: "auto",
          width: "120px",
          border: "2px solid #555",
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: "12px",
            borderBottom: "1px solid #444",
            paddingBottom: "4px",
            marginBottom: "4px",
            textAlign: "center",
          }}
        >
          TOOLS
        </div>
        <Tool label="Pan" value="pan" tool={tool} setTool={setTool} />
        <Tool label="Road ($10)" value="road" tool={tool} setTool={setTool} />
        <Tool label="Rail ($20)" value="rail" tool={tool} setTool={setTool} />
        <Tool
          label="Power Line ($5)"
          value="power-line"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Coal Plant ($3k)"
          value="power-plant-coal"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Nuke Plant ($5k)"
          value="power-plant-nuclear"
          tool={tool}
          setTool={setTool}
        />
        <div style={{ margin: "4px 0", borderBottom: "1px solid #444" }} />
        <Tool
          label="Res Zone ($100)"
          value="zone-r"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Com Zone ($100)"
          value="zone-c"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Ind Zone ($100)"
          value="zone-i"
          tool={tool}
          setTool={setTool}
        />
        <div style={{ margin: "4px 0", borderBottom: "1px solid #444" }} />
        <Tool
          label="Police ($500)"
          value="police"
          tool={tool}
          setTool={setTool}
        />
        <Tool label="Fire ($500)" value="fire" tool={tool} setTool={setTool} />
        <Tool label="Park ($10)" value="park" tool={tool} setTool={setTool} />
        <Tool
          label="Stadium ($3k)"
          value="stadium"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Seaport ($5k)"
          value="seaport"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Airport ($10k)"
          value="airport"
          tool={tool}
          setTool={setTool}
        />
        <div style={{ margin: "4px 0", borderBottom: "1px solid #444" }} />
        <Tool
          label="Bulldoze ($1)"
          value="bulldoze"
          tool={tool}
          setTool={setTool}
        />
      </div>
      {/* HUD overlays the canvas */}
      <div
        className="hud"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          background: "rgba(32,32,32,0.9)",
          borderRadius: 8,
          padding: "12px 16px",
          color: "#fff",
          fontFamily: "'Courier New', monospace",
          border: "2px solid #555",
          minWidth: "200px",
        }}
      >
        <div
          style={{
            fontSize: "1.4em",
            color: "#0f0",
            marginBottom: "8px",
            borderBottom: "1px solid #444",
          }}
        >
          <strong>WebCity</strong>
        </div>
        {stats && (
          <div
            style={{
              padding: "4px 8px",
              background: "#111",
              border: "1px solid #444",
              marginBottom: "12px",
              fontSize: "0.9em",
              color: "#0ff",
              minHeight: "1.5em",
            }}
          >
            {stats.message}
          </div>
        )}
        {stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>FUNDS:</span>
              <span style={{ color: stats.funds < 0 ? "#f00" : "#fff" }}>
                ${stats.funds.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>POP:</span>
              <span>{stats.population.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>DATE:</span>
              <span>
                {new Date(stats.year, stats.month - 1).toLocaleString(
                  "default",
                  { month: "short" }
                )}{" "}
                {stats.year}
              </span>
            </div>

            <div
              style={{ marginTop: "12px", fontSize: "0.8em", color: "#aaa" }}
            >
              DEMAND
            </div>
            <div
              style={{
                height: "40px",
                display: "flex",
                alignItems: "flex-end",
                gap: "4px",
                padding: "4px 0",
              }}
            >
              {/* RCI Graph */}
              <div
                style={{
                  flex: 1,
                  background: "#0f0",
                  height: `${Math.max(2, (stats.demand.r + 100) / 2)}%`,
                  minHeight: "2px",
                }}
                title="Residential"
              ></div>
              <div
                style={{
                  flex: 1,
                  background: "#00f",
                  height: `${Math.max(2, (stats.demand.c + 100) / 2)}%`,
                  minHeight: "2px",
                }}
                title="Commercial"
              ></div>
              <div
                style={{
                  flex: 1,
                  background: "#ff0",
                  height: `${Math.max(2, (stats.demand.i + 100) / 2)}%`,
                  minHeight: "2px",
                }}
                title="Industrial"
              ></div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7em",
              }}
            >
              <span style={{ color: "#0f0" }}>R</span>
              <span style={{ color: "#00f" }}>C</span>
              <span style={{ color: "#ff0" }}>I</span>
            </div>
          </div>
        ) : (
          <div>Loading Simulation...</div>
        )}
      </div>
    </div>
  );
};

export default App;
