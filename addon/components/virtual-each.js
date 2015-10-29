import Ember from 'ember';
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

      let scrollTimeout = this.getAttr('scrollTimeout');

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

  style: Ember.computed('height', {
    get() {
      let height = Handlebars.Utils.escapeExpression(this.getAttr('height'));

      return new SafeString(`height: ${height}px;`);
    }
  }),

  contentStyle: Ember.computed('_paddingTop', '_contentHeight', {
    get() {
      let _safePaddingTop = Handlebars.Utils.escapeExpression(this.get('_paddingTop'));
      let _safeContentHeight = Handlebars.Utils.escapeExpression(this.get('_contentHeight'));

      return new SafeString(`height: ${_safeContentHeight}px; padding-top: ${_safePaddingTop}px;`);
    }
  }),

  _visibleItems: Ember.computed('_startAt', '_visibleItemCount', '_items', {
    get() {
      let items = this.get('_items');
      let startAt = this.get('_startAt');
      let _visibleItemCount = this.get('_visibleItemCount');
      let endAt = Math.min(items.length, startAt + _visibleItemCount);
      let onScrollBottomed = this.attrs.onScrollBottomed;

      if (typeof onScrollBottomed === 'function' && (startAt + _visibleItemCount - EXTRA_ROW_PADDING) >= items.length) {
        onScrollBottomed(startAt, endAt);
      }

      return items.slice(startAt, endAt).map((item, index) => {
        return {
          raw: item,
          actualIndex: startAt + index,
          virtualIndex: index
        };
      });
    }
  }),

  _visibleItemCount: Ember.computed('attrs.height', 'attrs.itemHeight', {
    get() {
      let height = this.getAttr('height');

      return Math.ceil(height / this.getAttr('itemHeight')) + EXTRA_ROW_PADDING;
    }
  }),

  _paddingTop: Ember.computed('_totalHeight', '_startAt', '_visibleItemCount', 'attrs.itemHeight', {
    get() {
      let itemHeight = this.getAttr('itemHeight');
      let totalHeight = this.get('_totalHeight');
      let padding = this.get('_startAt') * itemHeight;
      let _visibleItemCount = this.get('_visibleItemCount');
      let maxPadding = Math.max(0, totalHeight - (_visibleItemCount * itemHeight) + itemHeight);

      return Math.min(maxPadding, padding);
    }
  }),

  _contentHeight: Ember.computed('_totalHeight', '_paddingTop', {
    get() {
      return this.get('_totalHeight') - this.get('_paddingTop');
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
      (this.get('_items.length') - this.get('_visibleItemCount'))
    );

    this.calculateVisibleItems(sanitizedIndex);
    this.$().scrollTop(sanitizedIndex * this.getAttr('itemHeight'));
  },

  didReceiveAttrs(attrs) {
    this._super(...arguments);

    let items = Ember.A(this.getAttr('items'));

    this.setProperties({
      _items: items,
      _totalHeight: Math.max(items.length * this.getAttr('itemHeight'), 0)
    });

    if (attrs.newAttrs.hasOwnProperty('items') || attrs.newAttrs.hasOwnProperty('positionIndex')) {
      emberRun.scheduleOnce('afterRender', () => {
        this.scrollTo(this.getAttr('positionIndex'));
      });
    }
  }
});
