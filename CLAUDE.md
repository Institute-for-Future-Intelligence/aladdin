# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Aladdin is a sustainable energy engineering design application powered by AI, focused on renewable energy and building energy analysis. Built with React, Three.js/React Three Fiber, and TypeScript, it provides 3D visualization and simulation capabilities for solar energy systems.

**Published at**: https://institute-for-future-intelligence.github.io/aladdin/

## Development Commands

### Build & Development
```bash
npm start              # Start development server (Vite, opens at localhost:3000)
npm run build          # Build for production
npm run deploy         # Deploy to GitHub Pages (runs build first)
```

### Deployment
```bash
npm run deploy-firebase-functions    # Deploy Firebase functions only
```

### Utilities
```bash
node ./src/scripts/updateExamples.js # Update example files
```

### Code Formatting
- **Prettier** runs automatically on staged TypeScript files via `husky` pre-commit hooks
- Config: `.prettierrc` (single quotes, 120 char line width, 2-space tabs, trailing commas)
- Files are auto-formatted on commit via `lint-staged`

## Architecture

### State Management - Zustand Stores

The application uses **Zustand** for state management with a split-store architecture:

- **`src/stores/common.ts`**: Main store containing world state, elements, view state, and most application logic
  - Uses `createWithEqualityFn` from `zustand/traditional`
  - Persisted to localStorage via `persist` middleware
  - Uses **Immer** for immutable state updates (`produce` function with `enableMapSet`)
  - Selectors are defined in `src/stores/selector.ts`

- **`src/stores/commonPrimitive.ts`**: Primitive values store for frequently changing values
- **`src/stores/commonRef.ts`**: Reference store for Three.js objects and refs
- **`src/stores/commonData.ts`**: Data store for weather, solar radiation, and PV modules

**Store Pattern**:
```typescript
// Access state
const value = useStore(Selector.someValue);
const setPrimitive = usePrimitiveStore(Selector.set);

// Update state (uses Immer produce)
useStore.getState().set((state) => {
  state.property = newValue;
});
```

### 3D Rendering - React Three Fiber

- Main 3D canvas in `src/appCreator.tsx`
- Scene components in `src/views/` (ground, sky, heliodon, solar panels, buildings, etc.)
- Element models in `src/models/` (type definitions extending `ElementModel`)
- Custom Three.js geometries extended via `extend()` in `src/types.ts`:
  - `ParabolicCylinderGeometry`, `ParaboloidGeometry`, `ConvexGeometry`
  - Custom `MyOrbitControls` for camera control

### Key Directories

- **`src/models/`**: Element model type definitions (SolarPanelModel, RoofModel, etc.)
  - `ElementModel.ts` - base interface
  - `ElementModelFactory.ts` - creates element instances
  - `ElementModelCloner.ts` - clones elements

- **`src/views/`**: 3D view components for rendering elements (ground, foundation, roof, solarPanel, etc.)

- **`src/components/`**: React components (UI, graphs, menus, modals)
  - `contextMenu/` - right-click context menus
  - `mainMenu/` - top menu bar components
  - `generateBuildingModal.tsx`, `generateSolarPowerTowerModal.tsx` - AI generation modals

- **`src/panels/`**: Side panels for data visualization and controls (daily/yearly energy panels, cloud files, settings)

- **`src/analysis/`**: Solar and thermal simulation engines
  - `SolarRadiation.ts` - core solar calculations
  - `*Simulation.tsx` - simulation components for different solar technologies
  - `energyHooks.ts` - React hooks for energy calculations

- **`src/ai/`**: AI optimization algorithms
  - `ga/` - Genetic Algorithm implementations
  - `pso/` - Particle Swarm Optimization implementations
  - `openAI/` - OpenAI API integration for GenAI features

- **`src/stores/`**: Zustand store definitions and defaults
  - `common.ts`, `commonPrimitive.ts`, `commonRef.ts`, `commonData.ts` - main stores
  - `Default*.ts` - default state values
  - Store types: `ViewState.ts`, `ActionState.ts`, `EvolutionaryAlgorithmState.ts`, etc.

- **`src/undo/`**: Undo/Redo system
  - `UndoManager.ts` - command pattern implementation
  - `Undoable.ts` - base interface for undoable actions

### Element System

Elements are the core building blocks (solar panels, buildings, walls, roofs, etc.):

1. **Model Definition**: TypeScript interface in `src/models/` extending `ElementModel`
2. **Factory**: Created via `ElementModelFactory.ts`
3. **View Component**: 3D rendering in `src/views/`
4. **Store Integration**: Elements array in main Zustand store
5. **Cloning**: `ElementModelCloner.ts` for copy operations

### Simulation Flow

1. User configures elements in 3D scene
2. Simulation parameters set via panels (`src/panels/*Panel.tsx`)
3. Simulation engine runs (`src/analysis/*Simulation.tsx`)
4. Results visualized in graphs/heatmaps (`src/components/lineGraph.tsx`, etc.)

## Firebase Integration

- **Config**: Environment variables in `.env` (see `src/firebase.ts`)
  - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.
- **Services**: Auth, Firestore, Storage
- **Functions**: Deployed separately via `npm run deploy-firebase-functions`
- **Workspace**: `functions/` directory is a separate npm workspace

## Important Patterns

### Immer for State Updates
Always use the `produce` pattern when updating Zustand state:
```typescript
useStore.getState().set((state) => {
  state.elements.push(newElement);
});
```

### Undo/Redo
- All user actions that modify state should be wrapped in `Undoable` commands
- Commands added to `UndoManager` instance
- See `src/undo/UndoableCheck.ts` for examples

### i18n
- Uses `react-i18next` for internationalization
- Translations in `src/i18n/`
- Access via `useLanguage()` hook or `i18n.t()`

### Three.js Object References
- Stored in `commonRef` store (not `common` store)
- Used for direct manipulation of Three.js scene objects

### URL Parameters
- `?viewonly=true` - read-only mode, no beforeunload warning
- `?map=true` - opens models map view on load

## Technology Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **3D**: Three.js + React Three Fiber + Drei
- **State**: Zustand + Immer
- **UI**: Ant Design (antd)
- **Styling**: Styled Components + CSS
- **Charts**: Recharts
- **Firebase**: Auth, Firestore, Storage, Functions
- **AI/ML**: Custom GA/PSO algorithms, OpenAI API
- **Maps**: Google Maps API (`@react-google-maps/api`)
