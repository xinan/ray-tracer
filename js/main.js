var WIDTH = 640;
var HEIGHT = 480;

var eyeVector = normalize(subtract(camera[1], camera[0])),
    vpRight = normalize(crossProduct(eyeVector, VECTOR_UP)),
    vpUp = normalize(crossProduct(vpRight, eyeVector)),
    fovRadians = Math.PI * (camera[2][0] / 2) / 180,
    heightWidthRatio = HEIGHT / WIDTH,
    halfWidth = Math.tan(fovRadians),
    halfHeight = heightWidthRatio * halfWidth,
    cameraWidth = halfWidth * 2,
    cameraHeight = halfHeight * 2,
    pixelWidth = cameraWidth / (WIDTH - 1),
    pixelHeight = cameraHeight / (HEIGHT - 1);

var gpu = new GPU();

var options = {
  dimensions: [WIDTH, HEIGHT],
  debug: true,
  graphical: true,
  constants: {
    height: HEIGHT,
    width: WIDTH,
    lightCount: lights.length,
    objectCount: objects.length,
    eyeVectorX: eyeVector[0],
    eyeVectorY: eyeVector[1],
    eyeVectorZ: eyeVector[2],
    vpRightX: vpRight[0],
    vpRightY: vpRight[1],
    vpRightZ: vpRight[2],
    vpUpX: vpUp[0],
    vpUpY: vpUp[1],
    vpUpZ: vpUp[2],
    fovRadians: fovRadians,
    heightWidthRatio: heightWidthRatio,
    halfWidth: halfWidth,
    halfHeight: halfHeight,
    cameraWidth: cameraWidth,
    cameraHeight: cameraHeight,
    pixelWidth: pixelWidth,
    pixelHeight: pixelHeight
  },
  mode: 'cpu'
};

