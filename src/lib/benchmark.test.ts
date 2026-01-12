// ABOUTME: Benchmark tests to measure pathfinding performance improvements
// ABOUTME: Run with CI=1 pnpm run test:unit to get timing measurements

import { expect, test } from 'vitest';
import { DijkstraCalculator } from './';

test('benchmark: large dense graph with heuristic', () => {
  // Create a 50x50 grid (2500 vertices) with diagonal connections
  // This tests all three optimizations:
  // 1. Heuristic caching (expensive sqrt calculations)
  // 2. Lazy vertex discovery (only explores reachable vertices)
  // 3. Object spreading reduction (many edges to explore)

  const gridSize = 50;
  const totalVertices = gridSize * gridSize;

  const graph = new DijkstraCalculator<'fuel'>((nodeA, nodeB) => {
    // Extract coordinates from node IDs like "x_y"
    const [ax, ay] = nodeA.split('_').map(Number);
    const [bx, by] = nodeB.split('_').map(Number);
    // Euclidean distance heuristic (expensive calculation)
    return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
  });

  // Build grid graph
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const nodeId = `${x}_${y}`;

      // Add vertex with recovery at 10% of nodes
      if (x % 10 === 0 && y % 10 === 0) {
        graph.addVertex(nodeId, {
          recover: {
            fuel: (current, max) => ({
              recoverAmount: Math.min(5, max - current),
              cost: 2,
            }),
          },
        });
      } else {
        graph.addVertex(nodeId);
      }

      // Add edges to neighbors (right, down, diagonal right-down)
      if (x < gridSize - 1) {
        graph.addEdge(nodeId, `${x + 1}_${y}`, {
          weight: 1,
          consumes: { fuel: 1 },
        });
      }
      if (y < gridSize - 1) {
        graph.addEdge(nodeId, `${x}_${y + 1}`, {
          weight: 1,
          consumes: { fuel: 1 },
        });
      }
      if (x < gridSize - 1 && y < gridSize - 1) {
        graph.addEdge(nodeId, `${x + 1}_${y + 1}`, {
          weight: 1.4,
          consumes: { fuel: 1.4 },
        });
      }
    }
  }

  console.log(
    `\nBenchmark: ${totalVertices} vertices, ~${totalVertices * 3} edges`,
  );

  const start = Date.now();
  const result = graph.calculateShortestPathAsLinkedListResult('0_0', '49_49', {
    supplies: { fuel: 200 },
    supplyCapacity: { fuel: 200 },
  });
  const elapsed = Date.now() - start;

  console.log(`Pathfinding completed in ${elapsed}ms`);
  console.log(`Path length: ${result.finalPath.length} steps`);
  console.log(`Final priority: ${result.pathProperties.priority.toFixed(2)}`);
  console.log(`Remaining fuel: ${result.pathProperties.supplies?.fuel}`);

  // Verify we found a path
  expect(result.finalPath.length).toBeGreaterThan(0);
  expect(result.finalPath[0].source).toBe('0_0');
  expect(result.finalPath[result.finalPath.length - 1].target).toBe('49_49');

  // Performance expectations (these will vary by machine, but should improve after optimizations)
  console.log(
    `Algorithm took ${result.pathProperties.timeTaken}ms (internal timer)`,
  );

  // With optimizations, this should complete reasonably fast
  // Without optimizations, this could take 500ms+
  // With optimizations, should be under 200ms on most machines
  expect(elapsed).toBeLessThan(1000); // Generous upper bound
});

