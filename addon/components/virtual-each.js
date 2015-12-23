import Ember from 'ember';
import EventListenerMixin from '../mixins/event-listener';
import DefaultAttrsMixin from '../mixins/default-attrs';
import layout from '../templates/components/virtual-each';

const {
  Component,
  Handlebars,
  run:emberRun,
  computed,
  get,
  set,
  RSVP,
  A:emberArray
} = Ember;

const { SafeString } = Handlebars;
const EXTRA_ROW_PADDING = 1;

const VirtualEachComponent = Component.extend(EventListenerMixin, DefaultAttrsMixin, {
  layout,
  classNames: ['virtual-each'],
  attributeBindings: ['style'],

  defaultAttrs: {
    positionIndex: 0,
    scrollTimeout: 30,
    height: 200,
    itemHeight: 20
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

  style: computed('attrs.height', {
    get() {
      const height = Handlebars.Utils.escapeExpression(this.getAttr('height'));

      return new SafeString(`height: ${height}px;`);
    }
  }).readOnly(),

  contentStyle: computed('_marginTop', '_contentHeight', {
    get() {
      const marginTop = Handlebars.Utils.escapeExpression(get(this, '_marginTop'));
      const height = Handlebars.Utils.escapeExpression(get(this, '_contentHeight'));

      return new SafeString(`height: ${height}px; margin-top: ${marginTop}px;`);
    }
  }).readOnly(),

  visibleItems: computed('_startAt', '_visibleItemCount', '_items', {
    get() {
      const items = get(this, '_items');
      const startAt = get(this, '_startAt');
      const _visibleItemCount = get(this, '_visibleItemCount');
      const itemsLength = get(items, 'length');
      const endAt = Math.min(itemsLength, startAt + _visibleItemCount);
      const onScrollBottomed = this.attrs.onScrollBottomed;

      if (typeof onScrollBottomed === 'function' && (startAt + _visibleItemCount - EXTRA_ROW_PADDING) >= itemsLength) {
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
      const height = this.getAttr('height');

      return Math.ceil(height / this.getAttr('itemHeight')) + EXTRA_ROW_PADDING;
    }
  }).readOnly(),

  _marginTop: computed('_totalHeight', '_startAt', '_visibleItemCount', 'attrs.itemHeight', {
    get() {
      const itemHeight = this.getAttr('itemHeight');
      const totalHeight = get(this, '_totalHeight');
      const margin = get(this, '_startAt') * itemHeight;
      const visibleItemCount = get(this, '_visibleItemCount');
      const maxMargin = Math.max(0, totalHeight - ((visibleItemCount - 1) * itemHeight) + (EXTRA_ROW_PADDING * itemHeight));

      return Math.min(maxMargin, margin);
    }
  }).readOnly(),

  _contentHeight: computed('_totalHeight', '_marginTop', {
    get() {
      return get(this, '_totalHeight') - get(this, '_marginTop');
    }
  }).readOnly(),

  init() {
    this._super(...arguments);

    this.setProperties({
      _items: emberArray(),
      _startAt: 0,
      _totalHeight: 0,
      _scrolledByWheel: false
    });
  },

  didInsertElement() {
    this._super(...arguments);

    const { userAgent:ua } = navigator || {};

    this.isWebkit = /WebKit/.test(ua);
  },

  calculateVisibleItems(positionIndex) {
    emberRun(() => {
      const startAt = get(this, '_startAt');
      const scrolledAmount = this.$().scrollTop();
      const visibleStart = positionIndex || Math.floor(scrolledAmount / this.getAttr('itemHeight'));

      if (visibleStart !== startAt) {
        set(this, '_startAt', visibleStart);
      }
    });
  },

  scrollTo(positionIndex) {
    const itemHeight = this.getAttr('itemHeight');
    const totalHeight = get(this, '_totalHeight');
    const _visibleItemCount = get(this, '_visibleItemCount');
    const startingIndex = Math.max(positionIndex, 0) || get(this, '_startAt');
    const maxVisibleItemTop = Math.max(0, (get(this, '_items.length') - _visibleItemCount + EXTRA_ROW_PADDING));
    const maxPadding = Math.max(0, totalHeight - ((_visibleItemCount - 1) * itemHeight) + (EXTRA_ROW_PADDING * itemHeight));
    const sanitizedIndex = Math.min( startingIndex, maxVisibleItemTop);
    const sanitizedPadding = (sanitizedIndex === maxVisibleItemTop) ? maxPadding : itemHeight * sanitizedIndex;

    this.calculateVisibleItems(sanitizedIndex);
    this.$().scrollTop(sanitizedPadding);
  },

  didReceiveAttrs(attrs) {
    this._super(...arguments);

    RSVP.cast(this.getAttr('items')).then((attrItems) => {
      const items = emberArray(attrItems);

      this.setProperties({
        _items: items,
        _totalHeight: Math.max(get(items, 'length') * this.getAttr('itemHeight'), 0)
      });

      if (attrs.newAttrs.hasOwnProperty('items') || attrs.newAttrs.hasOwnProperty('positionIndex')) {
        emberRun.scheduleOnce('afterRender', () => {
          this.scrollTo(this.getAttr('positionIndex'));
        });
      }
    });
  }
});

VirtualEachComponent.reopenClass({
  positionalParams: ['items']
});

export default VirtualEachComponent;
