/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

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

/**
 * Defines the exact rendering hint.
 *
 * Defines the faster rendering hint.
 *
 * Defines the fastest rendering hint.
 */
export const enum RENDERING_HINT {
    EXACT = 'exact',
    FASTER = 'faster',
    FASTEST = 'fastest',
};

/**
 * - DIALECT.SVG: Defines the SVG display dialect name.
 *
 * - DIALECT.MIXEDHTML: Defines the mixed HTML display dialect name.
 *
 * - DIALECT.PREFERHTML: Defines the preferred HTML display dialect name.
 *
 * - DIALECT.STRICTHTML: Defines the strict HTML display dialect.
 */
export const enum DIALECT {
    SVG = 'svg',
    MIXEDHTML = 'mixedHtml',
    PREFERHTML = 'preferHtml',
    STRICTHTML = 'strictHtml',
};

/**
 * Defines the SVG namespace.
 */
export const NS_SVG = 'http://www.w3.org/2000/svg';

/**
 * Defines the XLink namespace.
 */
export const NS_XLINK = 'http://www.w3.org/1999/xlink';

/**
 * Defines the color to be used to draw shadows in shapes and windows.
 * Default is gray.
 */
export const SHADOWCOLOR = 'gray';

/**
 * Specifies the x-offset of the shadow. Default is 2.
 */
export const SHADOW_OFFSET_X = 2;

/**
 * Specifies the y-offset of the shadow. Default is 3.
 */
export const SHADOW_OFFSET_Y = 3;

/**
 * Defines the opacity for shadows. Default is 1.
 */
export const SHADOW_OPACITY = 1;

