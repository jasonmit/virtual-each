import Ember from 'ember';

export default Ember.Mixin.create({
  eventHandlers: {},

  handleEvent(event) {
    var fn = this.eventHandlers[event.type];

    if (typeof fn === 'function') {
      return fn.call(this, event);
    }
  },

  didInsertElement() {
    this._super(...arguments);

    Object.keys(this.eventHandlers).forEach((eventName) => {
      this.element.addEventListener(eventName, this, false);
    });
  },

  willDestroyElement() {
    this._super(...arguments);

    Object.keys(this.eventHandlers).forEach((eventName) => {
      this.element.removeEventListener(eventName, this, false);
    });
  }
});
