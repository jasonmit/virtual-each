import Ember from 'ember';

export default Ember.Mixin.create({
  defaultAttrs: {},

  getAttr(attrName) {
    let value = this._super(...arguments);

    if (typeof value === 'undefined') {
      value = this.defaultAttrs[attrName];
    }

    return value;
  }
})
