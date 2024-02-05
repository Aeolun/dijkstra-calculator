/**
 * A unique identifier for the
 */
export type NodeId = string;
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

type PartialRecord<K extends keyof any, T> = Partial<Record<K, T>>;

export interface LinkedListItem<RESOURCES extends string> {
  source: NodeId;
  target: NodeId;
  edge?: NodeId;
  consumes?: PartialRecord<RESOURCES, number>;
  recover?: PartialRecord<RESOURCES, number>;
  weight?: number;
  weightFromResources?: number;
  totalConsumed?: PartialRecord<RESOURCES, number>;
  totalRecovered?: PartialRecord<RESOURCES, number>;
}

export interface VertexProperties<RESOURCES extends string> {
  recover?: PartialRecord<
    RESOURCES,
    (
      currentLevel: number,
      maxLevel: number
    ) => {
      recoverAmount: number;
      cost: number;
    }
  >;
}

export interface EdgeProperties<RESOURCES extends string> {
  id?: string;
  weight: number;
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

  constructor(
    private heuristic?: (vertex: NodeId, target: NodeId) => number,
    private isDebugging = false
  ) {
    this.adjacencyList = {};
    this.vertexProperties = {};
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

  addEdge(
    vertex1: NodeId,
    vertex2: NodeId,
    properties: EdgeProperties<RESOURCES> = { weight: 1 }
  ) {
    this.ensureVertexAdjacencyList(vertex1).push({ id: vertex2, properties });
    this.ensureVertexAdjacencyList(vertex2).push({ id: vertex1, properties });
  }

  debug(...args: any[]) {
    if (this.isDebugging) console.log(...args);
  }

  calculateShortestRouteAsLinkedListResults(
    nodes: NodeId[],
    properties: Omit<PathProperties<RESOURCES>, 'priority'> = {}
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
        }
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
   * Given the provided weights of each edge
   * @param start The starting {@link NodeId} to begin traversal
   * @param finish The ending {@link NodeId} to complete traversal
   * @returns an {@type Array<string>} showing how to traverse the nodes. If traversal is impossible then it will return an empty array
   */
  calculateShortestPathAsLinkedListResult(
    start: NodeId,
    finish: NodeId,
    properties: Omit<PathProperties<RESOURCES>, 'priority'> = {}
  ): {
    finalPath: LinkedListItem<RESOURCES>[];
    pathProperties: PathReturnProperties<RESOURCES>;
  } {
    this.debug("Start running Dijkstra's algorithm");
    const startTime = Date.now();
    const nodes = new PriorityQueue();
    const distances: { [key: NodeId]: PathProperties<RESOURCES> } = {};
    const previous: { [key: NodeId]: NodeId } = {};
    const previousEdgeId: {
      [key: NodeId]: EdgeProperties<RESOURCES> | undefined;
    } = {};
    const path: PathNode<RESOURCES>[] = []; //to return at end
    let smallestNode: Node<RESOURCES> | null = null;
    let smallest: string | null = null;
    //build up initial state
    for (const vertex in this.adjacencyList) {
      if (vertex === start) {
        distances[vertex] = { ...properties, priority: 0 };
        nodes.enqueue(vertex, { ...properties, priority: 0 });
      } else {
        distances[vertex] = { ...properties, priority: Infinity };
        nodes.enqueue(vertex, { ...properties, priority: Infinity });
      }
      delete previous[vertex];
    }
    // as long as there is something to visit
    while (nodes.values.length) {
      smallestNode = nodes.dequeue();
      smallest = smallestNode.id;
      if (smallest === finish) {
        //WE ARE DONE
        //BUILD UP PATH TO RETURN AT END
        while (smallest && previous[smallest]) {
          path.push(
            previousEdgeId[smallest]
              ? { vertexId: smallest, ...previousEdgeId[smallest] }
              : { vertexId: smallest }
          );
          smallest = previous[smallest];
        }
        break;
      }
      if (smallest || distances[smallest].priority !== Infinity) {
        for (const neighbor in this.adjacencyList[smallest]) {
          //find neighboring node
          const nextNode = this.adjacencyList[smallest][neighbor];
          const nextVertexProperties = this.vertexProperties[nextNode.id];
          //calculate new distance to neighboring node
          let candidate =
            distances[smallest].priority +
            nextNode.properties.weight +
            (this.heuristic ? this.heuristic(nextNode.id, finish) : 0);
          const newSupplies: PartialRecord<RESOURCES, number> = {
            ...distances[smallest].supplies,
          };
          const totalConsumed: PartialRecord<RESOURCES, number> = {
            ...distances[smallest].totalConsumed,
          };
          const totalRecovered: PartialRecord<RESOURCES, number> = {
            ...distances[smallest].totalRecovered,
          };
          const totalResourceWeight: PartialRecord<RESOURCES, number> = {
            ...distances[smallest].resourceWeight,
          };
          let weightFromResources = 0;
          const recoverHere: Record<string, number> = {};
          if (nextNode.properties.consumes) {
            for (const supply in nextNode.properties.consumes) {
              const consumed = nextNode.properties.consumes[supply] ?? 0;
              const originalSupply = newSupplies[supply] ?? 0;
              newSupplies[supply] = originalSupply - consumed;
              totalConsumed[supply] = (totalConsumed[supply] ?? 0) + consumed;
            }
          }
          // any step with negative supplies is a step we can't take
          for (const supply in newSupplies) {
            const supp = newSupplies[supply];
            if (supp && supp < 0) {
              candidate += Math.abs(supp) * 100000;
            }
          }

          if (nextVertexProperties && nextVertexProperties.recover) {
            this.debug('recover found');
            for (const supply in nextVertexProperties.recover) {
              const smallestSupplies = distances[smallest].supplies;
              const supplyFunction = nextVertexProperties.recover[supply];
              const supplyCapacity = properties.supplyCapacity?.[supply];
              const currentSupply = newSupplies[supply] ?? 0;
              if (!supplyCapacity) {
                throw new Error(
                  'No capacity for supply ' + supply + ', cannot recover.'
                );
              }
              if (
                smallestSupplies &&
                smallestSupplies[supply] &&
                supplyFunction
              ) {
                const { recoverAmount, cost } = supplyFunction(
                  currentSupply,
                  supplyCapacity
                );
                // increase cost of path by the amount of resources we need to recover times the cost of recovering here

                candidate += cost;
                weightFromResources += cost;
                recoverHere[supply] = recoverAmount;
                totalResourceWeight[supply] =
                  (totalResourceWeight[supply] ?? 0) + cost;
                totalRecovered[supply] =
                  (totalRecovered[supply] ?? 0) + recoverAmount;
              }
              newSupplies[supply] = properties.supplyCapacity?.[supply] ?? 0;
            }
          }
          const newProperties: PathProperties<RESOURCES> = {
            supplies: newSupplies,
            priority: candidate,
            totalConsumed,
            totalRecovered,
            resourceWeight: totalResourceWeight,
          };
          this.debug(
            'On ',
            smallest,
            ' over ',
            nextNode.properties.id,
            ' traveling to ',
            nextNode.id,
            ' state at end of trip ',
            newProperties
          );
          const nextNeighbor = nextNode.id;
          if (candidate < distances[nextNeighbor].priority) {
            this.debug(
              'new smallest',
              candidate,
              'lower than',
              distances[nextNeighbor].priority,
              'for',
              nextNeighbor,
              'set recover',
              recoverHere
            );
            //updating new smallest distance to neighbor
            distances[nextNeighbor] = newProperties;
            //updating previous - How we got to neighbor
            previous[nextNeighbor] = smallest;
            previousEdgeId[nextNeighbor] = {
              ...nextNode.properties,
              recover: recoverHere,
              weightFromResources,
            };
            //enqueue in priority queue with new priority
            nodes.enqueue(nextNeighbor, newProperties);
          }
        }
      }
    }

    let finalPath: PathNode<RESOURCES>[] = [];
    if (!smallest) {
      finalPath = path.reverse();
    } else {
      finalPath = path
        .concat({
          vertexId: smallest,
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

    this.debug('final distance', distances[finish]);

    const linkedListItems: LinkedListItem<RESOURCES>[] = [];
    for (let i = 0; i < finalPath.length; i++) {
      if (i == finalPath.length - 1) {
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
              weightFromResources: finalPath[i + 1].weightFromResources,
              totalConsumed: finalPath[i + 1].totalConsumed,
              totalRecovered: finalPath[i + 1].totalRecovered,
            }
          : {
              source: finalPath[i].vertexId,
              target: finalPath[i + 1].vertexId,
            }
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
    properties: Omit<PathProperties<RESOURCES>, 'priority'> = {}
  ): { finalPath: string[]; pathProperties: PathReturnProperties<RESOURCES> } {
    const result = this.calculateShortestPathAsLinkedListResult(
      start,
      finish,
      properties
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
}
