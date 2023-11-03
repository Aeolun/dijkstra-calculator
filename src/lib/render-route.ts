import * as fs from 'fs';

import system from './system.json';

import { DijkstraCalculator, NodeId } from './index';

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
  weightFromResources?: number;
  totalRecovered?: Partial<Record<string, number>>;
  totalConsumed?: Partial<Record<string, number>>;
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
                route.weight ? `(E-${route.weight})` : ''
              }</tspan>
              <tspan x="0" dy="1.2em">${
                route.weightFromResources
                  ? `(R-${route.weightFromResources})`
                  : ''
              }</tspan>
              <tspan x="0" dy="1.2em">${
                route.consumes ? `-${JSON.stringify(route.consumes)}` : ''
              }</tspan>
              <tspan x="0" dy="1.2em">${
                route.recover ? `+${JSON.stringify(route.recover)}` : ''
              }</tspan>
              <tspan x="0" dy="1.2em">${
                route.totalRecovered
                  ? `+${JSON.stringify(route.totalRecovered)}`
                  : ''
              }</tspan>
          <tspan x="0" dy="1.2em">${
            route.totalConsumed ? `-${JSON.stringify(route.totalConsumed)}` : ''
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

const waypointPositions: Record<string, { x: number; y: number }> = {};
system.forEach((waypoint) => {
  waypointPositions[waypoint.symbol] = {
    x: waypoint.x,
    y: waypoint.y,
  };
});

const connections: Connection[] = [];
const dijkstra = new DijkstraCalculator((vertex, target) => {
  const distance = getDistance(
    waypointPositions[vertex],
    waypointPositions[target]
  );
  return distance;
}, false);
system.forEach((waypoint) => {
  dijkstra.addVertex(waypoint.symbol, {
    recover: waypoint.fuel
      ? {
          fuel: (current, max) => {
            const recover = max - current;
            const costCount = Math.ceil(recover / 100);
            return {
              recoverAmount: recover,
              cost: costCount * waypoint.fuel,
            };
          },
        }
      : undefined,
  });
});
system.forEach((waypoint) => {
  const waypointsWithin100 = system
    .filter((otherWaypoint) => {
      if (otherWaypoint.symbol === waypoint.symbol) {
        return false;
      }
      const distance = getDistance(waypoint, otherWaypoint);
      return distance <= 300;
    })
    .filter((_d, i) => {
      return i % 2 === 0;
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
    .slice(0, 5);

  [...clostestWaypoints, ...waypointsWithin100].forEach((otherWaypoint) => {
    connections.push({
      source: waypoint.symbol,
      target: otherWaypoint.symbol,
    });
    const distance = getDistance(waypoint, otherWaypoint);
    const creditsPerSecond = 3;
    const edgeCost = (speed: number, multiplier: number, distance: number) => {
      return (
        Math.floor(
          Math.round(Math.max(distance, 1)) * (multiplier / speed) + 15
        ) * creditsPerSecond
      );
    };
    dijkstra.addEdge(waypoint.symbol, otherWaypoint.symbol, {
      weight: edgeCost(30, 7.5, distance),
      id: 'burn',
      consumes: {
        fuel: Math.max(distance * 2, 1),
      },
    });
    dijkstra.addEdge(waypoint.symbol, otherWaypoint.symbol, {
      weight: edgeCost(30, 15, distance),
      id: 'cruise',
      consumes: {
        fuel: Math.max(distance, 1),
      },
    });
    dijkstra.addEdge(waypoint.symbol, otherWaypoint.symbol, {
      weight: edgeCost(30, 150, distance),
      id: 'drift',
      consumes: {
        fuel: 1,
      },
    });
  });
});

const route = dijkstra.calculateShortestRouteAsLinkedListResults(
  ['X1-XM43-J68', 'X1-XM43-J78', 'X1-XM43-J72'],
  {
    supplies: {
      fuel: 400,
    },
    supplyCapacity: {
      fuel: 400,
    },
  }
);
console.log('final cost', route.pathProperties.priority, {
  properties: route.pathProperties,
});

const svg = renderRouteSVG(system, connections, route.finalPath);
fs.writeFileSync('route.svg', svg, 'utf-8');
