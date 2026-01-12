import { expect, test } from 'vitest';

import { DijkstraCalculator } from './';

// test('a graph with assigned weights', (t) => {
//   const graph = new DijkstraCalculator();
//   graph.addVertex('A');
//   graph.addVertex('B');
//   graph.addVertex('C');
//   graph.addVertex('D');
//   graph.addVertex('E');
//   graph.addVertex('F');
//
//   graph.addEdge('A', 'B', { weight: 4 });
//   graph.addEdge('A', 'C', { weight: 2 });
//   graph.addEdge('B', 'E', { weight: 3 });
//   graph.addEdge('C', 'D', { weight: 2 });
//   graph.addEdge('C', 'F', { weight: 4 });
//   graph.addEdge('D', 'E', { weight: 3 });
//   graph.addEdge('D', 'F', { weight: 1 });
//   graph.addEdge('E', 'F', { weight: 1 });
//
//   t.deepEqual(graph.calculateShortestPath('A', 'E'), {
//     finalPath: ['A', 'C', 'D', 'F', 'E'],
//     pathProperties: { priority: 6, supplies: {}, timeTaken: 0 },
//   });
//   t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'E'), {
//     finalPath: [
//       { source: 'A', target: 'C' },
//       { source: 'C', target: 'D' },
//       { source: 'D', target: 'F' },
//       { source: 'F', target: 'E' },
//     ],
//     pathProperties: { priority: 6, supplies: {}, timeTaken: 0 },
//   });
// });
//
// test('basic test with same weight', (t) => {
//   const graph = new DijkstraCalculator();
//   graph.addVertex('A');
//   graph.addVertex('B');
//   graph.addVertex('C');
//   graph.addVertex('D');
//   graph.addVertex('E');
//   graph.addVertex('F');
//
//   graph.addEdge('A', 'B');
//   graph.addEdge('A', 'C');
//   graph.addEdge('B', 'E');
//   graph.addEdge('C', 'D');
//   graph.addEdge('C', 'F');
//   graph.addEdge('D', 'E');
//   graph.addEdge('D', 'F');
//   graph.addEdge('E', 'F');
//
//   t.deepEqual(graph.calculateShortestPath('A', 'E'), {
//     finalPath: ['A', 'B', 'E'],
//     pathProperties: { priority: 2, supplies: {}, timeTaken: 0 },
//   });
//   t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'E'), {
//     finalPath: [
//       { source: 'A', target: 'B' },
//       { source: 'B', target: 'E' },
//     ],
//     pathProperties: { priority: 2, supplies: {}, timeTaken: 0 },
//   });
// });
//
// test('basic test with multiple weights', (t) => {
//   const graph = new DijkstraCalculator();
//   graph.addVertex('A');
//   graph.addVertex('B');
//   graph.addVertex('C');
//   graph.addVertex('D');
//   graph.addVertex('E');
//   graph.addVertex('F');
//
//   graph.addEdge('A', 'B', { weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('A', 'C', { weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('B', 'D', { weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('B', 'E', { weight: 1, consumes: { fuel: 10 } });
//   graph.addEdge('C', 'D', { weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('C', 'F', { weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('D', 'E', { weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('D', 'F', { weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('E', 'F', { weight: 1, consumes: { fuel: 1 } });
//
//   t.deepEqual(
//     graph.calculateShortestPath('A', 'E', {
//       supplies: { fuel: 3 },
//       maxSupplies: { fuel: 3 },
//     }),
//     {
//       finalPath: ['A', 'B', 'D', 'E'],
//       pathProperties: {
//         priority: 3,
//         supplies: {
//           fuel: 0,
//         },
//         timeTaken: 0,
//       },
//     }
//   );
//   t.deepEqual(
//     graph.calculateShortestPathAsLinkedListResult('A', 'E', {
//       supplies: { fuel: 3 },
//       maxSupplies: { fuel: 3 },
//     }),
//     {
//       finalPath: [
//         { source: 'A', target: 'B' },
//         { source: 'B', target: 'D' },
//         { source: 'D', target: 'E' },
//       ],
//       pathProperties: {
//         priority: 3,
//         supplies: {
//           fuel: 0,
//         },
//         timeTaken: 0,
//       },
//     }
//   );
// });
//
// test('complex test with refueling', (t) => {
//   const graph = new DijkstraCalculator();
//   graph.addVertex('A');
//   graph.addVertex('B');
//   graph.addVertex('C', { recover: { fuel: true } });
//   graph.addVertex('D');
//   graph.addVertex('E');
//   graph.addVertex('F');
//
//   graph.addEdge('A', 'B', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('A', 'C', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('B', 'D', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('C', 'D', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('C', 'F', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('D', 'E', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('D', 'F', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
//   graph.addEdge('E', 'F', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
//
//   t.deepEqual(
//     graph.calculateShortestPath('A', 'E', {
//       supplies: { fuel: 2 },
//       maxSupplies: { fuel: 2 },
//     }),
//     {
//       finalPath: ['A', 'C', 'F', 'E'],
//       pathProperties: {
//         priority: 3,
//         supplies: {
//           fuel: 0,
//         },
//         timeTaken: 0,
//       },
//     }
//   );
//   t.deepEqual(
//     graph.calculateShortestPathAsLinkedListResult('A', 'E', {
//       supplies: { fuel: 2 },
//       maxSupplies: { fuel: 2 },
//     }),
//     {
//       finalPath: [
//         {
//           source: 'A',
//           target: 'C',
//           edge: 'warp',
//           weight: 1,
//           consumes: { fuel: 1 },
//           recover: { fuel: 1 },
//         },
//         {
//           source: 'C',
//           target: 'F',
//           edge: 'warp',
//           weight: 1,
//           consumes: { fuel: 1 },
//           recover: {},
//         },
//         {
//           source: 'F',
//           target: 'E',
//           edge: 'warp',
//           weight: 1,
//           consumes: { fuel: 1 },
//           recover: {},
//         },
//       ],
//       pathProperties: {
//         priority: 3,
//         supplies: {
//           fuel: 0,
//         },
//         timeTaken: 0,
//       },
//     }
//   );
// });
//
// test('complex test with multiple edge options', (t) => {
//   const graph = new DijkstraCalculator();
//   graph.addVertex('A');
//   graph.addVertex('B');
//   graph.addVertex('C', { recover: { fuel: true } });
//   graph.addVertex('D');
//   graph.addVertex('E');
//   graph.addVertex('F');
//
//   graph.addEdge('A', 'B', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
//   graph.addEdge('A', 'B', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
//   graph.addEdge('A', 'C', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
//   graph.addEdge('A', 'C', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
//   graph.addEdge('B', 'D', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
//   graph.addEdge('B', 'D', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
//   graph.addEdge('C', 'D', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
//   graph.addEdge('C', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
//   graph.addEdge('D', 'E', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
//   graph.addEdge('D', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
//   graph.addEdge('E', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
//
//   t.deepEqual(
//     graph.calculateShortestPath('A', 'E', {
//       supplies: { fuel: 10 },
//       maxSupplies: { fuel: 10 },
//     }),
//     {
//       finalPath: ['A', 'B', 'D', 'E'],
//       pathProperties: {
//         priority: 4,
//         supplies: {
//           fuel: 5,
//         },
//         timeTaken: 1,
//       },
//     }
//   );
//   t.deepEqual(
//     graph.calculateShortestPathAsLinkedListResult('A', 'E', {
//       supplies: { fuel: 10 },
//       maxSupplies: { fuel: 10 },
//     }),
//     {
//       finalPath: [
//         {
//           source: 'A',
//           target: 'B',
//           edge: 'burn',
//           weight: 1,
//           consumes: { fuel: 2 },
//           recover: {},
//         },
//         {
//           source: 'B',
//           target: 'D',
//           edge: 'burn',
//           weight: 1,
//           consumes: { fuel: 2 },
//           recover: {},
//         },
//         {
//           source: 'D',
//           target: 'E',
//           edge: 'warp',
//           weight: 2,
//           consumes: { fuel: 1 },
//           recover: {},
//         },
//       ],
//       pathProperties: {
//         priority: 4,
//         supplies: {
//           fuel: 5,
//         },
//         timeTaken: 1,
//       },
//     }
//   );
// });

