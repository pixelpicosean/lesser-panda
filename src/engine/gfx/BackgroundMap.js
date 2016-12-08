const Node = require('./core/Node');
const Sprite = require('./core/sprites/Sprite');
const Texture = require('./core/textures/Texture');
const { textureFromData } = require('./utils');
const { filmstrip } = require('./utils');

const TILESETS = {};
const POOL = [];

/**
 * Tilemap node
 */
class BackgroundMap extends Node {
  /**
   * @constructor
   * @param  {Number} tilesize  Size of a single tile(in pixel)
   * @param  {Array} data       Map ata
   * @param  {Texture} tileset  Tileset texture
   */
  constructor(tilesize, data, tileset) {
    super();

    if (!Number.isFinite(tilesize) || tilesize <= 0) {
      console.log('Invalid tilesize!');
      return;
    }
    if (!Array.isArray(data) || (data.length === 0) || !Array.isArray(data[0])) {
      console.log('Invalid data format!');
      return;
    }
    if (!tileset || !(tileset instanceof Texture)) {
      console.log('Invalid tileset!');
      return;
    }

    this.tilesize = tilesize;
    this.data = data;
    this.tileset = tileset;
    this.tilesetTextures = null;
    this.tileSprites = null;

    this._width = data[0].length;
    this._height = data.length;

    this.parseTileset();
    this.drawTiles();
  }

  /**
   * Width of this map (in tile)
   * @readonly
   */
  get width() {
    return this._width;
  }
  /**
   * Height of this map (in tile)
   * @readonly
   */
  get height() {
    return this._height;
  }

  /**
   * Get the tile with its row and column
   * @param  {Number} r Row
   * @param  {Number} q Column
   * @return {Number}   Tile index
   */
  getTile(r, q) {
    return (q >= 0 && q < this._width && r >= 0 && r < this._height) ? this.data[r][q] : 0;
  }
  /**
   * Get the tile at a specific position
   * @param  {Number} x X position
   * @param  {Number} y Y position
   * @return {Number}   Tile index
   */
  getTileAt(x, y) {
    const q = Math.floor(x / this.tilesize);
    const r = Math.floor(y / this.tilesize);

    return (q >= 0 && q < this._width && r >= 0 && r < this._height) ? this.data[r][q] : 0;
  }

  /**
   * Set the tile at (row, column)
   * @param {Number} r    Row
   * @param {Number} q    Column
   * @param {Number} tile Tile index to set
   */
  setTile(r, q, tile) {
    if (q >= 0 && q < this._width && r >= 0 && r < this._height) {
      this.data[r][q] = tile;

      if (tile > 0) {
        this.tileSprites[r][q].visible = true;
        this.tileSprites[r][q].texture = this.tilesetTextures[tile - 1];
      }
      else {
        this.tileSprites[r][q].visible = false;
      }
    }
  }
  /**
   * Set the tile at a specific position
   * @param {Number} x    X position
   * @param {Number} y    Y position
   * @param {Number} tile Tile index
   */
  setTileAt(x, y, tile) {
    const q = Math.floor(x / this.tilesize);
    const r = Math.floor(y / this.tilesize);
    if (q >= 0 && q < this._width && r >= 0 && r < this._height) {
      this.data[r][q] = tile;

      if (tile > 0) {
        this.tileSprites[r][q].visible = true;
        this.tileSprites[r][q].texture = this.tilesetTextures[tile - 1];
      }
      else {
        this.tileSprites[r][q].visible = false;
      }
    }
  }

  /**
   * Parse the tileset of this map
   * @private
   */
  parseTileset() {
    let tileList;

    let uid = this.tileset.baseTexture.uid;
    if (TILESETS.hasOwnProperty(uid) && Array.isArray(TILESETS[uid])) {
      tileList = TILESETS[uid];
    }
    else {
      tileList = filmstrip(this.tileset, this.tilesize, this.tilesize);
      TILESETS[uid] = tileList;
    }

    this.tilesetTextures = tileList;
  }

  /**
   * Draw tiles of this map
   * @private
   */
  drawTiles() {
    // Draw nothing if tileset is invalid
    if (!this.tileset || !this.tilesetTextures || this.tilesetTextures.length === 0) {
      return;
    }

    // Create sprites to draw the map
    this.createTileSprites();

    // Update texture of each tile
    let q, r, tile, idx;
    for (r = 0; r < this._height; r++) {
      for (q = 0; q < this._width; q++) {
        idx = this.data[r][q] - 1;
        tile = this.tileSprites[r][q];

        if (idx < 0) {
          tile.visible = false;
        }
        else {
          tile.visible = true;
          tile.texture = this.tilesetTextures[idx];
        }
      }
    }
  }

  /**
   * Create sprites for drawing
   * @private
   */
  createTileSprites() {
    this.tileSprites = new Array(this._height);

    // Insert tiles to fit map size
    let q, r, tile, row;
    for (r = 0; r < this._height; r++) {
      row = new Array(this._width);

      for (q = 0; q < this._width; q++) {
        tile = POOL.pop();
        if (!tile) {
          tile = new Sprite();
        }
        tile.position.set(q * this.tilesize, r * this.tilesize);
        this.addChild(tile);

        row[q] = tile;
      }

      this.tileSprites[r] = row;
    }
  }
}

/**
 * BackgroundMap factory
 * @param  {Number} tilesize Size of a single tile
 * @param  {Array}  data     Map data
 * @param  {Texture} tileset Tileset texture
 * @return {BackgroundMap}   BackgroundMap instance
 */
module.exports = function(tilesize = 8, data = [[]], tileset = null) {
  return new BackgroundMap(tilesize, data, textureFromData(tileset));
};
