# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript implementation of Dijkstra's shortest path algorithm with advanced features including:
- Resource management (e.g., fuel consumption/recovery)
- Multiple edge types between nodes with different weights
- Custom weight/cost functions per edge
- A* heuristic support
- Resource recovery at vertices (e.g., refueling stations)

The library is primarily used by Ditto for visualizing mesh network shortest paths with differing priorities per link.

## Build and Test Commands

```bash
# Build both CommonJS and ES Module outputs
pnpm run build
# or build individually:
pnpm run build:main    # CommonJS → build/main/
pnpm run build:module  # ES Module → build/module/

# Run tests (builds first, then runs vitest)
pnpm run test

# Run only unit tests (without build)
pnpm run test:unit

# Lint
pnpm run test:lint

# Fix formatting and linting
pnpm run fix
```

## Architecture

### Core Algorithm (`src/lib/index.ts`)

The `DijkstraCalculator` class is a generic implementation that supports resource tracking via the `RESOURCES extends string` type parameter.

**Key data structures:**
- `adjacencyList`: Maps each vertex to its edges and their properties
- `vertexProperties`: Stores vertex-specific properties (e.g., recovery functions)
- `PriorityQueue`: Custom min-heap implementation for efficient node selection

**Path calculation flow:**
1. Initialize distances and priority queue from start node
2. Process nodes in order of lowest priority (weight + heuristic)
3. For each neighbor, calculate new cost considering:
   - Base edge weight
   - Resource consumption (`consumes`)
   - Resource recovery at vertices (`recover`)
   - Custom extra cost functions (`extraCost`)
   - A* heuristic (if provided)
4. Track resource levels throughout path to avoid impossible routes (negative resources)
5. Build path by backtracking through `previous` pointers

**Resource system:**
- Edges consume resources via `consumes` property
- Vertices can recover resources via `recover` functions (e.g., refueling)
- Routes become expensive (penalty: `Math.abs(negative) * 100000`) when resources go negative
- Recovery cost is added to path priority via custom cost functions

### Key Types

- `NodeId`: String identifier for vertices
- `EdgeProperties<RESOURCES>`: Edge configuration including weight, consumption, supplies, custom cost functions
- `VertexProperties<RESOURCES>`: Vertex configuration including recovery functions
- `PathProperties<RESOURCES>`: Tracks priority, supplies, capacity, consumed/recovered totals during pathfinding
- `LinkedListItem<RESOURCES>`: Source/target pairs with edge metadata for visualization libraries

### Dual Build System

The project builds to both CommonJS (`build/main/`) and ES Module (`build/module/`) formats using separate tsconfig files:
- `tsconfig.json`: CommonJS build
- `tsconfig.module.json`: ES Module build

## Testing Notes

- Tests use Vitest
- Many tests are commented out in `src/lib/index.test.ts` but demonstrate expected behavior
- Active tests cover: resource constraints, heuristics, edge creation before vertices
- Tests use `toMatchObject` to ignore `timeTaken` variance
