/**
 * Class representing an array change.
 */
class ArrayChange {
  static lastId = 0;

  constructor() {
    this.id = ArrayChange.lastId++;
    if (ArrayChange.lastId > 100000000) {
      ArrayChange.lastId = 0;
    }
    this.init = null;
    this.original = null;
    this.returnValue = null;
    this.params = [];
    this.type = 'reset';
  }

  /**
   * Get a new instance of ArrayChange with the same properties.
   * @returns {ArrayChange} A new instance of ArrayChange.
   */
  getInstance() {
    const instance = new ArrayChange();
    instance.init = this.init;
    instance.original = this.original;
    instance.params = [...this.params];
    instance.type = this.type;

    return instance;
  }
}

export default ArrayChange;
