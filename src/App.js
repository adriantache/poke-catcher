import React, { Component } from 'react'
import './App.css'
import catchAll from './assets/catchall.png'
import Pokemon from './Pokemon'

const URL = 'https://pokeapi.co/api/v2/pokemon/'
const API_DELAY = 60000
//delay between pokemons are displayed on screen
const DISPLAY_DELAY = 500
//we could slightly increase this to mask the API limit:
// const DISPLAY_DELAY = API_DELAY/99
const NUM_POKEMONS = 151

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      wildPoke: [],
      caughtPoke: [],
      catchAll: false
    }
  }

  componentDidMount() {
    this.pokemons = new Map()
    this.displayed = new Set()
    this.caught = new Set()
    this.catchAll = new Set()

    //get pokemon details from API
    this.fetchPokemons(1, 99)
    //fetch again after 60 seconds due to API limit (100 requests per minute)
    setTimeout(() => this.fetchPokemons(100, NUM_POKEMONS), API_DELAY)

    //start pokemon display loop
    this.interval = setInterval(this.displayPokemons, DISPLAY_DELAY)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  fetchPokemons = async (start, end) => {
    for (let i = start; i < end + 1; i++) {
      try {
        const response = await this.fetchUrl(URL + i)

        const id = response.id
        const name = response.name
        const type = response.types[0].type.name
        const sprite = response.sprites.front_default

        //retry on error
        if (!name || !type || !sprite) this.fetchPokemons(i, i)
        else {
          //add it to the map using id as key
          this.pokemons.set(id, new Pokemon(name, type, sprite))
          //preload its thumbnail to ensure it's cached
          this.preloadImage(sprite)
        }
      } catch (e) {
        console.warn(e.message)
      }
    }
  }

  fetchUrl = async url => {
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error("Error " + response.code)

        return response.json()
      })
      .catch(error => console.warn(error.message))
  }

  preloadImage = url => {
    const img = new Image()
    img.src = url
  }

  displayPokemons = () => {
    if (!this.pokemons.size) return

    //get available pokemons which are not displayed
    let values = this.getAvailable()

    if (!values.length) return

    //get a random available pokemon
    let randomKey = this.getRandom(values.length) - 1
    let id = values[randomKey]

    //then add it to list of displayed pokemons
    this.displayed.add(id)
    this.displayed = this.sortSet(this.displayed)
    this.drawPokemons()

    //if all pokemons are caught, stop the interval
    if (this.displayed.size === NUM_POKEMONS) clearInterval(this.interval)
  }

  //returns array of available pokemon ids (not displayed and not caught)
  getAvailable = () => {
    let values = []
    let iterator = this.pokemons.keys()
    let key = iterator.next().value
    while (key !== undefined) {
      if (!this.displayed.has(key) && !this.caught.has(key)) values.push(key)
      key = iterator.next().value
    }

    return values
  }

  //returns random number between 1 and max
  getRandom = max => {
    return Math.floor(Math.random() * max) + 1
  }

  sortSet = set => {
    return new Set(
      Array.from(set)
        .sort((a, b) => {
          return parseInt(a) - parseInt(b)
        })
    )
  }

  //turn pokemon details into JSX
  drawPokemons = () => {
    if (!this.displayed.size) return

    let wildPoke = []

    this.displayed.forEach((key) => {
      const element = this.pokemons.get(key)

      wildPoke.push(
        <img src={element.getSprite()} alt={element.getName()} onClick={() => this.clickDisplayed(key)} key={key} />
      )
    })

    this.setState({ wildPoke })
  }

  //turn pokemon details into JSX
  drawCaughtPokemons = () => {
    let caughtPoke = []

    this.caught.forEach(key => {
      const element = this.pokemons.get(key)

      caughtPoke.push(
        <div className="pokeFrame" key={key} onClick={() => this.clickCaught(key)}>
          <div className="pokePic">
            <img src={element.getSprite()} alt={element.getName()} />
          </div>
          <div className="pokeDetails">
            <p>Id: </p>
            <p>Name: </p>
            <p>Type: </p>
          </div>
          <div className="pokeDetails">
            <p>{key}</p>
            <p>{element.getName()}</p>
            <p>{element.getType()}</p>
          </div>
        </div>
      )
    })

    this.setState({ caughtPoke })
  }

  //click handler for displayed pokemon
  clickDisplayed = id => {
    if (this.caught.size === 6) return

    //add it to the caught map and delete it from the displayed map
    this.caught.add(id)
    this.caught = this.sortSet(this.caught)
    this.displayed.delete(id)

    //redraw both groups
    this.drawPokemons()
    this.drawCaughtPokemons()

    //easter egg
    this.catchAll.add(id)
    if (this.catchAll.size === NUM_POKEMONS) this.setState({ catchAll: true })
  }

  //click handler for caught pokemon
  clickCaught = id => {
    //add it to the displayed map and delete it from the caught map
    this.displayed.add(id)
    this.displayed = this.sortSet(this.displayed)
    this.caught.delete(id)

    //redraw both groups
    this.drawPokemons()
    this.drawCaughtPokemons()
  }

  render() {
    return (
      <div className="container">
        <div className="columnLeft">
          <h3>Wild Pokémons</h3>
          <div className="pokemonListLeft">
            {this.state.wildPoke}
          </div>
        </div>

        <div className="columnRight">
          <h3>Caught Pokémons</h3>
          <div className="pokemonListRight">
            {this.state.catchAll &&
              <div>
                <img src={catchAll} alt="Gotta catch 'em all!" style={{ width: 384 }} />
              </div>}
            {this.state.caughtPoke}
          </div>
        </div>
      </div>
    )
  }
}

export default App
