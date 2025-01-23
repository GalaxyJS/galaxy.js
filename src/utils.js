import Router from './router.js';
import Scope from './scope.js';
import Module from './module.js';

export function EMPTY_CALL() {}

export const def_prop = Object.defineProperty;
export const del_prop = Reflect.deleteProperty;

export const obj_keys = Object.keys;
export const arr_concat = Array.prototype.concat.bind([]);

export const arr_slice = Array.prototype.slice;

export function clone(obj) {
  let cloned = obj instanceof Array ? [] : {};
  cloned.__proto__ = obj.__proto__;
  for (let i in obj) {
    if (obj.hasOwnProperty(i)) {
      const v = obj[i];
      // Some objects can not be cloned and must be passed by reference
      if (v instanceof Promise || v instanceof Router) {
        cloned[i] = v;
      } else if (typeof (v) === 'object' && v !== null) {
        if (i === 'animations' && v && typeof v === 'object') {
          cloned[i] = v;
        } else {
          cloned[i] = clone(v);
        }
      } else {
        cloned[i] = v;
      }
    }
  }

  return cloned;
}

const COMMENT_NODE = document.createComment('');

export function create_comment(t) {
  const n = COMMENT_NODE.cloneNode();
  n.textContent = t;
  return n;
}
/**
 *
 * @param {string} tagName
 * @param {ViewNode} parentViewNode
 * @returns {HTMLElement|Comment}
 */
export function create_elem(tagName, parentViewNode) {
  if (tagName === 'svg' || (parentViewNode && parentViewNode.blueprint.tag === 'svg')) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
  }

  if (tagName === 'comment') {
    return document.createComment('ViewNode');
  }

  return document.createElement(tagName);
}


/**
 *
 * @param {any} galaxy
 * @param {ModuleMetaData} moduleMetaData
 * @returns {Module}
 */
export function create_module(galaxy, moduleMetaData) {
  const scope = new Scope(galaxy, moduleMetaData, moduleMetaData.element || this.rootElement);
  return new Module(moduleMetaData, scope);
}

/**
 *
 * @param {Module}  module
 * @return {Promise<any>}
 */
export function execute_compiled_module(module) {
  return new Promise(async function (resolve, reject) {
    try {
      const source = module.source || (await import(/* @vite-ignore */'/' + module.path)).default;

      let moduleSource = source;
      if (typeof source !== 'function') {
        moduleSource = function () {
          console.error('Can\'t find default function in %c' + module.path, 'font-weight: bold;');
        };
      }

      const output = moduleSource.call(null, module.scope) || null;
      const proceed = () => {
        module.init();
        return resolve(module);
      };

      // if the function is not async, output would be undefined
      if (output) {
        output.then(proceed);
      } else {
        proceed();
      }
    } catch (error) {
      console.error(error.message + ': ' + module.path);
      // console.warn('Search for es6 features in your code and remove them if your browser does not support them, e.g. arrow function');
      console.trace(error);
      reject();
    }
  });
}

