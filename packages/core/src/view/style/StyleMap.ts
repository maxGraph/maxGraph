class StyleMap implements Record<string, any> {
  defaultVertex?: StyleMap;
  defaultEdge?: StyleMap;

  /**
   * Variable: STYLE_PERIMETER
   *
   * Defines the key for the perimeter style. This is a function that defines
   * the perimeter around a particular shape. Possible values are the
   * functions defined in <mxPerimeter>. Alternatively, the constants in this
   * class that start with "PERIMETER_" may be used to access
   * perimeter styles in <mxStyleRegistry>. Value is "perimeter".
   */
  perimeter: any;

  /**
   * Variable: STYLE_SOURCE_PORT
   *
   * Defines the ID of the cell that should be used for computing the
   * perimeter point of the source for an edge. This allows for graphically
   * connecting to a cell while keeping the actual terminal of the edge.
   * Value is "sourcePort".
   */
  sourcePort: any;

  /**
   * Variable: STYLE_TARGET_PORT
   *
   * Defines the ID of the cell that should be used for computing the
   * perimeter point of the target for an edge. This allows for graphically
   * connecting to a cell while keeping the actual terminal of the edge.
   * Value is "targetPort".
   */
  targetPort: any;

  /**
   * Variable: STYLE_PORT_CONSTRAINT
   *
   * Defines the direction(s) that edges are allowed to connect to cells in.
   * Possible values are "DIRECTION_NORTH, DIRECTION_SOUTH,
   * DIRECTION_EAST" and "DIRECTION_WEST". Value is
   * "portConstraint".
   */
  portConstraint: any;

  /**
   * Variable: STYLE_PORT_CONSTRAINT_ROTATION
   *
   * Define whether port constraint directions are rotated with vertex
   * rotation. 0 (default) causes port constraints to remain absolute,
   * relative to the graph, 1 causes the constraints to rotate with
   * the vertex. Value is "portConstraintRotation".
   */
  portConstraintRotation: any;

  /**
   * Variable: STYLE_SOURCE_PORT_CONSTRAINT
   *
   * Defines the direction(s) that edges are allowed to connect to sources in.
   * Possible values are "DIRECTION_NORTH, DIRECTION_SOUTH, DIRECTION_EAST"
   * and "DIRECTION_WEST". Value is "sourcePortConstraint".
   */
  sourcePortConstraint: any;

  /**
   * Variable: STYLE_TARGET_PORT_CONSTRAINT
   *
   * Defines the direction(s) that edges are allowed to connect to targets in.
   * Possible values are "DIRECTION_NORTH, DIRECTION_SOUTH, DIRECTION_EAST"
   * and "DIRECTION_WEST". Value is "targetPortConstraint".
   */
  targetPortConstraint: any;

  /**
   * Variable: STYLE_OPACITY
   *
   * Defines the key for the opacity style. The type of the value is
   * numeric and the possible range is 0-100. Value is "opacity".
   */
  opacity: any;

  /**
   * Variable: STYLE_FILL_OPACITY
   *
   * Defines the key for the fill opacity style. The type of the value is
   * numeric and the possible range is 0-100. Value is "fillOpacity".
   */
  fillOpacity: any;

  /**
   * Variable: STYLE_STROKE_OPACITY
   *
   * Defines the key for the stroke opacity style. The type of the value is
   * numeric and the possible range is 0-100. Value is "strokeOpacity".
   */
  strokeOpacity: any;

  /**
   * Variable: STYLE_TEXT_OPACITY
   *
   * Defines the key for the text opacity style. The type of the value is
   * numeric and the possible range is 0-100. Value is "textOpacity".
   */
  textOpacity: any;

  /**
   * Variable: STYLE_TEXT_DIRECTION
   *
   * Defines the key for the text direction style. Possible values are
   * "TEXT_DIRECTION_DEFAULT, TEXT_DIRECTION_AUTO, TEXT_DIRECTION_LTR"
   * and "TEXT_DIRECTION_RTL". Value is "textDirection".
   * The default value for the style is defined in <DEFAULT_TEXT_DIRECTION>.
   * It is used is no value is defined for this key in a given style. This is
   * an experimental style that is currently ignored in the backends.
   */
  textDirection: any;

  /**
   * Variable: STYLE_OVERFLOW
   *
   * Defines the key for the overflow style. Possible values are 'visible',
   * 'hidden', 'fill' and 'width'. The default value is 'visible'. This value
   * specifies how overlapping vertex labels are handled. A value of
   * 'visible' will show the complete label. A value of 'hidden' will clip
   * the label so that it does not overlap the vertex bounds. A value of
   * 'fill' will use the vertex bounds and a value of 'width' will use the
   * vertex width for the label. See <mxGraph.isLabelClipped>. Note that
   * the vertical alignment is ignored for overflow fill and for horizontal
   * alignment, left should be used to avoid pixel offsets in Internet Explorer
   * 11 and earlier or if foreignObjects are disabled. Value is "overflow".
   */
  overflow: any;

  /**
   * Variable: STYLE_ORTHOGONAL
   *
   * Defines if the connection points on either end of the edge should be
   * computed so that the edge is vertical or horizontal if possible and
   * if the point is not at a fixed location. Default is false. This is
   * used in <mxGraph.isOrthogonal>, which also returns true if the edgeStyle
   * of the edge is an elbow or entity. Value is "orthogonal".
   */
  orthogonal: any;

  /**
   * Variable: STYLE_EXIT_X
   *
   * Defines the key for the horizontal relative coordinate connection point
   * of an edge with its source terminal. Value is "exitX".
   */
  exitX: any;

  /**
   * Variable: STYLE_EXIT_Y
   *
   * Defines the key for the vertical relative coordinate connection point
   * of an edge with its source terminal. Value is "exitY".
   */
  exitY: any;

  /**
   * Variable: STYLE_EXIT_DX
   *
   * Defines the key for the horizontal offset of the connection point
   * of an edge with its source terminal. Value is "exitDx".
   */
  exitDx: any;

  /**
   * Variable: STYLE_EXIT_DY
   *
   * Defines the key for the vertical offset of the connection point
   * of an edge with its source terminal. Value is "exitDy".
   */
  exitDy: any;

  /**
   * Variable: STYLE_EXIT_PERIMETER
   *
   * Defines if the perimeter should be used to find the exact entry point
   * along the perimeter of the source. Possible values are 0 (false) and
   * 1 (true). Default is 1 (true). Value is "exitPerimeter".
   */
  exitPerimeter: any;

  /**
   * Variable: STYLE_ENTRY_X
   *
   * Defines the key for the horizontal relative coordinate connection point
   * of an edge with its target terminal. Value is "entryX".
   */
  entryX: any;

  /**
   * Variable: STYLE_ENTRY_Y
   *
   * Defines the key for the vertical relative coordinate connection point
   * of an edge with its target terminal. Value is "entryY".
   */
  entryY: any;

  /**
   * Variable: STYLE_ENTRY_DX
   *
   * Defines the key for the horizontal offset of the connection point
   * of an edge with its target terminal. Value is "entryDx".
   */
  entryDx: any;

  /**
   * Variable: STYLE_ENTRY_DY
   *
   * Defines the key for the vertical offset of the connection point
   * of an edge with its target terminal. Value is "entryDy".
   */
  entryDy: any;

  /**
   * Variable: STYLE_ENTRY_PERIMETER
   *
   * Defines if the perimeter should be used to find the exact entry point
   * along the perimeter of the target. Possible values are 0 (false) and
   * 1 (true). Default is 1 (true). Value is "entryPerimeter".
   */
  entryPerimeter: any;

  /**
   * Variable: STYLE_WHITE_SPACE
   *
   * Defines the key for the white-space style. Possible values are 'nowrap'
   * and 'wrap'. The default value is 'nowrap'. This value specifies how
   * white-space inside a HTML vertex label should be handled. A value of
   * 'nowrap' means the text will never wrap to the next line until a
   * linefeed is encountered. A value of 'wrap' means text will wrap when
   * necessary. This style is only used for HTML labels.
   * See <mxGraph.isWrapping>. Value is "whiteSpace".
   */
  whiteSpace: any;

  /**
   * Variable: STYLE_ROTATION
   *
   * Defines the key for the rotation style. The type of the value is
   * numeric and the possible range is 0-360. Value is "rotation".
   */
  rotation: any;

  /**
   * Variable: STYLE_FILLCOLOR
   *
   * Defines the key for the fill color. Possible values are all HTML color
   * names or HEX codes, as well as special keywords such as 'swimlane,
   * 'inherit' or 'indicated' to use the color code of a related cell or the
   * indicator shape. Value is "fillColor".
   */
  fillColor: any;

  /**
   * Variable: STYLE_POINTER_EVENTS
   *
   * Specifies if pointer events should be fired on transparent backgrounds.
   * This style is currently only supported in <mxRectangleShape>. Default
   * is true. Value is "pointerEvents". This is typically set to
   * false in groups where the transparent part should allow any underlying
   * cells to be clickable.
   */
  pointerEvents: any;

  /**
   * Variable: STYLE_SWIMLANE_FILLCOLOR
   *
   * Defines the key for the fill color of the swimlane background. Possible
   * values are all HTML color names or HEX codes. Default is no background.
   * Value is "swimlaneFillColor".
   */
  swimlaneFillColor: any;

  /**
   * Variable: STYLE_MARGIN
   *
   * Defines the key for the margin between the ellipses in the double ellipse shape.
   * Possible values are all positive numbers. Value is "margin".
   */
  margin: any;

  /**
   * Variable: STYLE_GRADIENTCOLOR
   *
   * Defines the key for the gradient color. Possible values are all HTML color
   * names or HEX codes, as well as special keywords such as 'swimlane,
   * 'inherit' or 'indicated' to use the color code of a related cell or the
   * indicator shape. This is ignored if no fill color is defined. Value is
   * "gradientColor".
   */
  gradientColor: any;

  /**
   * Variable: STYLE_GRADIENT_DIRECTION
   *
   * Defines the key for the gradient direction. Possible values are
   * <DIRECTION_EAST>, <DIRECTION_WEST>, <DIRECTION_NORTH> and
   * <DIRECTION_SOUTH>. Default is <DIRECTION_SOUTH>. Generally, and by
   * default in mxGraph, gradient painting is done from the value of
   * <STYLE_FILLCOLOR> to the value of <STYLE_GRADIENTCOLOR>. Taking the
   * example of <DIRECTION_NORTH>, this means <STYLE_FILLCOLOR> color at the
   * bottom of paint pattern and <STYLE_GRADIENTCOLOR> at top, with a
   * gradient in-between. Value is "gradientDirection".
   */
  gradientDirection: any;

  /**
   * Variable: STYLE_STROKECOLOR
   *
   * Defines the key for the strokeColor style. Possible values are all HTML
   * color names or HEX codes, as well as special keywords such as 'swimlane,
   * 'inherit', 'indicated' to use the color code of a related cell or the
   * indicator shape or 'none' for no color. Value is "strokeColor".
   */
  strokeColor: any;

  /**
   * Variable: STYLE_SEPARATORCOLOR
   *
   * Defines the key for the separatorColor style. Possible values are all
   * HTML color names or HEX codes. This style is only used for
   * <SHAPE_SWIMLANE> shapes. Value is "separatorColor".
   */
  separatorColor: any;

  /**
   * Variable: STYLE_STROKEWIDTH
   *
   * Defines the key for the strokeWidth style. The type of the value is
   * numeric and the possible range is any non-negative value larger or equal
   * to 1. The value defines the stroke width in pixels. Note: To hide a
   * stroke use strokeColor none. Value is "strokeWidth".
   */
  strokeWidth: any;

  /**
   * Variable: STYLE_ALIGN
   *
   * Defines the key for the align style. Possible values are <ALIGN_LEFT>,
   * <ALIGN_CENTER> and <ALIGN_RIGHT>. This value defines how the lines of
   * the label are horizontally aligned. <ALIGN_LEFT> mean label text lines
   * are aligned to left of the label bounds, <ALIGN_RIGHT> to the right of
   * the label bounds and <ALIGN_CENTER> means the center of the text lines
   * are aligned in the center of the label bounds. Note this value doesn't
   * affect the positioning of the overall label bounds relative to the
   * vertex, to move the label bounds horizontally, use
   * <STYLE_LABEL_POSITION>. Value is "align".
   */
  align: any;

  /**
   * Variable: STYLE_VERTICAL_ALIGN
   *
   * Defines the key for the verticalAlign style. Possible values are
   * <ALIGN_TOP>, <ALIGN_MIDDLE> and <ALIGN_BOTTOM>. This value defines how
   * the lines of the label are vertically aligned. <ALIGN_TOP> means the
   * topmost label text line is aligned against the top of the label bounds,
   * <ALIGN_BOTTOM> means the bottom-most label text line is aligned against
   * the bottom of the label bounds and <ALIGN_MIDDLE> means there is equal
   * spacing between the topmost text label line and the top of the label
   * bounds and the bottom-most text label line and the bottom of the label
   * bounds. Note this value doesn't affect the positioning of the overall
   * label bounds relative to the vertex, to move the label bounds
   * vertically, use <STYLE_VERTICAL_LABEL_POSITION>. Value is "verticalAlign".
   */
  verticalAlign: any;

  /**
   * Variable: STYLE_LABEL_WIDTH
   *
   * Defines the key for the width of the label if the label position is not
   * center. Value is "labelWidth".
   */
  labelWidth: any;

  /**
   * Variable: STYLE_LABEL_POSITION
   *
   * Defines the key for the horizontal label position of vertices. Possible
   * values are <ALIGN_LEFT>, <ALIGN_CENTER> and <ALIGN_RIGHT>. Default is
   * <ALIGN_CENTER>. The label align defines the position of the label
   * relative to the cell. <ALIGN_LEFT> means the entire label bounds is
   * placed completely just to the left of the vertex, <ALIGN_RIGHT> means
   * adjust to the right and <ALIGN_CENTER> means the label bounds are
   * vertically aligned with the bounds of the vertex. Note this value
   * doesn't affect the positioning of label within the label bounds, to move
   * the label horizontally within the label bounds, use <STYLE_ALIGN>.
   * Value is "labelPosition".
   */
  labelPosition: any;

  /**
   * Variable: STYLE_VERTICAL_LABEL_POSITION
   *
   * Defines the key for the vertical label position of vertices. Possible
   * values are <ALIGN_TOP>, <ALIGN_BOTTOM> and <ALIGN_MIDDLE>. Default is
   * <ALIGN_MIDDLE>. The label align defines the position of the label
   * relative to the cell. <ALIGN_TOP> means the entire label bounds is
   * placed completely just on the top of the vertex, <ALIGN_BOTTOM> means
   * adjust on the bottom and <ALIGN_MIDDLE> means the label bounds are
   * horizontally aligned with the bounds of the vertex. Note this value
   * doesn't affect the positioning of label within the label bounds, to move
   * the label vertically within the label bounds, use
   * <STYLE_VERTICAL_ALIGN>. Value is "verticalLabelPosition".
   */
  verticalLabelPosition: any;

  /**
   * Variable: STYLE_IMAGE_ASPECT
   *
   * Defines the key for the image aspect style. Possible values are 0 (do
   * not preserve aspect) or 1 (keep aspect). This is only used in
   * <mxImageShape>. Default is 1. Value is "imageAspect".
   */
  imageAspect: any;

  /**
   * Variable: STYLE_IMAGE_ALIGN
   *
   * Defines the key for the align style. Possible values are <ALIGN_LEFT>,
   * <ALIGN_CENTER> and <ALIGN_RIGHT>. The value defines how any image in the
   * vertex label is aligned horizontally within the label bounds of a
   * <SHAPE_LABEL> shape. Value is "imageAlign".
   */
  imageAlign: any;

  /**
   * Variable: STYLE_IMAGE_VERTICAL_ALIGN
   *
   * Defines the key for the verticalAlign style. Possible values are
   * <ALIGN_TOP>, <ALIGN_MIDDLE> and <ALIGN_BOTTOM>. The value defines how
   * any image in the vertex label is aligned vertically within the label
   * bounds of a <SHAPE_LABEL> shape. Value is "imageVerticalAlign".
   */
  imageVerticalAlign: any;

  /**
   * Variable: STYLE_GLASS
   *
   * Defines the key for the glass style. Possible values are 0 (disabled) and
   * 1(enabled). The default value is 0. This is used in <mxLabel>. Value is
   * "glass".
   */
  glass: any;

  /**
   * Variable: STYLE_IMAGE
   *
   * Defines the key for the image style. Possible values are any image URL,
   * the type of the value is String. This is the path to the image that is
   * to be displayed within the label of a vertex. Data URLs should use the
   * following format: data:image/png,xyz where xyz is the base64 encoded
   * data (without the "base64"-prefix). Note that Data URLs are only
   * supported in modern browsers. Value is "image".
   */
  image: any;

  /**
   * Variable: STYLE_IMAGE_WIDTH
   *
   * Defines the key for the imageWidth style. The type of this value is
   * int, the value is the image width in pixels and must be greater than 0.
   * Value is "imageWidth".
   */
  imageWidth: any;

  /**
   * Variable: STYLE_IMAGE_HEIGHT
   *
   * Defines the key for the imageHeight style. The type of this value is
   * int, the value is the image height in pixels and must be greater than 0.
   * Value is "imageHeight".
   */
  imageHeight: any;

  /**
   * Variable: STYLE_IMAGE_BACKGROUND
   *
   * Defines the key for the image background color. This style is only used
   * in <mxImageShape>. Possible values are all HTML color names or HEX
   * codes. Value is "imageBackground".
   */
  imageBackground: any;

  /**
   * Variable: STYLE_IMAGE_BORDER
   *
   * Defines the key for the image border color. This style is only used in
   * <mxImageShape>. Possible values are all HTML color names or HEX codes.
   * Value is "imageBorder".
   */
  imageBorder: any;

  /**
   * Variable: STYLE_FLIPH
   *
   * Defines the key for the horizontal image flip. This style is only used
   * in <mxImageShape>. Possible values are 0 and 1. Default is 0. Value is
   * "flipH".
   */
  flipH: any;

  /**
   * Variable: STYLE_FLIPV
   *
   * Defines the key for the vertical flip. Possible values are 0 and 1.
   * Default is 0. Value is "flipV".
   */
  flipV: any;

  /**
   * Variable: STYLE_NOLABEL
   *
   * Defines the key for the noLabel style. If this is true then no label is
   * visible for a given cell. Possible values are true or false (1 or 0).
   * Default is false. Value is "noLabel".
   */
  noLabel: any;

  /**
   * Variable: STYLE_NOEDGESTYLE
   *
   * Defines the key for the noEdgeStyle style. If this is true then no edge
   * style is applied for a given edge. Possible values are true or false
   * (1 or 0). Default is false. Value is "noEdgeStyle".
   */
  noEdgeStyle: any;

  /**
   * Variable: STYLE_LABEL_BACKGROUNDCOLOR
   *
   * Defines the key for the label background color. Possible values are all
   * HTML color names or HEX codes. Value is "labelBackgroundColor".
   */
  labelBackgroundColor: any;

  /**
   * Variable: STYLE_LABEL_BORDERCOLOR
   *
   * Defines the key for the label border color. Possible values are all
   * HTML color names or HEX codes. Value is "labelBorderColor".
   */
  labelBorderColor: any;

  /**
   * Variable: STYLE_LABEL_PADDING
   *
   * Defines the key for the label padding, ie. the space between the label
   * border and the label. Value is "labelPadding".
   */
  labelPadding: any;

  /**
   * Variable: STYLE_INDICATOR_SHAPE
   *
   * Defines the key for the indicator shape used within an <mxLabel>.
   * Possible values are all SHAPE_* constants or the names of any new
   * shapes. The indicatorShape has precedence over the indicatorImage.
   * Value is "indicatorShape".
   */
  indicatorShape: any;

  /**
   * Variable: STYLE_INDICATOR_IMAGE
   *
   * Defines the key for the indicator image used within an <mxLabel>.
   * Possible values are all image URLs. The indicatorShape has
   * precedence over the indicatorImage. Value is "indicatorImage".
   */
  indicatorImage: any;

  /**
   * Variable: STYLE_INDICATOR_COLOR
   *
   * Defines the key for the indicatorColor style. Possible values are all
   * HTML color names or HEX codes, as well as the special 'swimlane' keyword
   * to refer to the color of the parent swimlane if one exists. Value is
   * "indicatorColor".
   */
  indicatorColor: any;

  /**
   * Variable: STYLE_INDICATOR_STROKECOLOR
   *
   * Defines the key for the indicator stroke color in <mxLabel>.
   * Possible values are all color codes. Value is "indicatorStrokeColor".
   */
  indicatorStrokeColor: any;

  /**
   * Variable: STYLE_INDICATOR_GRADIENTCOLOR
   *
   * Defines the key for the indicatorGradientColor style. Possible values
   * are all HTML color names or HEX codes. This style is only supported in
   * <SHAPE_LABEL> shapes. Value is "indicatorGradientColor".
   */
  indicatorGradientColor: any;

  /**
   * Variable: STYLE_INDICATOR_SPACING
   *
   * The defines the key for the spacing between the label and the
   * indicator in <mxLabel>. Possible values are in pixels. Value is
   * "indicatorSpacing".
   */
  indicatorSpacing: any;

  /**
   * Variable: STYLE_INDICATOR_WIDTH
   *
   * Defines the key for the indicator width. Possible values start at 0 (in
   * pixels). Value is "indicatorWidth".
   */
  indicatorWidth: any;

  /**
   * Variable: STYLE_INDICATOR_HEIGHT
   *
   * Defines the key for the indicator height. Possible values start at 0 (in
   * pixels). Value is "indicatorHeight".
   */
  indicatorHeight: any;

  /**
   * Variable: STYLE_INDICATOR_DIRECTION
   *
   * Defines the key for the indicatorDirection style. The direction style is
   * used to specify the direction of certain shapes (eg. <mxTriangle>).
   * Possible values are <DIRECTION_EAST> (default), <DIRECTION_WEST>,
   * <DIRECTION_NORTH> and <DIRECTION_SOUTH>. Value is "indicatorDirection".
   */
  indicatorDirection: any;

  /**
   * Variable: STYLE_SHADOW
   *
   * Defines the key for the shadow style. The type of the value is Boolean.
   * Value is "shadow".
   */
  shadow: any;

  /**
   * Variable: STYLE_SEGMENT
   *
   * Defines the key for the segment style. The type of this value is float
   * and the value represents the size of the horizontal segment of the
   * entity relation style. Default is ENTITY_SEGMENT. Value is "segment".
   */
  segment: any;

  /**
   * Variable: STYLE_ENDARROW
   *
   * Defines the key for the end arrow marker. Possible values are all
   * constants with an ARROW-prefix. This is only used in <mxConnector>.
   * Value is "endArrow".
   *
   * Example:
   * (code)
   * style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_CLASSIC;
   * (end)
   */
  endArrow: any;

  /**
   * Variable: STYLE_STARTARROW
   *
   * Defines the key for the start arrow marker. Possible values are all
   * constants with an ARROW-prefix. This is only used in <mxConnector>.
   * See <STYLE_ENDARROW>. Value is "startArrow".
   */
  startArrow: any;

  /**
   * Variable: STYLE_ENDSIZE
   *
   * Defines the key for the endSize style. The type of this value is numeric
   * and the value represents the size of the end marker in pixels. Value is
   * "endSize".
   */
  endSize: any;

  /**
   * Variable: STYLE_STARTSIZE
   *
   * Defines the key for the startSize style. The type of this value is
   * numeric and the value represents the size of the start marker or the
   * size of the swimlane title region depending on the shape it is used for.
   * Value is "startSize".
   */
  startSize: any;

  /**
   * Variable: STYLE_SWIMLANE_LINE
   *
   * Defines the key for the swimlaneLine style. This style specifies whether
   * the line between the title regio of a swimlane should be visible. Use 0
   * for hidden or 1 (default) for visible. Value is "swimlaneLine".
   */
  swimlaneLine: any;

  /**
   * Variable: STYLE_ENDFILL
   *
   * Defines the key for the endFill style. Use 0 for no fill or 1 (default)
   * for fill. (This style is only exported via <mxImageExport>.) Value is
   * "endFill".
   */
  endFill: any;

  /**
   * Variable: STYLE_STARTFILL
   *
   * Defines the key for the startFill style. Use 0 for no fill or 1 (default)
   * for fill. (This style is only exported via <mxImageExport>.) Value is
   * "startFill".
   */
  startFill: any;

  /**
   * Variable: STYLE_DASHED
   *
   * Defines the key for the dashed style. Use 0 (default) for non-dashed or 1
   * for dashed. Value is "dashed".
   */
  dashed: any;

  /**
   * Variable: STYLE_DASH_PATTERN
   *
   * Defines the key for the dashed pattern style in SVG and image exports.
   * The type of this value is a space separated list of numbers that specify
   * a custom-defined dash pattern. Dash styles are defined in terms of the
   * length of the dash (the drawn part of the stroke) and the length of the
   * space between the dashes. The lengths are relative to the line width: a
   * length of "1" is equal to the line width. VML ignores this style and
   * uses dashStyle instead as defined in the VML specification. This style
   * is only used in the <mxConnector> shape. Value is "dashPattern".
   */
  dashPattern: any;

  /**
   * Variable: STYLE_FIX_DASH
   *
   * Defines the key for the fixDash style. Use 0 (default) for dash patterns
   * that depend on the linewidth and 1 for dash patterns that ignore the
   * line width. Value is "fixDash".
   */
  fixDash: any;

  /**
   * Variable: STYLE_ROUNDED
   *
   * Defines the key for the rounded style. The type of this value is
   * Boolean. For edges this determines whether or not joins between edges
   * segments are smoothed to a rounded finish. For vertices that have the
   * rectangle shape, this determines whether or not the rectangle is
   * rounded. Use 0 (default) for non-rounded or 1 for rounded. Value is
   * "rounded".
   */
  rounded: any;

  /**
   * Variable: STYLE_CURVED
   *
   * Defines the key for the curved style. The type of this value is
   * Boolean. It is only applicable for connector shapes. Use 0 (default)
   * for non-curved or 1 for curved. Value is "curved".
   */
  curved: any;

  /**
   * Variable: STYLE_ARCSIZE
   *
   * Defines the rounding factor for a rounded rectangle in percent (without
   * the percent sign). Possible values are between 0 and 100. If this value
   * is not specified then RECTANGLE_ROUNDING_FACTOR * 100 is used. For
   * edges, this defines the absolute size of rounded corners in pixels. If
   * this values is not specified then LINE_ARCSIZE is used.
   * (This style is only exported via <mxImageExport>.) Value is "arcSize".
   */
  arcSize: any;

  /**
   * Variable: STYLE_ABSOLUTE_ARCSIZE
   *
   * Defines the key for the absolute arc size style. This specifies if
   * arcSize for rectangles is abolute or relative. Possible values are 1
   * and 0 (default). Value is "absoluteArcSize".
   */
  absoluteArcSize: any;

  /**
   * Variable: STYLE_SOURCE_PERIMETER_SPACING
   *
   * Defines the key for the source perimeter spacing. The type of this value
   * is numeric. This is the distance between the source connection point of
   * an edge and the perimeter of the source vertex in pixels. This style
   * only applies to edges. Value is "sourcePerimeterSpacing".
   */
  sourcePerimeterSpacing: any;

  /**
   * Variable: STYLE_TARGET_PERIMETER_SPACING
   *
   * Defines the key for the target perimeter spacing. The type of this value
   * is numeric. This is the distance between the target connection point of
   * an edge and the perimeter of the target vertex in pixels. This style
   * only applies to edges. Value is "targetPerimeterSpacing".
   */
  targetPerimeterSpacing: any;

  /**
   * Variable: STYLE_PERIMETER_SPACING
   *
   * Defines the key for the perimeter spacing. This is the distance between
   * the connection point and the perimeter in pixels. When used in a vertex
   * style, this applies to all incoming edges to floating ports (edges that
   * terminate on the perimeter of the vertex). When used in an edge style,
   * this spacing applies to the source and target separately, if they
   * terminate in floating ports (on the perimeter of the vertex). Value is
   * "perimeterSpacing".
   */
  perimeterSpacing: any;

  /**
   * Variable: STYLE_SPACING
   *
   * Defines the key for the spacing. The value represents the spacing, in
   * pixels, added to each side of a label in a vertex (style applies to
   * vertices only). Value is "spacing".
   */
  spacing: any;

  /**
   * Variable: STYLE_SPACING_TOP
   *
   * Defines the key for the spacingTop style. The value represents the
   * spacing, in pixels, added to the top side of a label in a vertex (style
   * applies to vertices only). Value is "spacingTop".
   */
  spacingTop: any;

  /**
   * Variable: STYLE_SPACING_LEFT
   *
   * Defines the key for the spacingLeft style. The value represents the
   * spacing, in pixels, added to the left side of a label in a vertex (style
   * applies to vertices only). Value is "spacingLeft".
   */
  spacingLeft: any;

  /**
   * Variable: STYLE_SPACING_BOTTOM
   *
   * Defines the key for the spacingBottom style The value represents the
   * spacing, in pixels, added to the bottom side of a label in a vertex
   * (style applies to vertices only). Value is "spacingBottom".
   */
  spacingBottom: any;

  /**
   * Variable: STYLE_SPACING_RIGHT
   *
   * Defines the key for the spacingRight style The value represents the
   * spacing, in pixels, added to the right side of a label in a vertex (style
   * applies to vertices only). Value is "spacingRight".
   */
  spacingRight: any;

  /**
   * Variable: STYLE_HORIZONTAL
   *
   * Defines the key for the horizontal style. Possible values are
   * true or false. This value only applies to vertices. If the <STYLE_SHAPE>
   * is "SHAPE_SWIMLANE" a value of false indicates that the
   * swimlane should be drawn vertically, true indicates to draw it
   * horizontally. If the shape style does not indicate that this vertex is a
   * swimlane, this value affects only whether the label is drawn
   * horizontally or vertically. Value is "horizontal".
   */
  horizontal: any;

  /**
   * Variable: STYLE_DIRECTION
   *
   * Defines the key for the direction style. The direction style is used
   * to specify the direction of certain shapes (eg. <mxTriangle>).
   * Possible values are <DIRECTION_EAST> (default), <DIRECTION_WEST>,
   * <DIRECTION_NORTH> and <DIRECTION_SOUTH>. Value is "direction".
   */
  direction: any;

  /**
   * Variable: STYLE_ANCHOR_POINT_DIRECTION
   *
   * Defines the key for the anchorPointDirection style. The defines if the
   * direction style should be taken into account when computing the fixed
   * point location for connected edges. Default is 1 (yes). Set this to 0
   * to ignore the direction style for fixed connection points. Value is
   * "anchorPointDirection".
   */
  anchorPointDirection: any;

  /**
   * Variable: STYLE_ELBOW
   *
   * Defines the key for the elbow style. Possible values are
   * <ELBOW_HORIZONTAL> and <ELBOW_VERTICAL>. Default is <ELBOW_HORIZONTAL>.
   * This defines how the three segment orthogonal edge style leaves its
   * terminal vertices. The vertical style leaves the terminal vertices at
   * the top and bottom sides. Value is "elbow".
   */
  elbow: any;

  /**
   * Variable: STYLE_FONTCOLOR
   *
   * Defines the key for the fontColor style. Possible values are all HTML
   * color names or HEX codes. Value is "fontColor".
   */
  fontColor: any;

  /**
   * Variable: STYLE_FONTFAMILY
   *
   * Defines the key for the fontFamily style. Possible values are names such
   * as Arial; Dialog; Verdana; Times New Roman. The value is of type String.
   * Value is fontFamily.
   */
  fontFamily: any;

  /**
   * Variable: STYLE_FONTSIZE
   *
   * Defines the key for the fontSize style (in px). The type of the value
   * is int. Value is "fontSize".
   */
  fontSize: any;

  /**
   * Variable: STYLE_FONTSTYLE
   *
   * Defines the key for the fontStyle style. Values may be any logical AND
   * (sum) of <FONT_BOLD>, <FONT_ITALIC> and <FONT_UNDERLINE>.
   * The type of the value is int. Value is "fontStyle".
   */
  fontStyle: any;

  /**
   * Variable: STYLE_ASPECT
   *
   * Defines the key for the aspect style. Possible values are empty or fixed.
   * If fixed is used then the aspect ratio of the cell will be maintained
   * when resizing. Default is empty. Value is "aspect".
   */
  aspect: any;

  /**
   * Variable: STYLE_AUTOSIZE
   *
   * Defines the key for the autosize style. This specifies if a cell should be
   * resized automatically if the value has changed. Possible values are 0 or 1.
   * Default is 0. See <mxGraph.isAutoSizeCell>. This is normally combined with
   * <STYLE_RESIZABLE> to disable manual sizing. Value is "autosize".
   */
  autosize: any;

  /**
   * Variable: STYLE_FOLDABLE
   *
   * Defines the key for the foldable style. This specifies if a cell is foldable
   * using a folding icon. Possible values are 0 or 1. Default is 1. See
   * <mxGraph.isCellFoldable>. Value is "foldable".
   */
  foldable: any;

  /**
   * Variable: STYLE_EDITABLE
   *
   * Defines the key for the editable style. This specifies if the value of
   * a cell can be edited using the in-place editor. Possible values are 0 or
   * 1. Default is 1. See <mxGraph.isCellEditable>. Value is "editable".
   */
  editable: any;

  /**
   * Variable: STYLE_BACKGROUND_OUTLINE
   *
   * Defines the key for the backgroundOutline style. This specifies if a
   * only the background of a cell should be painted when it is highlighted.
   * Possible values are 0 or 1. Default is 0. Value is "backgroundOutline".
   */
  backgroundOutline: any;

  /**
   * Variable: STYLE_BENDABLE
   *
   * Defines the key for the bendable style. This specifies if the control
   * points of an edge can be moved. Possible values are 0 or 1. Default is
   * 1. See <mxGraph.isCellBendable>. Value is "bendable".
   */
  bendable: any;

  /**
   * Variable: STYLE_MOVABLE
   *
   * Defines the key for the movable style. This specifies if a cell can
   * be moved. Possible values are 0 or 1. Default is 1. See
   * <mxGraph.isCellMovable>. Value is "movable".
   */
  movable: any;

  /**
   * Variable: STYLE_RESIZABLE
   *
   * Defines the key for the resizable style. This specifies if a cell can
   * be resized. Possible values are 0 or 1. Default is 1. See
   * <mxGraph.isCellResizable>. Value is "resizable".
   */
  resizable: any;

  /**
   * Variable: STYLE_RESIZE_WIDTH
   *
   * Defines the key for the resizeWidth style. This specifies if a cell's
   * width is resized if the parent is resized. If this is 1 then the width
   * will be resized even if the cell's geometry is relative. If this is 0
   * then the cell's width will not be resized. Default is not defined. Value
   * is "resizeWidth".
   */
  resizeWidth: any;

  /**
   * Variable: STYLE_RESIZE_WIDTH
   *
   * Defines the key for the resizeHeight style. This specifies if a cell's
   * height if resize if the parent is resized. If this is 1 then the height
   * will be resized even if the cell's geometry is relative. If this is 0
   * then the cell's height will not be resized. Default is not defined. Value
   * is "resizeHeight".
   */
  resizeHeight: any;

  /**
   * Variable: STYLE_ROTATABLE
   *
   * Defines the key for the rotatable style. This specifies if a cell can
   * be rotated. Possible values are 0 or 1. Default is 1. See
   * <mxGraph.isCellRotatable>. Value is "rotatable".
   */
  rotatable: any;

  /**
   * Variable: STYLE_CLONEABLE
   *
   * Defines the key for the cloneable style. This specifies if a cell can
   * be cloned. Possible values are 0 or 1. Default is 1. See
   * <mxGraph.isCellCloneable>. Value is "cloneable".
   */
  cloneable: any;

  /**
   * Variable: STYLE_DELETABLE
   *
   * Defines the key for the deletable style. This specifies if a cell can be
   * deleted. Possible values are 0 or 1. Default is 1. See
   * <mxGraph.isCellDeletable>. Value is "deletable".
   */
  deletable: any;

  /**
   * Variable: STYLE_SHAPE
   *
   * Defines the key for the shape. Possible values are all constants with
   * a SHAPE-prefix or any newly defined shape names. Value is "shape".
   */
  shape: any;

  /**
   * Variable: STYLE_EDGE
   *
   * Defines the key for the edge style. Possible values are the functions
   * defined in <mxEdgeStyle>. Value is "edgeStyle".
   */
  edgeStyle: any;

  /**
   * Variable: STYLE_JETTY_SIZE
   *
   * Defines the key for the jetty size in <mxEdgeStyle.OrthConnector>.
   * Default is 10. Possible values are all numeric values or "auto".
   * Jetty size is the minimum length of the orthogonal segment before
   * it attaches to a shape.
   * Value is "jettySize".
   */
  jettySize: any;

  /**
   * Variable: STYLE_SOURCE_JETTY_SIZE
   *
   * Defines the key for the jetty size in <mxEdgeStyle.OrthConnector>.
   * Default is 10. Possible values are numeric values or "auto". This has
   * precedence over <STYLE_JETTY_SIZE>. Value is "sourceJettySize".
   */
  sourceJettySize: any;

  /**
   * Variable: targetJettySize
   *
   * Defines the key for the jetty size in <mxEdgeStyle.OrthConnector>.
   * Default is 10. Possible values are numeric values or "auto". This has
   * precedence over <STYLE_JETTY_SIZE>. Value is "targetJettySize".
   */
  targetJettySize: any;

  /**
   * Variable: STYLE_LOOP
   *
   * Defines the key for the loop style. Possible values are the functions
   * defined in <mxEdgeStyle>. Value is "loopStyle". Default is
   * <mxGraph.defaultLoopStylean>.
   */
  loopStyle: any;

  /**
   * Variable: STYLE_ORTHOGONAL_LOOP
   *
   * Defines the key for the orthogonal loop style. Possible values are 0 and
   * 1. Default is 0. Value is "orthogonalLoop". Use this style to specify
   * if loops with no waypoints and defined anchor points should be routed
   * using <STYLE_LOOP> or not routed.
   */
  orthogonalLoop: any;

  /**
   * Variable: STYLE_ROUTING_CENTER_X
   *
   * Defines the key for the horizontal routing center. Possible values are
   * between -0.5 and 0.5. This is the relative offset from the center used
   * for connecting edges. The type of this value is numeric. Value is
   * "routingCenterX".
   */
  routingCenterX: any;

  /**
   * Variable: STYLE_ROUTING_CENTER_Y
   *
   * Defines the key for the vertical routing center. Possible values are
   * between -0.5 and 0.5. This is the relative offset from the center used
   * for connecting edges. The type of this value is numeric. Value is
   * "routingCenterY".
   */
  routingCenterY: any;
}

export default StyleMap;
