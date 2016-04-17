var width = 192;
var height = 144;

function createRenderer(mode) {
  var fovRadians = Math.PI * (camera[2][0] / 2) / 180,
    heightWidthRatio = height / width,
    halfWidth = Math.tan(fovRadians),
    halfHeight = heightWidthRatio * halfWidth,
    cameraWidth = halfWidth * 2,
    cameraHeight = halfHeight * 2,
    pixelWidth = cameraWidth / (width - 1),
    pixelHeight = cameraHeight / (height - 1);

  var gpu = new GPU();

  var options = {
    dimensions: [width, height],
    debug: false,
    graphical: true,
    hardcodeConstants: true,
    constants: {
      height: height,
      width: width,
      maxBounces: 4,
      maxAliasing: 8,
      lightCount: lights.length,
      objectCount: objects.length,
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
  var DEPTH = 2;
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
  var JND = 0.1;
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

  tempX = camera[VECTOR][X] - camera[POINT][X];
  tempY = camera[VECTOR][Y] - camera[POINT][Y];
  tempZ = camera[VECTOR][Z] - camera[POINT][Z];
  temp = length(tempX, tempY, tempZ);

  var eyeVectorX = tempX / temp;
  var eyeVectorY = tempY / temp;
  var eyeVectorZ = tempZ / temp;

  tempX = -eyeVectorZ;
  tempY = 0;
  tempZ = eyeVectorX;
  temp = length(tempX, tempY, tempZ);

  var vpRightX = tempX / temp;
  var vpRightY = tempY / temp;
  var vpRightZ = tempZ / temp;

  tempX = vpRightY * eyeVectorZ - vpRightZ * eyeVectorY;
  tempY = vpRightZ * eyeVectorX - vpRightX * eyeVectorZ;
  tempZ = vpRightX * eyeVectorY - vpRightY * eyeVectorX;
  temp = length(tempX, tempY, tempZ);

  var vpUpX = tempX / temp;
  var vpUpY = tempY / temp;
  var vpUpZ = tempZ / temp;

  var antiAliasingLevel = camera[MISC][LEVEL];
  var numRays = antiAliasingLevel * antiAliasingLevel;
  var depth = camera[MISC][DEPTH];

  var splitPixelWidth = this.constants.pixelWidth / antiAliasingLevel;
  var splitPixelHeight = this.constants.pixelHeight / antiAliasingLevel;

  for (var i = 0; i < this.constants.maxAliasing; i++) {
    if (i >= antiAliasingLevel) {
      break;
    }

    for (var j = 0; j < this.constants.maxAliasing; j++) {
      if (j >= antiAliasingLevel) {
        break;
      }

      t = (x - 1) * this.constants.pixelWidth - this.constants.halfWidth + i * splitPixelWidth;
      var xCompX = vpRightX * t;
      var xCompY = vpRightY * t;
      var xCompZ = vpRightZ * t;

      t = (y - 1) * this.constants.pixelHeight - this.constants.halfHeight + j * splitPixelHeight;
      var yCompX = vpUpX * t;
      var yCompY = vpUpY * t;
      var yCompZ = vpUpZ * t;

      tempX = eyeVectorX + xCompX + yCompX;
      tempY = eyeVectorY + xCompY + yCompY;
      tempZ = eyeVectorZ + xCompZ + yCompZ;
      temp = length(tempX, tempY, tempZ);

      var rayPointX = camera[POINT][X];
      var rayPointY = camera[POINT][Y];
      var rayPointZ = camera[POINT][Z];
      var rayVectorX = tempX / temp;
      var rayVectorY = tempY / temp;
      var rayVectorZ = tempZ / temp;

      var specular = 1;
      var idx = -1;

      for (var k = 0; k < this.constants.maxBounces; k++) {
        if (k > depth) {
          break;
        }

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

        if (idx === objectIdx) {
          break;
        }

        idx = objectIdx;

        if (idx === -1) {
          break;
        }
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

        if (t < JND) {
          break;
        }

        specular = objects[idx][PIE][SPECULAR];

        rayPointX = pointAtTimeX;
        rayPointY = pointAtTimeY;
        rayPointZ = pointAtTimeZ;

        t = 2 * dotProduct(rayVectorX, rayVectorY, rayVectorZ, sphereNormalX, sphereNormalY, sphereNormalZ);
        rayVectorX = sphereNormalX * t - rayVectorX;
        rayVectorY = sphereNormalY * t - rayVectorY;
        rayVectorZ = sphereNormalZ * t - rayVectorZ;

      }
    }
  }

  r /= numRays;
  g /= numRays;
  b /= numRays;

  this.color(r / 255, g / 255, b / 255, a / 255);
}
