describe('Vector', function() {

  var a, b;

  beforeEach(function() {
    a = new game.Vector();
    b = new game.Vector();
  });

  describe('create without any params', function() {
    it('its x and y value should be 0', function() {
      expect(a.x).toBe(0);
      expect(a.y).toBe(0);
    })
  });

  describe('.set', function() {
    it('with a single value, both of its x and y should be set to it', function () {
      a.set(10);

      expect(a.x).toBe(10);
      expect(a.y).toBe(10);
    });

    it('with two values, x should equal the first one and y should equal the second one', function () {
      a.set(1, 2);

      expect(a.x).toBe(1);
      expect(a.y).toBe(2);
    });
  });

  describe('.clone', function() {
    it('should return a different Vector object', function() {
      var c = a.clone();
      expect(c).not.toBe(a);
    });
    it('and the returned object should has the same value', function() {
      var c = a.clone();
      expect(c.x).toBe(a.x);
      expect(c.y).toBe(a.y);
    });
  });

  describe('.copy', function() {
    it('should set self\'s value to be the same of target', function() {
      a.set(8, 9);
      b.copy(a);
      expect(b.x).toBe(a.x);
      expect(b.y).toBe(a.y);
    });
  });

});
