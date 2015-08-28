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
const EXTRA_ROW_PADDING = 1;

export default Component.extend(EventListenerMixin, DefaultAttrsMixin, {
  layout,
  classNames: ['virtual-each'],
  attributeBindings: ['style'],

  _totalHeight: 0,
  _startAt: 0,
  _scrolledByWheel: false,

  defaultAttrs: {
    positionIndex: 0,
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

      const scrollTimeout = this.getAttr('scrollTimeout');

      if (scrollTimeout && this.isWebkit && this._scrolledByWheel) {
        this._scrolledByWheel = false;

        if (!this._scrollTimer) {
          this._scrollTimer = setTimeout(() => {
            this._scrollTimer = null;
            this.calculateVisibleItems();
          }, scrollTimeout);
        }

        return;
      }

      this.calculateVisibleItems();
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
      let endAt = Math.min(items.length, startAt + visibleItemCount);
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

  visibleItemCount: computed('height', 'itemHeight', {
    get() {
      let height = this.getAttr('height');

      return Math.ceil(height / this.getAttr('itemHeight')) + EXTRA_ROW_PADDING;
    }
  }),

  paddingTop: computed('_totalHeight', 'visibleItemCount', 'itemHeight', '_startAt', {
    get() {
      let itemHeight = this.getAttr('itemHeight');
      let totalHeight = this.get('_totalHeight');
      let padding = this.get('_startAt') * itemHeight;
      let visibleItemCount = this.get('visibleItemCount');
      let maxPadding = Math.max(0, totalHeight - (visibleItemCount * itemHeight) + itemHeight);

      return Math.min(maxPadding, padding);
    }
  }),

  contentHeight: computed('_totalHeight', 'paddingTop', {
    get() {
      return this.get('_totalHeight') - this.get('paddingTop');
    }
  }),

  calculateVisibleItems(positionIndex) {
    emberRun(() => {
      let startAt = this.get('_startAt');
      let scrolledAmount = this.$().scrollTop();
      let visibleStart = positionIndex || Math.floor(scrolledAmount / this.getAttr('itemHeight'));

      if (visibleStart !== startAt) {
        this.set('_startAt', visibleStart);
      }
    });
  },

  didInsertElement() {
    this._super(...arguments);

    this.isWebkit = /WebKit/.test(navigator && navigator.userAgent || '');
  },

  scrollTo(positionIndex) {
    let sanitizedIndex = Math.min(
      Math.max(positionIndex, 0),
      (this.get('_items.length') - this.get('visibleItemCount'))
    );

    this.calculateVisibleItems(sanitizedIndex);
    this.$().scrollTop(sanitizedIndex * this.getAttr('itemHeight'));
  },

  didReceiveAttrs(attrs) {
    this._super(...arguments);

    let items = Ember.A(this.getAttr('items'));
    this.set('_items', items);
    this.set('_totalHeight', Math.max(items.length * this.getAttr('itemHeight'), 0));

    if (attrs.newAttrs.hasOwnProperty('items') || attrs.newAttrs.hasOwnProperty('positionIndex')) {
      Ember.run.scheduleOnce('afterRender', () => {
        this.scrollTo(this.getAttr('positionIndex'));
      });
    }
  }
});
