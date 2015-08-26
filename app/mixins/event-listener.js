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

    var element = this.$()[0];

    Object.keys(this.eventHandlers).forEach((eventName) => {
      element.addEventListener(eventName, this, false);
    });
  },

  willDestroyElement() {
    this._super(...arguments);

    var element = this.$()[0];

    Object.keys(this.eventHandlers).forEach((eventName) => {
      element.removeEventListener(eventName, this, false);
    });
  },
})
