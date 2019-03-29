export default class Pokemon {
    constructor(name, type, sprite) {
        this.name = name
        this.type = type
        this.sprite = sprite
    }

    getName = () => { return this.name }
    getType = () => { return this.type }
    getSprite = () => { return this.sprite }
}