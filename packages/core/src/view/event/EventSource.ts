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

import EventObject from './EventObject';

type EventListenerObject = {
  funct: EventListenerFunction;
  name: string;
};

export type EventListenerFunction = (
  sender: EventTarget,
  eventObject: EventObject
) => void;

/**
 * Base class for objects that dispatch named events.
 *
 * To create a subclass that inherits from `EventSource`, the following code is used:
 *
 * ```javascript
 * class MyClass extends EventSource {
 *   // implement the logic here
 * };
 * ```
 *
 * Known Subclasses:
 * - {@link CellOverlay}
 * - {@link Editor}
 * - {@link AbstractGraph}
 * - {@link GraphDataModel}
 * - {@link GraphView}
 * - {@link MaxToolbar}
 * - {@link MaxWindow}
 *
 * @category Event
 */
class EventSource {
  constructor(eventSource: EventTarget | null = null) {
    this.eventSource = eventSource;
  }

  /**
   * Holds the event names and associated listeners in an array.
   * The array  contains the event name followed by the respective listener for each registered listener.
   */
  eventListeners: EventListenerObject[] = [];

  /**
   * Specifies if events can be fired.
   * @default true
   */
  eventsEnabled = true;

  /**
   * Optional source for events.
   * @default null
   */
  eventSource: EventTarget | null = null;

  /**
   * Returns {@link eventsEnabled}.
   */
  isEventsEnabled() {
    return this.eventsEnabled;
  }

  /**
   * Sets {@link eventsEnabled}.
   */
  setEventsEnabled(value: boolean) {
    this.eventsEnabled = value;
  }

  /**
   * Returns {@link eventSource}.
   */
  getEventSource() {
    return this.eventSource;
  }

  /**
   * Sets {@link eventSource}.
   */
  setEventSource(value: EventTarget | null) {
    this.eventSource = value;
  }

  /**
   * Binds the specified function to the given event name.
   * If no event name is given, then the listener is registered for all events.
   *
   * The parameters of the listener are the sender and an {@link EventObject}.
   */
  addListener(name: string, funct: EventListenerFunction) {
    this.eventListeners.push({ name, funct });
  }

  /**
   * Removes all occurrences of the given listener from {@link eventListeners}.
   */
  removeListener(funct: EventListenerFunction) {
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
   * Dispatches the given event to the listeners which are registered for
   * the event. The sender argument is optional. The current execution scope
   * ("this") is used for the listener invocation (see {@link utils.bind}).
   *
   * Example:
   *
   * ```javascript
   * fireEvent(new mxEventObject("eventName", key1, val1, .., keyN, valN))
   * ```
   *
   * @param evt {@link EventObject} that represents the event.
   * @param sender Optional sender to be passed to the listener. Default value is the returned value of {@link getEventSource}.
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
