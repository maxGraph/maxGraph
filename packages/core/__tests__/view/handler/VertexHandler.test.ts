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

import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import {
  type Cell,
  Graph,
  InternalEvent,
  InternalMouseEvent,
  Point,
  resetVertexHandlerConfig,
  type SelectionCellsHandler,
  VertexHandler,
  VertexHandlerConfig,
} from '../../../src';
import { createContainer } from '../../utils';

const createMouseEvent = (type: string, x: number, y: number): InternalMouseEvent => {
  // Alt disables the grid, so that the angle is not snapped to the rotation raster
  const event = new MouseEvent(type, { clientX: x, clientY: y, button: 0, altKey: true });
  const mouseEvent = new InternalMouseEvent(event);
  mouseEvent.graphX = x;
  mouseEvent.graphY = y;
  return mouseEvent;
};

const createdGraphs: Graph[] = [];

const createGraph = (scale: number): Graph => {
  const container = createContainer({ offsetWidth: 1200, offsetHeight: 900 });
  document.body.appendChild(container);

  const graph = new Graph(container);
  graph.view.setScale(scale);
  createdGraphs.push(graph);
  return graph;
};

beforeEach(() => {
  // Every test drags the rotation handle, which VertexHandlerConfig hides by default
  VertexHandlerConfig.rotationEnabled = true;
});

afterEach(() => {
  // VertexHandlerConfig is global and outlives the test that changed it
  resetVertexHandlerConfig();

  // Every test builds its own graph on a container appended to the document. No assertion depends on this teardown
  // and the tests do pass without it, but without it each graph stays alive with its plugins, its view listeners and
  // its model listener registered, and its container stays in the body, for the whole file.
  for (const graph of createdGraphs.splice(0)) {
    const { container } = graph;
    graph.destroy();
    container.remove();
  }
});

/**
 * Paints the rotation handle on the top left corner instead of above the centre, the case the `start` method of
 * {@link VertexHandler} explicitly supports through {@link VertexHandler.getRotationHandlePosition}.
 */
class CornerHandleVertexHandler extends VertexHandler {
  override getRotationHandlePosition(): Point {
    return new Point(this.bounds.x, this.bounds.y + this.rotationHandleVSpacing);
  }
}

/**
 * Drags the rotation handle from where it is currently painted to `targetAngle`, keeping the pointer on the circle
 * the handle sits on, as a real gesture does.
 */
const rotateWithHandleTo = (graph: Graph, cell: Cell, targetAngle: number): void => {
  const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>(
    'SelectionCellsHandler'
  )!;
  const handler = selectionCellsHandler.getHandler(cell) as VertexHandler;
  const state = graph.view.getState(cell)!;
  const centerX = state.getCenterX();
  const centerY = state.getCenterY();
  const handleBounds = handler.rotationShape!.bounds!;
  const startAngle = graph.getCurrentCellStyle(cell).rotation ?? 0;
  const radius = Math.hypot(
    handleBounds.getCenterX() - centerX,
    handleBounds.getCenterY() - centerY
  );

  handler.mouseDown(
    graph,
    createMouseEvent('mousedown', handleBounds.getCenterX(), handleBounds.getCenterY())
  );

  const pointAt = (angleInDegrees: number): Point => {
    const angle = (angleInDegrees * Math.PI) / 180;
    return new Point(
      centerX + radius * Math.sin(angle),
      centerY - radius * Math.cos(angle)
    );
  };

  const stepCount = 8;
  for (let step = 1; step <= stepCount; step++) {
    const point = pointAt(startAngle + ((targetAngle - startAngle) * step) / stepCount);
    handler.mouseMove(graph, createMouseEvent('mousemove', point.x, point.y));
  }

  const release = pointAt(targetAngle);
  handler.mouseUp(graph, createMouseEvent('mouseup', release.x, release.y));
};

