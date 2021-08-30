/* global Galaxy */
(function (G) {
  G.View.NODE_BLUEPRINT_PROPERTY_MAP['selected'] = {
    type: 'prop',
    name: 'selected',
    /**
     *
     * @param {Galaxy.View.ViewNode} viewNode
     * @param {Galaxy.View.ReactiveData} scopeReactiveData
     * @param prop
     * @param {Function} expression
     */
    beforeAssign: function (viewNode, scopeReactiveData, prop, expression) {
      if (expression && viewNode.blueprint.tag === 'select') {
        throw new Error('select.selected property does not support binding expressions ' +
          'because it must be able to change its data.\n' +
          'It uses its bound value as its `model` and expressions can not be used as model.\n');
      }

      // Don't do anything if the node is an option tag
      if (viewNode.blueprint.tag === 'select') {
        // const bindings = G.View.getBindings(viewNode.blueprint.selected);
        // const id = bindings.propertyKeysPaths[0].split('.').pop();
        // const nativeNode = viewNode.node;

        // const unsubscribe = viewNode.stream.filter('dom').filter('childList').subscribe(function () {
        //   if (scopeReactiveData.data[id] && !nativeNode.value) {
        //     nativeNode.value = scopeReactiveData.data[id];
        //   }
        // });
        //
        // viewNode.destroyed.then(unsubscribe);
      }
    },
    value: function (viewNode, value) {
      const nativeNode = viewNode.node;

      viewNode.rendered.then(function () {
        if (nativeNode.value !== value) {
          if (viewNode.blueprint.tag === 'select') {
            nativeNode.value = value;
          } else if (value) {
            nativeNode.setAttribute('selected');
          } else {
            nativeNode.removeAttribute('selected');
          }
        }
      });
    }
  };
})(Galaxy);

