/**
 * Collision map is a 2D tilemap specifically designed for collision.
 * All the `Entity` instances will trace against this map during update.
 *
 * @class
 */
class CollisionMap {
  /**
   * @constructor
   * @param  {Number} tilesize Tile size in pixel
   * @param  {Array} data      A 2D array representing the map.
   */
  constructor(tilesize, data) {
    if (!Number.isFinite(tilesize) || tilesize <= 0) {
      console.log('Invalid tilesize!');
      return;
    }
    if (!Array.isArray(data) || (data.length === 0) || !Array.isArray(data[0])) {
      console.log('Invalid data format!');
      return;
    }

    /**
     * Size of tiles in pixel
     * @type {Number}
     */
    this.tilesize = tilesize;
    /**
     * Map data as a 2D array
     * @type {Array}
     */
    this.data = data;

    this._width = data[0].length;
    this._height = data.length;
  }

  /**
   * Width of this map, in tile
   * @readonly
   */
  get width() {
    return this._width;
  }
  /**
   * Height of this map, in tile
   * @readonly
   */
  get height() {
    return this._height;
  }

  /**
   * Get the tile index with its row and column number
   * @param  {Number} r Row of this tile
   * @param  {Number} q Column of this tile
   * @return {Number}   Tile index
   */
  getTile(r, q) {
    return (q >= 0 && q < this._width && r >= 0 && r < this._height) ? this.data[r][q] : 0;
  }
  /**
   * Get the tile index at a specific position(in pixel)
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
   * Set the tile at the giving row and column
   * @param {Number} r    Row of this tile
   * @param {Number} q    Column of this tile
   * @param {Number} tile New tile index
   */
  setTile(r, q, tile) {
    if (q >= 0 && q < this._width && r >= 0 && r < this._height) {
      this.data[r][q] = tile;
    }
  }
  /**
   * Set the tile at a specific position
   * @param {Number} x    X position
   * @param {Number} y    Y position
   * @param {Number} tile New tile index
   */
  setTileAt(x, y, tile) {
    const q = Math.floor(x / this.tilesize);
    const r = Math.floor(y / this.tilesize);
    if (q >= 0 && q < this._width && r >= 0 && r < this._height) {
      this.data[r][q] = tile;
    }
  }

  /**
   * Trace a collider against this map.
   * @param  {Collider} coll  Collider object.
   * @param  {Number} sx      Movement on x-axis.
   * @param  {Number} sy      Movement on y-axis.
   * @param  {Object} res     Resolved movement result.
   */
  trace(coll, sx, sy, res) {
    // TODO: fast movement
    if (sx === 0 && sy === 0) {
      return;
    }

    // Set result as full movement
    res.x = sx;
    res.y = sy;
    res.hitX = res.hitY = false;

    let posi, leading, dir, start, end, tilespace, tilespaceEnd, done;
    let edgeVector, edge, tile;
    let i, j;

    // Check x-axis
    posi = sx > 0;
    leading = posi ? coll.right : coll.left;
    dir = posi ? 1 : -1;
    start = Math.floor(coll.top / this.tilesize);
    end = Math.ceil(coll.bottom / this.tilesize);
    tilespace = Math.floor(leading / this.tilesize);
    tilespaceEnd = Math.floor((leading + sx) / this.tilesize) + dir;
    done = false;

    for (i = tilespace; !done && i !== tilespaceEnd; i += dir) {
      // Out of map area
      if (i < 0 || i >= this._width) {
        continue;
      }

      for (j = start; j !== end; ++j) {
        // Out of map area
        if (j < 0 || j >= this._height) {
          continue;
        }

        tile = this.data[j][i];

        // Out of map area
        if (tile === undefined) {
          continue;
        }

        edge = ((dir > 0) ? i : (i + 1)) * this.tilesize;
        edgeVector = edge - leading;

        // if (oncollision(axis, tile, coords, dir, edgeVector)) {
        if (tile === 1) {
          res.x = edgeVector;
          res.hitX = true;
          done = true;
          break;
        }
      }
    }

    // Check y-axis
    posi = sy > 0;
    leading = posi ? coll.bottom : coll.top;
    dir = posi ? 1 : -1;
    start = Math.floor(coll.left / this.tilesize);
    end = Math.ceil(coll.right / this.tilesize);
    tilespace = Math.floor(leading / this.tilesize);
    tilespaceEnd = Math.floor((leading + sy) / this.tilesize) + dir;
    done = false;

    for (i = tilespace; !done && i !== tilespaceEnd; i += dir) {
      // Out of map area
      if (i < 0 || i >= this._height) {
        continue;
      }

      for (j = start; j !== end; ++j) {
        // Out of map area
        if (j < 0 || j >= this._width) {
          continue;
        }

        tile = this.data[i][j];

        // Out of map area
        if (tile === undefined) {
          continue;
        }

        edge = ((dir > 0) ? i : (i + 1)) * this.tilesize;
        edgeVector = edge - leading;

        // if (oncollision(axis, tile, coords, dir, edgeVector)) {
        if (tile === 1) {
          res.y = edgeVector;
          res.hitY = true;
          done = true;
          break;
        }
      }
    }
  }
}

/**
 * CollisionMap factory
 * @param  {Number} tilesize Tile size in pixel.
 * @param  {Array}  data     Map data as a 2D array.
 * @return {CollisionMap}    CollisionMap instance.
 */
module.exports = function(tilesize = 16, data = [[]]) {
  return new CollisionMap(tilesize, data);
};
