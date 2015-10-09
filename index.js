const TextInput = require('text-input')
const {JSX} = require('mana')

const geocoder = new google.maps.Geocoder()
const autocomplete = new google.maps.places.AutocompleteService()
const LatLng = google.maps.LatLng

const getLocation = options =>
  new Promise((success, fail) => {
    geocoder.geocode(options, (results, status) => {
      if (status != google.maps.GeocoderStatus.OK) return fail()
      const location = results[0].geometry.location
      success({lat: location.lat(), lng: location.lng()})
    })
  })

/**
 * A nice UI for entering a place
 *
 * @param {Object} params
 *   @attr {Cursor} cursor
 *   @attr {Number} [radius]  affects the weighting towards local results
 *   @attr {Object} [center]  results are weighted towards this point
 *   @attr {String} [country] limit results to a certain country
 * @return {VirtualElement}
 */

const PlaceInput = ({cursor,
                     locationᶜ,
                     radius=0,
                     placeholder='Which place?',
                     center={lat:0,lng:0},
                     autofocus=false,
                     types=[],
                     country,
                     ...rest}) => {
  var items = cursor.value.get('suggestions') || []
  var activeIndex = Math.min(cursor.value.get('activeIndex', -1), items.length - 1)
  var interestedᶜ = cursor.get('userInterested')
  var activeItem = activeIndex >= 0
    ? items[activeIndex]
    : {description:cursor.value.get('input') || ''}
  locationᶜ = locationᶜ || cursor.get('location')

  var onKeyDown = (event, _, dom) => {
    if (event.which == 40/*down*/ || event.which == 38/*up*/) {
      event.preventDefault()
      if (!interestedᶜ.value) return
      activeIndex = event.which == 40/*down*/
        ? Math.min(activeIndex + 1, items.length - 1)
        : Math.max(activeIndex - 1, -1)
      cursor.set('activeIndex', activeIndex)
    }
    else if (event.which == 13/*enter*/) {
      event.preventDefault()
      if (!interestedᶜ.value) return interestedᶜ.value = true
      var item = items[activeIndex]
      if (item) return select(item, cursor, locationᶜ)
      interestedᶜ.value = false
      locationᶜ.value = getLocation({address:cursor.value.get('input')})
    }
    else if (event.which == 27/*esc*/) dom.blur()
    else if (!interestedᶜ.value) interestedᶜ.value = true
  }

  const updateSuggestions = input => {
    cursor.set('activeIndex', -1)
    var onResults = results => cursor.set('suggestions', results)
    if (!input) return onResults([])
    autocomplete.getPlacePredictions({
      location: new LatLng(center.lat, center.lng),
      componentRestrictions: country && {country},
      input,
      radius,
      types
    }, onResults)
  }

  const onMousedown = (event, {params:{data}}) => {
    event.preventDefault()
    select(data, cursor, locationᶜ)
  }

  return <div class='place-input' {...rest}>
    <TextInput cursor={cursor.get('input')}
               value={activeItem.description}
               placeholder={placeholder}
               onKeyDown={onKeyDown}
               autofocus={autofocus}
               onChange={updateSuggestions}
               onFocus={() => interestedᶜ.value = true}
               onBlur={() => interestedᶜ.value = false} />
    <ul class={{hidden: !interestedᶜ.value || !items.length}}>
      {items.map((suggestion, index) =>
        <Item class={{active: index == activeIndex}}
              data={suggestion}
              onMousedown
              index/>
      )}
    </ul>
  </div>
}

const select = ({description,place_id}, cursor, locationᶜ) => {
  locationᶜ.value = getLocation({placeId: place_id})
  cursor.merge({userInterested: false, input: description, activeIndex: -1})
}

const addTerm = (terms, {value}) => {
  if (terms.length) terms.push(<span class="comma">,</span>)
  terms.push(<span class="term"> {value}</span>)
  return terms
}

const Item = ({data, ...rest}) =>
  <li data class={data.types.join(' ')}>
    {data.terms.reduce(addTerm, [])}
  </li>.mergeParams(rest)

export default PlaceInput
