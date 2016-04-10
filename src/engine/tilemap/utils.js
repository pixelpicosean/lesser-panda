module.exports = exports = {

  lift: function lift(arr, w, h) {
    var r, q, row, res = new Array(h);
    for (r = 0; r < h; r++) {
      row = new Array(w);
      for (q = 0; q < w; q++) {
        row[q] = arr[w * r + q];
      }
      res[r] = row;
    }
    return res;
  },

};
