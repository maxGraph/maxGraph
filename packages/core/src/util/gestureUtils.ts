/*
Copyright 2021-present The maxGraph project Contributors

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

import DragSource, { DropHandler } from '../view/other/DragSource';
import Point from '../view/geometry/Point';
import { TOOLTIP_VERTICAL_OFFSET } from './Constants';
import { Graph } from '../view/Graph';
import Cell from '../view/cell/Cell';

/**
 * Configures the given DOM element to act as a drag source for the
 * specified graph. Returns a a new {@link DragSource}. If
 * {@link DragSource#guideEnabled} is enabled then the x and y arguments must
 * be used in funct to match the preview location.
 *
 * Example:
 *
 * ```javascript
 * let funct = (graph, evt, cell, x, y)=>
 * {
 *   if (graph.canImportCell(cell))
 *   {
 *     let parent = graph.getDefaultParent();
 *     let vertex = null;
 *
 *     graph.getDataModel().beginUpdate();
 *     try
 *     {
 *        vertex = graph.insertVertex(parent, null, 'Hello', x, y, 80, 30);
 *     }
 *     finally
 *     {
 *       graph.getDataModel().endUpdate();
 *     }
 *
 *     graph.setSelectionCell(vertex);
 *   }
 * }
 *
 * let img = document.createElement('img');
 * img.setAttribute('src', 'editors/images/rectangle.gif');
 * img.style.position = 'absolute';
 * img.style.left = '0px';
 * img.style.top = '0px';
 * img.style.width = '16px';
 * img.style.height = '16px';
 *
 * let dragImage = img.cloneNode(true);
 * dragImage.style.width = '32px';
 * dragImage.style.height = '32px';
 * mxUtils.makeDraggable(img, graph, funct, dragImage);
 * document.body.appendChild(img);
 * ```
 *
 * @param element DOM element to make draggable.
 * @param graphF {@link Graph} that acts as the drop target or a function that takes a
 * mouse event and returns the current {@link Graph}.
 * @param funct Function to execute on a successful drop.
 * @param dragElement Optional DOM node to be used for the drag preview.
 * @param dx Optional horizontal offset between the cursor and the drag
 * preview.
 * @param dy Optional vertical offset between the cursor and the drag
 * preview.
 * @param autoscroll Optional boolean that specifies if autoscroll should be
 * used. Default is mxGraph.autoscroll.
 * @param scalePreview Optional boolean that specifies if the preview element
 * should be scaled according to the graph scale. If this is true, then
 * the offsets will also be scaled. Default is false.
 * @param highlightDropTargets Optional boolean that specifies if dropTargets
 * should be highlighted. Default is true.
 * @param getDropTarget Optional function to return the drop target for a given
 * location (x, y). Default is mxGraph.getCellAt.
 */
export const makeDraggable = (
  element: Element,
  graphF: Graph | Function,
  funct: DropHandler,
  dragElement: Element | null = null,
  dx: number | null = null,
  dy: number | null = null,
  autoscroll: boolean | null = null,
  scalePreview = false,
  highlightDropTargets = true,
  getDropTarget:
    | ((graph: Graph, x: number, y: number, evt: MouseEvent) => Cell)
    | null = null
) => {
  const dragSource = new DragSource(element, funct);
  dragSource.dragOffset = new Point(
    dx != null ? dx : 0,
    dy != null ? dy : TOOLTIP_VERTICAL_OFFSET
  );
  if (autoscroll != null) {
    dragSource.autoscroll = autoscroll;
  }

  // Cannot enable this by default. This needs to be enabled in the caller
  // if the funct argument uses the new x- and y-arguments.
  dragSource.setGuidesEnabled(false);

  if (highlightDropTargets != null) {
    dragSource.highlightDropTargets = highlightDropTargets;
  }

  // Overrides function to find drop target cell
  if (getDropTarget != null) {
    dragSource.getDropTarget = getDropTarget;
  }

  // Overrides function to get current graph
  dragSource.getGraphForEvent = (evt) => {
    return typeof graphF === 'function' ? graphF(evt) : graphF;
  };

  // Translates switches into dragSource customizations
  if (dragElement != null) {
    // @ts-ignore
    dragSource.createDragElement = () => {
      return dragElement.cloneNode(true);
    };

    if (scalePreview) {
      dragSource.createPreviewElement = (graph) => {
        const elt = <HTMLElement>dragElement.cloneNode(true);

        const w = parseInt(elt.style.width);
        const h = parseInt(elt.style.height);
        elt.style.width = `${Math.round(w * graph.view.scale)}px`;
        elt.style.height = `${Math.round(h * graph.view.scale)}px`;

        return elt;
      };
    }
  }

  return dragSource;
};
