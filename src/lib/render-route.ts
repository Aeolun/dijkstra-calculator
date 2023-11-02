import { DijkstraCalculator, NodeId } from './index';
import system from './system.json';
import * as fs from 'fs';

interface Waypoint {
  symbol: string;
  x: number;
  y: number;
}

interface Route {
  source: NodeId;
  target: NodeId;
  edge?: NodeId;
  consumes?: Partial<Record<string, number>>;
  recover?: Partial<Record<string, number>>;
  weight?: number;
}

interface Connection {
  source: string;
  target: string;
}

function renderRouteSVG(
  waypoints: Waypoint[],
  connections: Connection[],
  route: Route[]
) {
  const svgString = `
    <svg viewBox="-800 -800 1600 1600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth" />
      </defs>
      <!-- render waypoints -->
      ${waypoints
        .map((waypoint) => {
          return `<circle cx="${waypoint.x}" cy="${waypoint.y}" r="5" fill="blue" />`;
        })
        .join('\n')}
      <!-- render connections -->
      ${connections
        .map((connection) => {
          const source = waypoints.find(
            (waypoint) => waypoint.symbol === connection.source
          );
          const target = waypoints.find(
            (waypoint) => waypoint.symbol === connection.target
          );
          if (!source || !target) {
            return '';
          }
          return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="black" />`;
        })
        .join('\n')}
      <!-- render route -->
      ${route
        .map((route) => {
          const source = waypoints.find(
            (waypoint) => waypoint.symbol === route.source
          );
          const target = waypoints.find(
            (waypoint) => waypoint.symbol === route.target
          );
          if (!source || !target) {
            return '';
          }
          return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="red" marker-end="url(#arrow)" />`;
        })
        .join('\n')}
      <!-- render edge names, weight, and consumption/recovery -->
      ${route
        .map((route) => {
          const source = waypoints.find(
            (waypoint) => waypoint.symbol === route.source
          );
          const target = waypoints.find(
            (waypoint) => waypoint.symbol === route.target
          );
          if (!source || !target) {
            return '';
          }
          const x = (source.x + target.x) / 2;
          const y = (source.y + target.y) / 2;
          return `
            <g transform="translate(${x} ${y})">
            <text x="0" y="0" font-size="10" fill="red" text-anchor="middle" dominant-baseline="middle">
              <tspan x="0" dy="1.2em">${route.edge}</tspan>
              <tspan x="0" dy="1.2em">${
                route.weight ? `(${route.weight})` : ''
              }</tspan>
              <tspan x="0" dy="1.2em">${
                route.consumes ? `-${JSON.stringify(route.consumes)}` : ''
              }</tspan>
              <tspan x="0" dy="1.2em">${
                route.recover ? `+${JSON.stringify(route.recover)}` : ''
              }</tspan>
            </text>
            </g>
          `;
        })
        .join('\n')}
    </svg>
  `;

  return svgString;
}

const getDistance = (
  a: { x: number; y: number },
  b: { x: number; y: number }
) => {
  return Math.round(Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)));
};

const connections: Connection[] = [];
const dijkstra = new DijkstraCalculator(() => 0, true);
system.forEach((waypoint) => {
  dijkstra.addVertex(waypoint.symbol, {
    recover: waypoint.fuel
      ? {
          fuel: {
            cost: waypoint.fuel / 100,
          },
        }
      : undefined,
  });
});
system.forEach((waypoint) => {
  const waypointsWithin100 = system.filter((otherWaypoint) => {
    if (otherWaypoint.symbol === waypoint.symbol) {
      return false;
    }
    const distance = getDistance(waypoint, otherWaypoint);
    return distance <= 100;
  });
  const clostestWaypoints = system
    .filter(
      (otherWaypoint) =>
        otherWaypoint.symbol !== waypoint.symbol &&
        !waypointsWithin100.find((wp) => wp.symbol === otherWaypoint.symbol)
    )
    .sort((a, b) => {
      const aDistance = getDistance(waypoint, a);
      const bDistance = getDistance(waypoint, b);
      return aDistance - bDistance;
    })
    .slice(0, 7);

  [...clostestWaypoints, ...waypointsWithin100].forEach((otherWaypoint) => {
    connections.push({
      source: waypoint.symbol,
      target: otherWaypoint.symbol,
    });
    const distance = getDistance(waypoint, otherWaypoint);
    dijkstra.addEdge(waypoint.symbol, otherWaypoint.symbol, {
      weight: distance + 3,
      id: 'burn',
      consumes: {
        fuel: distance * 2,
      },
    });
    dijkstra.addEdge(waypoint.symbol, otherWaypoint.symbol, {
      weight: distance,
      id: 'warp',
      consumes: {
        fuel: distance,
      },
    });
    dijkstra.addEdge(waypoint.symbol, otherWaypoint.symbol, {
      weight: distance * 10,
      id: 'drift',
      consumes: {
        fuel: 1,
      },
    });
  });
});

const route = dijkstra.calculateShortestPathAsLinkedListResult(
  'X1-XM43-J68',
  'X1-XM43-J78',
  {
    supplies: {
      fuel: 400,
    },
    supplyCapacity: {
      fuel: 400,
    },
  }
);
console.log('final cost', route.pathProperties.priority);

const svg = renderRouteSVG(system, connections, route.finalPath);
fs.writeFileSync('route.svg', svg, 'utf-8');
