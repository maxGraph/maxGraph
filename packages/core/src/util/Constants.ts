/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

/**
 * The version of the `maxGraph` library.
 */
// WARN: this constant is updated at release time by the script located at 'scripts/update-versions.mjs'.
// So, if you modify the name of this file or this constant, please update the script accordingly.
export const VERSION = '0.19.0';

/**
 * Defines the portion of the cell which is to be used as a connectable
 * region. Default is 0.3. Possible values are 0 < x <= 1.
 */
export const DEFAULT_HOTSPOT = 0.3;

/**
 * Defines the minimum size in pixels of the portion of the cell which is
 * to be used as a connectable region. Default is 8.
 */
export const MIN_HOTSPOT_SIZE = 8;

/**
 * Defines the maximum size in pixels of the portion of the cell which is
 * to be used as a connectable region. Use 0 for no maximum. Default is 0.
 */
export const MAX_HOTSPOT_SIZE = 0;

export enum RENDERING_HINT {
  EXACT = 'exact',
  FASTER = 'faster',
  FASTEST = 'fastest',
}

export enum DIALECT {
  /** the SVG display dialect name. */
  SVG = 'svg',
  /** the mixed HTML display dialect name. */
  MIXEDHTML = 'mixedHtml',
  /** the preferred HTML display dialect name. */
  PREFERHTML = 'preferHtml',
  /** the strict HTML display dialect name. */
  STRICTHTML = 'strictHtml',
}

/**
 * Name of the field to be used to store the object ID.
 */
export const IDENTITY_FIELD_NAME = 'mxObjectId';

/**
 * Defines the SVG namespace.
 */
export const NS_SVG = 'http://www.w3.org/2000/svg';

/**
 * Defines the XLink namespace.
 */
export const NS_XLINK = 'http://www.w3.org/1999/xlink';

/** Default value of {@link StyleDefaultsConfig.shadowColor}. */
export const SHADOWCOLOR = 'gray';

/** Default value of {@link StyleDefaultsConfig.shadowOffsetX}. */
export const SHADOW_OFFSET_X = 2;

/** Default value of {@link StyleDefaultsConfig.shadowOffsetY}. */
export const SHADOW_OFFSET_Y = 3;

/** Default value of {@link StyleDefaultsConfig.shadowOpacity}. */
export const SHADOW_OPACITY = 1;

export enum NODETYPE {
  ELEMENT = 1,
  ATTRIBUTE = 2,
  TEXT = 3,
  CDATA = 4,
  ENTITY_REFERENCE = 5,
  ENTITY = 6,
  PROCESSING_INSTRUCTION = 7,
  COMMENT = 8,
  DOCUMENT = 9,
  DOCUMENTTYPE = 10,
  DOCUMENT_FRAGMENT = 11,
  NOTATION = 12,
}

/**
 * Defines the vertical offset for the tooltip.
 * Default is 16.
 */
export const TOOLTIP_VERTICAL_OFFSET = 16;

/**
 * Specifies the default valid color. Default is #0000FF.
 */
export const DEFAULT_VALID_COLOR = '#00FF00';

/**
 * Specifies the default invalid color. Default is #FF0000.
 */
export const DEFAULT_INVALID_COLOR = '#FF0000';

/**
 * Specifies the default highlight color for shape outlines.
 * Default is #0000FF. This is used in {@link ConnectionHandler} and {@link EdgeHandler}.
 */
export const OUTLINE_HIGHLIGHT_COLOR = '#00FF00';

/**
 * Defines the strokewidth to be used for shape outlines.
 * Default is 5. This is used in {@link ConnectionHandler} and {@link EdgeHandler}.
 */
export const OUTLINE_HIGHLIGHT_STROKEWIDTH = 5;

/**
 * Defines the strokewidth to be used for the highlights.
 * Default is 3.
 */
export const HIGHLIGHT_STROKEWIDTH = 3;

/**
 * Size of the constraint highlight (in px). Default is 2.
 */
export const HIGHLIGHT_SIZE = 2;

/**
 * Opacity (in %) used for the highlights (including outline).
 * Default is 100.
 */
export const HIGHLIGHT_OPACITY = 100;

