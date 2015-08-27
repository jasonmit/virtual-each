import Ember from 'ember';
import computed from 'ember-new-computed';
import EventListenerMixin from '../mixins/event-listener';
import DefaultAttrsMixin from '../mixins/default-attrs';
import layout from '../templates/components/virtual-each';

const {
  Component,
  Handlebars,
  run:emberRun
} = Ember;

const { SafeString } = Handlebars;
const isWebkit = /WebKit/.test(navigator && navigator.userAgent || '');
const EXTRA_ROW_PADDING = 1;

export default Component.extend(EventListenerMixin, DefaultAttrsMixin, {
  layout,
  classNames: ['virtual-each'],
  attributeBindings: ['style'],

  _itemHeight: null,
  _totalHeight: 0,
  _startAt: 0,

  defaultAttrs: {
    scrollTimeout: 30,
    height: 200,
    itemHeight: 20,
    items: Ember.A()
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

  safeStyle: computed('paddingTop', 'contentHeight', {
    get() {
      let paddingTop = Handlebars.Utils.escapeExpression(this.get('paddingTop'));
      let height = Handlebars.Utils.escapeExpression(this.get('contentHeight'));

      return new SafeString(`height: ${height}px; padding-top: ${paddingTop}px;`);
    }
  }),

  style: computed('height', {
    get() {
      let height = Handlebars.Utils.escapeExpression(this.getAttr('height'));
      return new SafeString(`height: ${height}px;`);
    }
  }),

  visibleItems: computed('items', '_startAt', 'visibleItemCount', {
    get() {
      let items = this.get('items');
      let startAt = this.get('_startAt');
      let visibleItemCount = this.get('visibleItemCount');
      let endAt = startAt + visibleItemCount;
      let onBottom = this.attrs.onBottom;
      let out = [];

      if (onBottom && (startAt + visibleItemCount - EXTRA_ROW_PADDING) >= items.length) {
        onBottom(startAt, endAt);
      }

      for (let i = startAt; i < endAt; i++) {
        out.push({
          raw: items.objectAt(i),
          index: startAt + i
        });
      }

      return out;
    }
  }),

  visibleItemCount: computed('height', '_itemHeight', {
    get() {
      let height = this.getAttr('height');
      let _itemHeight = this.get('_itemHeight');

      return Math.ceil(height / _itemHeight) + 1;
    }
  }),

  paddingTop: computed('_totalHeight', 'visibleItemCount', '_itemHeight', '_startAt', {
    get() {
      let _itemHeight = this.get('_itemHeight');
      let _totalHeight = this.get('_totalHeight');
      let padding = this.get('_startAt') * _itemHeight;
      let visibleItemCount = this.get('visibleItemCount');
      let maxPadding = Math.max(0, _totalHeight - (visibleItemCount * _itemHeight) + _itemHeight);

      return Math.min(maxPadding, padding);
    }
  }),

  contentHeight: computed('_totalHeight', 'paddingTop', {
    get() {
      return this.get('_totalHeight') - this.get('paddingTop');
    }
  }),

  _calculateVisibleItems() {
    emberRun(() => {
      let _startAt = this.get('_startAt');
      let scrolledAmount = this.$().scrollTop();
      let visibleStart = Math.floor(scrolledAmount / this.get('_itemHeight'));

      if (visibleStart !== _startAt) {
        this.set('_startAt', visibleStart);
      }
    });
  },

  didReceiveAttrs(attrs) {
    this._super(...arguments);

    let items = this.getAttr('items');
    let _itemHeight = this.getAttr('itemHeight');

    this.set('_items', Ember.A(items));
    this.set('_itemHeight', _itemHeight);
    this.set('_totalHeight', Math.max(items.length * _itemHeight, 0));

    if (attrs.newAttrs.hasOwnProperty('items')) {
      Ember.run.scheduleOnce('afterRender', () => {
        this.$().scrollTop = 0;
      });
    }
  }
});
