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
        Math.pow(locations[B].x - locations[A].x, 2) +
          Math.pow(locations[B].y - locations[A].y, 2)
      ) * 0.5
    );
  });

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C', { recover: { fuel: { cost: 1 } } });
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
        Math.pow(locations[B].x - locations[A].x, 2) +
          Math.pow(locations[B].y - locations[A].y, 2)
      ) * 0.5
    );
  });

  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C', { recover: { fuel: { cost: 0 } } });
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
