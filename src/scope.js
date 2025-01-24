import { def_prop, del_prop, load_module } from "./utils";
import GalaxyURI from "./uri.js";
import Observer from "./observer.js";
import View, { bind_subjects_to_data } from "./view.js";
import Router from "./router.js";

class Scope {

  /**
   *
   * @param {ModuleMetaData} module
   */
  constructor(module) {
    this.moduleId = module.id;
    this.parentScope = module.parentScope || null;
    this.element = module.element || null;
    this.export = {};
    this.uri = new GalaxyURI(module.path);
    this.eventHandlers = {};
    this.observers = [];
    const _data = this.element.data
      ? bind_subjects_to_data(
        this.element,
        this.element.data,
        this.parentScope,
        true,
      )
      : {};
    def_prop(this, "data", {
      enumerable: true,
      configurable: true,
      get: function() {
        return _data;
      },
      set: function(value) {
        if (value === null || typeof value !== "object") {
          throw Error(
            "The `Scope.data` property must be type of object and can not be null.",
          );
        }

        Object.assign(_data, value);
      },
    });

    this.on("module.destroy", this.destroy.bind(this));
  }

  importAsText(libId) {
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
  }

  destroy() {
    del_prop(this, "data");
    this.observers.forEach(function(observer) {
      observer.remove();
    });
  }

  kill() {
    throw Error("Scope.kill() should not be invoked at the runtime");
  }

  load(moduleMeta, config = {}) {
    const newModuleMetaData = Object.assign({}, moduleMeta, config);

    if (newModuleMetaData.path.indexOf("./") === 0) {
      newModuleMetaData.path = this.uri.path + moduleMeta.path.substr(2);
    }

    newModuleMetaData.parentScope = this;
    return load_module(newModuleMetaData);
  }

  loadModuleInto(moduleMetaData, viewNode) {
    return this.load(moduleMetaData, {
      element: viewNode,
    }).then(function(module) {
      module.start();
      return module;
    });
  }

  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }

    if (this.eventHandlers[event].indexOf(handler) === -1) {
      this.eventHandlers[event].push(handler);
    }
  }

  trigger(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(function(handler) {
        handler.call(null, data);
      });
    }
  }

  observe(object) {
    const observer = new Observer(object);
    this.observers.push(observer);

    return observer;
  }

  useView() {
    return new View(this);
  }

  useRouter() {
    const router = new Router(this);
    if (this.moduleId !== "@root") {
      this.on("module.destroy", () => router.destroy());
    }

    this.__router__ = router;
    this.router = router.data;

    return router;
  }
}

export default Scope;
