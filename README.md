# WebCity: Classic SimCity Clone

A browser-based city simulation inspired by the original 1989 SimCity. Built with **React**, **TypeScript**, and **PixiJS**, featuring procedural sprite generation and a tile-based simulation engine.

## 🏙 Features

- **Classic Aesthetics**: Hand-crafted procedural textures and 3/4 perspective buildings that capture the nostalgia of the original game.
- **Dynamic Simulation Engine**:
  - **Power Propagation**: Uses a BFS algorithm to simulate power flow from plants through the grid.
  - **RCI Demand**: Simulation of residential, commercial, and industrial demand.
  - **Growth & Abandonment**: Zones develop based on power, road access, and city-wide demand.
- **Infrastructure**: Place roads, rails, and power lines with auto-tiling logic.
- **City Services**: Police and fire departments to maintain safety.
- **Interactive Viewport**: Smooth zooming and panning using PixiJS.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd simcity
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## 🎮 How to Play

### Controls

- **Left Click**: Place current tool / Select.
- **Right Click / Drag**: Pan the camera.
- **Scroll**: Zoom in and out.

### Tools

- **Road**: Connect zones to the network.
- **Zones (R/C/I)**: Residential (Green), Commercial (Blue), and Industrial (Yellow).
- **Power**: Place power plants (Coal/Nuclear) and lines to energize your city.
- **Public Services**: Police (PD) and Fire (FD) to keep the peace.
- **Bulldozer**: Clear tiles for new development.

## 🛠 Tech Stack

- **Framework**: [React](https://react.dev/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Graphics Engine**: [PixiJS v8](https://pixijs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS

---

_Enjoy building the next great metropolis!_
