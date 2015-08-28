import Ember from 'ember';
import People from '../models/people';
import Countries from '../models/countries';

export default Ember.Route.extend({
  model() {
    return {
      people: People,
      countries: Countries
    };
  }
});
