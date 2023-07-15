/**
 * A unique identifier for the
 */
export type NodeId = string;
export interface Node {
  id: NodeId;
  properties: PathProperties;
}
class PriorityQueue {
  values: Node[];

  constructor() {
    this.values = [];
  }

  enqueue(id: NodeId, properties: PathProperties) {
    const newNode: Node = { id, properties };
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
      let leftChild: Node | undefined, rightChild: Node | undefined;
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

export interface LinkedListItem {
  source: NodeId;
  target: NodeId;
  edge?: NodeId;
  consumes?: Record<string, number>;
  recover?: Record<string, number>;
  weight?: number;
}

export interface VertexProperties {
  recover?: Record<string, boolean>;
}

export interface EdgeProperties {
  id?: string;
  weight: number;
  consumes?: Record<string, number>;
  recover?: Record<string, number>;
}

export interface PathProperties {
  priority: number;
  supplies?: Record<string, number>;
  maxSupplies?: Record<string, number>;
}

export type PathReturnProperties = PathProperties & {
  timeTaken: number;
};

export type PathNode = {
  vertexId: NodeId;
} & Partial<EdgeProperties>;

export class DijkstraCalculator {
  adjacencyList: {
    [key: NodeId]: { id: NodeId; properties: EdgeProperties }[];
  };
  vertexProperties: { [key: NodeId]: VertexProperties };

  constructor(
    private heuristic?: (vertex: NodeId, target: NodeId) => number,
    private isDebugging = false
  ) {
    this.adjacencyList = {};
    this.vertexProperties = {};
  }

  addVertex(vertex: NodeId, properties?: VertexProperties) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
      if (properties) {
        this.vertexProperties[vertex] = properties;
      }
    }
  }

  addEdge(
    vertex1: NodeId,
    vertex2: NodeId,
    properties: EdgeProperties = { weight: 1 }
  ) {
    this.adjacencyList[vertex1].push({ id: vertex2, properties });
    this.adjacencyList[vertex2].push({ id: vertex1, properties });
  }

  debug(...args: any[]) {
    if (this.isDebugging) console.log(...args);
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
    properties: Omit<PathProperties, 'priority'> = {}
  ): { finalPath: LinkedListItem[]; pathProperties: PathReturnProperties } {
    this.debug("Start running Dijkstra's algorithm");
    const startTime = Date.now();
    const nodes = new PriorityQueue();
    const distances: { [key: NodeId]: PathProperties } = {};
    const previous: { [key: NodeId]: NodeId } = {};
    const previousEdgeId: { [key: NodeId]: EdgeProperties | undefined } = {};
    const path: PathNode[] = []; //to return at end
    let smallestNode: Node | null = null;
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
          const newSupplies = { ...distances[smallest].supplies };
          let recoverHere: Record<string, number> = {};
          if (nextNode.properties.consumes) {
            for (const supply in nextNode.properties.consumes) {
              if (newSupplies[supply]) {
                newSupplies[supply] -= nextNode.properties.consumes[supply];
              } else {
                newSupplies[supply] = -nextNode.properties.consumes[supply];
              }
              if (newSupplies[supply] < 0) {
                candidate += 1000000000;
              }
            }
          }
          if (nextVertexProperties && nextVertexProperties.recover) {
            this.debug('recover found');
            for (const supply in nextVertexProperties.recover) {
              const smallestSupplies = distances[smallest].supplies;
              if (
                properties.maxSupplies &&
                properties.maxSupplies[supply] &&
                smallestSupplies &&
                smallestSupplies[supply]
              ) {
                const recoverAmount =
                  properties.maxSupplies[supply] - newSupplies[supply];
                recoverHere[supply] = recoverAmount;
              }
              newSupplies[supply] = properties.maxSupplies?.[supply] ?? 0;
            }
          }
          const newProperties: PathProperties = {
            supplies: newSupplies,
            priority: candidate,
          };
          this.debug(
            'On ',
            smallest,
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
            };
            //enqueue in priority queue with new priority
            nodes.enqueue(nextNeighbor, newProperties);
          }
        }
      }
    }

    let finalPath: PathNode[] = [];
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

    const linkedListItems: LinkedListItem[] = [];
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
    properties: Omit<PathProperties, 'priority'> = {}
  ): { finalPath: string[]; pathProperties: PathReturnProperties } {
    const result = this.calculateShortestPathAsLinkedListResult(
      start,
      finish,
      properties
    );

    let finalPath: string[] = [];
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
