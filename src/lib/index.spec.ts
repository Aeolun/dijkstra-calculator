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

  graph.addEdge('A', 'B', { weight: 4 });
  graph.addEdge('A', 'C', { weight: 2 });
  graph.addEdge('B', 'E', { weight: 3 });
  graph.addEdge('C', 'D', { weight: 2 });
  graph.addEdge('C', 'F', { weight: 4 });
  graph.addEdge('D', 'E', { weight: 3 });
  graph.addEdge('D', 'F', { weight: 1 });
  graph.addEdge('E', 'F', { weight: 1 });

  t.deepEqual(graph.calculateShortestPath('A', 'E'), {
    finalPath: [
      {
        vertexId: 'A',
      },
      {
        vertexId: 'C',
      },
      {
        vertexId: 'D',
      },
      {
        vertexId: 'F',
      },
      {
        vertexId: 'E',
      },
    ],
    pathProperties: { priority: 6, supplies: {} },
  });
  t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'E'), {
    finalPath: [
      { source: 'A', target: 'C' },
      { source: 'C', target: 'D' },
      { source: 'D', target: 'F' },
      { source: 'F', target: 'E' },
    ],
    pathProperties: { priority: 6, supplies: {} },
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

  t.deepEqual(graph.calculateShortestPath('A', 'E'), {
    finalPath: [
      {
        vertexId: 'A',
      },
      {
        vertexId: 'B',
      },
      {
        vertexId: 'E',
      },
    ],
    pathProperties: { priority: 2, supplies: {} },
  });
  t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'E'), {
    finalPath: [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'E' },
    ],
    pathProperties: { priority: 2, supplies: {} },
  });
});

test('basic test with multiple weights', (t) => {
  const graph = new DijkstraCalculator();
  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C');
  graph.addVertex('D');
  graph.addVertex('E');
  graph.addVertex('F');

  graph.addEdge('A', 'B', { weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('A', 'C', { weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('B', 'D', { weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('B', 'E', { weight: 1, consumes: { fuel: 10 } });
  graph.addEdge('C', 'D', { weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('C', 'F', { weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('D', 'E', { weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('D', 'F', { weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('E', 'F', { weight: 1, consumes: { fuel: 1 } });

  t.deepEqual(
    graph.calculateShortestPath('A', 'E', { supplies: { fuel: 3 } }),
    {
      finalPath: [
        {
          vertexId: 'A',
        },
        {
          vertexId: 'B',
        },
        {
          vertexId: 'D',
        },
        {
          vertexId: 'E',
        },
      ],
      pathProperties: {
        priority: 3,
        supplies: {
          fuel: 0,
        },
      },
    }
  );
  t.deepEqual(
    graph.calculateShortestPathAsLinkedListResult('A', 'E', {
      supplies: { fuel: 3 },
    }),
    {
      finalPath: [
        { source: 'A', target: 'B' },
        { source: 'B', target: 'D' },
        { source: 'D', target: 'E' },
      ],
      pathProperties: {
        priority: 3,
        supplies: {
          fuel: 0,
        },
      },
    }
  );
});

test('complex test with refueling', (t) => {
  const graph = new DijkstraCalculator();
  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C', { recover: { fuel: true } });
  graph.addVertex('D');
  graph.addVertex('E');
  graph.addVertex('F');

  graph.addEdge('A', 'B', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('A', 'C', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('B', 'D', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('C', 'D', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('C', 'F', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('D', 'E', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('D', 'F', { id: 'warp', weight: 1, consumes: { fuel: 1 } });
  graph.addEdge('E', 'F', { id: 'warp', weight: 1, consumes: { fuel: 1 } });

  t.deepEqual(
    graph.calculateShortestPath('A', 'E', { supplies: { fuel: 2 } }),
    {
      finalPath: [
        {
          vertexId: 'A',
        },
        {
          vertexId: 'C',
          edgeId: 'warp',
        },
        {
          vertexId: 'F',
          edgeId: 'warp',
        },
        {
          vertexId: 'E',
          edgeId: 'warp',
        },
      ],
      pathProperties: {
        priority: 3,
        supplies: {
          fuel: 0,
        },
      },
    }
  );
  t.deepEqual(
    graph.calculateShortestPathAsLinkedListResult('A', 'E', {
      supplies: { fuel: 2 },
    }),
    {
      finalPath: [
        { source: 'A', target: 'C', edgeId: 'warp' },
        { source: 'C', target: 'F', edgeId: 'warp' },
        { source: 'F', target: 'E', edgeId: 'warp' },
      ],
      pathProperties: {
        priority: 3,
        supplies: {
          fuel: 0,
        },
      },
    }
  );
});

test('complex test with multiple edge options', (t) => {
  const graph = new DijkstraCalculator();
  graph.addVertex('A');
  graph.addVertex('B');
  graph.addVertex('C', { recover: { fuel: true } });
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

  t.deepEqual(
    graph.calculateShortestPath('A', 'E', { supplies: { fuel: 10 } }),
    {
      finalPath: [
        {
          vertexId: 'A',
        },
        {
          vertexId: 'B',
          edgeId: 'burn',
        },
        {
          vertexId: 'D',
          edgeId: 'burn',
        },
        {
          vertexId: 'E',
          edgeId: 'warp',
        },
      ],
      pathProperties: {
        priority: 4,
        supplies: {
          fuel: 5,
        },
      },
    }
  );
  t.deepEqual(
    graph.calculateShortestPathAsLinkedListResult('A', 'E', {
      supplies: { fuel: 10 },
    }),
    {
      finalPath: [
        { source: 'A', target: 'B', edgeId: 'burn' },
        { source: 'B', target: 'D', edgeId: 'burn' },
        { source: 'D', target: 'E', edgeId: 'warp' },
      ],
      pathProperties: {
        priority: 4,
        supplies: {
          fuel: 5,
        },
      },
    }
  );
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

  graph.addEdge('A', 'B', { weight: 4 });
  graph.addEdge('A', 'C', { weight: 2 });
  graph.addEdge('B', 'E', { weight: 3 });
  graph.addEdge('C', 'D', { weight: 2 });
  graph.addEdge('C', 'F', { weight: 4 });
  graph.addEdge('D', 'E', { weight: 3 });
  graph.addEdge('D', 'F', { weight: 1 });
  graph.addEdge('E', 'F', { weight: 1 });
  // do not any connection to Z

  // ensure that there is an empty array.
  t.deepEqual(graph.calculateShortestPath('Z', 'A'), {
    finalPath: [],
    pathProperties: { priority: 0 },
  });
  t.deepEqual(graph.calculateShortestPathAsLinkedListResult('Z', 'A'), {
    finalPath: [],
    pathProperties: { priority: 0 },
  });
});

test('single node hop should only have 2 primitive array elements and one linked list result', (t) => {
  const graph = new DijkstraCalculator();
  graph.addVertex('A');
  graph.addVertex('B');

  graph.addEdge('A', 'B');
  // do not any connection to Z

  // ensure that there is an empty array.
  t.deepEqual(graph.calculateShortestPath('A', 'B'), {
    finalPath: [
      {
        vertexId: 'A',
      },
      {
        vertexId: 'B',
      },
    ],
    pathProperties: { priority: 1, supplies: {} },
  });
  t.deepEqual(graph.calculateShortestPathAsLinkedListResult('A', 'B'), {
    finalPath: [{ source: 'A', target: 'B' }],
    pathProperties: { priority: 1, supplies: {} },
  });
});
