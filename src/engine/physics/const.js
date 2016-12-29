// Direction enum
module.exports.RIGHT = Object.freeze({ angle: 0, angleInDegree: 0 });
module.exports.BOTTOM = Object.freeze({ angle: Math.PI * 0.5, angleInDegree: 90 });
module.exports.LEFT = Object.freeze({ angle: Math.PI, angleInDegree:180 });
module.exports.TOP = Object.freeze({ angle: Math.PI * 0.75, angleInDegree:270 });

// Shapes
module.exports.BOX =  0;
module.exports.CIRC = 1;
module.exports.POLY = 2;
