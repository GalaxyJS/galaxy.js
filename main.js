/**
 *
 * @typedef {Object} ModuleMetaData
 * @property {Function} [constructor]
 * @property {Function|string} [source]
 * @property {string} id
 * @property {string} [path]
 * @property {Scope} [parentScope]
 * @property {Node} [element]
 */

import { create_module, execute_compiled_module, load_module } from "./src/utils.js";
import { setupTimeline } from "./src/properties/animations.property.js";
import Scope from "./src/scope.js";
import Router from "./src/router.js";
import Module from "./src/module.js";
import View from "./src/view.js";

Array.prototype.unique = function () {
  const a = this.concat();
  for (let i = 0, lenI = a.length; i < lenI; ++i) {
    for (let j = i + 1, lenJ = a.length; j < lenJ; ++j) {
      if (a[i] === a[j]) {
        a.splice(j--, 1);
      }
    }
  }

  return a;
};

/**
 * @namespace Galaxy
 */
const Galaxy = {
  moduleContents: {},
  // addOnProviders: [],
  rootElement: null,
  bootModule: null,
  /**
   *
   * @param {Object} out
   * @returns {*|{}}
   */
  extend: function (out) {
    let result = out || {},
      obj;
    for (let i = 1; i < arguments.length; i++) {
      obj = arguments[i];

      if (!obj) {
        continue;
      }

      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (obj[key] instanceof Array) {
            result[key] = this.extend(result[key] || [], obj[key]);
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            result[key] = this.extend(result[key] || {}, obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
      }
    }

    return result;
  },
};

/**
 *
 * @param {ModuleMetaData} bootModule
 * @return {Promise<any>}
 */
function boot(bootModule) {
  Galaxy.rootElement = bootModule.element;

  bootModule.id = "@root";

  if (!Galaxy.rootElement) {
    throw new Error("element property is mandatory");
  }

  return new Promise(function (resolve, reject) {
    load_module(bootModule)
      .then(function (module) {
        // Replace galaxy temporary bootModule with user specified bootModule
        Galaxy.bootModule = module;
        resolve(module);
      })
      .catch(function (error) {
        console.error("Something went wrong", error);
        reject();
      });
  });
}

export { boot, setupTimeline, Galaxy, Scope, Router, Module, View };