export enum CURSOR {
  /** Defines the cursor for a movable vertex. */
  MOVABLE_VERTEX = 'move',
  /** Defines the cursor for a movable edge. */
  MOVABLE_EDGE = 'move',
  /** Defines the cursor for a movable label. */
  LABEL_HANDLE = 'default',
  /** Defines the cursor for a terminal handle. */
  TERMINAL_HANDLE = 'pointer',
  /** Defines the cursor for a movable bend. */
  BEND_HANDLE = 'crosshair',
  /** Defines the cursor for a movable bend. */
  VIRTUAL_BEND_HANDLE = 'crosshair',
  /** Defines the cursor for a connectable state. */
  CONNECT = 'pointer',
}

/**
 * Defines the color to be used for the cell highlighting.
 * Use 'none' for no color. Default is #00FF00.
 */
// TODO this constants is unused (it wasn't used in mxGraph as well)--> remove it (and all documentation references as well)
export const HIGHLIGHT_COLOR = '#00FF00';

/**
 * Defines the color to be used for highlighting a target cell for a new
 * or changed connection. Note that this may be either a source or
 * target terminal in the graph. Use 'none' for no color.
 * Default is #0000FF.
 */
// TODO this constants is unused (it wasn't used in mxGraph as well)--> remove it (and all documentation references as well)
export const CONNECT_TARGET_COLOR = '#0000FF';

/**
 * Defines the color to be used for highlighting an invalid target cells
 * for a new or changed connections. Note that this may be either a source
 * or target terminal in the graph. Use 'none' for no color. Default is
 * #FF0000.
 */
export const INVALID_CONNECT_TARGET_COLOR = '#FF0000';

/**
 * Defines the color to be used for the highlighting target parent cells
 * (for drag and drop). Use 'none' for no color. Default is #0000FF.
 */
export const DROP_TARGET_COLOR = '#0000FF';

/**
 * Defines the color to be used for the coloring valid connection
 * previews. Use 'none' for no color. Default is #FF0000.
 */
export const VALID_COLOR = '#00FF00';

/**
 * Defines the color to be used for the coloring invalid connection
 * previews. Use 'none' for no color. Default is #FF0000.
 */
export const INVALID_COLOR = '#FF0000';

/**
 * Default value ('green' color) of {@link EdgeHandlerConfig.selectionColor}.
 */
export const EDGE_SELECTION_COLOR = '#00FF00';

/**
 * Default value ('green' color) of {@link VertexHandlerConfig.selectionColor}.
 */
export const VERTEX_SELECTION_COLOR = '#00FF00';

/**
 * Default value of {@link VertexHandlerConfig.selectionStrokeWidth}.
 */
export const VERTEX_SELECTION_STROKEWIDTH = 1;

/**
 * Default value of {@link EdgeHandlerConfig.selectionStrokeWidth}.
 */
export const EDGE_SELECTION_STROKEWIDTH = 1;

/**
 * Default value of {@link VertexHandlerConfig.selectionDashed}.
 */
export const VERTEX_SELECTION_DASHED = true;

/**
 * Default value of {@link EdgeHandlerConfig.selectionDashed}.
 */
export const EDGE_SELECTION_DASHED = true;

/**
 * Defines the color to be used for the guidelines in `Guide`.
 * @default #FF0000.
 */
export const GUIDE_COLOR = '#FF0000';

/**
 * Defines the strokewidth to be used for the guidelines in `Guide`.
 * @default 1.
 */
export const GUIDE_STROKEWIDTH = 1;

/**
 * Defines the color to be used for the outline rectangle
 * border.  Use 'none' for no color. Default is #0099FF.
 */
export const OUTLINE_COLOR = '#0099FF';

/**
 * Defines the strokewidth to be used for the outline rectangle
 * stroke width. Default is 3.
 */
export const OUTLINE_STROKEWIDTH = 3;

/**
 * Default value of {@link HandleConfig.size}.
 */
export const HANDLE_SIZE = 6;

/**
 * Default value of {@link HandleConfig.labelSize}.
 */
export const LABEL_HANDLE_SIZE = 4;

/**
 * Default value ('green' color) of {@link HandleConfig.fillColor}.
 */
export const HANDLE_FILLCOLOR = '#00FF00';

/**
 * Default value of {@link HandleConfig.strokeColor}.
 */
