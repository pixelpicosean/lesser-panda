const Container = require('./core/display/Container');
const Sprite = require('./core/sprites/Sprite');
const Texture = require('./core/textures/Texture');
const { textureFromData } = require('./utils');
const { filmstrip } = require('./utils');

const TILESETS = {};
const POOL = [];

class BackgroundMap extends Container {
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

  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }

  getTile(x, y) {
    const q = Math.floor(x / this.tilesize);
    const r = Math.floor(y / this.tilesize);

    return (q >= 0 && q < this._width && r >= 0 && r < this._height) ? this.data[r][q] : 0;
  }

  setTile(x, y, tile) {
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
        row[q] = tile;
        tile.position.set(q * this.tilesize, r * this.tilesize);
        this.addChild(tile);
      }
      this.tileSprites[r] = row;
    }
  }
}

module.exports = function({ tilesize = 8, data = [[]], tileset = null } = {}) {
  return new BackgroundMap(tilesize, data, textureFromData(tileset));
};
