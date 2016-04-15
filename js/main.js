var WIDTH = 800;
var HEIGHT = 600;
var DEPTH = 3;

var POINT = 0;
var VECTOR = 1;
var COLOR = 1;
var LEVEL = 1;
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

function createRenderer(mode) {
  var gpu = new GPU();

  var options = {
    dimensions: [WIDTH, HEIGHT],
    debug: false,
    graphical: true,
    hardcodeConstants: true,
    constants: {
      height: HEIGHT,
      width: WIDTH,
      depth: DEPTH,
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
    mode: mode
  };

  return gpu.createKernel(rayTracing, options);
}

function rayTracing(camera, lights, objects) {
  var POINT = 0;
  var VECTOR = 1;
  var COLOR = 1;
  var LEVEL = 1;
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

  var x = this.thread.x;
  var y = this.thread.y;
  var Infinity = 99999999;
  var r = 0;
  var g = 0;
  var b = 0;
  var a = 0;
  var t;
  var n;
  var m;
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
      return 99999999;
    }
  }

  var antiAliasingLevel = camera[MISC][LEVEL];
  var numRays = antiAliasingLevel * antiAliasingLevel;

  var splitPixelWidth = this.constants.pixelWidth / antiAliasingLevel;
  var splitPixelHeight = this.constants.pixelHeight / antiAliasingLevel;

  for (var i = 0; i < 8; i++) {
    if (i >= antiAliasingLevel) {
      break;
    }

    for (var j = 0; j < 8; j++) {
      if (j >= antiAliasingLevel) {
        break;
      }

      t = (x - 1) * this.constants.pixelWidth - this.constants.halfWidth + i * splitPixelWidth;
      var xCompX = this.constants.vpRightX * t;
      var xCompY = this.constants.vpRightY * t;
      var xCompZ = this.constants.vpRightZ * t;

      t = (y - 1) * this.constants.pixelHeight - this.constants.halfHeight + j * splitPixelHeight;
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

      var specular = 1;

      for (var k = 0; k < this.constants.depth; k++) {

        var dist;
        var closest = Infinity;
        var objectIdx = -1;

        for (n = 0; n < this.constants.objectCount; n++) {
          dist = sphereIntersection(rayPointX, rayPointY, rayPointZ, rayVectorX, rayVectorY, rayVectorZ, objects[n][POINT][X], objects[n][POINT][Y], objects[n][POINT][Z], objects[n][MISC][RADIUS]);

          if (dist < closest) {
            closest = dist;
            objectIdx = n;
          }
        }

        var idx = objectIdx;

        if (idx != -1) {
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

          for (n = 0; n < this.constants.lightCount; n++) {
            tempX = pointAtTimeX - lights[n][X];
            tempY = pointAtTimeY - lights[n][Y];
            tempZ = pointAtTimeZ - lights[n][Z];
            temp = length(tempX, tempY, tempZ);

            var lightVectorX = tempX / temp;
            var lightVectorY = tempY / temp;
            var lightVectorZ = tempZ / temp;

            closest = Infinity;
            objectIdx = -1;

            for (m = 0; m < this.constants.objectCount; m++) {
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

          t = lambert * objects[idx][PIE][DIFFUSE] * specular + objects[idx][PIE][AMBIENT] * specular;
          r += colorR * t;
          g += colorG * t;
          b += colorB * t;

          specular = objects[idx][PIE][SPECULAR];

          rayPointX = pointAtTimeX;
          rayPointY = pointAtTimeY;
          rayPointZ = pointAtTimeZ;

          t = 2 * dotProduct(rayVectorX, rayVectorY, rayVectorZ, sphereNormalX, sphereNormalY, sphereNormalZ);
          rayVectorX = sphereNormalX * t - rayVectorX;
          rayVectorY = sphereNormalY * t - rayVectorY;
          rayVectorZ = sphereNormalZ * t - rayVectorZ;

        } else {
          break;
        }
      }
    }
  }

  r /= numRays;
  g /= numRays;
  b /= numRays;

  this.color(r / 255, g / 255, b / 255, a / 255);
}

var cpu = createRenderer('cpu');
var gpu = createRenderer('gpu');

function render() {
  var kernel = usingGPU ? gpu : cpu;
  kernel(camera, lights, objects);
  var parent = document.getElementById('parent');
  var canvas = document.getElementsByTagName('canvas')[0];
  parent.replaceChild(kernel.getCanvas(), canvas);
}

// A little fun magic
var earthR = 0,
    earthG = 0,
    earthB = 0,
    moon1 = 0,
    moon1R = 0,
    moon1G = 0,
    moon1B = 0,
    moon2 = 0,
    moon2R = 0,
    moon2G = 0,
    moon2B = 0,
    moon3 = 0,
    moon3R = 0,
    moon3G = 0,
    moon3B = 0;

var playing = false;
var usingGPU = false;
var throttle = true;
var fps = $('#fps');
fps.click(flop);

var FPS = {
  startTime : 0,
  frameNumber : 0,
  display: fps,
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
  earthR += Math.random() / 10;
  earthG += Math.random() / 10;
  earthB += Math.random() / 10;
  moon1R += Math.random() / 10;
  moon1G += Math.random() / 10;
  moon1B += Math.random() / 10;
  moon2R += Math.random() / 10;
  moon2G += Math.random() / 10;
  moon2B += Math.random() / 10;
  moon3R += Math.random() / 10;
  moon3G += Math.random() / 10;
  moon3G += Math.random() / 10;

  moon1 += Math.random() / 10;
  moon2 += Math.random() / 10;
  moon3 += Math.random() / 10;

  objects[0][COLOR][R] = (Math.sin(earthR)) * 64 + 128;
  objects[0][COLOR][G] = (Math.cos(earthG)) * 64 + 128;
  objects[0][COLOR][B] = (-Math.cos(earthB)) * 64 + 128;

  objects[1][COLOR][R] = (-Math.cos(moon1R)) * 64 + 128;
  objects[1][COLOR][G] = (-Math.sin(moon1G)) * 64 + 128;
  objects[1][COLOR][B] = (Math.sin(moon1B)) * 64 + 128;

  objects[2][COLOR][R] = (-Math.sin(moon2R)) * 64 + 128;
  objects[2][COLOR][G] = (-Math.cos(moon2G)) * 64 + 128;
  objects[2][COLOR][B] = (Math.cos(moon2B)) * 64 + 128;

  objects[3][COLOR][R] = (Math.cos(moon3R)) * 64 + 128;
  objects[3][COLOR][G] = (Math.sin(moon3G)) * 64 + 128;
  objects[3][COLOR][B] = (-Math.sin(moon3B)) * 64 + 128;

  objects[1][POINT][X] = Math.cos(moon1) * 1.5;
  objects[1][POINT][Y] = -Math.cos(moon1) * 2.598076211353316;
  objects[1][POINT][Z] = Math.sin(moon1) * 3;

  objects[2][POINT][X] = Math.cos(moon2) * 1.5;
  objects[2][POINT][Y] = Math.cos(moon2) * 2.598076211353316;
  objects[2][POINT][Z] = -Math.sin(moon2) * 3;

  objects[3][POINT][X] = -Math.cos(moon3) * 3;
  objects[3][POINT][Z] = Math.sin(moon3) * 3;

  FPS.updateFPS();
  render();

  if (playing) {
    if (throttle) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(tick, 1);
    }
  }
}

function flip(e) {
  if (usingGPU) {
    usingGPU = false;
    $(e.target).text("CPU");
  } else {
    usingGPU = true;
    $(e.target).text("GPU");
  }
}

function toggle(e) {
  if (playing) {
    $(e.target).text("Play");
    $(e.target).removeClass("btn-danger");
    $(e.target).addClass("btn-success");
    playing = false;
  } else {
    $(e.target).text("Stop");
    $(e.target).removeClass("btn-success");
    $(e.target).addClass("btn-danger");
    playing = true;
    tick();
  }
}

function flop() {
  throttle = !throttle;
}

function antiAliasing(e) {
  camera[MISC][LEVEL] = $(e.target).find('input').val();
}

render();

$('#switch').click(flip);
$('#toggle').click(toggle);
$('.btn-antialiasing').click(antiAliasing);

$('#footer').text('Copyright © 2014-' + new Date().getFullYear() + ' Liu Xinan');
