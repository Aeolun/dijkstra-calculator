/**
 * A unique identifier for a vertex/node in the graph
 */
export type NodeId = string;

/**
 * Logger interface compatible with Pino.
 * Allows users to optionally provide their own logger (e.g., Pino, Winston, console).
 */
export interface Logger {
  debug(obj: unknown, msg?: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
}

/**
 * No-op logger that discards all log messages.
 * Used as default when no logger is provided.
 */
const noopLogger: Logger = {
  debug: () => {},
};
export interface Node<RESOURCES extends string> {
  id: NodeId;
  properties: PathProperties<RESOURCES>;
}
class PriorityQueue<RESOURCES extends string> {
  values: Node<RESOURCES>[];

  constructor() {
    this.values = [];
  }

  enqueue(id: NodeId, properties: PathProperties<RESOURCES>) {
    const newNode: Node<RESOURCES> = { id, properties };
    this.values.push(newNode);
    this.bubbleUp();
  }

  bubbleUp() {
    let idx = this.values.length - 1;
    const element = this.values[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.values[parentIdx];
      if (element.properties.priority >= parent.properties.priority) break;
      this.values[parentIdx] = element;
      this.values[idx] = parent;
      idx = parentIdx;
    }
  }
  dequeue() {
    const min = this.values[0];
    const end = this.values.pop();
    if (this.values.length > 0 && end) {
      this.values[0] = end;
      this.sinkDown();
    }
    return min;
  }
  sinkDown() {
    let idx = 0;
    const length = this.values.length;
    const element = this.values[0];
    while (true) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let leftChild: Node<RESOURCES> | undefined,
        rightChild: Node<RESOURCES> | undefined;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.values[leftChildIdx];
        if (leftChild.properties.priority < element.properties.priority) {
          swap = leftChildIdx;
        }
      }
      if (rightChildIdx < length) {
        rightChild = this.values[rightChildIdx];
        if (
          (swap === null &&
            rightChild.properties.priority < element.properties.priority) ||
          (swap !== null &&
            leftChild &&
            rightChild.properties.priority < leftChild.properties.priority)
        ) {
          swap = rightChildIdx;
        }
      }
      if (swap === null) break;
      this.values[idx] = this.values[swap];
      this.values[swap] = element;
      idx = swap;
    }
  }
}

// biome-ignore lint/suspicious/noExplicitAny: Required for generic record key constraint
type PartialRecord<K extends keyof any, T> = Partial<Record<K, T>>;

export interface LinkedListItem<RESOURCES extends string> {
  source: NodeId;
  target: NodeId;
  edge?: NodeId;
  consumes?: PartialRecord<RESOURCES, number>;
  recover?: PartialRecord<RESOURCES, number>;
  weight?: number;
  extraWeight?: number;
  supplies?: PartialRecord<RESOURCES, number>;
  weightFromResources?: number;
  totalConsumed?: PartialRecord<RESOURCES, number>;
  totalRecovered?: PartialRecord<RESOURCES, number>;
}

export interface VertexProperties<RESOURCES extends string> {
  recover?: PartialRecord<
    RESOURCES,
    (
      currentLevel: number,
      maxLevel: number,
    ) => {
      recoverAmount: number;
      cost: number;
    }
  >;
}

export interface EdgeProperties<RESOURCES extends string> {
  id?: string;
  weight: number;
  extraCost?: (
    current: PartialRecord<RESOURCES, number>,
    max: PartialRecord<RESOURCES, number>,
    spent: PartialRecord<RESOURCES, number>,
    finalStep: boolean,
  ) => number;
  extraWeight?: number;
  supplies?: PartialRecord<RESOURCES, number>;
  consumes?: PartialRecord<RESOURCES, number>;
  recover?: PartialRecord<RESOURCES, number>;
  totalConsumed?: PartialRecord<RESOURCES, number>;
  totalRecovered?: PartialRecord<RESOURCES, number>;
  weightFromResources?: number;
}

