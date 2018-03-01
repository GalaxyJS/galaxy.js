/* global Galaxy */

Galaxy.GalaxyView.Portal = /** @class */(function () {
  /**
   *
   * @param owner
   * @constructor
   */
  function Portal(owner) {
    this.owner = null;
    this.owners = [];
    this.props = {};

    this.setOwner(owner);
  }

  Portal.prototype.setOwner = function (owner) {
    if (owner) {
      this.removeOwner(this.owner);
      this.addOwner(owner);
    }

    this.owner = owner;
  };

  Portal.prototype.getAllOwners = function () {
    return this.owners;
  };

  /**
   *
   * @param {Galaxy.GalaxyView.ReactiveProperty} owner
   */
  Portal.prototype.addOwner = function (owner) {
    if (this.owners.indexOf(owner) === -1) {
      this.owners.push(owner);
    }
  };

  /**
   *
   * @param {Galaxy.GalaxyView.ReactiveProperty} owner
   */
  Portal.prototype.removeOwner = function (owner) {
    let index = this.owners.indexOf(owner);
    if (index !== -1) {
      this.owners.splice(index, 1);
    }
  };
  /**
   *
   * @param property
   * @return {Array<Galaxy.GalaxyView.ReactiveProperty>}
   */
  Portal.prototype.getPropsList = function () {
    let list = [];
    const keys = Object.keys(this.props);
    let i = 0;

    for (const len = keys.length; i < len; i++) {
      list.push(this.props[keys[i]]);
    }

    return list;
  };

  /**
   *
   * @param {Galaxy.GalaxyView.ReactiveProperty} property
   */
  Portal.prototype.setProperty = function (property, key) {
    this.props[key] = property;
  };

  Portal.prototype.getValueOf = function (key) {
    const prop = this.props[key];

    return prop ? prop.value : undefined;
  };

  return Portal;
}());
