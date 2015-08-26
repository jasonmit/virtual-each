import Ember from 'ember';
import layout from '../templates/components/virtual-item';

export default Ember.Component.extend({
  layout,
  tagName: 'li',
  classNames: ['virtual-item']
});
