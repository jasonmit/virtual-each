import Ember from 'ember';
import computed from 'ember-new-computed';

export default Ember.Controller.extend({
  actions: {
    selected(modelType) {
      this.set('selected', modelType);
    },
    grow() {
      this.set('height', this.get('height') + this.get('height') * .3);
    },
    shrink() {
      this.set('height', this.get('height') - this.get('height') * .3);
    },
    changeTimeout() {
      const newValue = parseInt(this.get('scrollTimeout'), 10);
      if (!Number.isNaN(newValue)) {
        this.set('scrollTimeout', newValue);
      }
    }
  },
  height: 200,
  scrollTimeout: null,
  selected: 'people',
  componentName: computed('selected', {
    get() {
      return 'x-' + this.get('selected');
    }
  }),
  currentModel: computed('model', 'selected', {
    get() {
      return this.get('model')[this.get('selected')];
    }
  })
});
