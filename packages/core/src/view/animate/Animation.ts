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

import EventSource from '../event/EventSource';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';

/**
 * Implements a basic animation in JavaScript.
 */
class Animation extends EventSource {
  constructor(delay = 20) {
    super();
    this.delay = delay;
  }

  /**
   * Specifies the delay between the animation steps.
   * @default 20ms
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
   * Stops the animation by deleting the timer and fires an {@link Event#DONE}.
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
