import Ember from 'ember';
import EventListenerMixin from '../../mixins/event-listener';
import DefaultAttrsMixin from '../../mixins/default-attrs';
import layout from './template';

const {
  Component,
  run,
  observer,
  computed,
  get,
  set,
  RSVP,
  A:emberArray,
  String: { htmlSafe },
  Handlebars: {
    Utils: { escapeExpression }
  }
} = Ember;

const VirtualEachComponent = Component.extend(EventListenerMixin, DefaultAttrsMixin, {
  layout,
  classNames: ['virtual-each'],
  attributeBindings: ['style'],

  defaultAttrs: {
    height: 200,
    rowPadding: 1,
    itemHeight: 20,
    scrollTimeout: 30
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

  style: computed('height', {
    get() {
      const height = escapeExpression(this.getAttr('height'));

      return htmlSafe(`height: ${height}px;`);
    }
  }).readOnly(),

  contentStyle: computed('_marginTop', '_contentHeight', {
    get() {
      const marginTop = escapeExpression(get(this, '_marginTop'));
      const height = escapeExpression(get(this, '_contentHeight'));

      return htmlSafe(`height: ${height}px; margin-top: ${marginTop}px;`);
    }
  }).readOnly(),

  visibleItems: computed('_startAt', '_visibleItemCount', '_items', 'rowPadding', {
    get() {
      const items = get(this, '_items');
      const startAt = get(this, '_startAt');
      const rowPadding = this.getAttr('rowPadding');
      const _visibleItemCount = get(this, '_visibleItemCount');
      const itemsLength = get(items, 'length');
      const endAt = Math.min(itemsLength, startAt + _visibleItemCount);
      const onScrollBottomed = this.attrs.onScrollBottomed;

      if (typeof onScrollBottomed === 'function' && (startAt + _visibleItemCount - rowPadding) >= itemsLength) {
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

  _visibleItemCount: computed('height', 'itemHeight', 'rowPadding', {
    get() {
      const height = this.getAttr('height');
      const rowPadding = this.getAttr('rowPadding');

      return Math.ceil(height / this.getAttr('itemHeight')) + rowPadding;
    }
  }).readOnly(),

  _marginTop: computed('_totalHeight', '_startAt', '_visibleItemCount', 'itemHeight', 'rowPadding', {
    get() {
      const rowPadding = this.getAttr('rowPadding');
      const itemHeight = this.getAttr('itemHeight');
      const totalHeight = get(this, '_totalHeight');
      const margin = get(this, '_startAt') * itemHeight;
      const visibleItemCount = get(this, '_visibleItemCount');
      const maxMargin = Math.max(0, totalHeight - ((visibleItemCount - 1) * itemHeight) + (rowPadding * itemHeight));

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
    run(() => {
      const startAt = get(this, '_startAt');
      const scrolledAmount = this.$().scrollTop();
      const visibleStart = isNaN(positionIndex) ? Math.floor(scrolledAmount / this.getAttr('itemHeight')) : Math.max(positionIndex);

      if (visibleStart !== startAt) {
        set(this, '_startAt', visibleStart);
      }
    });
  },

  scrollTo: observer('_positionIndex', function() {
    const rowPadding = this.getAttr('rowPadding');
    const positionIndex = get(this, '_positionIndex');
    const itemHeight = this.getAttr('itemHeight');
    const totalHeight = get(this, '_totalHeight');
    const _visibleItemCount = get(this, '_visibleItemCount');
    const startingIndex = isNaN(positionIndex) ? get(this, '_startAt') : Math.max(positionIndex, 0);
    const startingPadding = itemHeight * startingIndex;
    const maxVisibleItemTop = Math.max(0, (get(this, '_items.length') - _visibleItemCount + rowPadding));
    const maxPadding = Math.max(0, totalHeight - ((_visibleItemCount - 1) * itemHeight) + (rowPadding * itemHeight));
    const sanitizedIndex = Math.min(startingIndex, maxVisibleItemTop);
    const sanitizedPadding = (startingPadding > maxPadding) ? maxPadding : startingPadding;

    this.scheduledRender = run.scheduleOnce('afterRender', () => {
      this.calculateVisibleItems(sanitizedIndex);
      this.$().scrollTop(sanitizedPadding);
    });
  }),

  didReceiveAttrs() {
    this._super(...arguments);

    RSVP.cast(this.getAttr('items')).then((attrItems) => {
      const items = emberArray(attrItems);

      this.setProperties({
        _items: items,
        _positionIndex: this.getAttr('positionIndex'),
        _totalHeight: Math.max(get(items, 'length') * this.getAttr('itemHeight'), 0)
      });
    });
  },

  willDestroyElement() {
    this._super(...arguments);
    run.cancel(this.scheduledRender);
  }
});

VirtualEachComponent.reopenClass({
  positionalParams: ['items']
});

export default VirtualEachComponent;
