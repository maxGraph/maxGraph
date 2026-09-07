# Raw exploration 5: mxGraph reference behavior

All paths below are relative to the root of a local mxGraph checkout (the `maxGraph/mxgraph` repository).

## Style string parsing: numbers, never booleans

`mxStylesheet.prototype.getCellStyle`, `javascript/src/js/view/mxStylesheet.js:225-247`:
value === NONE deletes the key, else `mxUtils.isNumeric(value)` -> `parseFloat(value)`, else the raw string is kept.
`mxUtils.isNumeric`, `mxUtils.js:2935-2938`.
So `rounded=1;shadow=0` gives the NUMBERS 1 and 0. A style object in mxGraph never contains a boolean.
`rounded=true` would stay the STRING "true".

## XML attribute decoding: numbers, never booleans

`mxObjectCodec.prototype.convertAttributeFromXml`, `io/mxObjectCodec.js:630-669`: if `isNumericAttribute` then
`parseFloat`, else the raw string. No boolean path, no "true"/"false" handling.
`mxCellCodec` (`io/mxCellCodec.js:60-63`) only excludes the `value` attribute from the numeric coercion, so
`vertex="1"` goes through it: `cell.vertex` is the number 1 after decoding.
`mxCell.isVertex()` (`mxCell.js:293-295`) is `return this.vertex != 0`, loose. Note `"false" != 0` is TRUE, so the
string form would be misread; the codec was never designed for true/false tokens.

## Reading a style boolean at use time: loose equality with 1 or '1'

`mxUtils.getValue` is a plain default lookup, no coercion. Every consumer compares:
- `mxShape.js:1372-1375`: `mxUtils.getValue(this.style, STYLE_SHADOW, this.isShadow) == 1`, same for dashed, rounded, glass.
- `mxShape.js:1124`, `mxRectangleShape.js:83`, `mxSwimlane.js:151`: `== '1'` (string form).
- `mxSwimlane.js:238,338`, `mxRectangleShape.js:50,68`: `getValue(style, STYLE_POINTER_EVENTS, '1') == '1'`.
- `mxGraph.js:9318-9319`, `mxGraph.js:6372-6373`: `getValue(style, STYLE_FLIPH, 0) == 1`.
Never JS truthiness of the raw value, never a comparison with "true". `"true" == 1` is false, so mxGraph does NOT
support true/false tokens in style strings.

## Encoding: always 1/0

`mxObjectCodec.convertAttributeToXml` (`io/mxObjectCodec.js:588-599`) with `isBooleanAttribute` (602-616):
`value = (value == true) ? '1' : '0'`, with an explicit comment that the raw value must not be used because 0 would
otherwise be truthy. Fires only for real JS booleans, so for model fields such as `mxCell.vertex`, not for style values
(which are never booleans). Style strings are concatenated by `mxUtils.setStyle` / `setStyleFlag`
(`mxUtils.js:3466,3587`) from whatever the caller passes, and mxGraph always passes 1/0.

## Fixtures

`javascript/examples/uiconfig.xml:9`, `fileio.xml:5`: `vertex="1"`, `edge="1"`. Grep over every `*.xml` of both
checkouts: zero occurrences of a boolean style key written `=true` / `=false`, zero `vertex="true"`. Only the 1/0 form.

## Conclusion for our fix

- Input compatibility REQUIRES accepting 1/0. Accepting "true"/"false" as well is not required by anything mxGraph or
  draw.io emits, but it is harmless and defensive.
- The ENCODER must keep emitting 1/0, never true/false, otherwise mxGraph and draw.io readers (which compare with
  `== 1` / `== '1'`) would silently treat the value as unset.