var kernel = gpu.createKernel(function(camera, lights, objects) {
  var x = this.thread.x;
  var y = this.constants.height - this.thread.y - 1;
  var Infinity = 99999999;
  var r = 0;
  var g = 0;
  var b = 0;
  var a = 0;
  var t;
  var POINT = 0;
  var VECTOR = 1;
  var COLOR = 1;
  var MISC = 2;
  var PIE = 3;
  var TYPE = 0;
  var RADIUS = 1;
  var SPECULAR = 0;
  var DIFFUSE = 1;
  var AMBIENT = 2;
  var X = 0;
  var Y = 1;
  var Z = 2;
  var R = 0;
  var G = 1;
  var B = 2;
  var tempX;
  var tempY;
  var tempZ;
  var temp;

  function dotProduct(ax, ay, az, bx, by, bz) {
    return ax * bx + ay * by + az * bz;
  }

  function length(ax, ay, az) {
    return Math.sqrt(ax * ax + ay * ay + az * az);
  }

  function sphereIntersection(rayPointX, rayPointY, rayPointZ, rayVectorX, rayVectorY, rayVectorZ, spherePointX, spherePointY, spherePointZ, sphereRadius) {
    var eyeToCenterX = spherePointX - rayPointX;
    var eyeToCenterY = spherePointY - rayPointY;
    var eyeToCenterZ = spherePointZ - rayPointZ;
    var v = eyeToCenterX * rayVectorX + eyeToCenterY * rayVectorY + eyeToCenterZ * rayVectorZ;
    var eoDot = eyeToCenterX * eyeToCenterX + eyeToCenterY * eyeToCenterY + eyeToCenterZ * eyeToCenterZ;
    var discriminant = (sphereRadius * sphereRadius) - eoDot + (v * v);

    if (discriminant > 0) {
      return v - Math.sqrt(discriminant);
    } else {
      return -1;
    }
  }

  t = x * this.constants.pixelWidth - this.constants.halfWidth;
  var xCompX = this.constants.vpRightX * t;
  var xCompY = this.constants.vpRightY * t;
  var xCompZ = this.constants.vpRightZ * t;

  t = y * this.constants.pixelHeight - this.constants.halfHeight;
  var yCompX = this.constants.vpUpX * t;
  var yCompY = this.constants.vpUpY * t;
  var yCompZ = this.constants.vpUpZ * t;

  tempX = this.constants.eyeVectorX + xCompX + yCompX;
  tempY = this.constants.eyeVectorY + xCompY + yCompY;
  tempZ = this.constants.eyeVectorZ + xCompZ + yCompZ;
  temp = length(tempX, tempY, tempZ);

  var rayPointX = camera[POINT][X];
  var rayPointY = camera[POINT][Y];
  var rayPointZ = camera[POINT][Z];
  var rayVectorX = tempX / temp;
  var rayVectorY = tempY / temp;
  var rayVectorZ = tempZ / temp;

  var dist;
  var closest = Infinity;
  var objectIdx = -1;

  for (var n = 0; n < this.constants.objectCount; n++) {
    dist = sphereIntersection(rayPointX, rayPointY, rayPointZ, rayVectorX, rayVectorY, rayVectorZ, objects[n][POINT][X], objects[n][POINT][Y], objects[n][POINT][Z], objects[n][MISC][RADIUS]);

    if (dist > 0 && dist < closest) {
      closest = dist;
      objectIdx = n;
    }
  }

  var idx = objectIdx;

  if (closest !== Infinity) {
    a = 255;

    tempX = rayVectorX * closest;
    tempY = rayVectorY * closest;
    tempZ = rayVectorZ * closest;
    var pointAtTimeX = rayPointX + tempX;
    var pointAtTimeY = rayPointY + tempY;
    var pointAtTimeZ = rayPointZ + tempZ;

    tempX = pointAtTimeX - objects[idx][POINT][X];
    tempY = pointAtTimeY - objects[idx][POINT][Y];
    tempZ = pointAtTimeZ - objects[idx][POINT][Z];
    temp = length(tempX, tempY, tempZ);

    var sphereNormalX = tempX / temp;
    var sphereNormalY = tempY / temp;
    var sphereNormalZ = tempZ / temp;

    var colorR = objects[idx][COLOR][R];
    var colorG = objects[idx][COLOR][G];
    var colorB = objects[idx][COLOR][B];

    var lambert = 0;

    for (var n = 0; n < this.constants.lightCount; n++) {
      tempX = pointAtTimeX - lights[n][X];
      tempY = pointAtTimeY - lights[n][Y];
      tempZ = pointAtTimeZ - lights[n][Z];
      temp = length(tempX, tempY, tempZ);

      var lightVectorX = tempX / temp;
      var lightVectorY = tempY / temp;
      var lightVectorZ = tempZ / temp;

      closest = Infinity;
      objectIdx = -1;

      for (var m = 0; m < this.constants.objectCount; m++) {
        dist = sphereIntersection(lights[n][X], lights[n][Y], lights[n][Z], lightVectorX, lightVectorY, lightVectorZ, objects[m][POINT][X], objects[m][POINT][Y], objects[m][POINT][Z], objects[m][MISC][RADIUS]);

        if (dist > 0 && dist < closest) {
          closest = dist;
          objectIdx = m;
        }
      }

      if (objectIdx === idx) {
        tempX = lights[n][X] - pointAtTimeX;
        tempY = lights[n][Y] - pointAtTimeY;
        tempZ = lights[n][Z] - pointAtTimeZ;

        temp = length(tempX, tempY, tempZ);
        tempX = tempX / temp;
        tempY = tempY / temp;
        tempZ = tempZ / temp;

        var contribution = dotProduct(tempX, tempY, tempZ, sphereNormalX, sphereNormalY, sphereNormalZ);
        if (contribution > 0) {
          lambert += contribution;
        }
      }
    }

    lambert = Math.min(1, lambert);

    t = lambert * objects[idx][PIE][DIFFUSE];
    r += colorR * t;
    g += colorG * t;
    b += colorB * t;

    t = objects[idx][PIE][AMBIENT];
    r += colorR * t;
    g += colorG * t;
    b += colorB * t;
  }

  this.color(r / 255, g / 255, b / 255, a / 255);
}, options);

function render() {
  kernel(camera, lights, objects);
  var parent = document.getElementById('parent');
  var canvas = document.getElementsByTagName('canvas')[0];
  parent.replaceChild(kernel.getCanvas(), canvas);
}

// A little fun magic
var planet1 = 0,
    planet2 = 0;

var playing = false;
var usingGPU = false;

var FPS = {
  startTime : 0,
  frameNumber : 0,
  display: $('#fps'),
  updateFPS : function() {
    this.frameNumber++;
    var d = new Date().getTime(),
      currentTime = (d - this.startTime) / 1000,
      result = Math.floor((this.frameNumber / currentTime));
    if(currentTime > 1) {
      this.startTime = new Date().getTime();
      this.frameNumber = 0;
    }
    this.display.text(result + ' fps');
  }
};

function tick() {
  planet1 += 0.1;
  planet2 += 0.2;

  objects[1][0][0] = Math.sin(planet1) * 3.5;
  objects[1][0][2] = -3 + (Math.cos(planet1) * 3.5);

  objects[2][0][0] = Math.sin(planet2) * 4;
  objects[2][0][2] = -3 + (Math.cos(planet2) * 4);

  FPS.updateFPS();
  render();

  if (playing) {
    // requestAnimationFrame(tick);
    setTimeout(tick, 1);
  }
}

function flip(e) {
  if (usingGPU) {
    usingGPU = false;
    $(e.target).text("Using CPU");
  } else {
    usingGPU = true;
    $(e.target).text("Using GPU");
  }
}

function play() {
  playing = true;
  tick();
}

function stop() {
  playing = false;
}

render();

$('#switch').click(flip);
$('#play').click(play);
$('#stop').click(stop);
