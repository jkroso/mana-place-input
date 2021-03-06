import TextInput from 'text-input'
import {style} from 'easy-style'
import {JSX} from 'mana'

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

const className = style({
  position: 'relative',
  '> input': {
    border: '1px solid rgb(190, 190, 190)',
    padding: '.5em 1em',
    outline: 'none',
    width: '100%',
    '&:focus': {borderColor: '#267dc0'}
  },
  '> ul': {
    position: 'absolute',
    width: '100%',
    maxHeight: '25em',
    padding: 0,
    margin: 0,
    background: '#fff',
    listStyle: 'none',
    transition: 'max-height 0.2s',
    '&.hidden': {
      overflowY: 'scroll',
      maxHeight: 0
    },
    '> li': {
      padding: '.5em .65em',
      cursor: 'pointer',
      '&:hover': {background: '#f5f5f5'},
      '&.active': {
        background: '#267dc0',
        color: '#fff',
        '&:hover': {background: '#ccc'}
      },
      '> span': {
        fontSize: '0.75em',
        opacity: 0.7,
        // hide first comma
        '&.comma:nth-of-type(2)': {display: 'none'},
        '&:first-child': {
          fontSize: '1em',
          opacity: 1
        }
      }
    }
  }
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
  var items = cursor.get('suggestions').value || []
  var activeIndex = Math.min(cursor.get('activeIndex').value, items.length - 1)
  var interestedᶜ = cursor.get('userInterested')
  var activeItem = activeIndex >= 0
    ? items[activeIndex]
    : {description:cursor.get('input').value || ''}
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

  return <div className>
    <TextInput cursor={cursor.get('input')}
               value={activeItem.description}
               placeholder={placeholder}
               onKeyDown={onKeyDown}
               autofocus={autofocus}
               onChange={updateSuggestions}
               onFocus={() => interestedᶜ.value = true}
               onBlur={() => interestedᶜ.value = false}/>
    <ul class={{hidden: !interestedᶜ.value || !items.length}}>
      {items.map((data, index) =>
        <Item class={{active: index == activeIndex}} data onMousedown index/>
      )}
    </ul>
  </div>.mergeParams(rest)
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
