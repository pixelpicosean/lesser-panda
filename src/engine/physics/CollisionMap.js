class CollisionMap {
  constructor(tilesize, data) {
    if (!Number.isFinite(tilesize) || tilesize <= 0) {
      console.log('Invalid tilesize!');
      return;
    }
    if (!Array.isArray(data) || (data.length === 0) || !Array.isArray(data[0])) {
      console.log('Invalid data format!');
      return;
    }

    this.tilesize = tilesize;
    this.data = data;

    this._width = data[0].length;
    this._height = data.length;
  }

  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }

  getTile(r, q) {
    return (q >= 0 && q < this._width && r >= 0 && r < this._height) ? this.data[r][q] : 0;
  }
  getTileAt(x, y) {
    const q = Math.floor(x / this.tilesize);
    const r = Math.floor(y / this.tilesize);

    return (q >= 0 && q < this._width && r >= 0 && r < this._height) ? this.data[r][q] : 0;
  }

  setTile(r, q, tile) {
    if (q >= 0 && q < this._width && r >= 0 && r < this._height) {
      this.data[r][q] = tile;
    }
  }
  setTileAt(x, y, tile) {
    const q = Math.floor(x / this.tilesize);
    const r = Math.floor(y / this.tilesize);
    if (q >= 0 && q < this._width && r >= 0 && r < this._height) {
      this.data[r][q] = tile;
    }
  }

  trace(coll, sx, sy, res) {
    if (sx === 0 && sy === 0) {
      return;
    }

    res.x = sx;
    res.y = sy;

    let posi, leading, dir, start, end, tilespace, tilespace_end, done;
    let edge_vector, edge, tile;
    let i, j;

    posi = sx > 0;
    leading = coll[posi ? 'right' : 'left'];
    dir = posi ? 1 : -1;
    start = Math.floor(coll.top / this.tilesize);
    end = Math.ceil(coll.bottom / this.tilesize);
    tilespace = Math.floor(leading / this.tilesize);
    tilespace_end = Math.floor((leading + sx) / this.tilesize) + dir;
    done = false;

    // Check x-axis
    for (i = tilespace; !done && i !== tilespace_end; i += dir) {
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
        edge_vector = edge - leading;

        // if (oncollision(axis, tile, coords, dir, edge_vector)) {
        if (tile === 1) {
          res.x = edge_vector;
          done = true;
          break;
        }
      }
    }

    // Check y-axis
    posi = sy > 0;
    leading = coll[posi ? 'bottom' : 'top'];
    dir = posi ? 1 : -1;
    start = Math.floor(coll.left / this.tilesize);
    end = Math.ceil(coll.right / this.tilesize);
    tilespace = Math.floor(leading / this.tilesize);
    tilespace_end = Math.floor((leading + sy) / this.tilesize) + dir;
    done = false;

    for (i = tilespace; !done && i !== tilespace_end; i += dir) {
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
        edge_vector = edge - leading;

        // if (oncollision(axis, tile, coords, dir, edge_vector)) {
        if (tile === 1) {
          res.y = edge_vector;
          done = true;
          break;
        }
      }
    }
  }
}

module.exports = function(tilesize = 16, data = [[]]) {
  return new CollisionMap(tilesize, data);
};
