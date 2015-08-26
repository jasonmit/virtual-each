# virtual-each

A direct port of react-infinite-list to Ember.  This was created as a benchmark exercise.

If you want a more flexible, feature-complete, virtualized list/grid component, please see [ember-collection](https://github.com/emberjs/ember-collection).

## Usage

```hbs
{{#virtual-each
  height=200
  itemHeight=36
  items=items as |item|
}}
  <div class="person-row">
    <img src={{item.picture}} />
    <div>
      <div>{{item.name.last}}, {{item.name.first}}</div>
      <div class="company">{{item.company}}</div>
    </div>
  </div>
{{/virtual-each}}
```

## CSS

Add the following CSS snippet to `styles/app.css`:

```css
.virtual-each {
  overflow-y: auto;
}

.infinite-list-content {
  list-style: none;
  margin: 0;
  padding: 0;
}
```

## Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`
