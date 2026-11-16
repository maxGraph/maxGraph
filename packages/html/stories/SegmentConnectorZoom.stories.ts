/*
Copyright 2026-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { type Cell, DomHelpers, Graph, Point } from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createMainDiv } from './shared/configure.js';

export default {
  title: 'Connections/SegmentConnectorZoom',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

type Rect = [number, number, number, number];

interface RoutingCase {
  name: string;
  source: Rect;
  target: Rect;
  waypoints: [number, number][];
}

// Floating ends (no exitX/entryX): the cleanup removing the bends inside a terminal only runs for them
const routingCases: RoutingCase[] = [
  {
    name: 'Issue description',
    source: [870, 430, 310, 70],
    target: [450, 250, 410, 80],
    waypoints: [
      [1025, 390],
      [655, 390],
    ],
  },
  {
    name: 'Issue comment',
    source: [500, 500, 200, 200],
    target: [900, 900, 100, 100],
    waypoints: [
      [800, 650],
      [950, 800],
    ],
  },
  {
    name: 'Bend on the target border',
    source: [130, 550, 180, 110],
    target: [560, 420, 130, 160],
    waypoints: [
      [600, 600],
      [540, 420],
    ],
  },
];

interface GridScale {
  value: number;
  label: string;
}

const gridScales: GridScale[] = [
  { value: 1, label: '1 (reference)' },
  { value: 0.75, label: '0.75' },
  { value: 0.8, label: '0.8' },
  { value: 1.12, label: '1.12' },
  { value: 1.2 ** 4, label: '2.07 (4 zoom in)' },
  { value: 1.2 ** -4, label: '0.48 (4 zoom out)' },
  { value: 0.15, label: '0.15 (sub-pixel limit)' },
  { value: 0.1, label: '0.1 (sub-pixel limit)' },
];

const caseBounds = (routingCase: RoutingCase): Rect => {
  const xs = [
    routingCase.source[0],
    routingCase.source[0] + routingCase.source[2],
    routingCase.target[0],
    routingCase.target[0] + routingCase.target[2],
    ...routingCase.waypoints.map(([x]) => x),
  ];
  const ys = [
    routingCase.source[1],
    routingCase.source[1] + routingCase.source[3],
    routingCase.target[1],
    routingCase.target[1] + routingCase.target[3],
    ...routingCase.waypoints.map(([, y]) => y),
  ];
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return [minX, minY, Math.max(...xs) - minX, Math.max(...ys) - minY];
};

const insertCase = (graph: Graph, routingCase: RoutingCase): Cell => {
  let edge!: Cell;
  graph.batchUpdate(() => {
    const [sourceX, sourceY, sourceWidth, sourceHeight] = routingCase.source;
    const [targetX, targetY, targetWidth, targetHeight] = routingCase.target;
    const source = graph.insertVertex({
      position: [sourceX, sourceY],
      size: [sourceWidth, sourceHeight],
      value: 'source',
    });
    const target = graph.insertVertex({
      position: [targetX, targetY],
      size: [targetWidth, targetHeight],
      value: 'target',
    });
    edge = graph.insertEdge({ source, target, style: { edgeStyle: 'segmentEdgeStyle' } });
    edge.getGeometry()!.points = routingCase.waypoints.map(([x, y]) => new Point(x, y));
  });
  return edge;
};

const countEdgePoints = (graph: Graph, edge: Cell): number =>
  graph.view.getState(edge)?.absolutePoints.length ?? 0;

const viewMargin = 10;

// The translate of the view stays at 0: it takes part in the computation of the route, so a translate would move the
// scales where the routes go wrong. The graph container is offset in its viewport instead, to show the diagram.
const placeGraphContainer = (
  graphContainer: HTMLElement,
  routingCase: RoutingCase,
  scale: number
): void => {
  const [x, y, width, height] = caseBounds(routingCase);
  graphContainer.style.left = `${viewMargin - x * scale}px`;
  graphContainer.style.top = `${viewMargin - y * scale}px`;
  graphContainer.style.width = `${(x + width) * scale + viewMargin}px`;
  graphContainer.style.height = `${(y + height) * scale + viewMargin}px`;
};

const createCaseViewport = (
  routingCase: RoutingCase,
  scale: number,
  width: number,
  height: number
): { viewport: HTMLElement; graphContainer: HTMLElement } => {
  const viewport = document.createElement('div');
  viewport.style.position = 'relative';
  viewport.style.overflow = 'hidden';
  viewport.style.width = `${width}px`;
  viewport.style.height = `${height}px`;
  viewport.style.border = '1px solid lightgray';
  viewport.style.background = 'url(./images/grid.gif)';

  const graphContainer = document.createElement('div');
  graphContainer.style.position = 'absolute';
  graphContainer.style.overflow = 'visible';
  placeGraphContainer(graphContainer, routingCase, scale);
  viewport.appendChild(graphContainer);
  return { viewport, graphContainer };
};

const describePointCount = (
  pointCount: number,
  referenceCount: number
): { text: string; color: string } => ({
  text: `${pointCount} points (${referenceCount} at scale 1)`,
  color: pointCount === referenceCount ? 'green' : 'red',
});

const textStyle = (element: HTMLElement): void => {
  element.style.fontFamily = 'Arial,Helvetica,sans-serif';
  element.style.fontSize = '12px';
};

const gridCellMaxWidth = 260;
const gridCellMaxHeight = 200;

const createGrid = (): HTMLElement => {
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `max-content repeat(${gridScales.length}, max-content)`;
  grid.style.gap = '8px';
  grid.style.alignItems = 'start';
  textStyle(grid);

  grid.appendChild(document.createElement('div'));
  for (const scale of gridScales) {
    const header = document.createElement('div');
    header.textContent = `scale ${scale.label}`;
    header.style.fontWeight = 'bold';
    grid.appendChild(header);
  }

  for (const routingCase of routingCases) {
    const rowHeader = document.createElement('div');
    rowHeader.textContent = routingCase.name;
    rowHeader.style.fontWeight = 'bold';
    grid.appendChild(rowHeader);

    const pointCountsByCaption = new Map<HTMLElement, number>();
    let referenceCount = 0;
    for (const scale of gridScales) {
      const cell = document.createElement('div');
      const [, , width, height] = caseBounds(routingCase);
      const viewportWidth = width * scale.value + 2 * viewMargin;
      const viewportHeight = height * scale.value + 2 * viewMargin;
      const { viewport, graphContainer } = createCaseViewport(
        routingCase,
        scale.value,
        viewportWidth,
        viewportHeight
      );
      // Shrinks the whole diagram into the cell. A CSS transform is visual only: maxGraph still routes at the scale of
      // the view, and the grid is not interactive, so the mouse coordinates it would distort are not used.
      const shrinkFactor = Math.min(
        1,
        gridCellMaxWidth / viewportWidth,
        gridCellMaxHeight / viewportHeight
      );
      viewport.style.transform = `scale(${shrinkFactor})`;
      viewport.style.transformOrigin = 'top left';
      const shrunkViewport = document.createElement('div');
      shrunkViewport.style.width = `${viewportWidth * shrinkFactor}px`;
      shrunkViewport.style.height = `${viewportHeight * shrinkFactor}px`;
      shrunkViewport.appendChild(viewport);
      cell.appendChild(shrunkViewport);
      grid.appendChild(cell);

      // No plugins: the grid is not interactive, and each graph would install the listeners of the default plugins
      const graph = new Graph(graphContainer, undefined, []);
      graph.setEnabled(false);
      graph.view.setScale(scale.value);
      const edge = insertCase(graph, routingCase);

      const pointCount = countEdgePoints(graph, edge);
      if (scale.value === 1) {
        referenceCount = pointCount;
      }
      const caption = document.createElement('div');
      cell.appendChild(caption);
      pointCountsByCaption.set(caption, pointCount);
    }

    // Described once the whole row is built, so that the scale 1 reference can be anywhere in the grid
    for (const [caption, pointCount] of pointCountsByCaption) {
      const { text, color } = describePointCount(pointCount, referenceCount);
      caption.textContent = text;
      caption.style.color = color;
    }
  }
  return grid;
};

const minZoomScale = 0.05;
const maxZoomScale = 3;

const createZoomSection = (args: Record<string, string>): HTMLElement => {
  const section = document.createElement('div');
  textStyle(section);

  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.alignItems = 'center';
  controls.style.gap = '.5rem';
  controls.style.marginBottom = '1rem';
  section.appendChild(controls);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(minZoomScale);
  slider.max = String(maxZoomScale);
  slider.step = '0.01';
  slider.value = '1';
  slider.style.width = '300px';

  const scaleLabel = document.createElement('span');
  scaleLabel.style.minWidth = '6rem';

  const graphsContainer = document.createElement('div');
  graphsContainer.style.display = 'flex';
  graphsContainer.style.flexWrap = 'wrap';
  graphsContainer.style.gap = '1rem';
  section.appendChild(graphsContainer);

  const maxWidth = Math.max(Number(args.width) / 2, 300);
  const maxHeight = Math.max(Number(args.height) / 2, 250);
  const views = routingCases.map((routingCase) => {
    const wrapper = document.createElement('div');
    const title = document.createElement('div');
    title.textContent = routingCase.name;
    title.style.fontWeight = 'bold';
    const { viewport, graphContainer } = createCaseViewport(
      routingCase,
      1,
      maxWidth,
      maxHeight
    );
    viewport.style.overflow = 'auto';
    const caption = document.createElement('div');
    wrapper.append(title, viewport, caption);
    graphsContainer.appendChild(wrapper);

    const graph = new Graph(graphContainer);
    const edge = insertCase(graph, routingCase);
    const referenceCount = countEdgePoints(graph, edge);
    return { routingCase, graphContainer, caption, graph, edge, referenceCount };
  });

  // view.setScale keeps the translate, unlike graph.zoomIn which can change it to keep the center
  // Bounded by the slider range, which otherwise stays at its end while the zoom buttons go further
  const applyScale = (requestedScale: number): void => {
    const scale = Math.min(maxZoomScale, Math.max(minZoomScale, requestedScale));
    slider.value = String(scale);
    scaleLabel.textContent = `scale ${scale.toFixed(4)}`;
    for (const view of views) {
      view.graph.view.setScale(scale);
      placeGraphContainer(view.graphContainer, view.routingCase, scale);
      // Counted at each scale since the waypoints can be moved interactively
      const { text, color } = describePointCount(
        countEdgePoints(view.graph, view.edge),
        view.referenceCount
      );
      view.caption.textContent = text;
      view.caption.style.color = color;
    }
  };

  slider.addEventListener('input', () => applyScale(Number(slider.value)));
  const currentScale = (): number => views[0].graph.view.scale;
  controls.append(
    DomHelpers.button('Zoom In', () => applyScale(currentScale() * 1.2)),
    DomHelpers.button('Zoom Out', () => applyScale(currentScale() / 1.2)),
    DomHelpers.button('Zoom Actual', () => applyScale(1)),
    slider,
    scaleLabel
  );
  applyScale(1);
  return section;
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const mainDiv = createMainDiv(`
  Orthogonal edges using <code>segmentEdgeStyle</code>, with waypoints and floating ends, routed at several scales.
  The route must not depend on the scale: each edge should have the same number of points as at scale 1.
  <br>
  Before the fix of <a href="https://github.com/maxGraph/maxGraph/issues/1051" target="_blank">issue #1051</a>, some
  bends were removed at some scales, and the route turned into a diagonal or lost a segment (counts in red).
  <br>
  Below a scale of about 0.15, a segment shorter than 1 pixel is also dropped, on purpose since it cannot be seen: a
  count in red there may come from this known limit, tracked in
  <a href="https://github.com/maxGraph/maxGraph/issues/1322" target="_blank">issue #1322</a>, rather than from #1051.
  <h3>Fixed scales</h3>
  `);

  mainDiv.appendChild(createGrid());

  const zoomTitle = document.createElement('h3');
  zoomTitle.textContent = 'Any scale';
  zoomTitle.style.fontFamily = 'Arial,Helvetica,sans-serif';
  mainDiv.appendChild(zoomTitle);
  mainDiv.appendChild(createZoomSection(args));

  return mainDiv;
};

export const Default = Template.bind({});
