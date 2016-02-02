/*global xdescribe, beforeEach */
/*jshint -W030 */ // Expected an assignment or function call and instead saw an expression
import '../test-helper';

import Ember from 'ember';
import {
  describeComponent,
  it
} from 'ember-mocha';
import { describe } from 'mocha';
import { expect } from 'chai';
import hbs from 'htmlbars-inline-precompile';

const { run } = Ember;
const EXTRA_ROW_PADDING = 1;

describeComponent('virtual-each', 'VirtualEachComponent', {
  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']
  integration: true
}, function() {

  it('renders', function() {
    // creates the component instance
    this.render(hbs`
      {{virtual-each}}
    `);
    var $component = this.$('.virtual-each');
    expect($component.hasClass('virtual-each')).to.be.true;
  });

  describe("positional param", function() {
    it("it sets items", function() {
      const items = new Array(200).fill(0).map((value, index)=> {
        return "Item ".concat(index);
      });

      const height = 500;
      const itemHeight = 35;
      const expectedLength = Math.ceil(height/itemHeight + EXTRA_ROW_PADDING);

      this.setProperties({
        items,
        height,
        itemHeight
      });

      this.render(hbs`
        {{#virtual-each
          items
          positionIndex=positionIndex
          height=height
          itemHeight=itemHeight
        as |item actualIndex virtualIndex|}}
          <div style='height: 35px;'>
            {{item}} - actual {{actualIndex}} - virtual {{virtualIndex}}
          </div>
        {{else}}
          <div class="spec-no-data">You have no data!</div>
        {{/virtual-each}}
      `);

      expect(this.$('.virtual-each ul li').length, expectedLength);
    });
  });

  describe("with empty content", function() {
    beforeEach(function() {
      const items = new Array(0);

      this.set('items', items);

      this.render(hbs`
        {{#virtual-each
          items=items
          positionIndex=positionIndex
          height=500
          itemHeight=35
        as |item actualIndex virtualIndex|}}
        <div style='height: 35px;'>{{item}} - actual {{actualIndex}} - virtual {{virtualIndex}}</div>
        {{else}}
        <div class="spec-no-data">You have no data!</div>
        {{/virtual-each}}
      `);
      this.$component = this.$('.virtual-each');
    });

    it("renders the else", function() {
      expect($('.virtual-list-empty').length).to.equal(1);
      expect($('.spec-no-data').text().trim()).to.equal('You have no data!');
    });
  });

  describe("passing attributes", function() {
    beforeEach(function() {
      const items = new Array(200).fill(0).map((value, index)=> {
        return "Item ".concat(index);
      });

      this.set('items', items);

      this.render(hbs`
        {{#virtual-each
          items=items
          positionIndex=positionIndex
          height=500
          itemHeight=35
        as |item actualIndex virtualIndex|}}
          <div style='height: 35px;'>{{item}} - actual {{actualIndex}} - virtual {{virtualIndex}}</div>
        {{/virtual-each}}
      `);

      this.$component = this.$('.virtual-each');
    });

    it("styles the panel height", function() {
      var obj = {};
      var split = this.$component.attr('style').split(/[:;]/);
      for (var i = 0; i < split.length-1; i+=2) {
        obj[split[i].trim()] = split[i+1].trim();
      }
      expect(obj['height']).to.equal('500px');
    });

    it("styles the content height", function() {
      var obj = {};
      var split = this.$component.find('.infinite-list-content').attr('style').split(/[:;]/);
      for (var i = 0; i < split.length-1; i+=2) {
        obj[split[i].trim()] = split[i+1].trim();
      }
      var contentHeight = 35 * 200;
      expect(obj['height']).to.equal(`${contentHeight}px`);
    });

    it("shows visible items in the panel", function() {
      var visibleItems = this.$component.find('li');
      var expectedLength = Math.ceil(500/35 + EXTRA_ROW_PADDING);
      expect(visibleItems.length).to.equal(expectedLength);
    });

    it("first item is item 0", function () {
      expect(this.$component.find('li').first().text()).to.contain('Item 0');
      expect(this.$component.find('li').first().text()).to.contain('actual 0');
      expect(this.$component.find('li').first().text()).to.contain('virtual 0');
    });

    describe("scrolling", function() {
      beforeEach(function() {
        this.itemHeight = 35;
      });

      it("scrolls to the bottom of the first item", function() {

        let changedActionCallCount = 0;
        var $component = this.$('.virtual-each');

        $component.on('scroll', function() {
          changedActionCallCount++;
        });

        run(() => {
          this.$('.virtual-each').scrollTop(this.itemHeight);
          this.$('.virtual-each').trigger('scroll');
        });

        expect(this.$component.find('li').first().text()).to.contain('Item 0');
        expect(changedActionCallCount).to.equal(1);
      });

      xdescribe("scrolling to the top of the second item", function() {
        beforeEach(function() {
          run(() => {
            this.$('.virtual-each').scrollTop(this.itemHeight + 1);
            this.$('.virtual-each').trigger('scroll');
          });
        });

        it("rerenders with the second item at the top", function() {
          var $component = this.$('.virtual-each');
          expect($component.find('li').first().text()).to.contain('Item 1');
        });
      });
    });

    describe("positioning", function() {
      beforeEach(function() {
        this.set('positionIndex', 0);
      });

      it("shows visible items in the panel", function() {
        var visibleItems = this.$component.find('li');
        var expectedLength = Math.ceil(500/35 + EXTRA_ROW_PADDING);
        expect(visibleItems.length).to.equal(expectedLength);
      });

      it("first item is item 0", function () {
        var $component = this.$('.virtual-each');
        expect($component.find('li').first().text()).to.contain('Item 0');
      });

      describe("positioning to the second item", function() {
        beforeEach(function() {
          run(() => {
            this.set('positionIndex', 1);
          });
        });

        it("rerenders with the second item at the top", function() {
          var $component = this.$('.virtual-each');
          expect($component.find('li').first().text()).to.contain('Item 1');
        });
      });

      describe("re-positioning to the first item", function() {
        beforeEach(function() {
          run(() => {
            this.set('positionIndex', 10);
            this.set('positionIndex', 0);
          });
        });

        it("rerenders with the first item at the top", function() {
          var $component = this.$('.virtual-each');
          expect($component.find('li').first().text()).to.contain('Item 0');
        });
      });

      describe("positioning where the last item is in view", function() {
        beforeEach(function() {
          run(() => {
            this.set('positionIndex', 185);
          });
        });

        it("sets the scrollTop such that the first item shown is not cutoff", function() {
          var $component = this.$('.virtual-each');
          let firstVisibleItem = 185;
          let itemHeight = 35;
          expect($component.scrollTop()).to.be.closeTo(firstVisibleItem * itemHeight, 1);
        });
      });

      describe("positioning to the last item in list", function() {
        beforeEach(function() {
          run(() => {
            this.set('positionIndex', 199);
          });
        });

        it("is the last item in the list", function() {
          var $component = this.$('.virtual-each');
          expect($component.find('li').last().text()).to.contain('Item 199');
        });

        it("sets the scrollTop such that the last item exists is the last visible item", function() {
          var $component = this.$('.virtual-each');
          let totalHeight = 200*35;
          let virtualHeight = 500;

          let expectedScrollTop = totalHeight - virtualHeight;
          let halfItemHeight = 0.5 * 35;
          expect($component.scrollTop()).to.be.closeTo(expectedScrollTop, halfItemHeight);
        });
      });

      describe("positioning past the last item in list", function() {
        beforeEach(function() {
          run(() => {
            this.set('positionIndex', 200);
          });
        });

        it("does not position past the last item", function() {
          var $component = this.$('.virtual-each');
          expect($component.find('li').last().text()).to.contain('Item 199');
        });

        it("sets the scrollTop such that the last item exists is the last visible item", function() {
          var $component = this.$('.virtual-each');
          let totalHeight = 200*35;
          let virtualHeight = 500;

          let expectedScrollTop = totalHeight - virtualHeight;
          let halfItemHeight = 0.5 * 35;
          expect($component.scrollTop()).to.be.closeTo(expectedScrollTop, halfItemHeight);
        });

        describe("persisting the positionIndex", function() {
          beforeEach(function() {
            this.set('positionIndex', undefined);
          });

          it("persists the current index", function() {
            var $component = this.$('.virtual-each');
            expect($component.find('li').last().text()).to.contain('actual 199');
          });

          describe("updating items", function() {
            beforeEach(function() {
              let newItems = this.get('items').map((value, index)=> { return "newItem ".concat(index); });
              this.set('items', newItems);
            });

            it("persists the current index", function() {
              var $component = this.$('.virtual-each');
              expect($component.find('li').last().text()).to.contain('actual 199');
            });
          });
        });
      });
    });
  });
});
