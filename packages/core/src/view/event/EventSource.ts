/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import EventObject from './EventObject';

type EventListenerObject = {
  funct: Function;
  name: string;
};

/**
 * Class: mxEventSource
 *
 * Base class for objects that dispatch named events. To create a subclass that
 * inherits from mxEventSource, the following code is used.
 *
 * (code)
 * function MyClass() { };
 *
 * MyClass.prototype = new mxEventSource();
 * constructor = MyClass;
 * (end)
 *
 * Known Subclasses:
 *
 * <Transactions>, <mxGraph>, <mxGraphView>, <Editor>, <CellOverlay>,
 * <MaxToolbar>, <MaxWindow>
 *
 * Constructor: mxEventSource
 *
 * Constructs a new event source.
 */
class EventSource {
  constructor(eventSource: EventTarget | null = null) {
    this.eventSource = eventSource;
  }

  /**
   * Holds the event names and associated listeners in an array. The array
   * contains the event name followed by the respective listener for each
   * registered listener.
   */
  eventListeners: EventListenerObject[] = [];

  /**
   * Specifies if events can be fired. Default is true.
   */
  eventsEnabled = true;

  /**
   * Optional source for events. Default is null.
   */
  eventSource: EventTarget | null = null;

  /**
   * Function: isEventsEnabled
   *
   * Returns <eventsEnabled>.
   */
  isEventsEnabled() {
    return this.eventsEnabled;
  }

  /**
   * Function: setEventsEnabled
   *
   * Sets <eventsEnabled>.
   */
  setEventsEnabled(value: boolean) {
    this.eventsEnabled = value;
  }

  /**
   * Function: getEventSource
   *
   * Returns <eventSource>.
   */
  getEventSource() {
    return this.eventSource;
  }

  /**
   * Function: setEventSource
   *
   * Sets <eventSource>.
   */
  setEventSource(value: EventTarget | null) {
    this.eventSource = value;
  }

  /**
   * Function: addListener
   *
   * Binds the specified function to the given event name. If no event name
   * is given, then the listener is registered for all events.
   *
   * The parameters of the listener are the sender and an <mxEventObject>.
   */
  addListener(name: string, funct: Function) {
    this.eventListeners.push({ name, funct });
  }

  /**
   * Function: removeListener
   *
   * Removes all occurrences of the given listener from <eventListeners>.
   */
  removeListener(funct: Function) {
    let i = 0;

    while (i < this.eventListeners.length) {
      if (this.eventListeners[i].funct === funct) {
        this.eventListeners.splice(i, 1);
      } else {
        i += 1;
      }
    }
  }

  /**
   * Function: fireEvent
   *
   * Dispatches the given event to the listeners which are registered for
   * the event. The sender argument is optional. The current execution scope
   * ("this") is used for the listener invocation (see <mxUtils.bind>).
   *
   * Example:
   *
   * (code)
   * fireEvent(new mxEventObject("eventName", key1, val1, .., keyN, valN))
   * (end)
   *
   * Parameters:
   *
   * evt - <mxEventObject> that represents the event.
   * sender - Optional sender to be passed to the listener. Default value is
   * the return value of <getEventSource>.
   */
  fireEvent(evt: EventObject, sender: EventTarget | null = null) {
    if (this.isEventsEnabled()) {
      if (!evt) {
        evt = new EventObject('');
      }

      if (!sender) {
        sender = this.getEventSource();
      }
      if (!sender) {
        sender = <EventTarget>(<unknown>this);
      }

      for (const eventListener of this.eventListeners) {
        if (eventListener.name === null || eventListener.name === evt.getName()) {
          eventListener.funct.apply(this, [sender, evt]);
        }
      }
    }
  }
}

export default EventSource;
