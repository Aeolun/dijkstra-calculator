![Dijkstra's Calculator](./banner.jpg)

# A TypeScript implementation of Dijkstra's shortest path algorithm

> An advanced pathfinding library with resource management, custom cost functions, and A* heuristic support

- **GitHub URL**: https://github.com/aeolun/dijkstra-calculator
- **TypeDoc Link**: https://getditto.github.io/dijkstra-calculator
- Built with [![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
- Continuous Integration Status ![Continuous Integration](https://github.com/getditto/dijkstra-calculator/actions/workflows/ci.yml/badge.svg)

## Overview

Find the shortest path between nodes in a graph using [Dijkstra's algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm), with support for:

- 🎯 **Resource management** - Track consumable resources like fuel, energy, or ammunition
- ⛽ **Resource recovery** - Define refueling/recharging stations at vertices
- 🔄 **Multiple edge types** - Model different travel modes (walk/drive/fly) between the same nodes
- 💰 **Dynamic cost functions** - Calculate edge costs based on current state
- 🚀 **A* heuristic** - Improve performance with custom heuristic functions
- 🗺️ **Multi-waypoint routing** - Calculate routes through multiple destinations

Originally ported from [Alfred Gatsby @Prottoy2938](https://github.com/Prottoy2938)'s [gist](https://gist.github.com/Prottoy2938/66849e04b0bac459606059f5f9f3aa1a), this library has been significantly extended to support resource-constrained pathfinding.

At [Ditto](https://www.ditto.live), we use this library with [react-force-graph](https://github.com/vasturiano/react-force-graph) to visualize optimal paths in mesh networks with varying link priorities and resource constraints.

**Scale**: This library is battle-tested on massive graphs with 7,000-350,000 nodes (depending on granularity) and multiple travel modes between each pair of nodes. For graphs of this size, using proper A* heuristics is essential to make pathfinding tractable.

[Learn how to pronounce Dijkstra](https://www.youtube.com/watch?v=lg6uIPSvclU)

## Installation

```sh
npm install @aeolun/dijkstra-calculator
# or
yarn add @aeolun/dijkstra-calculator
# or
pnpm add @aeolun/dijkstra-calculator
```

This library targets ES2017 and works in Web, Node, and Electron environments with **zero runtime dependencies**.

## Usage

### Basic Usage

Find the shortest path between two nodes with uniform edge weights:

```typescript
import { DijkstraCalculator } from '@aeolun/dijkstra-calculator';

const graph = new DijkstraCalculator();

// Add vertices
graph.addVertex('A');
graph.addVertex('B');
graph.addVertex('C');
graph.addVertex('D');
graph.addVertex('E');
graph.addVertex('F');

// Add edges (default weight: 1)
graph.addEdge('A', 'B');
graph.addEdge('A', 'C');
graph.addEdge('B', 'E');
graph.addEdge('C', 'D');
graph.addEdge('C', 'F');
graph.addEdge('D', 'E');
graph.addEdge('D', 'F');
graph.addEdge('E', 'F');

const result = graph.calculateShortestPath('A', 'E');
console.log(result.finalPath); // ['A', 'B', 'E']
console.log(result.pathProperties.priority); // 2 (total weight)
```

### Weighted Edges

Assign different weights to prioritize certain paths:

```typescript
const graph = new DijkstraCalculator();

graph.addVertex('A');
graph.addVertex('B');
graph.addVertex('C');
graph.addVertex('D');
graph.addVertex('E');
graph.addVertex('F');

graph.addEdge('A', 'B', { weight: 4 });
graph.addEdge('A', 'C', { weight: 2 });
graph.addEdge('B', 'E', { weight: 3 });
graph.addEdge('C', 'D', { weight: 2 });
graph.addEdge('C', 'F', { weight: 4 });
graph.addEdge('D', 'E', { weight: 3 });
graph.addEdge('D', 'F', { weight: 1 });
graph.addEdge('E', 'F', { weight: 1 });

const result = graph.calculateShortestPath('A', 'E');
console.log(result.finalPath); // ['A', 'C', 'D', 'F', 'E']
console.log(result.pathProperties.priority); // 6
```

### Resource Management

Track consumable resources (fuel, energy, health, etc.) and find paths that don't exceed capacity:

```typescript
// Specify resource types via generic parameter
const graph = new DijkstraCalculator<'fuel'>();

graph.addVertex('A');
graph.addVertex('B');
graph.addVertex('C');
graph.addVertex('D');
graph.addVertex('E');

// Each edge consumes resources
graph.addEdge('A', 'B', { weight: 1, consumes: { fuel: 1 } });
graph.addEdge('A', 'C', { weight: 1, consumes: { fuel: 1 } });
graph.addEdge('B', 'D', { weight: 1, consumes: { fuel: 1 } });
graph.addEdge('B', 'E', { weight: 1, consumes: { fuel: 10 } }); // expensive!
graph.addEdge('C', 'D', { weight: 1, consumes: { fuel: 1 } });
graph.addEdge('D', 'E', { weight: 1, consumes: { fuel: 1 } });

const result = graph.calculateShortestPath('A', 'E', {
  supplies: { fuel: 3 },        // Starting fuel
  supplyCapacity: { fuel: 3 },  // Maximum fuel capacity
});

console.log(result.finalPath); // ['A', 'B', 'D', 'E'] - avoids expensive edge
console.log(result.pathProperties.supplies); // { fuel: 0 } - fuel remaining
```

When a path would exceed resource capacity, it receives a large penalty (100,000 × deficit), making it non-viable unless no other path exists.

### Resource Recovery (Refueling Stations)

Define vertices where resources can be recovered:

```typescript
const graph = new DijkstraCalculator<'fuel'>();

graph.addVertex('A');
graph.addVertex('B');
graph.addVertex('C', {
  recover: {
    fuel: (currentLevel, maxCapacity) => {
      const recoverAmount = maxCapacity - currentLevel;
      const refuelCost = recoverAmount * 0.5; // cost per unit
      return {
        recoverAmount,
        cost: refuelCost, // added to path priority
      };
    },
  },
});
graph.addVertex('D');
graph.addVertex('E');

graph.addEdge('A', 'B', { weight: 1, consumes: { fuel: 2 } });
graph.addEdge('A', 'C', { weight: 1, consumes: { fuel: 2 } });
graph.addEdge('B', 'E', { weight: 1, consumes: { fuel: 2 } });
graph.addEdge('C', 'D', { weight: 1, consumes: { fuel: 2 } });
graph.addEdge('D', 'E', { weight: 1, consumes: { fuel: 2 } });

const result = graph.calculateShortestPath('A', 'E', {
  supplies: { fuel: 4 },
  supplyCapacity: { fuel: 10 },
});

// May route through C to refuel if it's more efficient
console.log(result.pathProperties.totalConsumed); // Total fuel consumed
console.log(result.pathProperties.totalRecovered); // Total fuel recovered
```

### Multiple Edge Types

Model different travel modes between the same nodes:

```typescript
const graph = new DijkstraCalculator<'fuel'>();

graph.addVertex('A');
graph.addVertex('B');

// Walk: slow but fuel-efficient
graph.addEdge('A', 'B', {
  id: 'walk',
  weight: 10,
  consumes: { fuel: 1 },
});

// Drive: fast but uses more fuel
graph.addEdge('A', 'B', {
  id: 'drive',
  weight: 3,
  consumes: { fuel: 5 },
});

// Fly: fastest but fuel-hungry
graph.addEdge('A', 'B', {
  id: 'fly',
  weight: 1,
  consumes: { fuel: 10 },
});

// Low fuel: will choose walk
const lowFuelResult = graph.calculateShortestPath('A', 'B', {
  supplies: { fuel: 2 },
  supplyCapacity: { fuel: 2 },
});

// High fuel: will choose fly
const highFuelResult = graph.calculateShortestPath('A', 'B', {
  supplies: { fuel: 20 },
  supplyCapacity: { fuel: 20 },
});
```

### Dynamic Cost Functions

Calculate edge costs based on current path state:

```typescript
const graph = new DijkstraCalculator<'fuel'>();

graph.addVertex('A');
graph.addVertex('B');

graph.addEdge('A', 'B', {
  weight: 10,
  consumes: { fuel: 5 },
  // Add cost based on how much fuel we're using
  extraCost: (currentSupply, maxSupply, consumedThisEdge, isFinalStep) => {
    const fuelUsed = consumedThisEdge.fuel ?? 0;
    const fuelRemaining = currentSupply.fuel ?? 0;

    // Penalize low fuel at destination
    if (isFinalStep && fuelRemaining < maxSupply.fuel! * 0.2) {
      return 1000; // large penalty for arriving with <20% fuel
    }

    // Small cost per fuel unit consumed
    return fuelUsed * 0.1;
  },
});
```

### A* Heuristic

Improve pathfinding performance with a heuristic function (converts Dijkstra to A*):

```typescript
// Define 2D positions for nodes
const positions: Record<string, { x: number; y: number }> = {
  A: { x: 0, y: 0 },
  B: { x: 10, y: 5 },
  C: { x: 20, y: 0 },
  D: { x: 30, y: 10 },
};

// Heuristic: Euclidean distance to target
const graph = new DijkstraCalculator<'fuel'>((currentNode, targetNode) => {
  const current = positions[currentNode];
  const target = positions[targetNode];
  const distance = Math.sqrt(
    Math.pow(target.x - current.x, 2) +
    Math.pow(target.y - current.y, 2)
  );
  return distance * 0.5; // scale factor
});

// Add vertices and edges...
const result = graph.calculateShortestPath('A', 'D', {
  supplies: { fuel: 100 },
  supplyCapacity: { fuel: 100 },
});
```

The heuristic guides the search toward the target, potentially exploring fewer nodes.

### Optional Debug Logging

By default, the library is completely silent with no logging overhead. For debugging, you can optionally provide a logger:

```typescript
import { DijkstraCalculator, type Logger } from '@aeolun/dijkstra-calculator';
import pino from 'pino'; // optional dependency

// With Pino (or any compatible logger)
const logger = pino({ level: 'debug' });
const graph = new DijkstraCalculator<'fuel'>(undefined, logger);

// With custom logger
const consoleLogger: Logger = {
  debug: (msg, ...args) => console.log('[DEBUG]', msg, ...args),
};
const graph2 = new DijkstraCalculator<'fuel'>(undefined, consoleLogger);

// Without logger (default - zero overhead)
const graph3 = new DijkstraCalculator<'fuel'>();
```

The `Logger` interface is compatible with [Pino](https://github.com/pinojs/pino), [Winston](https://github.com/winstonjs/winston), and most other logging libraries.

### Multi-Waypoint Routing

Calculate a route through multiple destinations in sequence:

```typescript
const graph = new DijkstraCalculator<'fuel'>();

// Add vertices and edges...

const result = graph.calculateShortestRouteAsLinkedListResults(
  ['A', 'C', 'E', 'B'], // visit in this order
  {
    supplies: { fuel: 50 },
    supplyCapacity: { fuel: 50 },
  }
);

console.log(result.finalPath); // Complete path through all waypoints
console.log(result.pathProperties.priority); // Total cost
console.log(result.pathProperties.timeTaken); // Computation time (ms)
```

### Linked List Output

For visualization libraries like [d3](https://d3js.org/), [Vis.js](https://visjs.org/), or [force-graph](https://github.com/vasturiano/react-force-graph/), use the linked list format:

```typescript
const result = graph.calculateShortestPathAsLinkedListResult('A', 'E', {
  supplies: { fuel: 10 },
  supplyCapacity: { fuel: 10 },
});

console.log(result.finalPath);
// [
//   {
//     source: 'A',
//     target: 'C',
//     edge: 'drive',
//     weight: 2,
//     consumes: { fuel: 1 },
//     recover: {},
//     supplies: { fuel: 9 },
//     totalConsumed: { fuel: 1 },
//     totalRecovered: { fuel: 0 },
//   },
//   // ... more edges
// ]
```

Each edge includes:
- `source`/`target`: Node IDs
- `edge`: Edge ID (if provided)
- `weight`: Base edge weight
- `extraWeight`: Additional cost from `extraCost` function
- `consumes`: Resources consumed on this edge
- `recover`: Resources recovered at target vertex
- `supplies`: Resource levels after this edge
- `totalConsumed`/`totalRecovered`: Cumulative resource usage

## TypeScript Types

The library is fully typed. Key interfaces:

```typescript
// Define your resource types
type MyResources = 'fuel' | 'health' | 'ammo';

// Create a typed graph
const graph = new DijkstraCalculator<MyResources>();

// Edge configuration
interface EdgeProperties<RESOURCES extends string> {
  id?: string;
  weight: number;
  consumes?: Partial<Record<RESOURCES, number>>;
  extraCost?: (
    currentSupply: Partial<Record<RESOURCES, number>>,
    maxSupply: Partial<Record<RESOURCES, number>>,
    consumed: Partial<Record<RESOURCES, number>>,
    isFinalStep: boolean
  ) => number;
}

// Vertex configuration
interface VertexProperties<RESOURCES extends string> {
  recover?: Partial<Record<RESOURCES, (
    currentLevel: number,
    maxLevel: number
  ) => {
    recoverAmount: number;
    cost: number;
  }>>;
}

// Path calculation options
interface PathProperties<RESOURCES extends string> {
  supplies?: Partial<Record<RESOURCES, number>>;
  supplyCapacity?: Partial<Record<RESOURCES, number>>;
  timeout?: number;         // Maximum time in ms before aborting
}

// Return type
interface PathReturnProperties<RESOURCES extends string> {
  priority: number;      // Total path cost
  timeTaken: number;     // Calculation time (ms)
  supplies?: Partial<Record<RESOURCES, number>>;
  totalConsumed?: Partial<Record<RESOURCES, number>>;
  totalRecovered?: Partial<Record<RESOURCES, number>>;
  resourceWeight?: Partial<Record<RESOURCES, number>>; // Cost from recovery
}
```

## Real-World Example

A space trading game with fuel management:

```typescript
const graph = new DijkstraCalculator<'fuel'>((from, to) => {
  // A* heuristic: straight-line distance
  return Math.hypot(
    systems[to].x - systems[from].x,
    systems[to].y - systems[from].y
  ) * 0.5;
});

// Add star systems
systems.forEach(system => {
  graph.addVertex(system.id, {
    recover: system.hasRefueling ? {
      fuel: (current, max) => {
        const amount = max - current;
        return {
          recoverAmount: amount,
          cost: amount * system.fuelPrice, // varies by location
        };
      }
    } : undefined,
  });
});

// Add travel routes
systems.forEach(system => {
  system.neighbors.forEach(neighbor => {
    const distance = Math.hypot(
      neighbor.x - system.x,
      neighbor.y - system.y
    );

    // Multiple travel speeds
    graph.addEdge(system.id, neighbor.id, {
      id: 'cruise',
      weight: distance * 2,  // time cost
      consumes: { fuel: distance },
    });

    graph.addEdge(system.id, neighbor.id, {
      id: 'burn',
      weight: distance,      // faster
      consumes: { fuel: distance * 2 }, // uses more fuel
      extraCost: (supply, max, spent, finalStep) => {
        // Penalty for arriving with low fuel
        if (finalStep && supply.fuel! < max.fuel! * 0.1) {
          return 5000;
        }
        return 0;
      },
    });
  });
});

const route = graph.calculateShortestPath('Sol', 'Alpha-Centauri', {
  supplies: { fuel: 500 },
  supplyCapacity: { fuel: 500 },
});
```

## Performance Tips

For large graphs (>1,000 nodes), performance optimization becomes critical:

### 1. **Use A* Heuristics (Essential for Large Graphs)**

For graphs with spatial properties, A* heuristics are **mandatory** for reasonable performance. On graphs with 100,000+ nodes, a good heuristic can reduce pathfinding time from minutes to milliseconds.

```typescript
// Without heuristic: explores most of the graph
const slowGraph = new DijkstraCalculator<'fuel'>();

// With heuristic: guided search, explores only relevant nodes
const fastGraph = new DijkstraCalculator<'fuel'>((current, target) => {
  const dx = positions[target].x - positions[current].x;
  const dy = positions[target].y - positions[current].y;
  return Math.sqrt(dx * dx + dy * dy);
});
```

**Heuristic requirements**:
- Must be **admissible** (never overestimate the true cost)
- Should be **consistent** (satisfy triangle inequality)
- Euclidean distance works well for spatial graphs
- For non-spatial graphs, try domain-specific distance metrics

### 2. **Pre-compute Graph Structure**

If running multiple queries on the same graph, build it once:

```typescript
// Build graph once
const graph = new DijkstraCalculator<'fuel'>(heuristic);
for (const node of nodes) {
  graph.addVertex(node.id);
}
for (const edge of edges) {
  graph.addEdge(edge.from, edge.to, edge.properties);
}

// Run multiple queries efficiently
const route1 = graph.calculateShortestPath('A', 'B', props);
const route2 = graph.calculateShortestPath('C', 'D', props);
```

### 3. **Optimize Resource Calculations**

For graphs with many resources, minimize computation in hot paths:

```typescript
// Avoid expensive calculations in extraCost
graph.addEdge('A', 'B', {
  weight: 10,
  extraCost: (supply, max, consumed, finalStep) => {
    // BAD: Complex math in hot path
    // return Math.pow(consumed.fuel, 2) * Math.sin(supply.fuel);

    // GOOD: Simple arithmetic
    return consumed.fuel * 0.1;
  },
});
```

### 4. **Use Directed Edges When Possible**

If your graph has one-way connections, use directed edges to reduce memory:

```typescript
// Bidirectional (default) - creates 2 edges
graph.addEdge('A', 'B', { weight: 1 });

// Directed - creates 1 edge
graph.addEdge('A', 'B', { weight: 1 }, true);
```

### 5. **Use Timeouts for Long-Distance Queries**

For very large graphs (100,000+ nodes), some queries across the entire graph may take too long. Use timeouts to prevent hanging:

```typescript
const result = graph.calculateShortestPath('EarthSystem', 'FarGalaxy', {
  supplies: { fuel: 1000 },
  supplyCapacity: { fuel: 1000 },
  timeout: 500, // Abort after 500ms if no path found
});

if (result.finalPath.length === 0) {
  console.log('No path found within timeout - systems too far apart');
} else {
  console.log(`Path found in ${result.pathProperties.timeTaken}ms`);
}
```

**Timeout guidelines**:
- For graphs with good heuristics: 100-500ms is usually sufficient
- Without heuristics: may need 1000ms+ for large graphs
- Empty result (`finalPath: []`) indicates timeout or no path exists

### 6. **Use Bidirectional Search (For Graphs Without Resources)**

For very large graphs with good heuristics and **without resource constraints**, use `calculateBidirectionalPath()` which searches from both start and end simultaneously:

```typescript
// Create graph with heuristic (required for bidirectional search)
const graph = new DijkstraCalculator((from, to) => {
  return Math.hypot(
    positions[to].x - positions[from].x,
    positions[to].y - positions[from].y
  );
});

// Add vertices and edges WITHOUT resource consumption
systems.forEach(system => {
  graph.addVertex(system.id);
});

systems.forEach(system => {
  system.neighbors.forEach(neighbor => {
    graph.addEdge(system.id, neighbor.id, {
      weight: calculateDistance(system, neighbor),
      // NO consumes, NO supplies
    });
  });
});

// Use bidirectional search for fast pathfinding
const result = graph.calculateBidirectionalPath('EarthSystem', 'AlphaCentauri', {
  timeout: 500, // Optional timeout in ms
});

console.log(result.finalPath); // ['EarthSystem', ..., 'AlphaCentauri']
console.log(result.pathProperties.priority); // Total cost
```

**Important limitations**:
- **Does NOT support resource management** (fuel, supplies, etc.)
- Requires a heuristic function (will throw error if not provided)
- For graphs with resources, you must use the standard `calculateShortestPath()` methods

**When to use**:
- Very large graphs (50,000+ nodes) with good heuristics
- Long-distance queries where standard A* is too slow
- **Graphs without resource constraints**
- Simple weight-only pathfinding at scale

### 7. **Profile Large Graphs**

For graphs with 10,000+ nodes, check timing to identify bottlenecks:

```typescript
const result = graph.calculateShortestPath('A', 'Z', props);
console.log(`Pathfinding took ${result.pathProperties.timeTaken}ms`);

// If slow:
// - Verify heuristic is working (should see <100ms for most queries)
// - Check if recovery functions are too complex
// - Consider reducing graph granularity if possible
// - Try bidirectional search for long-distance queries
// - Add a timeout to prevent UI hangs
```

## API Reference

### `DijkstraCalculator<RESOURCES extends string>`

#### Constructor
```typescript
constructor(
  heuristic?: (currentNode: NodeId, targetNode: NodeId) => number,
  logger?: Logger  // optional, defaults to no-op
)
```

#### Methods

- `addVertex(id: NodeId, properties?: VertexProperties<RESOURCES>): void`
- `addEdge(from: NodeId, to: NodeId, properties?: EdgeProperties<RESOURCES>, directed?: boolean): void`
- `calculateShortestPath(start: NodeId, end: NodeId, properties?: PathProperties<RESOURCES>): PathResult`
- `calculateShortestPathAsLinkedListResult(start: NodeId, end: NodeId, properties?: PathProperties<RESOURCES>): LinkedListResult`
- `calculateShortestRouteAsLinkedListResults(nodes: NodeId[], properties?: PathProperties<RESOURCES>): LinkedListResult`
- `calculateBidirectionalPath(start: NodeId, end: NodeId, options?: { timeout?: number }): { finalPath: string[]; pathProperties: { priority: number; timeTaken: number } }` - For graphs without resource constraints only

## License

MIT

## Credits

- Original implementation: [Alfred Gatsby @Prottoy2938](https://github.com/Prottoy2938)
- Extended by [@aeolun](https://github.com/aeolun) with resource management, recovery mechanics, and advanced features
- Used in production at [Ditto](https://www.ditto.live)