export const enum NODETYPE {
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
 * Default is #0000FF. This is used in {@link EdgeHandler}.
 */
export const OUTLINE_HIGHLIGHT_COLOR = '#00FF00';

/**
 * Defines the strokewidth to be used for shape outlines.
 * Default is 5. This is used in {@link EdgeHandler}.
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

/**
 * - CURSOR_MOVABLE_VERTEX: Defines the cursor for a movable vertex. Default is 'move'.
 *
 * - CURSOR_MOVABLE_EDGE: Defines the cursor for a movable edge. Default is 'move'.
 *
 * - CURSOR_LABEL_HANDLE: Defines the cursor for a movable label. Default is 'default'.
 *
 * - CURSOR_TERMINAL_HANDLE: Defines the cursor for a terminal handle. Default is 'pointer'.
 *
 * - CURSOR_BEND_HANDLE: Defines the cursor for a movable bend. Default is 'crosshair'.
 *
 * - CURSOR_VIRTUAL_BEND_HANDLE: Defines the cursor for a movable bend. Default is 'crosshair'.
 *
 * - CURSOR_CONNECT: Defines the cursor for a connectable state. Default is 'pointer'.
 */
export const enum CURSOR {
    MOVABLE_VERTEX = 'move',
    MOVABLE_EDGE = 'move',
    LABEL_HANDLE = 'default',
    TERMINAL_HANDLE = 'pointer',
    BEND_HANDLE = 'crosshair',
    VIRTUAL_BEND_HANDLE = 'crosshair',
    CONNECT = 'pointer',
};

/**
 * Defines the color to be used for the cell highlighting.
 * Use 'none' for no color. Default is #00FF00.
 */
export const HIGHLIGHT_COLOR = '#00FF00';

/**
 * Defines the color to be used for highlighting a target cell for a new
 * or changed connection. Note that this may be either a source or
 * target terminal in the graph. Use 'none' for no color.
 * Default is #0000FF.
 */
export const CONNECT_TARGET_COLOR = '#0000FF';

/**
 * Defines the color to be used for highlighting a invalid target cells
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
 * Defines the color to be used for the selection border of edges. Use
 * 'none' for no color. Default is #00FF00.
 */
export const EDGE_SELECTION_COLOR = '#00FF00';

/**
 * Defines the color to be used for the selection border of vertices. Use
 * 'none' for no color. Default is #00FF00.
 */
export const VERTEX_SELECTION_COLOR = '#00FF00';

/**
 * Defines the strokewidth to be used for vertex selections.
 * Default is 1.
 */
export const VERTEX_SELECTION_STROKEWIDTH = 1;

/**
 * Defines the strokewidth to be used for edge selections.
 * Default is 1.
 */
export const EDGE_SELECTION_STROKEWIDTH = 1;

/**
 * Defines the dashed state to be used for the vertex selection
 * border. Default is true.
 */
export const VERTEX_SELECTION_DASHED = true;

/**
 * Defines the dashed state to be used for the edge selection
 * border. Default is true.
 */
export const EDGE_SELECTION_DASHED = true;

/**
 * Defines the color to be used for the guidelines in mxGraphHandler.
 * Default is #FF0000.
 */
export const GUIDE_COLOR = '#FF0000';

/**
 * Defines the strokewidth to be used for the guidelines in mxGraphHandler.
 * Default is 1.
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
 * Defines the default size for handles. Default is 6.
 */
export const HANDLE_SIZE = 6;

/**
 * Defines the default size for label handles. Default is 4.
 */
export const LABEL_HANDLE_SIZE = 4;

/**
 * Defines the color to be used for the handle fill color. Use 'none' for
 * no color. Default is #00FF00 (green).
 */
export const HANDLE_FILLCOLOR = '#00FF00';

/**
 * Defines the color to be used for the handle stroke color. Use 'none' for
 * no color. Default is black.
 */
export const HANDLE_STROKECOLOR = 'black';

/**
 * Defines the color to be used for the label handle fill color. Use 'none'
 * for no color. Default is yellow.
 */
export const LABEL_HANDLE_FILLCOLOR = 'yellow';

/**
 * Defines the color to be used for the connect handle fill color. Use
 * 'none' for no color. Default is #0000FF (blue).
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
 * Defines the length of the horizontal segment of an Entity Relation.
 * This can be overridden using <'segment'> style.
 * Default is 30.
 */
export const ENTITY_SEGMENT = 30;

/**
 * Defines the rounding factor for rounded rectangles in percent between
 * 0 and 1. Values should be smaller than 0.5. Default is 0.15.
 */
export const RECTANGLE_ROUNDING_FACTOR = 0.15;

/**
 * Defines the size of the arcs for rounded edges. Default is 20.
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
 * Defines the rectangle for the A4 portrait page format. The dimensions
 * of this page format are 826x1169 pixels.
 */
export const PAGE_FORMAT_A4_PORTRAIT = [0, 0, 827, 1169];

/**
 * Defines the rectangle for the A4 portrait page format. The dimensions
 * of this page format are 826x1169 pixels.
 */
export const PAGE_FORMAT_A4_LANDSCAPE = [0, 0, 1169, 827];

/**
 * Defines the rectangle for the Letter portrait page format. The
 * dimensions of this page format are 850x1100 pixels.
 */
export const PAGE_FORMAT_LETTER_PORTRAIT = [0, 0, 850, 1100];

/**
 * Defines the rectangle for the Letter portrait page format. The dimensions
 * of this page format are 850x1100 pixels.
 */
export const PAGE_FORMAT_LETTER_LANDSCAPE = [0, 0, 1100, 850];

/**
 * Defines the value for none. Default is "none".
 */
export const NONE = 'none';

/**
 * - FONT_BOLD: Constant for bold fonts. Default is 1.
 *
 * - FONT_ITALIC: Constant for italic fonts. Default is 2.
 *
 * - FONT_UNDERLINE: Constant for underlined fonts. Default is 4.
 *
 * - FONT_STRIKETHROUGH: Constant for strikthrough fonts. Default is 8.
 */
export const enum FONT {
    BOLD = 1,
    ITALIC = 2,
    UNDERLINE = 4,
    STRIKETHROUGH = 8,
};

/**
 * - ARROW_CLASSIC: Constant for classic arrow markers.
 *
 * - ARROW_CLASSIC_THIN: Constant for thin classic arrow markers.
 *
 * - ARROW_BLOCK: Constant for block arrow markers.
 *
 * - ARROW_BLOCK_THIN: Constant for thin block arrow markers.
 *
 * - ARROW_OPEN: Constant for open arrow markers.
 *
 * - ARROW_OPEN_THIN: Constant for thin open arrow markers.
 *
 * - ARROW_OVAL: Constant for oval arrow markers.
 *
 * - ARROW_DIAMOND: Constant for diamond arrow markers.
 *
 * - ARROW_DIAMOND_THIN: Constant for thin diamond arrow markers.
 */
export const enum ARROW {
    CLASSIC = 'classic',
    CLASSIC_THIN = 'classicThin',
    BLOCK = 'block',
    BLOCK_THIN = 'blockThin',
    OPEN = 'open',
    OPEN_THIN = 'openThin',    
    OVAL = 'oval',
    DIAMOND = 'diamond',
    DIAMOND_THIN = 'diamondThin',
};

/**
 * - ALIGN_LEFT: Constant for left horizontal alignment. Default is left.
 *
 * - ALIGN_CENTER: Constant for center horizontal alignment. Default is center.
 *
 * - ALIGN_RIGHT: Constant for right horizontal alignment. Default is right.
 *
 * - ALIGN_TOP: Constant for top vertical alignment. Default is top.
 *
 * - ALIGN_MIDDLE: Constant for middle vertical alignment. Default is middle.
 *
 * - ALIGN_BOTTOM: Constant for bottom vertical alignment. Default is bottom.
 */
export const enum ALIGN {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
    TOP = 'top',
    MIDDLE = 'middle',
    BOTTOM = 'bottom',
};

export const enum DIRECTION {
    NORTH = 'north',
    SOUTH = 'south',
    EAST = 'east',
    WEST = 'west',
}

/**
 * Constant for text direction default. Default is an empty string. Use
 * this value to use the default text direction of the operating system.
 *
 * Constant for text direction automatic. Default is auto. Use this value
 * to find the direction for a given text with {@link Text#getAutoDirection}.
*
 * Constant for text direction left to right. Default is ltr. Use this
 * value for left to right text direction.
 * 
 * Constant for text direction right to left. Default is rtl. Use this
 * value for right to left text direction.
 */
export const enum TEXT_DIRECTION {
    DEFAULT = '',
    AUTO = 'auto',
    LTR = 'ltr',
    RTL = 'rtl',
};

/**
 * - DIRECTION_MASK_NONE: Constant for no direction.
 *
 * - DIRECTION_MASK_WEST: Bitwise mask for west direction.
 *
 * - DIRECTION_MASK_NORTH: Bitwise mask for north direction.
 *
 * - DIRECTION_MASK_SOUTH: Bitwise mask for south direction.
 *
 * - DIRECTION_MASK_EAST: Bitwise mask for east direction.
 *
 * - DIRECTION_MASK_ALL: Bitwise mask for all directions.
 */
export const DIRECTION_MASK = {
    NONE: 0,
    WEST: 1,
    NORTH: 2,
    SOUTH: 4,
    EAST: 8,
    ALL: 15,
};

/**
 * Default is horizontal.
 */
export const enum ELBOW {
    VERTICAL = 'vertical',
    HORIZONTAL = 'horizontal',
};

/**
 * Can be used as a string value for the STYLE_EDGE style.
 */
export const enum EDGESTYLE {
    ELBOW = 'elbowEdgeStyle',
    ENTITY_RELATION = 'entityRelationEdgeStyle',
    LOOP = 'loopEdgeStyle',
    SIDETOSIDE = 'sideToSideEdgeStyle',
    TOPTOBOTTOM = 'topToBottomEdgeStyle',
    ORTHOGONAL = 'orthogonalEdgeStyle',
    SEGMENT = 'segmentEdgeStyle',
};

/**
 * Can be used as a string value for the STYLE_PERIMETER style.
 */
export const enum PERIMETER {
    ELLIPSE = 'ellipsePerimeter',
    RECTANGLE = 'rectanglePerimeter',
    RHOMBUS = 'rhombusPerimeter',
    HEXAGON = 'hexagonPerimeter',
    TRIANGLE = 'trianglePerimeter'
};

export const enum SHAPE {
    /**
     * Name under which {@link RectangleShape} is registered in {@link CellRenderer}.
     * Default is rectangle.
     */
    RECTANGLE = 'rectangle',

    /**
     * Name under which {@link Ellipse} is registered in {@link CellRenderer}.
     * Default is ellipse.
     */
    ELLIPSE = 'ellipse',

    /**
     * Name under which {@link DoubleEllipse} is registered in {@link CellRenderer}.
     * Default is doubleEllipse.
     */
    DOUBLE_ELLIPSE = 'doubleEllipse',

    /**
     * Name under which {@link Rhombus} is registered in {@link CellRenderer}.
     * Default is rhombus.
     */
    RHOMBUS = 'rhombus',

    /**
     * Name under which {@link Line} is registered in {@link CellRenderer}.
     * Default is line.
     */
    LINE = 'line',

    /**
     * Name under which {@link ImageShape} is registered in {@link CellRenderer}.
     * Default is image.
     */
    IMAGE = 'image',

    /**
     * Name under which {@link Arrow} is registered in {@link CellRenderer}.
     * Default is arrow.
     */
    ARROW = 'arrow',

    /**
     * Name under which {@link ArrowConnector} is registered in {@link CellRenderer}.
     * Default is arrowConnector.
     */
    ARROW_CONNECTOR = 'arrowConnector',

    /**
     * Name under which {@link Label} is registered in {@link CellRenderer}.
     * Default is label.
     */
    LABEL = 'label',

    /**
     * Name under which {@link Cylinder} is registered in {@link CellRenderer}.
     * Default is cylinder.
     */
    CYLINDER = 'cylinder',

    /**
     * Name under which {@link Swimlane} is registered in {@link CellRenderer}.
     * Default is swimlane.
     */
    SWIMLANE = 'swimlane',

    /**
     * Name under which {@link Connector} is registered in {@link CellRenderer}.
     * Default is connector.
     */
    CONNECTOR = 'connector',

    /**
     * Name under which {@link Actor} is registered in {@link CellRenderer}.
     * Default is actor.
     */
    ACTOR = 'actor',

    /**
     * Name under which {@link Cloud} is registered in {@link CellRenderer}.
     * Default is cloud.
     */
    CLOUD = 'cloud',

    /**
     * Name under which {@link Triangle} is registered in {@link CellRenderer}.
     * Default is triangle. 
     */
    TRIANGLE = 'triangle',

    /**
     * Name under which {@link Hexagon} is registered in {@link CellRenderer}.
     * Default is hexagon.
     */
    HEXAGON = 'hexagon',
};
