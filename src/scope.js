import { def_prop, del_prop } from "./utils";
import GalaxyURI from "./uri.js";
import Observer from "./observer.js";
import View, { bind_subjects_to_data } from "./view.js";
import Router from "./router.js";

/**
 *
 * @param {any} context
 * @param {Object} module
 * @param [element]
 */
function Scope(context, module, element) {
  const _this = this;
  _this.context = context;
  _this.systemId = module.systemId;
  _this.parentScope = module.parentScope || null;
  _this.element = element || null;
  _this.export = {};

  _this.uri = new GalaxyURI(module.path);
  _this.eventHandlers = {};
  _this.observers = [];
  const _data = _this.element.data
    ? bind_subjects_to_data(
        _this.element,
        _this.element.data,
        _this.parentScope,
        true,
      )
    : {};
  def_prop(_this, "data", {
    enumerable: true,
    configurable: true,
    get: function () {
      return _data;
    },
    set: function (value) {
      if (value === null || typeof value !== "object") {
        throw Error(
          "The `Scope.data` property must be type of object and can not be null.",
        );
      }

      Object.assign(_data, value);
    },
  });

  _this.on("module.destroy", this.destroy.bind(_this));
}

Scope.prototype = {
  data: null,
  systemId: null,
  parentScope: null,

  importAsText(libId) {
    // return this.import(libId + '#text');
    if (libId.indexOf("./") === 0) {
      libId = libId.replace("./", this.uri.path);
    }

    return fetch(libId, {
      headers: {
        "Content-Type": "text/plain",
      },
    }).then((response) => {
      return response.text();
    });
  },

  /**
   *
   */
  destroy() {
    del_prop(this, "data");
    this.observers.forEach(function (observer) {
      observer.remove();
    });
  },

  kill() {
    throw Error("Scope.kill() should not be invoked at the runtime");
  },

  /**
   *
   * @param {ModuleMetaData} moduleMeta
   * @param {*} config
   * @returns {*}
   */
  load(moduleMeta, config) {
    const newModuleMetaData = Object.assign({}, moduleMeta, config || {});

    if (newModuleMetaData.path.indexOf("./") === 0) {
      newModuleMetaData.path = this.uri.path + moduleMeta.path.substr(2);
    }

    newModuleMetaData.parentScope = this;
    return this.context.load(newModuleMetaData);
  },

  /**
   *
   * @param moduleMetaData
   * @param viewNode
   * @returns {*|PromiseLike<T>|Promise<T>}
   */
  loadModuleInto(moduleMetaData, viewNode) {
    return this.load(moduleMetaData, {
      element: viewNode,
    }).then(function (module) {
      module.start();
      return module;
    });
  },

  /**
   *
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }

    if (this.eventHandlers[event].indexOf(handler) === -1) {
      this.eventHandlers[event].push(handler);
    }
  },

  /**
   *
   * @param {string} event
   * @param {*} [data]
   */
  trigger(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(function (handler) {
        handler.call(null, data);
      });
    }
  },

  /**
   *
   * @param object
   * @returns {Observer}
   */
  observe(object) {
    const observer = new Observer(object);
    this.observers.push(observer);

    return observer;
  },

  /**
   *
   * @returns {View}
   */
  useView() {
    return new View(this);
  },

  /**
   *
   * @returns {Router}
   */
  useRouter() {
    const router = new Router(this);
    if (this.systemId !== "@root") {
      this.on("module.destroy", () => router.destroy());
    }

    this.__router__ = router;
    this.router = router.data;

    return router;
  },
};

export default Scope;
