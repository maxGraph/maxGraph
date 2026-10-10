// Checks the types of EventNames, of the EventName union and of the event name accepted by EventSource.addListener.
import { EventName, EventNames, EventSource } from '@maxgraph/core';

const builtInEventName: EventName = EventNames.CLICK;

// The checks below are what makes the statement above meaningful: without them, it would also compile if the event
// names were typed `string` or `any`.
// @ts-expect-error a built-in event name is read-only
EventNames.CLICK = 'anotherValue';
// @ts-expect-error 'AN_UNDECLARED_EVENT' does not exist in type 'EventNamesMap'
const undeclaredEventName = EventNames.AN_UNDECLARED_EVENT;
// @ts-expect-error an undeclared value is not an event name
const unknownEventName: EventName = 'anUndeclaredEvent';

// addListener suggests the built-in event names and still accepts any other string.
const eventSource = new EventSource();
const listener = () => {};
eventSource.addListener(EventNames.CLICK, listener);
eventSource.addListener('anyOtherEventName', listener);
// @ts-expect-error the event name is still a string, accepting any string must not make the parameter `any`
eventSource.addListener(42, listener);