export const HANDLE_STROKECOLOR = 'black';

/**
 * Default value of {@link HandleConfig.labelFillColor}.
 */
export const LABEL_HANDLE_FILLCOLOR = 'yellow';

/**
 * Default value ('blue' color) of {@link EdgeHandlerConfig.connectFillColor}.
 */
export const CONNECT_HANDLE_FILLCOLOR = '#0000FF';

/**
 * Defines the color to be used for the locked handle fill color. Use
 * 'none' for no color. Default is #FF0000 (red).
 */
export const LOCKED_HANDLE_FILLCOLOR = '#FF0000';

/**
 * Defines the color to be used for the outline sizer fill color. Use
 * 'none' for no color. Default is #00FFFF.
 */
export const OUTLINE_HANDLE_FILLCOLOR = '#00FFFF';

/**
 * Defines the color to be used for the outline sizer stroke color. Use
 * 'none' for no color. Default is #0033FF.
 */
export const OUTLINE_HANDLE_STROKECOLOR = '#0033FF';

/**
 * Defines the default family for all fonts. Default is Arial,Helvetica.
 */
export const DEFAULT_FONTFAMILY = 'Arial,Helvetica';

/**
 * Defines the default size (in px). Default is 11.
 */
export const DEFAULT_FONTSIZE = 11;

/**
 * Defines the default value for the <STYLE_TEXT_DIRECTION> if no value is
 * defined for it in the style. Default value is an empty string which means
 * the default system setting is used and no direction is set.
 */
export const DEFAULT_TEXT_DIRECTION = '';

/**
 * Defines the default line height for text labels. Default is 1.2.
 */
export const LINE_HEIGHT = 1.2;

/**
 * Defines the CSS value for the word-wrap property. Default is "normal".
 * Change this to "break-word" to allow long words to be able to be broken
 * and wrap onto the next line.
 */
export const WORD_WRAP = 'normal';

/**
 * Specifies if absolute line heights should be used (px) in CSS. Default
 * is false. Set this to true for backwards compatibility.
 */
export const ABSOLUTE_LINE_HEIGHT = false;

/**
 * Defines the default style for all fonts. Default is 0. This can be set
 * to any combination of font styles as follows.
 *
 * ```javascript
 * mxConstants.DEFAULT_FONTSTYLE = mxConstants.FONT_BOLD | mxConstants.FONT_ITALIC;
 * ```
 */
export const DEFAULT_FONTSTYLE = 0;

/**
 * Defines the default start size for swimlanes. Default is 40.
 */
export const DEFAULT_STARTSIZE = 40;

/**
 * Defines the default size for all markers. Default is 6.
 */
export const DEFAULT_MARKERSIZE = 6;

/**
 * Defines the default width and height for images used in the
 * label shape. Default is 24.
 */
export const DEFAULT_IMAGESIZE = 24;

/**
 * Default value of {@link EntityRelationConnectorConfig.segment}.
 */
export const ENTITY_SEGMENT = 30;

/**
 * Defines the default rounding factor for the rounded vertices in percent between
 * `0` and `1`. Values should be smaller than `0.5`.
 * See {@link CellStateStyle.arcSize}.
 */
export const RECTANGLE_ROUNDING_FACTOR = 0.15;

/**
 * Defines the default size in pixels of the arcs for the rounded edges.
 * See {@link CellStateStyle.arcSize}.
 */
export const LINE_ARCSIZE = 20;

/**
 * Defines the spacing between the arrow shape and its terminals. Default is 0.
 */
export const ARROW_SPACING = 0;

/**
 * Defines the width of the arrow shape. Default is 30.
 */
export const ARROW_WIDTH = 30;

/**
 * Defines the size of the arrowhead in the arrow shape. Default is 30.
 */
export const ARROW_SIZE = 30;

/**
 * Defines the rectangle for the A4 portrait page format.
 * The dimensions of this page format are 827x1169 pixels.
 */
export const PAGE_FORMAT_A4_PORTRAIT = [0, 0, 827, 1169];

/**
 * Defines the rectangle for the A4 landscape page format.
 * The dimensions of this page format are 1169x827 pixels.
 */
export const PAGE_FORMAT_A4_LANDSCAPE = [0, 0, 1169, 827];

