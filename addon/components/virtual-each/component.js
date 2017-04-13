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
  getProperties,
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
      let height = escapeExpression(this.getAttr('height'));

      return htmlSafe(`height: ${height}px;`);
    }
  }).readOnly(),

  contentStyle: computed('_marginTop', '_contentHeight', {
    get() {
      let marginTop = escapeExpression(get(this, '_marginTop'));
      let height = escapeExpression(get(this, '_contentHeight'));

      return htmlSafe(`height: ${height}px; margin-top: ${marginTop}px;`);
    }
  }).readOnly(),

  visibleItems: computed('_startAt', '_visibleItemCount', '_items.[]', 'rowPadding', {
    get() {
      let { _items, _startAt, _visibleItemCount } = getProperties(this, '_items', '_startAt', '_visibleItemCount');
      let rowPadding = this.getAttr('rowPadding');
      let itemsLength = get(_items, 'length');
      let endAt = Math.min(itemsLength, _startAt + _visibleItemCount);
      let { onScrollBottomed } = this.attrs;

      if (typeof onScrollBottomed === 'function' && (_startAt + _visibleItemCount - rowPadding) >= itemsLength) {
        setTimeout(() => onScrollBottomed(_startAt, endAt), 5);
      }

      return _items.slice(_startAt, endAt).map((item, index) => {
        return {
          raw: item,
          actualIndex: _startAt + index,
          virtualIndex: index
        };
      });
    }
  }).readOnly(),

  _visibleItemCount: computed('height', 'itemHeight', 'rowPadding', {
    get() {
      let height = this.getAttr('height');
      let rowPadding = this.getAttr('rowPadding');

      return Math.ceil(height / this.getAttr('itemHeight')) + rowPadding;
    }
  }).readOnly(),

  _marginTop: computed('_totalHeight', '_startAt', '_visibleItemCount', 'itemHeight', 'rowPadding', {
    get() {
      let rowPadding = this.getAttr('rowPadding');
      let itemHeight = this.getAttr('itemHeight');
      let totalHeight = get(this, '_totalHeight');
      let margin = get(this, '_startAt') * itemHeight;
      let visibleItemCount = get(this, '_visibleItemCount');
      let maxMargin = Math.max(0, totalHeight - ((visibleItemCount - 1) * itemHeight) + (rowPadding * itemHeight));

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

    let { userAgent:ua } = navigator || {};

    this.isWebkit = /WebKit/.test(ua);
  },

  calculateVisibleItems(positionIndex) {
    run(() => {
      let startAt = get(this, '_startAt');
      let scrolledAmount = this.$().scrollTop();
      let visibleStart = isNaN(positionIndex) ? Math.floor(scrolledAmount / this.getAttr('itemHeight')) : positionIndex;

      if (visibleStart !== startAt) {
        set(this, '_startAt', visibleStart);
      }
    });
  },

  scrollTo: observer('_positionIndex', function() {
    let rowPadding = this.getAttr('rowPadding');
    let positionIndex = get(this, '_positionIndex');
    let itemHeight = this.getAttr('itemHeight');
    let totalHeight = get(this, '_totalHeight');
    let _visibleItemCount = get(this, '_visibleItemCount');
    let startingIndex = isNaN(positionIndex) ? get(this, '_startAt') : Math.max(positionIndex, 0);
    let startingPadding = itemHeight * startingIndex;
    let maxVisibleItemTop = Math.max(0, (get(this, '_items.length') - _visibleItemCount + rowPadding));
    let maxPadding = Math.max(0, totalHeight - ((_visibleItemCount - 1) * itemHeight) + (rowPadding * itemHeight));
    let sanitizedIndex = Math.min(startingIndex, maxVisibleItemTop);
    let sanitizedPadding = (startingPadding > maxPadding) ? maxPadding : startingPadding;

    this.scheduledRender = run.scheduleOnce('afterRender', () => {
      this.calculateVisibleItems(sanitizedIndex);
      this.$().scrollTop(sanitizedPadding);
    });
  }),

  didReceiveAttrs() {
    this._super(...arguments);

    RSVP.cast(this.getAttr('items')).then((attrItems) => {
      let items = emberArray(attrItems);

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
