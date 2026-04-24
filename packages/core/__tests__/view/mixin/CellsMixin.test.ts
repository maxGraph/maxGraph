/*
Copyright 2024-present The maxGraph project Contributors

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

import { describe, expect, test } from '@jest/globals';
import { createCellWithStyle, createGraphWithoutPlugins } from '../../utils';
import {
  BaseGraph,
  Cell,
  type CellStateStyle,
  type CellStyle,
  ImageBundle,
  ImageBundlePlugin,
} from '../../../src';
import { FONT_STYLE_MASK } from '../../../src/util/Constants';

test('setCellStyles on vertex', () => {
  const graph = createGraphWithoutPlugins();

  const style: CellStyle = { align: 'right', fillColor: 'red' };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  graph.setCellStyles('fillColor', 'blue', [cell]);
  expect(cell.style.fillColor).toBe('blue');
  expect(graph.getView().getState(cell)?.style?.fillColor).toBe('blue');
});

test('setCellStyleFlags on vertex', () => {
  const graph = createGraphWithoutPlugins();

  const style: CellStyle = { fontStyle: 3, fillColor: 'red' };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  graph.setCellStyleFlags('fontStyle', FONT_STYLE_MASK.UNDERLINE, null, [cell]);
  expect(cell.style.fontStyle).toBe(7);
  expect(graph.getView().getState(cell)?.style?.fontStyle).toBe(7);
});

describe('isAutoSizeCell', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isAutoSizeCell(new Cell())).toBeFalsy();
  });

  test('Using Cell with the "autoSize" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isAutoSizeCell(createCellWithStyle({ autoSize: true }))
    ).toBeTruthy();
  });

  test('Using Cell with the "autoSize" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isAutoSizeCell(createCellWithStyle({ autoSize: false }))
    ).toBeFalsy();
  });

  test('Cells not "autoSize" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setAutoSizeCells(false);
    expect(graph.isAutoSizeCell(new Cell())).toBeFalsy();
  });

  test('Cells "autoSize" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setAutoSizeCells(true);
    expect(graph.isAutoSizeCell(new Cell())).toBeTruthy();
  });
});

describe('isCellBendable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellBendable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "bendable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellBendable(createCellWithStyle({ bendable: true }))
    ).toBeTruthy();
  });

  test('Using Cell with the "bendable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellBendable(createCellWithStyle({ bendable: false }))
    ).toBeFalsy();
  });

  test('Cells not "bendable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsBendable(false);
    expect(graph.isCellBendable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsLocked(true);
    expect(graph.isCellBendable(new Cell())).toBeFalsy();
  });
});

describe('isCellCloneable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellCloneable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "cloneable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellCloneable(
        createCellWithStyle({ cloneable: true })
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "cloneable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellCloneable(
        createCellWithStyle({ cloneable: false })
      )
    ).toBeFalsy();
  });

  test('Cells not "cloneable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsCloneable(false);
    expect(graph.isCellCloneable(new Cell())).toBeFalsy();
  });
});

describe('isCellDeletable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellDeletable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "deletable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellDeletable(
        createCellWithStyle({ deletable: true })
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "deletable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellDeletable(
        createCellWithStyle({ deletable: false })
      )
    ).toBeFalsy();
  });

  test('Cells not "deletable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsDeletable(false);
    expect(graph.isCellDeletable(new Cell())).toBeFalsy();
  });
});

describe('isCellMovable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellMovable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "movable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellMovable(createCellWithStyle({ movable: true }))
    ).toBeTruthy();
  });

  test('Using Cell with the "movable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellMovable(createCellWithStyle({ movable: false }))
    ).toBeFalsy();
  });

  test('Cells not "movable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsMovable(false);
    expect(graph.isCellMovable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsLocked(true);
    expect(graph.isCellMovable(new Cell())).toBeFalsy();
  });
});

describe('isCellResizable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellResizable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "resizable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellResizable(
        createCellWithStyle({ resizable: true })
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "resizable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellResizable(
        createCellWithStyle({ resizable: false })
      )
    ).toBeFalsy();
  });

  test('Cells not "resizable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsResizable(false);
    expect(graph.isCellResizable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsLocked(true);
    expect(graph.isCellResizable(new Cell())).toBeFalsy();
  });
});

describe('isCellRotatable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellRotatable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "rotatable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellRotatable(
        createCellWithStyle({ rotatable: true })
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "rotatable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellRotatable(
        createCellWithStyle({ rotatable: false })
      )
    ).toBeFalsy();
  });
});

function configureParentChild(parent: Cell, child: Cell) {
  child.setParent(parent);
  parent.children.push(child);
}

describe('isValidAncestor', () => {
  test('Parent is the direct parent of the Cell, recurse: false', () => {
    const parent = new Cell();
    const cell = new Cell();
    cell.setParent(parent);
    expect(createGraphWithoutPlugins().isValidAncestor(cell, parent)).toBeTruthy();
  });

  test('Cell is direct child of parent but does not declare it as parent, and recurse: false', () => {
    const cell = new Cell();
    const parent = new Cell();
    parent.children.push(cell);
    expect(createGraphWithoutPlugins().isValidAncestor(cell, parent)).toBeFalsy();
  });

  test('Cell is direct child of parent, recurse: true', () => {
    const cell = new Cell();
    const intermediateParent = new Cell();
    configureParentChild(intermediateParent, cell);
    const parent = new Cell();
    configureParentChild(parent, intermediateParent);
    expect(createGraphWithoutPlugins().isValidAncestor(cell, parent, true)).toBeTruthy();
  });

  test.each([true, false])(
    'Cell does not match parent, recurse: %s',
    (recurse: boolean) => {
      expect(
        createGraphWithoutPlugins().isValidAncestor(new Cell(), new Cell(), recurse)
      ).toBeFalsy();
    }
  );

  test.each([true, false])('null Cell, recurse: %s', (recurse: boolean) => {
    expect(
      createGraphWithoutPlugins().isValidAncestor(null, new Cell(), recurse)
    ).toBeFalsy();
  });
});

describe('postProcessCellStyle', () => {
  const createGraph = (): BaseGraph => new BaseGraph({ plugins: [ImageBundlePlugin] });

  const registerBundle = (
    graph: BaseGraph,
    entries: Array<{ key: string; value: string; fallback?: string }>
  ): ImageBundle => {
    const bundle = new ImageBundle();
    for (const { key, value, fallback } of entries) {
      bundle.putImage(key, value, fallback ?? `${key}-fallback`);
    }
    graph.getPlugin<ImageBundlePlugin>('image-bundle')!.addImageBundle(bundle);
    return bundle;
  };

  describe('early return when style.image is falsy', () => {
    test('style.image is undefined: returns style untouched', () => {
      const graph = createGraph();
      const style: CellStateStyle = {};

      const result = graph.postProcessCellStyle(style);

      expect(result).toBe(style);
      expect(result.image).toBeUndefined();
    });

    test('style.image is an empty string: returns style untouched', () => {
      const graph = createGraph();
      const style: CellStateStyle = { image: '' };

      const result = graph.postProcessCellStyle(style);

      expect(result).toBe(style);
      expect(result.image).toBe('');
    });
  });

  describe('bundle resolution without data-URI normalization', () => {
    test('plain key, plugin not registered on the graph: style.image unchanged', () => {
      const graph = new BaseGraph();
      const style: CellStateStyle = { image: 'myKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe('myKey');
    });

    test('plain key, plugin registered without bundles: style.image unchanged', () => {
      const graph = createGraph();
      const style: CellStateStyle = { image: 'myKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe('myKey');
    });

    test('plain key, bundle registered but key does not match: style.image unchanged', () => {
      const graph = createGraph();
      registerBundle(graph, [{ key: 'otherKey', value: 'http://example.com/other.png' }]);
      const style: CellStateStyle = { image: 'myKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe('myKey');
    });

    test('key matches a bundle returning a plain URL: style.image replaced', () => {
      const graph = createGraph();
      registerBundle(graph, [{ key: 'myKey', value: 'http://example.com/img.png' }]);
      const style: CellStateStyle = { image: 'myKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe('http://example.com/img.png');
    });
  });

  describe('data-URI normalization', () => {
    test('bundle returns data:image/svg+xml with literal "<": body URL-encoded after position 19', () => {
      const graph = createGraph();
      const svgBody = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
      const bundleValue = `data:image/svg+xml,${svgBody}`;
      registerBundle(graph, [{ key: 'svgKey', value: bundleValue }]);
      const style: CellStateStyle = { image: 'svgKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe(`data:image/svg+xml,${encodeURIComponent(svgBody)}`);
    });

    test('bundle returns already-encoded data:image/svg+xml,%3C...: unchanged', () => {
      const graph = createGraph();
      const encoded =
        'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%2F%3E%3C%2Fsvg%3E';
      registerBundle(graph, [{ key: 'svgKey', value: encoded }]);
      const style: CellStateStyle = { image: 'svgKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe(encoded);
    });

    test('bundle returns data:image/png,xyz without ";base64,": infix injected', () => {
      const graph = createGraph();
      registerBundle(graph, [{ key: 'pngKey', value: 'data:image/png,xyz' }]);
      const style: CellStateStyle = { image: 'pngKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe('data:image/png;base64,xyz');
    });

    test('bundle returns data:image/png;base64,xyz already base64: unchanged', () => {
      const graph = createGraph();
      const alreadyBase64 = 'data:image/png;base64,iVBORw0KGgo=';
      registerBundle(graph, [{ key: 'pngKey', value: alreadyBase64 }]);
      const style: CellStateStyle = { image: 'pngKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe(alreadyBase64);
    });

    test('style.image is itself a data URI without ";base64,", no bundle lookup match: transform still applies', () => {
      const graph = createGraph();
      const style: CellStateStyle = { image: 'data:image/gif,abc' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe('data:image/gif;base64,abc');
    });

    test('"data:image/" with no comma: unchanged (comma guard prevents injection)', () => {
      const graph = createGraph();
      const style: CellStateStyle = { image: 'data:image/' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe('data:image/');
    });
  });

  describe('bundle ordering', () => {
    test('two bundles both containing the key: first match wins', () => {
      const graph = createGraph();
      registerBundle(graph, [
        { key: 'sharedKey', value: 'http://first.example/img.png' },
      ]);
      registerBundle(graph, [
        { key: 'sharedKey', value: 'http://second.example/img.png' },
      ]);
      const style: CellStateStyle = { image: 'sharedKey' };

      const result = graph.postProcessCellStyle(style);

      expect(result.image).toBe('http://first.example/img.png');
    });
  });
});