describe('rotation with the rotation handle', () => {
  // The scales are the ones reached by zoomIn/zoomOut in the Stencils story, whose "X1" vertex is used here. At some
  // of them, rounding the selection bounds moves the painted rotation handle half a pixel left of the vertex centre,
  // which used to make `startAngle` jump from 0 to about 180 degrees and flip every rotation.
  test.each([
    ['no zoom', 1],
    ['zoom in once', 1.2],
    ['zoom in twice', 1.44],
    ['zoom in 3 times', 1.73],
    ['zoom out once', 0.83],
    ['zoom out twice', 0.69],
    ['zoom out 3 times', 0.57],
  ])('applies the dragged angle after %s', (_description, scale) => {
    const graph = createGraph(scale);
    const vertex = graph.insertVertex({
      value: 'X1',
      position: [160, 110],
      size: [80, 80],
    });
    graph.setSelectionCell(vertex);

    rotateWithHandleTo(graph, vertex, 90);

    expect(graph.getCurrentCellStyle(vertex).rotation).toBe(90);
  });

  test('applies the dragged angle on consecutive rotations of an initially rotated vertex', () => {
    const graph = createGraph(1);
    const vertex = graph.insertVertex({
      value: 'X1',
      position: [160, 110],
      size: [80, 80],
      style: { rotation: 40 },
    });
    graph.setSelectionCell(vertex);

    rotateWithHandleTo(graph, vertex, 90);
    expect(graph.getCurrentCellStyle(vertex).rotation).toBe(90);

    rotateWithHandleTo(graph, vertex, 120);
    expect(graph.getCurrentCellStyle(vertex).rotation).toBe(120);
  });

  test('leaves the angle unchanged when the rotation handle is only clicked', () => {
    const graph = createGraph(1);
    const vertex = graph.insertVertex({
      value: 'X1',
      position: [160, 110],
      size: [80, 80],
      style: { rotation: 40 },
    });
    graph.setSelectionCell(vertex);

    const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>(
      'SelectionCellsHandler'
    )!;
    const handler = selectionCellsHandler.getHandler(vertex) as VertexHandler;
    const handleBounds = handler.rotationShape!.bounds!;
    const mouseDownEvent = createMouseEvent(
      'mousedown',
      handleBounds.getCenterX(),
      handleBounds.getCenterY()
    );

    handler.mouseDown(graph, mouseDownEvent);
    expect(handler.index).toBe(InternalEvent.ROTATION_HANDLE);
    handler.mouseUp(
      graph,
      createMouseEvent('mouseup', mouseDownEvent.graphX, mouseDownEvent.graphY)
    );

    expect(graph.getCurrentCellStyle(vertex).rotation).toBe(40);
  });

  test('applies the dragged angle when a subclass paints the handle in a corner', () => {
    const graph = createGraph(1);
    const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>(
      'SelectionCellsHandler'
    )!;
    selectionCellsHandler.setVertexHandlerFactory(
      (state) => new CornerHandleVertexHandler(state)
    );

    const vertex = graph.insertVertex({
      value: 'X1',
      position: [160, 110],
      size: [80, 80],
    });
    graph.setSelectionCell(vertex);

    const handler = selectionCellsHandler.getHandler(vertex) as VertexHandler;
    const state = graph.view.getState(vertex)!;
    const centerX = state.getCenterX();
    const centerY = state.getCenterY();
    // Grab the handle where the handler positions it, rather than at the centre of the painted shape, whose
    // coordinates are floored by moveSizerTo and would add a fraction of a degree to the expected angle
    const { x: grabX, y: grabY } = handler.getRotationHandlePosition();
    // Bearing of the handle, measured clockwise from straight up, and its distance to the centre
    const handleBearing = Math.atan2(grabX - centerX, -(grabY - centerY));
    const radius = Math.hypot(grabX - centerX, grabY - centerY);

    handler.mouseDown(graph, createMouseEvent('mousedown', grabX, grabY));
    // Drag the handle to where it belongs once the vertex is rotated by 90 degrees
    const releaseBearing = handleBearing + Math.PI / 2;
    const release = createMouseEvent(
      'mousemove',
      centerX + radius * Math.sin(releaseBearing),
      centerY - radius * Math.cos(releaseBearing)
    );
    handler.mouseMove(graph, release);
    handler.mouseUp(graph, createMouseEvent('mouseup', release.graphX, release.graphY));

    expect(graph.getCurrentCellStyle(vertex).rotation).toBe(90);
  });
});