test('test with lacking fuel', () => {
  const locations: Record<string, { x: number; y: number }> = {
    A: { x: 0, y: 0 },
    B: { x: 1, y: 1 },
    C: { x: 2, y: 2 },
    D: { x: 3, y: 3 },
    E: { x: 4, y: 4 },
    F: { x: 5, y: 5 },
  };

  const graph = new DijkstraCalculator((A, B) => {
    return (
      Math.sqrt(
        (locations[B].x - locations[A].x) ** 2 +
          (locations[B].y - locations[A].y) ** 2,
      ) * 0.5
    );
  });

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C', {
    recover: {
      fuel: (current, max) => {
        const recover = max - current;
        return {
          recoverAmount: recover,
          cost: recover,
        };
      },
    },
  });
  graph.addVertex('D');
  graph.addVertex('E');
  graph.addVertex('F');

  graph.addEdge('A', 'B', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('A', 'B', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
  graph.addEdge('A', 'C', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('A', 'C', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
  graph.addEdge('B', 'D', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('B', 'D', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
  graph.addEdge('C', 'D', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('C', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('D', 'E', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('D', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('E', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });

  const res = graph.calculateShortestPathAsLinkedListResult('A', 'E', {
    supplies: { fuel: 4 },
    supplyCapacity: { fuel: 4 },
  });
  expect(res).toMatchObject({
    finalPath: [
      {
        source: 'A',
        target: 'C',
        edge: 'warp',
        weight: 2,
        consumes: { fuel: 1 },
        recover: {
          fuel: 1,
        },
      },
      {
        source: 'C',
        target: 'F',
        edge: 'warp',
        weight: 2,
        consumes: { fuel: 1 },
        recover: {},
      },
      {
        source: 'F',
        target: 'E',
        edge: 'warp',
        weight: 2,
        consumes: { fuel: 1 },
        recover: {},
      },
    ],
    pathProperties: {
      priority: 9.121320343559642,
      supplies: {
        fuel: 2,
      },
    },
  });
  expect(res.pathProperties.timeTaken).toBeLessThan(5);
});

test('can create edges before vertexes', () => {
  const graph = new DijkstraCalculator();
  graph.addEdge('A', 'B', { weight: 1 });
  graph.addEdge('B', 'C', { weight: 1 });
  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');
  expect(graph.calculateShortestPath('A', 'C')).toMatchObject({
    finalPath: ['A', 'B', 'C'],
  });
});

test('test with partial recovery', () => {
  // This test demonstrates the bug where recovery always fills to max
  // instead of adding the calculated recoverAmount
  const graph = new DijkstraCalculator<'fuel'>();

  graph.addVertex('A');
  graph.addVertex('B', {
    recover: {
      fuel: (_current, _max) => {
        // Only recover 2 units, regardless of current level
        return {
          recoverAmount: 2,
          cost: 5, // High cost to make recovery visible in path
        };
      },
    },
  });
  graph.addVertex('C');

  graph.addEdge('A', 'B', { id: 'edge1', weight: 1, consumes: { fuel: 3 } });
  graph.addEdge('B', 'C', { id: 'edge2', weight: 1, consumes: { fuel: 1 } });

  const res = graph.calculateShortestPathAsLinkedListResult('A', 'C', {
    supplies: { fuel: 10 },
    supplyCapacity: { fuel: 10 },
  });

  // After A->B: 10 - 3 = 7 fuel
  // After recovery at B: 7 + 2 = 9 fuel (NOT 10!)
  // After B->C: 9 - 1 = 8 fuel
  expect(res).toMatchObject({
    finalPath: [
      {
        source: 'A',
        target: 'B',
        weight: 1,
        consumes: { fuel: 3 },
        recover: {
          fuel: 2, // Should recover only 2 units
        },
        supplies: {
          fuel: 9, // Should be 9 after: (10 - 3 consumed) + 2 recovered = 9
        },
      },
      {
        source: 'B',
        target: 'C',
        weight: 1,
        consumes: { fuel: 1 },
        recover: {},
        supplies: {
          fuel: 8, // After consuming 1 from the recovered 9: 9 - 1 = 8
        },
      },
    ],
    pathProperties: {
      supplies: {
        fuel: 8, // Final supplies: 8
      },
    },
  });
});

test('test penalty timing with negative resources', () => {
  // This test ensures that negative resource penalties are applied BEFORE heuristic
  // to maintain A* admissibility
  const graph = new DijkstraCalculator<'fuel'>();

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');

  // Path A->B consumes too much fuel (goes negative)
  // Path A->C is longer but doesn't go negative
  graph.addEdge('A', 'B', { id: 'edge1', weight: 1, consumes: { fuel: 15 } });
  graph.addEdge('B', 'C', { id: 'edge2', weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('A', 'C', { id: 'edge3', weight: 3, consumes: { fuel: 5 } });

  const res = graph.calculateShortestPathAsLinkedListResult('A', 'C', {
    supplies: { fuel: 10 },
    supplyCapacity: { fuel: 10 },
  });

  // Should take the longer path A->C to avoid negative fuel
  // The penalty for negative fuel should make A->B->C much more expensive
  expect(res).toMatchObject({
    finalPath: [
      {
        source: 'A',
        target: 'C',
        edge: 'edge3',
      },
    ],
  });
});

test('test directed edges', () => {
  const graph = new DijkstraCalculator<'fuel'>();

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');

  // Create directed edges: A->B and B->C, but not the reverse
  graph.addEdge('A', 'B', { weight: 1 }, true);
  graph.addEdge('B', 'C', { weight: 1 }, true);

  // Should be able to go from A to C
  const pathAtoC = graph.calculateShortestPath('A', 'C');
  expect(pathAtoC.finalPath).toEqual(['A', 'B', 'C']);

  // Should NOT be able to go from C to A (no path exists)
  const pathCtoA = graph.calculateShortestPath('C', 'A');
  expect(pathCtoA.finalPath).toEqual([]);
});

test('test input validation for non-existent nodes', () => {
  const graph = new DijkstraCalculator<'fuel'>();

  graph.addVertex('A');
  graph.addVertex('B');

  // Should throw when start node doesn't exist
  expect(() => {
    graph.calculateShortestPath('Z', 'B');
  }).toThrow('Start node "Z" does not exist in graph');

  // Should throw when finish node doesn't exist
  expect(() => {
    graph.calculateShortestPath('A', 'Z');
  }).toThrow('Finish node "Z" does not exist in graph');
});

test('test with heuristic', () => {
  const locations: Record<string, { x: number; y: number }> = {
    A: { x: 0, y: 0 },
    B: { x: 1, y: 1 },
    C: { x: 2, y: 2 },
    D: { x: 3, y: 3 },
    E: { x: 4, y: 4 },
    F: { x: 5, y: 5 },
  };

  const graph = new DijkstraCalculator((A, B) => {
    return (
      Math.sqrt(
        (locations[B].x - locations[A].x) ** 2 +
          (locations[B].y - locations[A].y) ** 2,
      ) * 0.5
    );
  });

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C', {
    recover: {
      fuel: (current, max) => {
        const recover = max - current;
        return {
          recoverAmount: recover,
          cost: 0,
        };
      },
    },
  });
  graph.addVertex('D');
  graph.addVertex('E');
  graph.addVertex('F');

  graph.addEdge('A', 'B', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('A', 'B', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
  graph.addEdge('A', 'C', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('A', 'C', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
  graph.addEdge('B', 'D', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('B', 'D', { id: 'burn', weight: 1, consumes: { fuel: 2 } });
  graph.addEdge('C', 'D', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('C', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('D', 'E', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('D', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });
  graph.addEdge('E', 'F', { id: 'warp', weight: 2, consumes: { fuel: 1 } });

  const res = graph.calculateShortestPathAsLinkedListResult('A', 'E', {
    supplies: { fuel: 10 },
    supplyCapacity: { fuel: 10 },
  });
  expect(res).toMatchObject({
    finalPath: [
      {
        source: 'A',
        target: 'B',
        edge: 'burn',
        weight: 1,
        consumes: { fuel: 2 },
        recover: {},
      },
      {
        source: 'B',
        target: 'D',
        edge: 'burn',
        weight: 1,
        consumes: { fuel: 2 },
        recover: {},
      },
      {
        source: 'D',
        target: 'E',
        edge: 'warp',
        weight: 2,
        consumes: { fuel: 1 },
        recover: {},
      },
    ],
    pathProperties: {
      priority: 6.82842712474619,
      supplies: {
        fuel: 5,
      },
    },
  });
  expect(res.pathProperties.timeTaken).toBeLessThan(5);
});

test('test timeout functionality', () => {
  // Create a large graph that would take a while to explore
  const graph = new DijkstraCalculator<'fuel'>();

  // Create a chain of 1000 nodes
  for (let i = 0; i < 1000; i++) {
    graph.addVertex(`node${i}`);
    if (i > 0) {
      graph.addEdge(`node${i - 1}`, `node${i}`, {
        weight: 1,
        consumes: { fuel: 0.1 },
      });
    }
  }

  // Try to find path with very short timeout (should fail)
  const result = graph.calculateShortestPath('node0', 'node999', {
    supplies: { fuel: 1000 },
    supplyCapacity: { fuel: 1000 },
    timeout: 1, // 1ms timeout - should trigger
  });

  // Should return empty path due to timeout
  expect(result.finalPath).toEqual([]);
  expect(result.pathProperties.priority).toBe(0);
  // Time taken should be close to timeout value (within reasonable margin)
  expect(result.pathProperties.timeTaken).toBeGreaterThanOrEqual(1);
  expect(result.pathProperties.timeTaken).toBeLessThan(50); // generous upper bound
});

test('test path completes within timeout', () => {
  // Small graph should complete well within timeout
  const graph = new DijkstraCalculator<'fuel'>();

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');

  graph.addEdge('A', 'B', { weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('B', 'C', { weight: 1, consumes: { fuel: 1 } });

  const result = graph.calculateShortestPath('A', 'C', {
    supplies: { fuel: 10 },
    supplyCapacity: { fuel: 10 },
    timeout: 1000, // 1 second timeout - should NOT trigger
  });

  // Should find the path successfully
  expect(result.finalPath).toEqual(['A', 'B', 'C']);
  expect(result.pathProperties.priority).toBe(2);
  expect(result.pathProperties.timeTaken).toBeLessThan(1000);
});

test('test bidirectional search with heuristic', () => {
  // Create a simple linear graph with coordinates - NO RESOURCES
  const locations: Record<string, { x: number; y: number }> = {
    A: { x: 0, y: 0 },
    B: { x: 1, y: 0 },
    C: { x: 2, y: 0 },
    D: { x: 3, y: 0 },
    E: { x: 4, y: 0 },
  };

  const graph = new DijkstraCalculator((nodeA, nodeB) => {
    return Math.abs(locations[nodeB].x - locations[nodeA].x);
  });

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');
  graph.addVertex('D');
  graph.addVertex('E');

  graph.addEdge('A', 'B', { weight: 1 });
  graph.addEdge('B', 'C', { weight: 1 });
  graph.addEdge('C', 'D', { weight: 1 });
  graph.addEdge('D', 'E', { weight: 1 });

  const result = graph.calculateBidirectionalPath('A', 'E');

  // Should find the correct path
  expect(result.finalPath.length).toBe(5); // ['A', 'B', 'C', 'D', 'E']
  expect(result.finalPath[0]).toBe('A');
  expect(result.finalPath[4]).toBe('E');
  expect(result.pathProperties.priority).toBeGreaterThan(0);
});

test('test bidirectional search requires heuristic', () => {
  // Graph without heuristic - should throw error
  const graph = new DijkstraCalculator();

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');

  graph.addEdge('A', 'B', { weight: 1 });
  graph.addEdge('B', 'C', { weight: 1 });

  // Should throw error when attempting bidirectional search without heuristic
  expect(() => {
    graph.calculateBidirectionalPath('A', 'C');
  }).toThrow('Bidirectional search requires a heuristic function');
});

test('test bidirectional search with complex graph', () => {
  // Create a grid graph to test bidirectional search - NO RESOURCES
  const locations: Record<string, { x: number; y: number }> = {};
  const graph = new DijkstraCalculator((nodeA, nodeB) => {
    return Math.sqrt(
      (locations[nodeB].x - locations[nodeA].x) ** 2 +
        (locations[nodeB].y - locations[nodeA].y) ** 2,
    );
  });

  // Create a 5x5 grid
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      const nodeId = `${x}_${y}`;
      locations[nodeId] = { x, y };
      graph.addVertex(nodeId);

      // Add edges to neighbors
      if (x > 0) {
        graph.addEdge(`${x - 1}_${y}`, nodeId, {
          weight: 1,
        });
      }
      if (y > 0) {
        graph.addEdge(`${x}_${y - 1}`, nodeId, {
          weight: 1,
        });
      }
    }
  }

  const result = graph.calculateBidirectionalPath('0_0', '4_4');

  // Should find a path connecting start to finish
  expect(result.finalPath.length).toBeGreaterThan(0);
  expect(result.finalPath[0]).toBe('0_0');
  expect(result.finalPath[result.finalPath.length - 1]).toBe('4_4');
  expect(result.pathProperties.priority).toBeGreaterThan(0);
});

// test('no possible traversal should have an empty result', (t) => {
//   const graph = new DijkstraCalculator();
//   graph.addVertex('A');
//   graph.addVertex('B');
//   graph.addVertex('C');
//   graph.addVertex('D');
//   graph.addVertex('E');
//   graph.addVertex('F');
//   // let's add a node here that's just floating out there
//   graph.addVertex('Z');
//
//   graph.addEdge('A', 'B', { weight: 4 });
//   graph.addEdge('A', 'C', { weight: 2 });
//   graph.addEdge('B', 'E', { weight: 3 });
//   graph.addEdge('C', 'D', { weight: 2 });
//   graph.addEdge('C', 'F', { weight: 4 });
//   graph.addEdge('D', 'E', { weight: 3 });
//   graph.addEdge('D', 'F', { weight: 1 });
//   graph.addEdge('E', 'F', { weight: 1 });
//   // do not any connection to Z
//
//   // ensure that there is an empty array.
//   t.deepEqual(graph.calculateShortestPath('Z', 'A'), {
//     finalPath: [],
//     pathProperties: { priority: 0, timeTaken: 0 },
//   });
//   t.deepEqual(graph.calculateShortestPathAsLinkedListResult('Z', 'A'), {
//     finalPath: [],
//     pathProperties: { priority: 0, timeTaken: 0 },
//   });
// });
//
// test('single node hop should only have 2 primitive array elements and one linked list result', (t) => {
//   const graph = new DijkstraCalculator();
//   graph.addVertex('A');
//   graph.addVertex('B');
//
//   graph.addEdge('A', 'B');
//   // do not any connection to Z
//
//   // ensure that there is an empty array.
//   t.deepEqual(graph.calculateShortestPath('A', 'B'), {
//     finalPath: ['A', 'B'],
//     pathProperties: { priority: 1, supplies: {}, timeTaken: 0 },
//   });
//   t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'B'), {
//     finalPath: [{ source: 'A', target: 'B' }],
//     pathProperties: { priority: 1, supplies: {}, timeTaken: 0 },
//   });
// });
