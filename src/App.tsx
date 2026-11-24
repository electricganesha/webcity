import { useEffect, useState, type FC } from "react";
import { Game } from "./game/game";
import clsx from "classnames";
import type { Stats, Tool } from "./game/types";
import { ThreeScene } from "./components/ThreeScene";

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
    style={{
        padding: "8px",
        background: tool === value ? "#444" : "#222",
        color: "#fff",
        border: "1px solid #555",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "12px"
    }}
  >
    {label}
  </button>
);

const App: FC = () => {
  const [game, setGame] = useState<Game | null>(null);
  const [tool, setTool] = useState<Tool>("pan");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const g = await Game.init();
      setGame(g);
      
      // Update stats in React every second
      const interval = setInterval(() => {
        setStats({ ...g.cityStats });
      }, 500);

      return () => {
        clearInterval(interval);
      };
    })();
  }, []);

  useEffect(() => {
    if (game) {
      game.tool = tool;
    }
  }, [tool, game]);

  return (
    <div
      className="canvas-wrap"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      {game ? (
        <ThreeScene game={game} />
      ) : (
        <div style={{ color: "#fff", padding: "20px" }}>Initializing 3D Engine...</div>
      )}

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
          background: "rgba(32,32,32,0.8)",
          backdropFilter: "blur(8px)",
          borderRadius: 8,
          padding: "12px",
          overflowY: "auto",
          width: "140px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
        }}
      >
        <div
          style={{
            color: "#aaa",
            fontSize: "10px",
            fontWeight: "bold",
            letterSpacing: "1px",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          CITY TOOLS
        </div>
        <Tool label="Orbit View" value="pan" tool={tool} setTool={setTool} />
        <div style={{ margin: "4px 0", borderBottom: "1px solid #444" }} />
        <Tool label="Road ($10)" value="road" tool={tool} setTool={setTool} />
        <Tool label="Rail ($20)" value="rail" tool={tool} setTool={setTool} />
        <Tool
          label="Power Line ($5)"
          value="power-line"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Coal Plant"
          value="power-plant-coal"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Nuclear Plant"
          value="power-plant-nuclear"
          tool={tool}
          setTool={setTool}
        />
        <div style={{ margin: "4px 0", borderBottom: "1px solid #444" }} />
        <Tool
          label="Res Zone"
          value="zone-r"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Com Zone"
          value="zone-c"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Ind Zone"
          value="zone-i"
          tool={tool}
          setTool={setTool}
        />
        <div style={{ margin: "4px 0", borderBottom: "1px solid #444" }} />
        <Tool
          label="Police Dept"
          value="police"
          tool={tool}
          setTool={setTool}
        />
        <Tool label="Fire Dept" value="fire" tool={tool} setTool={setTool} />
        <Tool label="Park" value="park" tool={tool} setTool={setTool} />
        <Tool
          label="Stadium"
          value="stadium"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Seaport"
          value="seaport"
          tool={tool}
          setTool={setTool}
        />
        <Tool
          label="Airport"
          value="airport"
          tool={tool}
          setTool={setTool}
        />
        <div style={{ margin: "4px 0", borderBottom: "1px solid #444" }} />
        <Tool
          label="Bulldozer"
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
          background: "rgba(20,20,20,0.8)",
          backdropFilter: "blur(12px)",
          borderRadius: 12,
          padding: "16px",
          color: "#fff",
          fontFamily: "'Inter', sans-serif",
          border: "1px solid rgba(255,255,255,0.1)",
          minWidth: "220px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}
      >
        <div
          style={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: "#4ade80",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#4ade80", borderRadius: "50%" }}></span>
          WebCity 3D
        </div>
        
        {stats && (
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: 6,
              marginBottom: "16px",
              fontSize: "0.85rem",
              color: "#67e8f9",
              borderLeft: "3px solid #0891b2"
            }}
          >
            {stats.message}
          </div>
        )}

        {stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "0.7rem", color: "#888" }}>FUNDS</span>
              <span style={{ color: stats.funds < 0 ? "#f87171" : "#fff", fontWeight: "600", fontSize: "1.1rem" }}>
                ${stats.funds.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "0.7rem", color: "#888" }}>POPULATION</span>
              <span style={{ fontWeight: "500" }}>{stats.population.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "0.7rem", color: "#888" }}>FISCAL DATE</span>
              <span style={{ fontWeight: "500", color: "#fbbf24" }}>
                {new Date(stats.year, stats.month - 1).toLocaleString(
                  "default",
                  { month: "short" }
                ).toUpperCase()}{" "}
                {stats.year}
              </span>
            </div>

            <div
              style={{ marginTop: "16px", fontSize: "0.7rem", color: "#888", fontWeight: "bold" }}
            >
              RCI DEMAND
            </div>
            <div
              style={{
                height: "40px",
                display: "flex",
                alignItems: "flex-end",
                gap: "6px",
                padding: "4px 0",
              }}
            >
              {/* RCI Graph */}
              <div
                style={{
                  flex: 1,
                  background: "#22c55e",
                  height: `${Math.max(4, (stats.demand.r + 100) / 2)}%`,
                  borderRadius: "2px 2px 0 0",
                  transition: "height 0.3s ease"
                }}
                title="Residential"
              ></div>
              <div
                style={{
                  flex: 1,
                  background: "#3b82f6",
                  height: `${Math.max(4, (stats.demand.c + 100) / 2)}%`,
                  borderRadius: "2px 2px 0 0",
                  transition: "height 0.3s ease"
                }}
                title="Commercial"
              ></div>
              <div
                style={{
                  flex: 1,
                  background: "#eab308",
                  height: `${Math.max(4, (stats.demand.i + 100) / 2)}%`,
                  borderRadius: "2px 2px 0 0",
                  transition: "height 0.3s ease"
                }}
                title="Industrial"
              ></div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.6rem",
                color: "#666"
              }}
            >
              <span>RES</span>
              <span>COM</span>
              <span>IND</span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: "0.8rem", color: "#666" }}>Crunching city data...</div>
        )}
      </div>

      <div style={{ 
          position: "absolute", 
          bottom: 16, 
          right: 16, 
          color: "rgba(255,255,255,0.3)", 
          fontSize: "10px",
          pointerEvents: "none"
      }}>
        Left Click: Build | Right Click/Alt: Rotate | Scroll: Zoom
      </div>
    </div>
  );
};

export default App;
