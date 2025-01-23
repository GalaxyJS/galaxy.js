import Scope from './scope';

/**
 *
 * @param {object} module
 * @param {Scope} scope
 * @constructor
 */
class Module {
  /**
   * @param {object} module
   * @param {Scope} scope
   */
  constructor(module, scope) {
    this.id = module.id;
    this.systemId = module.systemId;
    this.source = typeof module.source === 'function' ? module.source : null;
    this.path = module.path || null;
    this.importId = module.importId || module.path;
    this.scope = scope;
  }

  init() {
    Reflect.deleteProperty(this, 'source');
    Reflect.deleteProperty(this, 'addOnProviders');
    this.scope.trigger('module.init');
  }

  start() {
    this.scope.trigger('module.start');
  }

  destroy() {
    this.scope.trigger('module.destroy');
  }
}

export default Module;
