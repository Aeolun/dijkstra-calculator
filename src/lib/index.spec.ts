import test from 'ava';

import { DijkstraCalculator } from './';

test('a graph with assigned weights', (t) => {
  const graph = new DijkstraCalculator();
  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');
  graph.addVertex('D');
  graph.addVertex('E');
  graph.addVertex('F');

  graph.addEdge('A', 'B', 4);
  graph.addEdge('A', 'C', 2);
  graph.addEdge('B', 'E', 3);
  graph.addEdge('C', 'D', 2);
  graph.addEdge('C', 'F', 4);
  graph.addEdge('D', 'E', 3);
  graph.addEdge('D', 'F', 1);
  graph.addEdge('E', 'F', 1);

  t.deepEqual(graph.calculateShortestPath('A', 'E'), {
    finalPath: ['A', 'C', 'D', 'F', 'E'],
    totalWeight: 6
  });
  t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'E'), {
    finalPath: [
      { source: 'A', target: 'C' },
      { source: 'C', target: 'D' },
      { source: 'D', target: 'F' },
      { source: 'F', target: 'E' },
    ],
    totalWeight: 6
  });
});

test('basic test with same weight', (t) => {
  const graph = new DijkstraCalculator();
  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');
  graph.addVertex('D');
  graph.addVertex('E');
  graph.addVertex('F');

  graph.addEdge('A', 'B');
  graph.addEdge('A', 'C');
  graph.addEdge('B', 'E');
  graph.addEdge('C', 'D');
  graph.addEdge('C', 'F');
  graph.addEdge('D', 'E');
  graph.addEdge('D', 'F');
  graph.addEdge('E', 'F');

  t.deepEqual(graph.calculateShortestPath('A', 'E'), { finalPath: ['A', 'B', 'E'], totalWeight: 2 });
  t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'E'), {
    finalPath: [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'E' },
    ],
    totalWeight: 2
  });
});

test('no possible traversal should have an empty result', (t) => {
  const graph = new DijkstraCalculator();
  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');
  graph.addVertex('D');
  graph.addVertex('E');
  graph.addVertex('F');
  // let's add a node here that's just floating out there
  graph.addVertex('Z');

  graph.addEdge('A', 'B', 4);
  graph.addEdge('A', 'C', 2);
  graph.addEdge('B', 'E', 3);
  graph.addEdge('C', 'D', 2);
  graph.addEdge('C', 'F', 4);
  graph.addEdge('D', 'E', 3);
  graph.addEdge('D', 'F', 1);
  graph.addEdge('E', 'F', 1);
  // do not any connection to Z

  // ensure that there is an empty array.
  t.deepEqual(graph.calculateShortestPath('Z', 'A'), { finalPath: [], totalWeight: 0 });
  t.deepEqual(graph.calculateShortestPathAsLinkedListResult('Z', 'A'), { finalPath: [], totalWeight: 0 });
});

test('single node hop should only have 2 primitive array elements and one linked list result', (t) => {
  const graph = new DijkstraCalculator();
  graph.addVertex('A');
  graph.addVertex('B');

  graph.addEdge('A', 'B');
  // do not any connection to Z

  // ensure that there is an empty array.
  t.deepEqual(graph.calculateShortestPath('A', 'B'), { finalPath: ['A', 'B'], totalWeight: 1 });
  t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'B'), {
    finalPath: [
      { source: 'A', target: 'B' },
    ],
    totalWeight: 1
  });
});
