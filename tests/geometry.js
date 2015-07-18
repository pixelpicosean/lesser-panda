describe('Vector', function() {

  var a, b;

  beforeEach(function() {
    a = new game.Vector();
    b = new game.Vector();
  });

  it('should has x and y properties', function() {
    expect(a.x).toBeDefined();
    expect(a.y).toBeDefined();
  });

});
