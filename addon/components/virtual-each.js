import Ember from 'ember';
import computed from 'ember-new-computed';
import EventListenerMixin from '../mixins/event-listener';
import DefaultAttrsMixin from '../mixins/default-attrs';
import layout from '../templates/components/virtual-each';

let {
  Component,
  String:emberString,
  run:emberRun
} = Ember;

let isWebkit = /WebKit/.test(navigator && navigator.userAgent || '');

export default Component.extend(EventListenerMixin, DefaultAttrsMixin, {
  layout,
  totalHeight: 0,
  content: null,
  classNames: ['virtual-each'],
  attributeBindings: ['style'],
  renderedStart: 0,

  defaultAttrs: {
    scrollTimeout: 30,
    height: 200,
    itemHeight: 20,
    items: []
  },

  eventHandlers: {
    wheel() {
      this._scrolledByWheel = true;
    },

    scroll(e) {
      e.preventDefault();

      const timeout = this.getAttr('scrollTimeout');

      if (timeout && isWebkit && this._scrolledByWheel) {
        this._scrolledByWheel = false;

        if (!this._scrollTimer) {
          this._scrollTimer = setTimeout(() => {
            this._scrollTimer = null;
            this._calculateVisibleItems();
          }, timeout);
        }

        return;
      }

      this._calculateVisibleItems();
    }
  },

  style: computed('height', function() {
    return emberString.fmt('height: %@px', this.getAttr('height'));
  }),

  visibleItems: computed('items', 'renderedStart', 'visibleItemCount', {
    get() {
      let items = this.get('items');
      let renderedStart = this.get('renderedStart');
      let visibleItemCount = this.get('visibleItemCount');

      return items.slice(renderedStart, renderedStart + visibleItemCount).map(function(raw, index) {
        return {
          raw: raw,
          index: renderedStart + index
        }
      });
    }
  }),

  visibleItemCount: computed('height', 'itemHeight', {
    get() {
      let height = this.getAttr('height');
      let itemHeight = this.get('itemHeight');

      return Math.ceil(height / itemHeight) + 1;
    }
  }),

  paddingTop: computed('totalHeight', 'visibleItemCount', 'itemHeight', 'renderedStart', {
    get() {
      let itemHeight = this.get('itemHeight');
      let totalHeight = this.get('totalHeight');
      let padding = this.get('renderedStart') * itemHeight;
      let visibleItemCount = this.get('visibleItemCount');
      let maxPadding = Math.max(0, totalHeight - (visibleItemCount * itemHeight) + itemHeight);

      return Math.min(maxPadding, padding);
    }
  }),

  contentHeight: computed('totalHeight', 'paddingTop', {
    get() {
      return this.get('totalHeight') - this.get('paddingTop');
    }
  }),

  _calculateVisibleItems() {
    emberRun(() => {
      let renderedStart = this.get('renderedStart');
      let scrolledAmount = this.$().scrollTop();
      let visibleStart = Math.floor(scrolledAmount / this.get('itemHeight'));

      if (visibleStart !== renderedStart) {
        this.set('renderedStart', visibleStart);
      }
    });
  },

  didReceiveAttrs() {
    this._super(...arguments);

    let items = this.getAttr('items');

    if (items !== this.get('items')) {
      Ember.run.scheduleOnce('afterRender', () => {
        this.$().scrollTop = 0;
      });
    }

    let itemHeight = this.getAttr('itemHeight');

    this.set('items', items);
    this.set('itemheight', itemHeight);
    this.set('totalHeight', Math.max(items.length * itemHeight, 0));
  }
});
