/* global Galaxy */

(function (G) {
  G.View.NODE_SCHEMA_PROPERTY_MAP['on'] = {
    type: 'custom',
    name: 'on',
    /**
     *
     * @param {Galaxy.View.ViewNode} viewNode
     * @param attr
     * @param events
     */
    handler: function (viewNode, attr, events) {
      if (events !== null && typeof events === 'object') {
        for (let name in events) {
          if (events.hasOwnProperty(name)) {
            viewNode.node.addEventListener(name, events[name].bind(viewNode), false);
          }
        }
      }
    }
  };
})(Galaxy);
