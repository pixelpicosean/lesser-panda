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

  describe('.scale', function() {
    it('should multiply both x and y with param if it\'s a number', function() {
      a.set(1, 1);
      a.scale(2);
      expect(a.x).toBe(1 * 2);
      expect(a.y).toBe(1 * 2);
    });

    it('should multiply x with the first param and y with the second if both of them are numbers', function() {
      a.set(1, 1);
      a.scale(2, 3);
      expect(a.x).toBe(1 * 2);
      expect(a.y).toBe(1 * 3);
    });

    it('should multiply self.x with value.x and self.y with value.y if param is a vector', function() {
      a.set(1, 1);
      b.set(2, 3);
      a.scale(b);
      expect(a.x).toBe(1 * b.x);
      expect(a.y).toBe(1 * b.y);
    });
  });

  describe('.divide', function() {
    it('should divide param by both x and y if it\'s a number', function() {
      a.set(2, 2);
      a.divide(2);
      expect(a.x).toBe(2 / 2);
      expect(a.y).toBe(2 / 2);
    });

    it('should divide first param by x and second by y if both of them are numbers', function() {
      a.set(4, 9);
      a.divide(2, 3);
      expect(a.x).toBe(4 / 2);
      expect(a.y).toBe(9 / 3);
    });

    it('should divide x by self.x and y by self.y if it\'s a vector', function() {
      a.set(12, 32);
      b.set(3, 8);
      a.divide(b);
      expect(a.x).toBe(12 / b.x);
      expect(a.y).toBe(32 / b.y);
    });
  });

  describe('.distance', function() {
    it('should return distance from self to the target vector', function() {
      a.set(2, 2);
      b.set(0, 2);
      expect(a.distance(b)).toBe(2);
    });
  });

  describe('.length', function() {
    it('should return self\'s length', function() {
      a.set(0, 4);
      expect(a.length()).toBe(4);
    });
  });

  describe('.dot', function() {
    it('should return 0 as the dot product of (1, 0) and (0, 1)', function() {
      a.set(1, 0);
      b.set(0, 1);
      expect(a.dot(b)).toBe(0);
    });
    it('should return 1 as the dot product of (1, 0) and (1, 0)', function() {
      a.set(1, 0);
      b.set(1, 0);
      expect(a.dot(b)).toBe(1);
    });
  });

  describe('.dotNormalized', function() {
    it('should return number not greater than 1 since the dot product of (1, 1) and (1, 1) is noramlized', function() {
      a.set(1, 1);
      expect(a.dotNormalized(a)).toBeCloseTo(1);
      expect(a.dotNormalized(a)).not.toBeGreaterThan(1);
    });
  });

  describe('.rotate', function() {
    it('should rotate a vector', function() {
      a.set(1, 0);
      a.rotate(Math.PI);
      expect(a.x).toBeCloseTo(-1);
      expect(a.y).toBeCloseTo(0);

      a.set(1, 0);
      a.rotate(Math.PI * 0.5);
      expect(a.x).toBeCloseTo(0);
      expect(a.y).toBeCloseTo(1);
    });
  });

});
