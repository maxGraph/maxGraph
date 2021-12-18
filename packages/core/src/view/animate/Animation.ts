/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import EventSource from '../event/EventSource';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';

/**
 * Implements a basic animation in JavaScript.
 *
 * @class Animation
 * @extends {EventSource}
 */
class Animation extends EventSource {
  constructor(delay: number=20) {
    super();
    this.delay = delay;
  }

  /**
   * Specifies the delay between the animation steps. Defaul is 30ms.
   */
  delay: number;

  /**
   * Reference to the thread while the animation is running.
   */
  thread: number | null = null;

  /**
   * Returns true if the animation is running.
   */
  isRunning(): boolean {
    return this.thread != null;
  }

  /**
   * Starts the animation by repeatedly invoking updateAnimation.
   */
  startAnimation(): void {
    if (this.thread == null) {
      this.thread = window.setInterval(this.updateAnimation.bind(this), this.delay);
    }
  }

  /**
   * Hook for subclassers to implement the animation. Invoke stopAnimation
   * when finished, startAnimation to resume. This is called whenever the
   * timer fires and fires an mxEvent.EXECUTE event with no properties.
   */
  updateAnimation(): void {
    this.fireEvent(new EventObject(InternalEvent.EXECUTE));
  }

  /**
   * Stops the animation by deleting the timer and fires an <mxEvent.DONE>.
   */
  stopAnimation(): void {
    if (this.thread != null) {
      window.clearInterval(this.thread);
      this.thread = null;
      this.fireEvent(new EventObject(InternalEvent.DONE));
    }
  }
}

export default Animation;