test('benchmark: sparse graph (tests lazy discovery)', () => {
  // Create a graph with many disconnected components
  // Only a small subset is reachable from start
  // This tests lazy vertex discovery optimization

  const graph = new DijkstraCalculator<'fuel'>();

  // Create 10 separate chains of 50 nodes each (500 total nodes)
  // Only chain 0 is reachable from start
  for (let chain = 0; chain < 10; chain++) {
    for (let i = 0; i < 50; i++) {
      const nodeId = `chain${chain}_node${i}`;
      graph.addVertex(nodeId);

      if (i < 49) {
        graph.addEdge(nodeId, `chain${chain}_node${i + 1}`, {
          weight: 1,
          consumes: { fuel: 0.5 },
        });
      }
    }
  }

  console.log(
    '\nBenchmark: 500 vertices (10 disconnected chains), only 50 reachable',
  );

  const start = Date.now();
  const result = graph.calculateShortestPathAsLinkedListResult(
    'chain0_node0',
    'chain0_node49',
    {
      supplies: { fuel: 100 },
      supplyCapacity: { fuel: 100 },
    },
  );
  const elapsed = Date.now() - start;

  console.log(`Pathfinding completed in ${elapsed}ms`);
  console.log(`Path length: ${result.finalPath.length} steps`);

  // Verify correct path
  expect(result.finalPath.length).toBe(49);
  expect(result.finalPath[0].source).toBe('chain0_node0');
  expect(result.finalPath[48].target).toBe('chain0_node49');

  // With lazy discovery, should only explore ~50 nodes
  // Without lazy discovery, would initialize all 500 nodes
  // This should be very fast with optimizations
  console.log(
    `Algorithm took ${result.pathProperties.timeTaken}ms (internal timer)`,
  );
  expect(elapsed).toBeLessThan(100);
});

test('benchmark: many alternative paths (tests object spreading)', () => {
  // Create a diamond-shaped graph with many alternative paths
  // Tests the early rejection optimization to avoid object spreading

  const graph = new DijkstraCalculator<'fuel'>();

  const layers = 20; // Number of layers in the diamond
  const nodesPerLayer = 50; // Nodes in each middle layer

  graph.addVertex('start');
  graph.addVertex('end');

  // Create layers
  for (let layer = 0; layer < layers; layer++) {
    for (let i = 0; i < nodesPerLayer; i++) {
      const nodeId = `L${layer}_N${i}`;
      graph.addVertex(nodeId);

      // Connect to previous layer (or start)
      if (layer === 0) {
        graph.addEdge('start', nodeId, {
          weight: Math.random() * 5 + 1,
          consumes: { fuel: 1 },
        });
      } else {
        // Connect to several nodes in previous layer
        for (
          let j = Math.max(0, i - 5);
          j < Math.min(nodesPerLayer, i + 5);
          j++
        ) {
          graph.addEdge(`L${layer - 1}_N${j}`, nodeId, {
            weight: Math.random() * 5 + 1,
            consumes: { fuel: 1 },
          });
        }
      }

      // Connect to next layer (or end)
      if (layer === layers - 1) {
        graph.addEdge(nodeId, 'end', {
          weight: Math.random() * 5 + 1,
          consumes: { fuel: 1 },
        });
      }
    }
  }

  const totalVertices = 2 + layers * nodesPerLayer;
  console.log(
    `\nBenchmark: ${totalVertices} vertices with many alternative paths`,
  );

  const start = Date.now();
  const result = graph.calculateShortestPathAsLinkedListResult('start', 'end', {
    supplies: { fuel: 200 },
    supplyCapacity: { fuel: 200 },
  });
  const elapsed = Date.now() - start;

  console.log(`Pathfinding completed in ${elapsed}ms`);
  console.log(`Path length: ${result.finalPath.length} steps`);
  console.log(`Final priority: ${result.pathProperties.priority.toFixed(2)}`);

  expect(result.finalPath.length).toBeGreaterThan(0);
  expect(result.finalPath[0].source).toBe('start');
  expect(result.finalPath[result.finalPath.length - 1].target).toBe('end');

  // Early rejection should significantly reduce object allocations here
  console.log(
    `Algorithm took ${result.pathProperties.timeTaken}ms (internal timer)`,
  );
  expect(elapsed).toBeLessThan(500);
});
