var Vector = {};

// Constants
Vector.UP = { x: 0, y: 1, z: 0 };
Vector.ZERO = { x: 0, y: 0, z: 0 };
Vector.WHITE = { x: 255, y: 255, z: 255 };
Vector.createZero = function() {
  return { x: 0, y: 0, z: 0 };
};

// Operations
Vector.dotProduct = function(a, b) {
  return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
};

Vector.crossProduct = function(a, b) {
  return {
    x: (a.y * b.z) - (a.z * b.y),
    y: (a.z * b.x) - (a.x * b.z),
    z: (a.x * b.y) - (a.y * b.x)
  };
};

Vector.scale = function(a, t) {
  return {
    x: a.x * t,
    y: a.y * t,
    z: a.z * t
  }
};

Vector.length = function(a) {
  return Math.sqrt(Vector.dotProduct(a, a));
};

Vector.unitVector = function(a) {
  return Vector.scale(a, 1 / Vector.length(a));
};

Vector.add = function(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  }
};

Vector.add3 = function(a, b, c) {
  return {
    x: a.x + b.x + c.x,
    y: a.y + b.y + c.y,
    z: a.z + b.z + c.z
  };
};

Vector.subtract = function(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
};

Vector.reflectThrough = function(a, normal) {
  var d = Vector.scale(normal, Vector.dotProduct(a, normal));
  return Vector.subtract(Vector.scale(d, 2), a);
};
