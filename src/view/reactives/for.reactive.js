/* global Galaxy */

(function (GV) {
  GV.NODE_SCHEMA_PROPERTY_MAP['$for'] = {
    type: 'reactive',
    name: '$for'
  };

  GV.REACTIVE_BEHAVIORS['$for'] = {
    regex: /^([\w]*)\s+in\s+([^\s\n]+)$/,
    prepareData: function (matches, scope) {
      this.virtualize();

      return {
        propName: matches.as || matches[1],
        nodes: [],
        scope: scope,
        matches: matches
      };
    },
    install: function (data) {
      if (data.matches instanceof Array) {
        GV.makeBinding(this, data.scope, '$for', data.matches[2]);
      } else if (data.matches) {
        const bindings = GV.getBindings(data.matches.data);
        if (bindings.variableNamePaths) {
          GV.makeBinding(this, data.scope, '$for', bindings.variableNamePaths, bindings.isExpression);
        }
      }
    },
    /**
     *
     * @param data
     * @param {Galaxy.GalaxyView.ViewNode} viewNode
     * @param changes
     * @param matches
     * @param scope
     */
    apply: function (data, changes, oldChanges, expression, scope) {
      if (!changes || typeof changes === 'string') {
        changes = {
          type: 'reset',
          params: []
        };
      }

      if (expression) {
        changes.params = expression();
      }

      const _this = this;
      createResetProcess(_this, data, changes, data.scope);
    }
  };

  /**
   *
   * @param {Galaxy.GalaxyView.ViewNode} node
   * @param cache
   * @param changes
   * @param nodeScopeData
   */
  const createResetProcess = function (node, cache, changes, nodeScopeData) {
    // const parentNode = node.parent;
    node.renderingFlow.truncate();
    if (changes.type === 'reset') {
      node.renderingFlow.next(function forResetProcess(next) {
        GV.ViewNode.destroyNodes(node, cache.nodes.reverse());
        cache.nodes = [];

        node.parent.sequences.leave.nextAction(function () {
          next();
        });
      });

      changes = Object.assign({}, changes);
      changes.type = 'push';

      if (changes.params.length) {
        createPushProcess(node, cache, changes, nodeScopeData);
      }
    } else {
      createPushProcess(node, cache, changes, nodeScopeData);
    }
  };

  const createPushProcess = function (node, cache, changes, nodeScopeData) {
    const parentNode = node.parent;
    let position = null;
    let newItems = [];
    let action = Array.prototype.push;

    node.renderingFlow.next(function forPushProcess(next) {
      if (changes.type === 'push') {
        let length = cache.nodes.length;
        if (length) {
          position = cache.nodes[length - 1].getPlaceholder().nextSibling;
        } else {
          position = node.placeholder.nextSibling;
        }

        newItems = changes.params;
      } else if (changes.type === 'unshift') {
        position = cache.nodes[0] ? cache.nodes[0].getPlaceholder() : null;
        newItems = changes.params;
        action = Array.prototype.unshift;
      } else if (changes.type === 'splice') {
        let removedItems = Array.prototype.splice.apply(cache.nodes, changes.params.slice(0, 2));
        newItems = changes.params.slice(2);
        removedItems.forEach(function (node) {
          node.destroy();
        });
      } else if (changes.type === 'pop') {
        cache.nodes.pop().destroy();
      } else if (changes.type === 'shift') {
        cache.nodes.shift().destroy();
      } else if (changes.type === 'sort' || changes.type === 'reverse') {
        cache.nodes.forEach(function (viewNode) {
          viewNode.destroy();
        });

        cache.nodes = [];
        newItems = changes.original;
      }

      let itemDataScope = nodeScopeData;
      let p = cache.propName, n = cache.nodes, cns;
      const templateSchema = node.cloneSchema();
      Reflect.deleteProperty(templateSchema, '$for');

      if (newItems instanceof Array) {
        const c = newItems.slice(0);
        for (let i = 0, len = newItems.length; i < len; i++) {
          itemDataScope = GV.createMirror(nodeScopeData);
          itemDataScope[p] = c[i];
          itemDataScope['$forIndex'] = i;
          cns = Galaxy.clone(templateSchema);

          let vn = GV.createNode(parentNode, itemDataScope, cns, position);
          // vn.data['$for'] = {};
          // vn.data['$for'][p] = c[i];
          // vn.data['$for']['index'] = i;
          action.call(n, vn);
        }
      }

      parentNode.sequences.enter.nextAction(next);
    });
    // We check for domManipulationsBus in the next ui action so we can be sure all the dom manipulations have been set
    // on parentNode.domManipulationsBus. For example in the case of nested $for, there is no way of telling that
    // all the dom manipulations are set in a ui action, so we need to do that in the next ui action.
    // parentNode.renderingFlow.next(function (next) {
    // setTimeout(function () {
    // Promise.all(parentNode.domBus).then(next);
    // });
    // });
  };
})(Galaxy.GalaxyView);

