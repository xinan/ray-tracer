var Vector = {};

// Constants
Vector.UP = { x: 0, y: 1, z: 0 };
var VECTOR_UP = [0, 1, 0];

Vector.ZERO = { x: 0, y: 0, z: 0 };
var VECTOR_ZERO = [0, 0, 0];

Vector.WHITE = { x: 255, y: 255, z: 255 };
var VECTOR_WHITE = [255, 255, 255];

Vector.createZero = function() {
  return { x: 0, y: 0, z: 0 };
};
function createOrigin() {
  return [0, 0, 0];
}

// Operations
Vector.dotProduct = function(a, b) {
  return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
};
function dotProduct(a, b) {
  return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}

Vector.crossProduct = function(a, b) {
  return {
    x: (a.y * b.z) - (a.z * b.y),
    y: (a.z * b.x) - (a.x * b.z),
    z: (a.x * b.y) - (a.y * b.x)
  };
};
function crossProduct(a, b) {
  return [
    (a[1] * b[2]) - (a[2] * b[1]),
    (a[2] * b[0]) - (a[0] * b[2]),
    (a[0] * b[1]) - (a[1] * b[0])
  ];
}

Vector.scale = function(a, t) {
  return {
    x: a.x * t,
    y: a.y * t,
    z: a.z * t
  }
};
function scale(a, t) {
  return [
    a[0] * t,
    a[1] * t,
    a[2] * t
  ];
}

Vector.length = function(a) {
  return Math.sqrt(Vector.dotProduct(a, a));
};
function length(a) {
  return Math.sqrt(dotProduct(a, a));
}

Vector.unitVector = function(a) {
  return Vector.scale(a, 1 / Vector.length(a));
};
function normalize(a) {
  return scale(a, 1 / length(a));
}

Vector.add = function(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  }
};
function add(a, b) {
  return [
    a[0] + b[0],
    a[1] + b[1],
    a[2] + b[2]
  ];
}

Vector.add3 = function(a, b, c) {
  return {
    x: a.x + b.x + c.x,
    y: a.y + b.y + c.y,
    z: a.z + b.z + c.z
  };
};
function add3(a, b, c) {
  return [
    a[0] + b[0] + c[0],
    a[1] + b[1] + c[1],
    a[2] + b[2] + c[2]
  ];
}

Vector.subtract = function(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
};
function subtract(a, b) {
  return [
    a[0] - b[0],
    a[1] - b[1],
    a[2] - b[2]
  ];
}

Vector.reflectThrough = function(a, normal) {
  var d = Vector.scale(normal, Vector.dotProduct(a, normal));
  return Vector.subtract(Vector.scale(d, 2), a);
};
function reflectThrough(a, normal) {
  var d = scale(normal, dotProduct(a, normal));
  return subtract(scale(d, 2), a);
}
