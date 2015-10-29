import '../../test-helper';

import {
  describeComponent,
  it
} from 'ember-mocha';
// import { describe } from 'mocha';
import { expect } from 'chai';


describeComponent('virtual-each', 'VirtualEachComponent', {
  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
  unit: true
  }, function() {

  it('renders', function() {
    // creates the component instance
    var component = this.subject();
    expect(component._state).to.equal('preRender');

    // renders the component on the page
    this.render();
    expect(component._state).to.equal('inDOM');
  });
});