export interface PathProperties<RESOURCES extends string> {
  priority: number;
  supplies?: PartialRecord<RESOURCES, number>;
  supplyCapacity?: PartialRecord<RESOURCES, number>;
  totalConsumed?: PartialRecord<RESOURCES, number>;
  totalRecovered?: PartialRecord<RESOURCES, number>;
  resourceWeight?: PartialRecord<RESOURCES, number>;
  timeout?: number; // Maximum time in milliseconds before pathfinding aborts
}

export type PathReturnProperties<RESOURCES extends string> =
  PathProperties<RESOURCES> & {
    timeTaken: number;
  };

export type PathNode<RESOURCES extends string> = {
  vertexId: NodeId;
} & Partial<EdgeProperties<RESOURCES>>;

export class DijkstraCalculator<RESOURCES extends string> {
  adjacencyList: {
    [key: NodeId]: { id: NodeId; properties: EdgeProperties<RESOURCES> }[];
  };
  vertexProperties: { [key: NodeId]: VertexProperties<RESOURCES> };
  private logger: Logger;
  private heuristicCache?: Map<NodeId, number>;
  private disabledVertices: Set<NodeId> = new Set();

  constructor(
    private heuristic?: (vertex: NodeId, target: NodeId) => number,
    logger?: Logger,
  ) {
    this.adjacencyList = {};
    this.vertexProperties = {};
    this.logger = logger || noopLogger;
  }

