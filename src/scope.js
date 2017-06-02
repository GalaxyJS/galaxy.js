/* global Galaxy */

(function (root, G) {
  root.Galaxy = G;
  /**
   *
   * @returns {Galaxy.GalaxyScope}
   */
  G.GalaxyScope = GalaxyScope;

  function GalaxyScope(module, element) {
    this.systemId = module.systemId;
    this.parentScope = module.parentScope || null;
    this.element = element || null;
    this.imports = {};

    var urlParser = document.createElement('a');
    urlParser.href = module.url;
    var myRegexp = /([^\t\n]+)\//g;
    var match = myRegexp.exec(urlParser.pathname);
    this.path = match ? match[0] : '/';
    this.parsedURL = urlParser.href;
  }

  GalaxyScope.prototype.load = function (module) {
    module.parentScope = this;
    module.domain = module.domain || Galaxy;
    return G.load(module);
  };

  GalaxyScope.prototype.loadModuleInto = function (moduleMetaData, element) {
    var newModuleMetaData = Object.assign({}, moduleMetaData);
    if (newModuleMetaData.url.indexOf('./') === 0) {
      newModuleMetaData.url = this.path + moduleMetaData.url.substr(2);
    }

    newModuleMetaData.element = element;
    return this.load(newModuleMetaData).then(function (module) {
      module.start();

      return module;
    });
  };

}(this, Galaxy || {}));
