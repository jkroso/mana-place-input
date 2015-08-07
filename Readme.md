# Place-input

A nice UI component for users to input a place name with autocompletion provided by google. The UX mirrors googles own place inputs so it should feel the same to users. Therefore, this module is purely for your benefit. It provides an idiomatic Mana API and cleaner CSS

[Live Demo](http://jkroso.github.io/mana-place-input)

## Installation

`npm install --save jkroso/mana-place-input`

You will also need to have google maps API loaded with the places extension though eventually this module may find a way to load it automatically for you. PR's welcome.

```html
<script src="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places"></script>
```

then in your app:

```js
var PlaceInput = require('place-input')
```

## API

See the [example](example.html) and documentation in the [source](index.js)