  ensureVertexAdjacencyList(vertex: NodeId) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
    }
    return this.adjacencyList[vertex];
  }
  addVertex(vertex: NodeId, properties?: VertexProperties<RESOURCES>) {
    this.ensureVertexAdjacencyList(vertex);
    if (properties) {
      this.vertexProperties[vertex] = properties;
    }
  }

  /**
   * Adds an edge between two vertices
   * @param vertex1 The first vertex
   * @param vertex2 The second vertex
   * @param properties Edge properties including weight, consumption, etc.
   * @param directed If true, creates a directed edge from vertex1 to vertex2 only. If false (default), creates bidirectional edge
   */
  addEdge(
    vertex1: NodeId,
    vertex2: NodeId,
    properties: EdgeProperties<RESOURCES> = { weight: 1 },
    directed = false,
  ) {
    this.ensureVertexAdjacencyList(vertex1).push({ id: vertex2, properties });
    if (!directed) {
      this.ensureVertexAdjacencyList(vertex2).push({ id: vertex1, properties });
    }
  }

  /**
   * Removes all edges between two vertices.
   * @param vertex1 The first vertex
   * @param vertex2 The second vertex
   * @param directed If true, only removes edge from vertex1 to vertex2. If false (default), removes both directions.
   */
  removeEdge(vertex1: NodeId, vertex2: NodeId, directed = false) {
    if (this.adjacencyList[vertex1]) {
      this.adjacencyList[vertex1] = this.adjacencyList[vertex1].filter(
        (edge) => edge.id !== vertex2,
      );
    }
    if (!directed && this.adjacencyList[vertex2]) {
      this.adjacencyList[vertex2] = this.adjacencyList[vertex2].filter(
        (edge) => edge.id !== vertex1,
      );
    }
  }

  /**
   * Removes a vertex and all its edges from the graph.
   * @param vertex The vertex to remove
   */
  removeVertex(vertex: NodeId) {
    // Remove all edges pointing to this vertex from other vertices
    for (const v in this.adjacencyList) {
      this.adjacencyList[v] = this.adjacencyList[v].filter(
        (edge) => edge.id !== vertex,
      );
    }
    // Remove the vertex's own adjacency list
    delete this.adjacencyList[vertex];
    // Remove vertex properties if any
    delete this.vertexProperties[vertex];
  }

  calculateShortestRouteAsLinkedListResults(
    nodes: NodeId[],
    properties: Omit<PathProperties<RESOURCES>, 'priority'> = {},
  ) {
    // calculate route from first node hitting all specified nodes in order
    const startNode = nodes.shift();
    if (!startNode) {
      throw new Error('No nodes provided');
    }

    const results: {
      finalPath: LinkedListItem<RESOURCES>[];
      pathProperties: PathReturnProperties<RESOURCES>;
    } = {
      finalPath: [],
      pathProperties: {
        priority: 0,
        timeTaken: 0,
        supplies: {},
        totalConsumed: {},
        totalRecovered: {},
        resourceWeight: {},
      },
    };

    let currentNode = startNode;
    while (nodes.length > 0) {
      const nextNode = nodes.shift();
      if (!nextNode) {
        throw new Error('No nodes provided');
      }
      const route = this.calculateShortestPathAsLinkedListResult(
        currentNode,
        nextNode,
        {
          ...properties,
          supplies: {
            ...properties.supplies,
            ...results.pathProperties.supplies,
          },
        },
      );
      results.finalPath = results.finalPath.concat(route.finalPath);
      results.pathProperties.priority += route.pathProperties.priority;
      results.pathProperties.timeTaken += route.pathProperties.timeTaken;
      for (const supply in route.pathProperties.supplies) {
        if (results.pathProperties.supplies) {
          results.pathProperties.supplies[supply] =
            (results.pathProperties.supplies[supply] ?? 0) +
            (route.pathProperties.supplies?.[supply] ?? 0);
        }
      }
      for (const supply in route.pathProperties.totalConsumed) {
        if (results.pathProperties.totalConsumed) {
          results.pathProperties.totalConsumed[supply] =
            (results.pathProperties.totalConsumed[supply] ?? 0) +
            (route.pathProperties.totalConsumed?.[supply] ?? 0);
        }
      }
      for (const supply in route.pathProperties.totalRecovered) {
        if (results.pathProperties.totalRecovered) {
          results.pathProperties.totalRecovered[supply] =
            (results.pathProperties.totalRecovered[supply] ?? 0) +
            (route.pathProperties.totalRecovered?.[supply] ?? 0);
        }
      }
      for (const supply in route.pathProperties.resourceWeight) {
        if (results.pathProperties.resourceWeight) {
          results.pathProperties.resourceWeight[supply] =
            (results.pathProperties.resourceWeight[supply] ?? 0) +
            (route.pathProperties.resourceWeight?.[supply] ?? 0);
        }
      }
      currentNode = nextNode;
    }

    return results;
  }

  /**
   * Bidirectional A* search for graphs without resource constraints.
   * Searches from both start and end simultaneously, which can significantly
   * reduce the search space for long paths in large graphs.
   *
   * IMPORTANT: This method does NOT support resource management (fuel, supplies, etc.).
   * For graphs with resources, use the standard calculateShortestPath methods.
   *
   * @param start The starting node ID
   * @param finish The ending node ID
   * @param timeout Optional maximum time in milliseconds before aborting
   * @returns Path result with node array and total cost
   * @throws Error if start or finish nodes don't exist, or if no heuristic is defined
   */
  calculateBidirectionalPath(
    start: NodeId,
    finish: NodeId,
    options: { timeout?: number } = {},
  ): {
    finalPath: string[];
    pathProperties: { priority: number; timeTaken: number };
  } {
    // Validation
    if (!this.adjacencyList[start]) {
      throw new Error(`Start node "${start}" does not exist in graph`);
    }
    if (!this.adjacencyList[finish]) {
      throw new Error(`Finish node "${finish}" does not exist in graph`);
    }
    if (!this.heuristic) {
      throw new Error('Bidirectional search requires a heuristic function');
    }
    if (this.disabledVertices.has(start) || this.disabledVertices.has(finish)) {
      return {
        finalPath: [],
        pathProperties: { priority: 0, timeTaken: 0 },
      };
    }

    this.logger.debug('Start running bidirectional A* search');
    const startTime = Date.now();

    // Forward search (from start)
    const forwardQueue = new PriorityQueue<RESOURCES>();
    const forwardDistances: { [key: NodeId]: { priority: number } } = {};
    const forwardPrevious: { [key: NodeId]: NodeId } = {};

    // Backward search (from finish)
    const backwardQueue = new PriorityQueue<RESOURCES>();
    const backwardDistances: { [key: NodeId]: { priority: number } } = {};
    const backwardPrevious: { [key: NodeId]: NodeId } = {};

    // Best meeting point
    let bestCost = Infinity;
    let meetingNode: NodeId | null = null;

    const deadline = options.timeout ? startTime + options.timeout : undefined;

    // Initialize forward search
    forwardDistances[start] = { priority: 0 };
    forwardQueue.enqueue(start, { priority: 0 } as PathProperties<RESOURCES>);

    // Initialize backward search
    backwardDistances[finish] = { priority: 0 };
    backwardQueue.enqueue(finish, { priority: 0 } as PathProperties<RESOURCES>);

    // Alternate between forward and backward search
    while (forwardQueue.values.length > 0 || backwardQueue.values.length > 0) {
      // Check timeout
      if (deadline && Date.now() > deadline) {
        this.logger.debug('Bidirectional search timeout exceeded');
        return {
          finalPath: [],
          pathProperties: { priority: 0, timeTaken: Date.now() - startTime },
        };
      }

      // Forward step
      if (forwardQueue.values.length > 0) {
        const current = forwardQueue.dequeue();
        if (!current) break;
        const currentId = current.id;

        // Skip stale entries
        if (
          forwardDistances[currentId] &&
          current.properties.priority > forwardDistances[currentId].priority
        ) {
          continue;
        }

        // Check if we've met the backward search
        if (backwardDistances[currentId]) {
          const totalCost =
            forwardDistances[currentId].priority +
            backwardDistances[currentId].priority;
          if (totalCost < bestCost) {
            bestCost = totalCost;
            meetingNode = currentId;
            // Early termination - we found a path
            break;
          }
        }

        // Expand forward
        if (forwardDistances[currentId].priority < bestCost) {
          for (const neighbor in this.adjacencyList[currentId]) {
            const nextNode = this.adjacencyList[currentId][neighbor];
            const nextId = nextNode.id;

            // Skip disabled vertices
            if (this.disabledVertices.has(nextId)) {
              continue;
            }

            // Initialize if not discovered
            if (!(nextId in forwardDistances)) {
              forwardDistances[nextId] = { priority: Infinity };
            }

            const newCost =
              forwardDistances[currentId].priority +
              nextNode.properties.weight +
              this.heuristic(nextId, finish);

            if (newCost < forwardDistances[nextId].priority) {
              forwardDistances[nextId] = { priority: newCost };
              forwardPrevious[nextId] = currentId;
              forwardQueue.enqueue(nextId, {
                priority: newCost,
              } as PathProperties<RESOURCES>);
            }
          }
        }
      }

      // Backward step
      if (backwardQueue.values.length > 0) {
        const current = backwardQueue.dequeue();
        if (!current) break;
        const currentId = current.id;

        // Skip stale entries
        if (
          backwardDistances[currentId] &&
          current.properties.priority > backwardDistances[currentId].priority
        ) {
          continue;
        }

        // Check if we've met the forward search
        if (forwardDistances[currentId]) {
          const totalCost =
            forwardDistances[currentId].priority +
            backwardDistances[currentId].priority;
          if (totalCost < bestCost) {
            bestCost = totalCost;
            meetingNode = currentId;
          }
        }

        // Expand backward (traverse edges in reverse)
        if (backwardDistances[currentId].priority < bestCost) {
          for (const neighbor in this.adjacencyList[currentId]) {
            const nextNode = this.adjacencyList[currentId][neighbor];
            const nextId = nextNode.id;

            // Skip disabled vertices
            if (this.disabledVertices.has(nextId)) {
              continue;
            }

            // Initialize if not discovered
            if (!(nextId in backwardDistances)) {
              backwardDistances[nextId] = { priority: Infinity };
            }

            const newCost =
              backwardDistances[currentId].priority +
              nextNode.properties.weight +
              this.heuristic(nextId, start);

            if (newCost < backwardDistances[nextId].priority) {
              backwardDistances[nextId] = { priority: newCost };
              backwardPrevious[nextId] = currentId;
              backwardQueue.enqueue(nextId, {
                priority: newCost,
              } as PathProperties<RESOURCES>);
            }
          }
        }
      }
    }

    // If no meeting point found, no path exists
    if (!meetingNode) {
      return {
        finalPath: [],
        pathProperties: { priority: 0, timeTaken: Date.now() - startTime },
      };
    }

    // Reconstruct path from start to meeting point
    const forwardPath: NodeId[] = [];
    let current: NodeId | undefined = meetingNode;
    while (current && current !== start) {
      forwardPath.unshift(current);
      current = forwardPrevious[current];
    }
    forwardPath.unshift(start);

    // Reconstruct path from meeting point to finish
    const backwardPath: NodeId[] = [];
    current = backwardPrevious[meetingNode];
    while (current) {
      backwardPath.push(current);
      current = backwardPrevious[current];
    }

    // Combine paths
    const fullPath = [...forwardPath, ...backwardPath];

    return {
      finalPath: fullPath,
      pathProperties: {
        priority: bestCost,
        timeTaken: Date.now() - startTime,
      },
    };
  }

  /**
   * Given the provided weights of each edge
   * @param start The starting {@link NodeId} to begin traversal
   * @param finish The ending {@link NodeId} to complete traversal
   * @returns an {@type Array<string>} showing how to traverse the nodes. If traversal is impossible then it will return an empty array
   */
  calculateShortestPathAsLinkedListResult(
    start: NodeId,
    finish: NodeId,
    properties: Omit<PathProperties<RESOURCES>, 'priority'> = {},
  ): {
    finalPath: LinkedListItem<RESOURCES>[];
    pathProperties: PathReturnProperties<RESOURCES>;
  } {
    // Input validation
    if (!this.adjacencyList[start]) {
      throw new Error(`Start node "${start}" does not exist in graph`);
    }
    if (!this.adjacencyList[finish]) {
      throw new Error(`Finish node "${finish}" does not exist in graph`);
    }
    if (this.disabledVertices.has(start) || this.disabledVertices.has(finish)) {
      return {
        finalPath: [],
        pathProperties: { priority: 0, timeTaken: 0 },
      };
    }

    this.logger.debug("Start running Dijkstra's algorithm");
    const startTime = Date.now();
    const nodes = new PriorityQueue();
    const distances: { [key: NodeId]: PathProperties<RESOURCES> } = {};
    const previous: { [key: NodeId]: NodeId } = {};
    const previousEdgeId: {
      [key: NodeId]: EdgeProperties<RESOURCES> | undefined;
    } = {};
    const path: PathNode<RESOURCES>[] = []; //to return at end
    let currentNode: Node<RESOURCES> | null = null;
    let currentNodeId: string | null = null;

    // Pre-compute heuristic values for all vertices if heuristic function provided
    if (this.heuristic) {
      this.heuristicCache = new Map();
      for (const vertex in this.adjacencyList) {
        this.heuristicCache.set(vertex, this.heuristic(vertex, finish));
      }
    }

    // Initialize only the start vertex - other vertices discovered lazily
    distances[start] = { ...properties, priority: 0 };
    nodes.enqueue(start, distances[start]);

    const timeoutMs = properties.timeout;
    const deadline = timeoutMs ? startTime + timeoutMs : undefined;

    // as long as there is something to visit
    while (nodes.values.length) {
      // Check timeout periodically (every iteration is too expensive at 350k nodes)
      if (deadline && Date.now() > deadline) {
        this.logger.debug('Pathfinding timeout exceeded');
        // Return empty result on timeout
        return {
          finalPath: [],
          pathProperties: { priority: 0, timeTaken: Date.now() - startTime },
        };
      }

      currentNode = nodes.dequeue();
      if (!currentNode) break;
      currentNodeId = currentNode.id;

      // Skip stale entries (lazy deletion) - if we've already processed this node with a better distance
      if (
        distances[currentNodeId] &&
        currentNode.properties.priority > distances[currentNodeId].priority
      ) {
        continue;
      }

      if (currentNodeId === finish) {
        //WE ARE DONE
        //BUILD UP PATH TO RETURN AT END
        while (currentNodeId && previous[currentNodeId]) {
          path.push(
            previousEdgeId[currentNodeId]
              ? { vertexId: currentNodeId, ...previousEdgeId[currentNodeId] }
              : { vertexId: currentNodeId },
          );
          currentNodeId = previous[currentNodeId];
        }
        break;
      }
      if (currentNodeId && distances[currentNodeId].priority !== Infinity) {
        for (const neighbor in this.adjacencyList[currentNodeId]) {
          //find neighboring node
          const nextNode = this.adjacencyList[currentNodeId][neighbor];
          const nextNeighbor = nextNode.id;

          // Skip disabled vertices
          if (this.disabledVertices.has(nextNeighbor)) {
            continue;
          }

          // Initialize neighbor vertex if not yet discovered
          if (!(nextNeighbor in distances)) {
            distances[nextNeighbor] = { ...properties, priority: Infinity };
          }

          // Early rejection: check base cost before expensive allocations
          const baseCost =
            distances[currentNodeId].priority + nextNode.properties.weight;
          if (baseCost >= distances[nextNeighbor].priority) {
            // Even without considering resources/heuristic, this path isn't better
            // Skip expensive object allocations
            continue;
          }

          const nextVertexProperties = this.vertexProperties[nextNode.id];
          //calculate new distance to neighboring node

          const newSupplies: PartialRecord<RESOURCES, number> = {
            ...distances[currentNodeId].supplies,
          };
          const totalConsumed: PartialRecord<RESOURCES, number> = {
            ...distances[currentNodeId].totalConsumed,
          };
          const totalRecovered: PartialRecord<RESOURCES, number> = {
            ...distances[currentNodeId].totalRecovered,
          };
          const totalResourceWeight: PartialRecord<RESOURCES, number> = {
            ...distances[currentNodeId].resourceWeight,
          };
          let weightFromResources = 0;
          const recoverHere: PartialRecord<RESOURCES, number> = {};
          if (nextNode.properties.consumes) {
            for (const supply in nextNode.properties.consumes) {
              const consumed = nextNode.properties.consumes[supply] ?? 0;
              const originalSupply = newSupplies[supply] ?? 0;
              newSupplies[supply] = originalSupply - consumed;
              totalConsumed[supply] = (totalConsumed[supply] ?? 0) + consumed;
            }
          }

          // Calculate base cost first
          let candidate = baseCost;

          // Apply negative resource penalty BEFORE heuristic to maintain A* admissibility
          for (const supply in newSupplies) {
            const supp = newSupplies[supply];
            if (supp && supp < 0) {
              candidate += Math.abs(supp) * 100000;
            }
          }

          // Now add heuristic from cache
          candidate += this.heuristicCache?.get(nextNode.id) ?? 0;

          // Calculate extra cost BEFORE recovery so it sees post-consumption, pre-recovery state
          // This allows the cost function to make decisions based on low resource situations
          const extraWeight = nextNode.properties.extraCost
            ? nextNode.properties.extraCost(
                newSupplies,
                properties.supplyCapacity ?? {},
                nextNode.properties.consumes ?? {},
                nextNode.id === finish,
              )
            : 0;
          candidate += extraWeight;

          if (nextVertexProperties?.recover) {
            this.logger.debug('recover found');
            for (const supply in nextVertexProperties.recover) {
              const currentNodeSupplies = distances[currentNodeId].supplies;
              const supplyFunction = nextVertexProperties.recover[supply];
              const supplyCapacity = properties.supplyCapacity?.[supply];
              const currentSupply = newSupplies[supply] ?? 0;
              if (!supplyCapacity) {
                throw new Error(
                  `No capacity for supply ${supply}, cannot recover.`,
                );
              }
              if (currentNodeSupplies?.[supply] && supplyFunction) {
                const { recoverAmount, cost } = supplyFunction(
                  currentSupply,
                  supplyCapacity,
                );
                // increase cost of path by the amount of resources we need to recover times the cost of recovering here

                candidate += cost;
                weightFromResources += cost;
                recoverHere[supply] = recoverAmount;
                totalResourceWeight[supply] =
                  (totalResourceWeight[supply] ?? 0) + cost;
                totalRecovered[supply] =
                  (totalRecovered[supply] ?? 0) + recoverAmount;

                // Apply the calculated recovery amount, not the max capacity
                newSupplies[supply] = currentSupply + recoverAmount;
              }
            }
          }

          const newProperties: PathProperties<RESOURCES> = {
            supplies: newSupplies,
            priority: candidate,
            totalConsumed,
            totalRecovered,
            resourceWeight: totalResourceWeight,
          };
          this.logger.debug(
            {
              from: currentNodeId,
              via: nextNode.properties.id,
              to: nextNode.id,
              state: newProperties,
            },
            'Traversing edge',
          );

          if (candidate < distances[nextNeighbor].priority) {
            this.logger.debug(
              {
                node: nextNeighbor,
                newPriority: candidate,
                oldPriority: distances[nextNeighbor].priority,
                recover: recoverHere,
              },
              'Found better path',
            );
            //updating new distance to neighbor
            distances[nextNeighbor] = newProperties;
            //updating previous - How we got to neighbor
            previous[nextNeighbor] = currentNodeId;
            previousEdgeId[nextNeighbor] = {
              ...nextNode.properties,
              recover: recoverHere,
              supplies: newSupplies,
              weightFromResources,
              extraWeight,
            };
            //enqueue in priority queue with new priority
            nodes.enqueue(nextNeighbor, newProperties);
          }
        }
      }
    }

    let finalPath: PathNode<RESOURCES>[] = [];
    if (!currentNodeId) {
      finalPath = path.reverse();
    } else {
      finalPath = path
        .concat({
          vertexId: currentNodeId,
        })
        .reverse();
    }

    if (finalPath.length <= 1) {
      // if the final path has only 1 or fewer elements, there was no traversal that was possible.
      return {
        finalPath: [],
        pathProperties: { priority: 0, timeTaken: Date.now() - startTime },
      };
    }

    this.logger.debug(
      { distance: distances[finish] },
      'Final distance calculated',
    );

    const linkedListItems: LinkedListItem<RESOURCES>[] = [];
    for (let i = 0; i < finalPath.length; i++) {
      if (i === finalPath.length - 1) {
        break;
      }
      linkedListItems.push(
        finalPath[i + 1].id
          ? {
              source: finalPath[i].vertexId,
              target: finalPath[i + 1].vertexId,
              edge: finalPath[i + 1].id,
              consumes: finalPath[i + 1].consumes,
              recover: finalPath[i + 1].recover,
              weight: finalPath[i + 1].weight,
              supplies: finalPath[i + 1].supplies,
              weightFromResources: finalPath[i + 1].weightFromResources,
              totalConsumed: finalPath[i + 1].totalConsumed,
              totalRecovered: finalPath[i + 1].totalRecovered,
              extraWeight: finalPath[i + 1].extraWeight,
            }
          : {
              source: finalPath[i].vertexId,
              target: finalPath[i + 1].vertexId,
            },
      );
    }
    return {
      finalPath: linkedListItems,
      pathProperties: {
        ...distances[finish],
        timeTaken: Date.now() - startTime,
      },
    };
  }

  /**
   * Creates a linked list of the result with each element with a source and target property
   * @param start The starting {@link NodeId} to begin traversal
   * @param finish The ending {@link NodeId} to complete traversal
   * @returns Returns an array where each element is a {@link LinkedListItem}
   */
  calculateShortestPath(
    start: NodeId,
    finish: NodeId,
    properties: Omit<PathProperties<RESOURCES>, 'priority'> = {},
  ): { finalPath: string[]; pathProperties: PathReturnProperties<RESOURCES> } {
    const result = this.calculateShortestPathAsLinkedListResult(
      start,
      finish,
      properties,
    );

    const finalPath: string[] = [];
    if (result.finalPath.length > 0) {
      result.finalPath.forEach((item, index) => {
        if (index === 0) finalPath.push(item.source);
        finalPath.push(item.target);
      });
    }

    return {
      finalPath,
      pathProperties: result.pathProperties,
    };
  }

  /**
   * Temporarily disable a vertex without removing it from the graph.
   * Disabled vertices are skipped during pathfinding.
   * @param vertex The vertex to disable
   */
  disableVertex(vertex: NodeId) {
    this.disabledVertices.add(vertex);
  }

  /**
   * Re-enable a previously disabled vertex.
   * @param vertex The vertex to enable
   */
  enableVertex(vertex: NodeId) {
    this.disabledVertices.delete(vertex);
  }

  /**
   * Check if a vertex is currently disabled.
   * @param vertex The vertex to check
   * @returns true if the vertex is disabled
   */
  isVertexDisabled(vertex: NodeId): boolean {
    return this.disabledVertices.has(vertex);
  }

  /**
   * Find all nodes reachable within a maximum number of edges (hops) from the start node.
   * Uses BFS traversal, ignoring edge weights.
   * @param start The starting node
   * @param maxEdges Maximum number of edges to traverse
   * @returns Array of all reachable node IDs (including start)
   */
  getNodesWithinEdges(start: NodeId, maxEdges: number): NodeId[] {
    if (this.disabledVertices.has(start)) {
      return [];
    }

    const visited = new Set<NodeId>();
    const result = new Set<NodeId>();
    const queue: Array<{ node: NodeId; distance: number }> = [];

    queue.push({ node: start, distance: 0 });
    visited.add(start);
    result.add(start);

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const { node: currentNode, distance } = item;

      if (distance >= maxEdges) {
        continue;
      }

      const edges = this.adjacencyList[currentNode];
      if (edges) {
        for (const edge of edges) {
          if (!visited.has(edge.id) && !this.disabledVertices.has(edge.id)) {
            visited.add(edge.id);
            result.add(edge.id);
            queue.push({ node: edge.id, distance: distance + 1 });
          }
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Find all nodes at exactly the specified number of edges (hops) from the start node.
   * Uses BFS traversal, ignoring edge weights.
   * @param start The starting node
   * @param exactEdges Exact number of edges from start
   * @returns Array of node IDs at exactly that distance
   */
  getNodesAtExactDistance(start: NodeId, exactEdges: number): NodeId[] {
    if (this.disabledVertices.has(start)) {
      return [];
    }

    const visited = new Set<NodeId>();
    const result = new Set<NodeId>();
    const queue: Array<{ node: NodeId; distance: number }> = [];

    queue.push({ node: start, distance: 0 });
    visited.add(start);

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const { node: currentNode, distance } = item;

      if (distance === exactEdges) {
        result.add(currentNode);
        continue;
      }

      if (distance < exactEdges) {
        const edges = this.adjacencyList[currentNode];
        if (edges) {
          for (const edge of edges) {
            if (!visited.has(edge.id) && !this.disabledVertices.has(edge.id)) {
              visited.add(edge.id);
              queue.push({ node: edge.id, distance: distance + 1 });
            }
          }
        }
      }
    }

    return Array.from(result);
  }
}
