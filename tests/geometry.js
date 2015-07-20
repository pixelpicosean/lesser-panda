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

  describe('.add', function() {
    it('should add param to both x and y if it\'s a number', function() {
      a.set(1, 1);
      a.add(2);
      expect(a.x).toBe(1 + 2);
      expect(a.y).toBe(1 + 2);
    });

    it('should add first param to x and second to y if both of them are numbers', function() {
      a.set(1, 1);
      a.add(2, 3);
      expect(a.x).toBe(1 + 2);
      expect(a.y).toBe(1 + 3);
    });

    it('should add param.x to self.x and param.y to self.y if it\'s a vector', function() {
      a.set(1, 1);
      b.set(2, 3);
      a.add(b);
      expect(a.x).toBe(1 + b.x);
      expect(a.y).toBe(1 + b.y);
    });
  });

  describe('.subtract', function() {
    it('should subtract param from both x and y if it\'s a number', function() {
      a.set(1, 1);
      a.subtract(2);
      expect(a.x).toBe(1 - 2);
      expect(a.y).toBe(1 - 2);
    });

    it('should subtract first param from x and second from y if both of them are numbers', function() {
      a.set(1, 1);
      a.subtract(2, 3);
      expect(a.x).toBe(1 - 2);
      expect(a.y).toBe(1 - 3);
    });

    it('should subtract x from self.x and y from self.y if it\'s a vector', function() {
      a.set(1, 1);
      b.set(2, 3);
      a.subtract(b);
      expect(a.x).toBe(1 - b.x);
      expect(a.y).toBe(1 - b.y);
    });
  });

  describe('.multiply', function() {
    it('should multiply both x and y with param if it\'s a number', function() {
      a.set(1, 1);
      a.multiply(2);
      expect(a.x).toBe(1 * 2);
      expect(a.y).toBe(1 * 2);
    });

    it('should multiply x with the first param and y with the second if both of them are numbers', function() {
      a.set(1, 1);
      a.multiply(2, 3);
      expect(a.x).toBe(1 * 2);
      expect(a.y).toBe(1 * 3);
    });

    it('should multiply self.x with value.x and self.y with value.y if param is a vector', function() {
      a.set(1, 1);
      b.set(2, 3);
      a.multiply(b);
      expect(a.x).toBe(1 * b.x);
      expect(a.y).toBe(1 * b.y);
    });

    it('should be called "scale" instead', function() {
      expect('multiply').toBe('scale');
    });
  });

});