/**
 * Defines the rectangle for the Letter portrait page format.
 * The dimensions of this page format are 850x1100 pixels.
 */
// It may not be used in @maxGraph/core for now, but helpful for users. So don't remove it.
export const PAGE_FORMAT_LETTER_PORTRAIT = [0, 0, 850, 1100];

/**
 * Defines the rectangle for the Letter landscape page format.
 * The dimensions of this page format are 1100x850 pixels.
 */
// It may not be used in @maxGraph/core for now, but helpful for users. So don't remove it.
export const PAGE_FORMAT_LETTER_LANDSCAPE = [0, 0, 1100, 850];

/**
 * Defines the value for none. Default is "none".
 */
export const NONE = 'none';

export enum FONT {
  /** for bold fonts. */
  BOLD = 1,
  /** for italic fonts. */
  ITALIC = 2,
  /** for underlined fonts. */
  UNDERLINE = 4,
  /** for strikethrough fonts. */
  STRIKETHROUGH = 8,
}

export enum ARROW {
  /** for classic arrow markers. */
  CLASSIC = 'classic',
  /** for thin classic arrow markers. */
  CLASSIC_THIN = 'classicThin',
  /** for block arrow markers. */
  BLOCK = 'block',
  /** for thin block arrow markers. */
  BLOCK_THIN = 'blockThin',
  /** for open arrow markers. */
  OPEN = 'open',
  /** for thin open arrow markers. */
  OPEN_THIN = 'openThin',
  /** for oval arrow markers. */
  OVAL = 'oval',
  /** for diamond arrow markers. */
  DIAMOND = 'diamond',
  /** for thin diamond arrow markers. */
  DIAMOND_THIN = 'diamondThin',
}

export enum ALIGN {
  /** left horizontal alignment. */
  LEFT = 'left',
  /** center horizontal alignment. */
  CENTER = 'center',
  /** right horizontal alignment. */
  RIGHT = 'right',
  /** top vertical alignment. */
  TOP = 'top',
  /** middle vertical alignment. */
  MIDDLE = 'middle',
  /** bottom vertical alignment. */
  BOTTOM = 'bottom',
}

export enum DIRECTION {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
}

export enum TEXT_DIRECTION {
  /**
   * Use this value to use the default text direction of the operating system. */
  DEFAULT = '',
  /** Use this value to find the direction for a given text with {@link Text#getAutoDirection}. */
  AUTO = 'auto',
  /** Use this value for left to right text direction. */
  LTR = 'ltr',
  /** Use this value for right to left text direction. */
  RTL = 'rtl',
}

/**
 * Bitwise mask for all directions.
 */
export const DIRECTION_MASK = {
  /** No direction. */
  NONE: 0,
  WEST: 1,
  NORTH: 2,
  SOUTH: 4,
  EAST: 8,
  /** All directions. */
  ALL: 15,
};

/**
 * Default is horizontal.
 */
export enum ELBOW {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal',
}

/**
 * Names used to register the edge styles (a.k.a. connectors) provided out-of-the-box by maxGraph with {@link StyleRegistry.putValue}.
 * Can be used as a value for {@link CellStateStyle.edgeStyle}.
 */
export enum EDGESTYLE {
  ELBOW = 'elbowEdgeStyle',
  ENTITY_RELATION = 'entityRelationEdgeStyle',
  LOOP = 'loopEdgeStyle',
  SIDETOSIDE = 'sideToSideEdgeStyle',
  TOPTOBOTTOM = 'topToBottomEdgeStyle',
  ORTHOGONAL = 'orthogonalEdgeStyle',
  SEGMENT = 'segmentEdgeStyle',
  MANHATTAN = 'manhattanEdgeStyle',
}

/**
 * Names used to register the perimeters provided out-of-the-box by maxGraph with {@link StyleRegistry.putValue}.
 * Can be used as a value for {@link CellStateStyle.perimeter}.
 */
export enum PERIMETER {
  ELLIPSE = 'ellipsePerimeter',
  RECTANGLE = 'rectanglePerimeter',
  RHOMBUS = 'rhombusPerimeter',
  HEXAGON = 'hexagonPerimeter',
  TRIANGLE = 'trianglePerimeter',
}
