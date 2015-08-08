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
 *   @attr {Number} [radius=0]                affects the weighting towards local results
 *   @attr {Object} [location={lat:0,lng:0}]  results are weighted towards this point
 *   @attr {String} [country='earth']         limit results to a certain country
 * @return {VirtualElement}
 */

const PlaceInput = params => {
  var {cursor,placeholder,radius=0,location={lat:0,lng:0},country} = params
  var items = cursor.value.get('suggestions') || []
  var activeIndex = Math.min(cursor.value.get('activeIndex', -1), items.length - 1)
  var interestedᶜ = cursor.get('userInterested')
  var activeItem = activeIndex >= 0
    ? items[activeIndex]
    : {description:cursor.value.get('input') || ''}

  var onKeyDown = (event, {dom}) => {
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
      var item = items[activeIndex]
      if (item) return select(item, cursor)
      cursor.merge({
        location: getLocation({address:cursor.value.get('input')}),
        userInterested: false
      })
    }
    else if (event.which == 27/*esc*/) dom.blur()
    else interestedᶜ.value || interestedᶜ.update(true)
  }

  const updateSuggestions = input => {
    var onResults = results => cursor.set('suggestions', results)
    if (!input) return onResults([])
    autocomplete.getPlacePredictions({
      input: input,
      location: new LatLng(location.lat, location.lng),
      radius: radius,
      types: ['geocode'],
      componentRestrictions: country && {country}
    }, onResults)
  }

  return <div class='place-input'>
    <TextInput cursor={cursor.get('input')}
               value={activeItem.description}
               placeholder={placeholder || 'Which place?'}
               onKeyDown={onKeyDown}
               onChange={updateSuggestions}
               onFocus={() => interestedᶜ.update(true)}
               onBlur={() => interestedᶜ.update(false)} />
    <ul class={{hidden: !interestedᶜ.value || !items.length}}>
      {items.map((suggestion, i) =>
        <Item active={i == activeIndex} index={i} data={suggestion} cursor={cursor}/>
      )}
    </ul>
  </div>
}

const select = ({description,place_id}, cursor) =>
  cursor.merge({
    location: getLocation({placeId: place_id}),
    userInterested: false,
    input: description,
    activeIndex: -1
  })

const onMousedown = (event, {params:{data,cursor}}) => {
  event.preventDefault()
  select(data, cursor)
}

const addTerm = (terms, {value}) => {
  if (terms.length) terms.push(<span class='comma'>,</span>)
  terms.push(<span class='term'>{value}</span>)
  return terms
}

const Item = params => {
  const {active,data:{types,terms}} = params
  return <li class={(active ? types.concat('active') : types).join(' ')}
             onMousedown={onMousedown}>
    {terms.reduce(addTerm, [])}
  </li>.mergeParams(params)
}

export default PlaceInput
