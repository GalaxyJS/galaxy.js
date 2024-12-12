import { def_prop } from './utils';

class Observer {
  /**
   * Create an Observer.
   * @param {Object} context - The context to observe.
   */
  constructor(context) {
    this.context = context;
    this.subjectsActions = {};
    this.allSubjectAction = [];

    const __observers__ = '__observers__';
    if (!this.context.hasOwnProperty(__observers__)) {
      def_prop(context, __observers__, {
        value: [],
        writable: true,
        configurable: true
      });
    }

    this.context[__observers__].push(this);
  }

  /**
   * Remove the observer from the context.
   */
  remove() {
    const observers = this.context.__observers__;
    const index = observers.indexOf(this);
    if (index !== -1) {
      observers.splice(index, 1);
    }
  }

  /**
   * Notify the observer of a change.
   * @param {string} key - The key that changed.
   * @param {*} value - The new value.
   */
  notify(key, value) {
    if (this.subjectsActions.hasOwnProperty(key)) {
      this.subjectsActions[key].call(this.context, value);
    }

    this.allSubjectAction.forEach(action => {
      action.call(this.context, key, value);
    });
  }

  /**
   * Register an action for a specific subject.
   * @param {string} subject - The subject to observe.
   * @param {Function} action - The action to perform.
   */
  on(subject, action) {
    this.subjectsActions[subject] = action;
  }

  /**
   * Register an action for all subjects.
   * @param {Function} action - The action to perform.
   */
  onAll(action) {
    if (this.allSubjectAction.indexOf(action) === -1) {
      this.allSubjectAction.push(action);
    }
  }

  /**
   * Notify all observers of a change.
   * @param {Object} obj - The object being observed.
   * @param {string} key - The key that changed.
   * @param {*} value - The new value.
   */
  static notify(obj, key, value) {
    const observers = obj.__observers__;
    if (observers !== undefined) {
      observers.forEach(observer => {
        observer.notify(key, value);
      });
    }
  }
}

export default Observer;
