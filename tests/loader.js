describe('Loader', function() {

  describe('.isSpriteAtlas', function() {
    it('should return true if name of a resource is end with "json_image"', function() {
      expect(game.Loader.isSpriteAtlas({ name: 'sprites.json_image' }))
        .toBe(true);
    });
  });

});
