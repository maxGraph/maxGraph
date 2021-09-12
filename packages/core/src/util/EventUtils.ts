/**
 * Returns the touch or mouse event that contains the mouse coordinates.
 */

import mxClient from '../mxClient';

export const getMainEvent = (evt: MouseEvent) => {
  let t = evt as any;

  if ((t.type === 'touchstart' || t.type === 'touchmove') && t.touches && t.touches[0]) {
    t = t.touches[0];
  } else if (t.type === 'touchend' && t.changedTouches && t.changedTouches[0]) {
    t = t.changedTouches[0];
  }

  return t as MouseEvent;
};

/**
 * Returns true if the meta key is pressed for the given event.
 */
export const getClientX = (evt: MouseEvent) => {
  return getMainEvent(evt).clientX;
};

/**
 * Returns true if the meta key is pressed for the given event.
 */
// static getClientY(e: TouchEvent | MouseEvent): number;
export const getClientY = (evt: MouseEvent) => {
  return getMainEvent(evt).clientY;
};

/**
 * Function: getSource
 *
 * Returns the event's target or srcElement depending on the browser.
 */
export const getSource = (evt: MouseEvent) => {
  return evt.srcElement !== undefined ? evt.srcElement : evt.target;
};

/**
 * Returns true if the event has been consumed using {@link consume}.
 */
export const isConsumed = (evt: MouseEvent | KeyboardEvent) => {
  const t = evt as any;
  return t.isConsumed !== undefined && t.isConsumed;
};

/**
 * Returns true if the event was generated using a touch device (not a pen or mouse).
 */
export const isTouchEvent = (evt: MouseEvent) => {
  const t = evt as any;

  return t.pointerType
    ? t.pointerType === 'touch' || t.pointerType === t.MSPOINTER_TYPE_TOUCH
    : t.mozInputSource !== undefined
    ? t.mozInputSource === 5
    : t.type.indexOf('touch') === 0;
};

/**
 * Returns true if the event was generated using a pen (not a touch device or mouse).
 */
export const isPenEvent = (evt: MouseEvent) => {
  const t = evt as any;

  return t.pointerType
    ? t.pointerType == 'pen' || t.pointerType === t.MSPOINTER_TYPE_PEN
    : t.mozInputSource !== undefined
    ? t.mozInputSource === 2
    : t.type.indexOf('pen') === 0;
};

/**
 * Returns true if the event was generated using a touch device (not a pen or mouse).
 */
export const isMultiTouchEvent = (evt: MouseEvent) => {
  const t = evt as any;

  return (
    t.type &&
    t.type.indexOf('touch') == 0 &&
    t.touches !== undefined &&
    t.touches.length > 1
  );
};

/**
 * Returns true if the event was generated using a mouse (not a pen or touch device).
 */
export const isMouseEvent = (evt: Event) => {
  const t = evt as any;

  return t.pointerType
    ? t.pointerType == 'mouse' || t.pointerType === t.MSPOINTER_TYPE_MOUSE
    : t.mozInputSource !== undefined
    ? t.mozInputSource === 1
    : t.type.indexOf('mouse') === 0;
};

/**
 * Returns true if the left mouse button is pressed for the given event.
 * To check if a button is pressed during a mouseMove you should use the
 * {@link mxGraph.isMouseDown} property. Note that this returns true in Firefox
 * for control+left-click on the Mac.
 */
// static isLeftMouseButton(evt: MouseEvent): boolean;
export const isLeftMouseButton = (evt: MouseEvent) => {
  // Special case for mousemove and mousedown we check the buttons
  // if it exists because which is 0 even if no button is pressed
  if ('buttons' in evt && (evt.type === 'mousedown' || evt.type === 'mousemove')) {
    return evt.buttons === 1;
  }
  if ('which' in evt) {
    return evt.which === 1;
  }
  return evt.button === 1;
};

/**
 * Returns true if the middle mouse button is pressed for the given event.
 * To check if a button is pressed during a mouseMove you should use the
 * {@link mxGraph.isMouseDown} property.
 */
export const isMiddleMouseButton = (evt: MouseEvent) => {
  if ('which' in evt) {
    return evt.which === 2;
  }
  return evt.button === 4;
};

/**
 * Returns true if the right mouse button was pressed. Note that this
 * button might not be available on some systems. For handling a popup
 * trigger {@link isPopupTrigger} should be used.
 */
export const isRightMouseButton = (evt: MouseEvent) => {
  if ('which' in evt) {
    return evt.which === 3;
  }
  return evt.button === 2;
};

/**
 * Returns true if the event is a popup trigger. This implementation
 * returns true if the right button or the left button and control was
 * pressed on a Mac.
 */
export const isPopupTrigger = (evt: MouseEvent) => {
  return (
    isRightMouseButton(evt) ||
    (mxClient.IS_MAC &&
      isControlDown(evt) &&
      !isShiftDown(evt) &&
      !isMetaDown(evt) &&
      !isAltDown(evt))
  );
};

/**
 * Returns true if the shift key is pressed for the given event.
 */
export const isShiftDown = (evt: MouseEvent) => {
  return evt.shiftKey;
};

/**
 * Returns true if the alt key is pressed for the given event.
 */
export const isAltDown = (evt: MouseEvent) => {
  return evt.altKey;
};

/**
 * Returns true if the control key is pressed for the given event.
 */
export const isControlDown = (evt: MouseEvent) => {
  return evt.ctrlKey;
};

/**
 * Returns true if the meta key is pressed for the given event.
 */
export const isMetaDown = (evt: MouseEvent) => {
  return evt.metaKey;
};
