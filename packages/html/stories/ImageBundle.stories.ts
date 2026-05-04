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

import {
  BaseGraph,
  CellEditorHandler,
  ImageBundle,
  ImageBundlePlugin,
  ImageShape,
  SelectionCellsHandler,
  SelectionHandler,
  ShapeRegistry,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';

export default {
  title: 'Icon_Images/ImageBundle',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

// Minimalist geometric cats, drawn by hand (Apache-2.0, shipped with maxGraph).
// Each key resolves to an inline SVG data URI via the ImageBundle registered below.
const catSvgs: Record<string, string> = {
  'cat-face':
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
    '<polygon points="14,14 24,6 26,22" fill="#ff9800"/>' +
    '<polygon points="50,14 40,6 38,22" fill="#ff9800"/>' +
    '<circle cx="32" cy="34" r="20" fill="#ffb74d"/>' +
    '<circle cx="24" cy="32" r="2" fill="#000"/>' +
    '<circle cx="40" cy="32" r="2" fill="#000"/>' +
    '<path d="M32,40 L28,44 M32,40 L36,44" stroke="#000" stroke-width="1.5" fill="none"/>' +
    '</svg>',
  'cat-sitting':
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
    '<ellipse cx="28" cy="46" rx="18" ry="14" fill="#8d6e63"/>' +
    '<circle cx="22" cy="24" r="13" fill="#8d6e63"/>' +
    '<polygon points="12,14 16,2 22,16" fill="#8d6e63"/>' +
    '<polygon points="22,14 28,2 32,18" fill="#8d6e63"/>' +
    '<circle cx="18" cy="22" r="1.5" fill="#fff"/>' +
    '<circle cx="28" cy="22" r="1.5" fill="#fff"/>' +
    '<path d="M46,42 Q58,32 52,18" stroke="#8d6e63" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '</svg>',
  'cat-curled':
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
    '<ellipse cx="32" cy="40" rx="26" ry="14" fill="#ab47bc"/>' +
    '<polygon points="8,32 12,20 18,32" fill="#ab47bc"/>' +
    '<polygon points="18,30 22,18 26,30" fill="#ab47bc"/>' +
    '<path d="M44,36 Q58,44 52,30 Q48,22 42,28" stroke="#7b1fa2" stroke-width="3" fill="#ab47bc"/>' +
    '<path d="M14,34 Q16,38 18,34" stroke="#4a148c" stroke-width="1.2" fill="none"/>' +
    '</svg>',
  'cat-standing':
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
    '<rect x="12" y="28" width="32" height="14" rx="5" fill="#607d8b"/>' +
    '<circle cx="48" cy="30" r="9" fill="#607d8b"/>' +
    '<polygon points="42,22 46,12 50,24" fill="#607d8b"/>' +
    '<polygon points="50,22 54,12 54,24" fill="#607d8b"/>' +
    '<circle cx="50" cy="29" r="1.5" fill="#fff"/>' +
    '<rect x="15" y="40" width="4" height="12" fill="#607d8b"/>' +
    '<rect x="23" y="40" width="4" height="12" fill="#607d8b"/>' +
    '<rect x="32" y="40" width="4" height="12" fill="#607d8b"/>' +
    '<rect x="38" y="40" width="4" height="12" fill="#607d8b"/>' +
    '<path d="M12,34 Q2,28 6,18" stroke="#607d8b" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '</svg>',
};

const Template = ({ label, ...args }: Record<string, any>) => {
  const div = createMainDiv(`
  Demonstrates how to use <code>ImageBundlePlugin</code> on a <code>BaseGraph</code>.
  <p>
  Four cells reference short keys (<code>cat-face</code>, <code>cat-sitting</code>, <code>cat-curled</code>, <code>cat-standing</code>)
  resolved to inline SVG data URIs by a registered <code>ImageBundle</code>. A fifth cell references a PNG
  directly by URL to show that <code>style.image</code> also accepts raw paths — bundle keys are optional.
  <br>
  <code>BaseGraph</code> loads nothing by default: the <code>image</code> shape, <code>ImageBundlePlugin</code>,
  and the handlers for selection and label editing are all opted in explicitly. Click to select, drag to move,
  double-click a cell to edit its label.
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

  // BaseGraph does not register any default shape. The 'image' shape is the only
  // one this story needs, so register just it (instead of calling registerDefaultShapes()
  // which would also register the other built-ins).
  ShapeRegistry.add('image', ImageShape);

  // BaseGraph does NOT load any default plugin, so each behavior must be opted in:
  // - ImageBundlePlugin     -> resolve bundle keys in style.image
  // - SelectionHandler + SelectionCellsHandler -> click to select, drag to move
  // - CellEditorHandler     -> double-click a cell to edit its label
  // With Graph (full-featured), these are all wired automatically by getDefaultPlugins().
  const graph = new BaseGraph({
    container,
    plugins: [
      ImageBundlePlugin,
      SelectionHandler,
      SelectionCellsHandler,
      CellEditorHandler,
    ],
  });

  // Build a bundle that maps short keys to inline SVG data URIs.
  const bundle = new ImageBundle();
  for (const [key, svg] of Object.entries(catSvgs)) {
    bundle.putImage(key, 'data:image/svg+xml,' + encodeURIComponent(svg));
  }

  // Register the bundle. The non-null assertion is intentional: if the plugin
  // is missing, the registration should fail fast.
  graph.getPlugin<ImageBundlePlugin>('image-bundle')!.addImageBundle(bundle);

  const parent = graph.getDefaultParent();

  // Shared style: label sits immediately below the image. `verticalLabelPosition`
  // places the label block below the cell; `verticalAlign: 'top'` aligns the text
  // to the top of that block (otherwise it would be centered, leaving a visible gap).
  const labelBelowImage = {
    shape: 'image' as const,
    verticalLabelPosition: 'bottom' as const,
    verticalAlign: 'top' as const,
  };

  graph.batchUpdate(() => {
    // Four cells referencing bundle keys, scattered across the canvas.
    // Cell size (64x64) matches the SVG viewBox.
    graph.insertVertex({
      parent,
      value: 'cat-face',
      position: [40, 30],
      size: [64, 64],
      style: { ...labelBelowImage, image: 'cat-face' },
    });
    graph.insertVertex({
      parent,
      value: 'cat-sitting',
      position: [280, 20],
      size: [64, 64],
      style: { ...labelBelowImage, image: 'cat-sitting' },
    });
    graph.insertVertex({
      parent,
      value: 'cat-curled',
      position: [60, 220],
      size: [64, 64],
      style: { ...labelBelowImage, image: 'cat-curled' },
    });
    graph.insertVertex({
      parent,
      value: 'cat-standing',
      position: [310, 230],
      size: [64, 64],
      style: { ...labelBelowImage, image: 'cat-standing' },
    });

    // Fifth cell: direct URL to a PNG served by Storybook from packages/html/public/images/.
    // Demonstrates that style.image also accepts plain paths — it is NOT required to
    // be a bundle key.
    graph.insertVertex({
      parent,
      value: 'server-served PNG',
      position: [170, 130],
      size: [64, 64],
      style: { ...labelBelowImage, image: 'images/icons48/keys.png' },
    });
  });

  return div;
};

export const Default = Template.bind({});
