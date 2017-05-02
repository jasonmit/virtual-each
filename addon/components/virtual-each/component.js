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
  setProperties,
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
  isWebkit: /WebKit/.test(navigator && navigator.userAgent),

  defaultAttrs: {
    height: 200,
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
        this._scrollThrottleTimeut = run.throttle(this, this.calculateVisibleItems, scrollTimeout);
        return;
      }

      this.calculateVisibleItems();
    }
  },

  bufferSize: computed('rowPadding', function() {
    return get(this, 'rowPadding') || 1;
  }),

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

  visibleItems: computed('_startAt', '_itemCount', '_items.[]', 'bufferSize', {
    get() {
      let { _items, _startAt, _itemCount } = getProperties(this, '_items', '_startAt', '_itemCount');
      let bufferSize = get(this, 'bufferSize');
      let itemsLength = get(_items, 'length');
      let endAt = Math.min(itemsLength, _startAt + _itemCount);
      let { onScrollBottomed } = this.attrs;

      if (typeof onScrollBottomed === 'function' && (_startAt + _itemCount - bufferSize) >= itemsLength) {
        this._scrollBottomedTimeout = run.later(() => onScrollBottomed(_startAt, endAt), 5);
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

  _itemCount: computed('height', 'itemHeight', 'bufferSize', {
    get() {
      let height = this.getAttr('height');
      let bufferSize = get(this, 'bufferSize');

      return Math.ceil(height / this.getAttr('itemHeight')) + bufferSize;
    }
  }).readOnly(),

  _marginTop: computed('_totalHeight', '_startAt', '_itemCount', 'itemHeight', 'bufferSize', {
    get() {
      let bufferSize = get(this, 'bufferSize');
      let itemHeight = this.getAttr('itemHeight');
      let totalHeight = get(this, '_totalHeight');
      let margin = get(this, '_startAt') * itemHeight;
      let visibleItemCount = get(this, '_itemCount');
      let maxMargin = Math.max(0, totalHeight - ((visibleItemCount - 1) * itemHeight) + (bufferSize * itemHeight));

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

    setProperties(this, {
      _items: emberArray(),
      _startAt: 0,
      _totalHeight: 0,
      _scrolledByWheel: false
    });
  },

  calculateVisibleItems(positionIndex) {
    if (this.get('isDestroyed')) {
      return;
    }

    let startAt = get(this, '_startAt');
    let scrolledAmount = this.element.scrollTop;
    let visibleStart = isNaN(positionIndex) ? Math.floor(scrolledAmount / this.getAttr('itemHeight')) : positionIndex;

    if (visibleStart !== startAt) {
      set(this, '_startAt', visibleStart);
    }
  },

  scrollTo: observer('_positionIndex', function() {
    let bufferSize = get(this, 'bufferSize');
    let positionIndex = get(this, '_positionIndex');
    let itemHeight = this.getAttr('itemHeight');
    let totalHeight = get(this, '_totalHeight');
    let _itemCount = get(this, '_itemCount');
    let startingIndex = isNaN(positionIndex) ? get(this, '_startAt') : Math.max(positionIndex, 0);
    let startingPadding = itemHeight * startingIndex;
    let maxVisibleItemTop = Math.max(0, (get(this, '_items.length') - _itemCount + bufferSize));
    let maxPadding = Math.max(0, totalHeight - ((_itemCount - 1) * itemHeight) + (bufferSize * itemHeight));
    let sanitizedIndex = Math.min(startingIndex, maxVisibleItemTop);
    let sanitizedPadding = (startingPadding > maxPadding) ? maxPadding : startingPadding;

    this.scheduledRender = run.scheduleOnce('afterRender', () => {
      this.calculateVisibleItems(sanitizedIndex);
      this.element.scrollTop = sanitizedPadding;
    });
  }),

  didReceiveAttrs() {
    this._super(...arguments);

    RSVP.cast(this.getAttr('items')).then((attrItems) => {
      let items = emberArray(attrItems);

      setProperties(this, {
        _items: items,
        _positionIndex: this.getAttr('positionIndex'),
        _totalHeight: Math.max(get(items, 'length') * this.getAttr('itemHeight'), 0)
      });
    });
  },

  willDestroyElement() {
    this._super(...arguments);

    run.cancel(this.scheduledRender);
    run.cancel(this._scrollThrottleTimeut);
    run.cancel(this._scrollBottomedTimeout);
  }
});

VirtualEachComponent.reopenClass({
  positionalParams: ['items']
});

export default VirtualEachComponent;
