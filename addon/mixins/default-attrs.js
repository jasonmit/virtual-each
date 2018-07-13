import Ember from 'ember';

export default Ember.Mixin.create({
  init() {
    this._super(...arguments);

    if (!this.defaultAttrs) {
      this.defaultAttrs = {};
    }
  },

  getAttr(attrName) {
    const value = this._super(...arguments);

    if (typeof value === 'undefined') {
      return this.get(`defaultAttrs.${attrName}`);
    }

    return value;
  }
});
