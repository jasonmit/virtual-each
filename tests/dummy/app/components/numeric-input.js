import Ember from 'ember';

export default Ember.Component.extend({
  placeholder: '',
  actions: {
    numeric(e) {
      return e.charCode >= 48 && e.charCode <= 57;
    },
    oninput(value) {
      if (this.attrs.oninput) {
        const newValue = parseInt(value, 10);
        if (!Number.isNaN(newValue)) {
          this.attrs.oninput(newValue);
        }
      }
    }
  }
});
