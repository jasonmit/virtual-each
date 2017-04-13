import Ember from 'ember';

const { Controller, run:emberRun } = Ember;

function coerceSet(attributeName) {
  return function(value) {
    const schedulerName = attributeName + '_timer';

    if (schedulerName) {
      emberRun.cancel(this[schedulerName]);
    }

    this[schedulerName] = emberRun.later(() => {
      const newValue = parseInt(value, 10);
      if (!Number.isNaN(newValue)) {
        this.set(attributeName, newValue);
      }
    }, 100);
  };
}

export default Controller.extend({
  actions: {
    setScrollTimeout: coerceSet('scrollTimeout'),
    setPositionIndex: coerceSet('positionIndex'),
    selected(modelType) {
      this.set('selected', modelType);
    },
    grow() {
      this.set('height', this.get('height') + this.get('height') * 0.3);
    },
    shrink() {
      this.set('height', this.get('height') - this.get('height') * 0.3);
    }
  },

  positionIndex: null,
  height: 500,
  scrollTimeout: null,
  selected: 'people',

  componentName: Ember.computed('selected', {
    get() {
      return 'x-' + this.get('selected');
    }
  }),
  currentModel: Ember.computed('model', 'selected', {
    get() {
      return this.get('model')[this.get('selected')];
    }
  })
});
