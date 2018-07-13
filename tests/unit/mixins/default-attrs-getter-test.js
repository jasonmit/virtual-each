import { expect } from 'chai';
import { describe, it } from 'mocha';
import EmberObject, { computed } from '@ember/object';
import DefaultAttrsMixin from 'virtual-each/mixins/default-attrs';

describe('Default Attrs Mixin', function() {
  it('gets a value from plain object', function() {
    let mixin = EmberObject.extend(DefaultAttrsMixin).create();
    mixin.defaultAttrs.positionIndex = 5;

    expect(mixin.getAttr('positionIndex')).to.equal(5);
  });

  it('gets a value from computed property', function() {
    let mixin = EmberObject.extend(DefaultAttrsMixin, {
      defaultAttrs: computed(function() {
        return {
          positionIndex: 5
        };
      })
    }).create();

    expect(mixin.getAttr('positionIndex')).to.equal(5);
  });
});
