import Ember from 'ember';
import EventListenerMixin from '../mixins/event-listener';
import DefaultAttrsMixin from '../mixins/default-attrs';
import layout from '../templates/components/virtual-each';

const {
  Component,
  Handlebars,
  run:emberRun,
  computed
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

  style: computed('height', {
    get() {
      let height = Handlebars.Utils.escapeExpression(this.getAttr('height'));

      return new SafeString(`height: ${height}px;`);
    }
  }),

  contentStyle: computed('_marginTop', '_contentHeight', {
    get() {
      let _safeMarginTop = Handlebars.Utils.escapeExpression(this.get('_marginTop'));
      let _safeContentHeight = Handlebars.Utils.escapeExpression(this.get('_contentHeight'));

      return new SafeString(`height: ${_safeContentHeight}px; margin-top: ${_safeMarginTop}px;`);
    }
  }).readOnly(),

  _visibleItems: computed('_startAt', '_visibleItemCount', '_items', {
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
  }).readOnly(),

  _visibleItemCount: computed('attrs.height', 'attrs.itemHeight', {
    get() {
      let height = this.getAttr('height');

      return Math.ceil(height / this.getAttr('itemHeight')) + EXTRA_ROW_PADDING;
    }
  }).readOnly(),

  _marginTop: computed('_totalHeight', '_startAt', '_visibleItemCount', 'attrs.itemHeight', {
    get() {
      let itemHeight = this.getAttr('itemHeight');
      let totalHeight = this.get('_totalHeight');
      let margin = this.get('_startAt') * itemHeight;
      let _visibleItemCount = this.get('_visibleItemCount');
      let maxMargin = Math.max(0, totalHeight - ((_visibleItemCount - 1) * itemHeight) + (EXTRA_ROW_PADDING * itemHeight));

      return Math.min(maxMargin, margin);
    }
  }).readOnly(),

  _contentHeight: computed('_totalHeight', '_marginTop', {
    get() {
      return this.get('_totalHeight') - this.get('_marginTop');
    }
  }).readOnly(),

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
    let itemHeight = this.getAttr('itemHeight');
    let totalHeight = this.get('_totalHeight');
    let _visibleItemCount = this.get('_visibleItemCount');

    let startingIndex = Math.max(positionIndex, 0) || this.get('_startAt');

    let maxVisibleItemTop = Math.max(0, (this.get('_items.length') - _visibleItemCount + EXTRA_ROW_PADDING));
    let maxPadding = Math.max(0, totalHeight - ((_visibleItemCount - 1) * itemHeight) + (EXTRA_ROW_PADDING * itemHeight));

    let sanitizedIndex = Math.min( startingIndex, maxVisibleItemTop);
    let sanitizedPadding = (sanitizedIndex === maxVisibleItemTop) ? maxPadding : itemHeight * sanitizedIndex;

    this.calculateVisibleItems(sanitizedIndex);
    this.$().scrollTop(sanitizedPadding);

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
