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

import { afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import {
  Cell,
  CollapseChange,
  Geometry,
  GraphDataModel,
  GraphView,
  ModelXmlSerializer,
  registerAllCodecs,
  registerCoreCodecs,
  TerminalChange,
  unregisterAllCodecs,
  VisibleChange,
} from '../../src';
import { Editor } from '../../src/editor/Editor';
import { ModelChecker } from './utils';
import { createGraphWithoutContainer } from '../utils';
import { importToObject } from './codec/shared';
import {
  allBooleanCellStyleCases,
  booleanCellStyleCasesFor,
  buildExpectedStyle,
  decodedBooleanValue,
  serializedBooleanValues,
  type BooleanCellStyleCase,
  type SerializedBooleanValue,
} from './boolean-style-properties';

const buildStyleXmlAttributes = (cases: readonly BooleanCellStyleCase[]): string =>
  cases.map(({ key, serializedValue }) => `${key}="${serializedValue}"`).join(' ');

const namedCases = (
  cases: readonly BooleanCellStyleCase[]
): readonly [string, BooleanCellStyleCase][] =>
  cases.map((booleanCase) => [
    `${booleanCase.key}="${booleanCase.serializedValue}"`,
    booleanCase,
  ]);

// Prevents side effects between tests
beforeAll(() => {
  unregisterAllCodecs();
});
afterEach(() => {
  unregisterAllCodecs();
});

describe('decode boolean style properties from an Object element', () => {
  // ModelXmlSerializer is not involved here, so the codecs must be registered explicitly
  beforeEach(() => {
    registerCoreCodecs();
  });

  const decodeStyle = (cases: readonly BooleanCellStyleCase[]): object => {
    const style = {};
    importToObject(style, `<Object ${buildStyleXmlAttributes(cases)} />`);
    return style;
  };

  test.each(serializedBooleanValues)('all properties serialized as %s', (value) => {
    const cases = booleanCellStyleCasesFor(value);
    expect(decodeStyle(cases)).toEqual(buildExpectedStyle(cases));
  });

  test.each(namedCases(allBooleanCellStyleCases))('%s', (_name, booleanCase) => {
    expect(decodeStyle([booleanCase])).toEqual(buildExpectedStyle([booleanCase]));
  });
});

describe('decode boolean style properties from the add children of an Object element', () => {
  // ModelXmlSerializer is not involved here, so the codecs must be registered explicitly
  beforeEach(() => {
    registerCoreCodecs();
  });

  const decodeStyle = (children: string): object => {
    const style = {};
    importToObject(style, `<Object>${children}</Object>`);
    return style;
  };

  const decodeStyleCases = (cases: readonly BooleanCellStyleCase[]): object =>
    decodeStyle(
      cases
        .map(
          ({ key, serializedValue }) => `<add as="${key}" value="${serializedValue}" />`
        )
        .join('')
    );

  test.each(serializedBooleanValues)('all properties serialized as %s', (value) => {
    const cases = booleanCellStyleCasesFor(value);
    expect(decodeStyleCases(cases)).toEqual(buildExpectedStyle(cases));
  });

  test.each(namedCases(allBooleanCellStyleCases))('%s', (_name, booleanCase) => {
    expect(decodeStyleCases([booleanCase])).toEqual(buildExpectedStyle([booleanCase]));
  });

  test('agrees with the attribute form', () => {
    const cases = booleanCellStyleCasesFor('1');
    const fromAttributes = {};
    importToObject(fromAttributes, `<Object ${buildStyleXmlAttributes(cases)} />`);
    expect(decodeStyleCases(cases)).toEqual(fromAttributes);
  });

  test('a property of another type is still stored as a string, unlike on the attribute form', () => {
    expect(decodeStyle('<add as="strokeWidth" value="2" />')).toEqual({
      strokeWidth: '2',
    });
    expect(decodeStyle('<add as="fillColor" value="red" />')).toEqual({
      fillColor: 'red',
    });
  });

  test('an unrecognized spelling of a boolean property is left untouched', () => {
    expect(decodeStyle('<add as="rounded" value="yes" />')).toEqual({
      rounded: 'yes',
    });
  });
});

describe('decode boolean style properties from the style of a Cell', () => {
  const decodeStyleOfVertex = (
    cases: readonly BooleanCellStyleCase[]
  ): GraphDataModel => {
    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(
      `<GraphDataModel>
  <root>
    <Cell id="0">
      <Object as="style" />
    </Cell>
    <Cell id="1" parent="0">
      <Object as="style" />
    </Cell>
    <Cell id="cell-1" vertex="1" parent="1">
      <Object ${buildStyleXmlAttributes(cases)} as="style" />
    </Cell>
  </root>
</GraphDataModel>`
    );
    return model;
  };

  const expectDecodedStyle = (cases: readonly BooleanCellStyleCase[]): void => {
    const model = decodeStyleOfVertex(cases);
    const modelChecker = new ModelChecker(model);
    modelChecker.checkRootCells();
    modelChecker.checkCellsCount(3);
    modelChecker.expectIsVertex(model.getCell('cell-1'), null, {
      style: buildExpectedStyle(cases),
    });
  };

  test.each(serializedBooleanValues)('all properties serialized as %s', (value) => {
    expectDecodedStyle(booleanCellStyleCasesFor(value));
  });

  test.each(namedCases(allBooleanCellStyleCases))('%s', (_name, booleanCase) => {
    expectDecodedStyle([booleanCase]);
  });
});

/**
 * The boolean fields of the classes that have a registered codec, with the XML element they decode from.
 *
 * The defect is not limited to styles: the attribute decoder is shared, so every one of these fields decodes as a
 * number too. `previous` is left out of the change classes because their codecs exclude it from decoding.
 */
const classesWithBooleanFields: readonly [
  string,
  string,
  () => object,
  readonly string[],
][] = [
  [
    'Cell',
    'Cell',
    () => new Cell(),
    ['vertex', 'edge', 'connectable', 'visible', 'collapsed', 'invalidating'],
  ],
  [
    'Geometry',
    'Geometry',
    () => new Geometry(),
    ['relative', 'TRANSLATE_CONTROL_POINTS'],
  ],
  [
    'GraphDataModel',
    'GraphDataModel',
    () => new GraphDataModel(),
    ['maintainEdgeParent', 'ignoreRelativeEdgeParent', 'createIds', 'endingUpdate'],
  ],
  [
    'GraphView',
    'GraphView',
    () => new GraphView(createGraphWithoutContainer()),
    ['allowEval', 'captureDocumentGesture', 'rendering', 'updateStyle'],
  ],
  [
    'CollapseChange',
    'CollapseChange',
    () => new CollapseChange(undefined!, undefined!, undefined!),
    ['collapsed'],
  ],
  [
    'VisibleChange',
    'VisibleChange',
    () => new VisibleChange(undefined!, undefined!, undefined!),
    ['visible'],
  ],
  [
    'TerminalChange',
    'TerminalChange',
    () => new TerminalChange(undefined!, undefined!, undefined!, undefined!),
    ['source'],
  ],
  [
    'Editor',
    'Editor',
    () => new Editor(undefined!),
    [
      'swimlaneRequired',
      'disableContextMenu',
      'forcedInserting',
      'escapePostData',
      'horizontalFlow',
      'layoutDiagram',
      'maintainSwimlanes',
      'layoutSwimlanes',
      'movePropertiesDialog',
      'validating',
      'destroyed',
    ],
  ],
];

const buildFieldAttributes = (
  fields: readonly string[],
  serializedValue: SerializedBooleanValue
): string => fields.map((field) => `${field}="${serializedValue}"`).join(' ');

const readFields = (target: object, fields: readonly string[]): Record<string, unknown> =>
  Object.fromEntries(fields.map((field) => [field, (target as never)[field]]));

const expectedFields = (
  fields: readonly string[],
  serializedValue: SerializedBooleanValue
): Record<string, unknown> =>
  Object.fromEntries(
    fields.map((field) => [field, decodedBooleanValue(serializedValue)])
  );

describe('decode the boolean fields of the codec registered classes', () => {
  beforeEach(() => {
    registerAllCodecs();
  });

  describe.each(classesWithBooleanFields)(
    '%s',
    (_name, nodeName, createTarget, fields) => {
      test.each(serializedBooleanValues)('serialized as %s', (serializedValue) => {
        const target = createTarget();
        importToObject(
          target,
          `<${nodeName} ${buildFieldAttributes(fields, serializedValue)} />`
        );
        expect(readFields(target, fields)).toEqual(
          expectedFields(fields, serializedValue)
        );
      });
    }
  );

  const graphOwnBooleanFields = [
    'destroyed',
    'isConstrainedMoving',
    'pageVisible',
    'pageBreaksVisible',
    'pageBreakDashed',
    'preferPageSize',
    'enabled',
    'exportEnabled',
    'importEnabled',
    'ignoreScrollbars',
    'translateToScrollPosition',
    'resizeContainer',
    'keepEdgesInForeground',
    'keepEdgesInBackground',
    'recursiveResize',
    'resetViewOnRootChange',
    'allowLoops',
    'multigraph',
  ];

  test.each(serializedBooleanValues)(
    'AbstractGraph own fields serialized as %s',
    (serializedValue) => {
      const graph = createGraphWithoutContainer();
      importToObject(
        graph,
        `<Graph ${buildFieldAttributes(graphOwnBooleanFields, serializedValue)} />`
      );
      expect(readFields(graph, graphOwnBooleanFields)).toEqual(
        expectedFields(graphOwnBooleanFields, serializedValue)
      );
    }
  );

  // The folding options are a plain object, not a class instance, but unlike a style object they are reached through
  // the field of a graph, so the object being decoded into already holds real booleans.
  const foldingOptionsBooleanFields = ['foldingEnabled', 'collapseToPreferredSize'];

  test.each(serializedBooleanValues)(
    'graph folding options serialized as %s',
    (serializedValue) => {
      const graph = createGraphWithoutContainer();
      expect(typeof graph.options.foldingEnabled).toBe('boolean');

      importToObject(
        graph,
        `<Graph><Object ${buildFieldAttributes(foldingOptionsBooleanFields, serializedValue)} as="options" /></Graph>`
      );

      expect(readFields(graph.options, foldingOptionsBooleanFields)).toEqual(
        expectedFields(foldingOptionsBooleanFields, serializedValue)
      );
    }
  );

  // Not a wrong type but a lost value: unlike every other class above, the attributes of a Multiplicity are not
  // decoded at all, so its boolean field keeps no trace of what the XML said. Tracked separately from this work.
  test('Multiplicity source is not decoded at all', () => {
    const graph = createGraphWithoutContainer();
    importToObject(
      graph,
      `<Graph><Array as="multiplicities"><Multiplicity type="rectangle" source="1" /></Array></Graph>`
    );

    expect(graph.multiplicities).toHaveLength(1);
    expect(graph.multiplicities[0].source).toBeUndefined();
  });
});
