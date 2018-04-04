/* global Galaxy */

(function (GV) {
  GV.NODE_SCHEMA_PROPERTY_MAP['value.config'] = {
    type: 'none'
  };

  GV.NODE_SCHEMA_PROPERTY_MAP['value'] = {
    type: 'prop',
    name: 'value',
    util: function valueUtil(viewNode, scopeProperty, prop, expression) {
      if (expression) {
        throw new Error('input.value property does not support binding expressions ' +
          'because it must be able to change its data.\n' +
          'It uses its bound value as its `model` and expressions can not be used as model.\n');
      }

      const bindings = GV.getBindings(viewNode.schema.value);
      const id = bindings.propertyKeysPaths[0].split('.').pop();
      const nativeNode = viewNode.node;
      if(nativeNode.type === 'number') {
        nativeNode.addEventListener('input', function () {
          scopeProperty.data[id] = nativeNode.value ? Number(nativeNode.value) : null;
        });
      } else {
        nativeNode.addEventListener('keyup', function () {
          scopeProperty.data[id] = nativeNode.value;
        });
      }
    }
  };
})(Galaxy.GalaxyView);

