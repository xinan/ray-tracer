// Default width and height, can be changed by the user
var width = 192;
var height = 144;

function createRenderer(mode) {

  // Pre-compute shared data
  var fovRadians = Math.PI * (camera[2][0] / 2) / 180;
  var heightWidthRatio = height / width;
  var halfWidth = Math.tan(fovRadians);
  var halfHeight = heightWidthRatio * halfWidth;
  var cameraWidth = halfWidth * 2;
  var cameraHeight = halfHeight * 2;
  var pixelWidth = cameraWidth / (width - 1);
  var pixelHeight = cameraHeight / (height - 1);

  var gpu = new GPU();

  var options = {
    dimensions: [width, height],
    debug: false,
    graphical: true,
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
  // Constants for indexes to make array access more readable
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

  // Define infinity
  var Infinity = 99999999;

  // Define just noticeable difference for early ray-termination
  var JND = 0.1;

  // Resultant rgba
  var r = 0;
  var g = 0;
  var b = 0;
  var a = 0;

  // Temporary variables
  var t;
  var n;
  var m;
  var tempX;
  var tempY;
  var tempZ;
  var temp;

  // Helper function for computing dot product
  function dotProduct(ax, ay, az, bx, by, bz) {
    return ax * bx + ay * by + az * bz;
  }

  // Helper function for computing the length of a vector
  function length(ax, ay, az) {
    return Math.sqrt(ax * ax + ay * ay + az * az);
  }

  // Helper function for vector-sphere intersection detection. If detected, return distance, otherwise return Infinity.
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

  // Compute the eye vector and normalize it
  tempX = camera[VECTOR][X] - camera[POINT][X];
  tempY = camera[VECTOR][Y] - camera[POINT][Y];
  tempZ = camera[VECTOR][Z] - camera[POINT][Z];
  temp = length(tempX, tempY, tempZ);

  var eyeVectorX = tempX / temp;
  var eyeVectorY = tempY / temp;
  var eyeVectorZ = tempZ / temp;

  // Compute the right vector and normalize it
  tempX = -eyeVectorZ;
  tempY = 0;
  tempZ = eyeVectorX;
  temp = length(tempX, tempY, tempZ);

  var vpRightX = tempX / temp;
  var vpRightY = tempY / temp;
  var vpRightZ = tempZ / temp;

  // Compute the up vector and normalize it
  tempX = vpRightY * eyeVectorZ - vpRightZ * eyeVectorY;
  tempY = vpRightZ * eyeVectorX - vpRightX * eyeVectorZ;
  tempZ = vpRightX * eyeVectorY - vpRightY * eyeVectorX;
  temp = length(tempX, tempY, tempZ);

  var vpUpX = tempX / temp;
  var vpUpY = tempY / temp;
  var vpUpZ = tempZ / temp;

  // Make it easier to access some variables
  var antiAliasingLevel = camera[MISC][LEVEL];
  var depth = camera[MISC][DEPTH];

  // Number of rays that need to be casted and traced
  var numRays = antiAliasingLevel * antiAliasingLevel;

  // Compute the sub-pixel size
  var splitPixelWidth = this.constants.pixelWidth / antiAliasingLevel;
  var splitPixelHeight = this.constants.pixelHeight / antiAliasingLevel;

  // For each row of sub-pixels
  for (var i = 0; i < this.constants.maxAliasing; i++) {
    if (i >= antiAliasingLevel) {
      break;
    }

    // For each column of sub-pixels
    for (var j = 0; j < this.constants.maxAliasing; j++) {
      if (j >= antiAliasingLevel) {
        break;
      }

      // Compute the x-component of the eye ray
      t = (x - 1) * this.constants.pixelWidth - this.constants.halfWidth + i * splitPixelWidth;
      var xCompX = vpRightX * t;
      var xCompY = vpRightY * t;
      var xCompZ = vpRightZ * t;

      // Compute the y-component of the eye ray
      t = (y - 1) * this.constants.pixelHeight - this.constants.halfHeight + j * splitPixelHeight;
      var yCompX = vpUpX * t;
      var yCompY = vpUpY * t;
      var yCompZ = vpUpZ * t;

      // Compute direction of the eye ray and normalize it
      tempX = eyeVectorX + xCompX + yCompX;
      tempY = eyeVectorY + xCompY + yCompY;
      tempZ = eyeVectorZ + xCompZ + yCompZ;
      temp = length(tempX, tempY, tempZ);

      var rayVectorX = tempX / temp;
      var rayVectorY = tempY / temp;
      var rayVectorZ = tempZ / temp;

      var rayPointX = camera[POINT][X];
      var rayPointY = camera[POINT][Y];
      var rayPointZ = camera[POINT][Z];

      // Specular multiplier of the current level of reflection
      // For the ray from camera, it will be 1
      // For subsequent reflected rays, it will be the specular value of the object that it is reflected from
      var specular = 1;

      // The index of the object that the ray intersected, -1 means did not intersect anything
      var idx = -1;

      // For the number of light bounces
      for (var k = 0; k < this.constants.maxBounces; k++) {
        if (k > depth) {
          break;
        }

        var dist;
        var closest = Infinity;
        var objectIdx = -1;

        // For each object
        for (n = 0; n < this.constants.objectCount; n++) {
          // Check if it is intersected with the ray
          dist = sphereIntersection(rayPointX, rayPointY, rayPointZ, rayVectorX, rayVectorY, rayVectorZ, objects[n][POINT][X], objects[n][POINT][Y], objects[n][POINT][Z], objects[n][MISC][RADIUS]);

          // Pick the closest one
          if (dist < closest) {
            closest = dist;
            objectIdx = n;
          }
        }

        // If the closest intersected object is the object that the ray is reflected from, break
        if (idx === objectIdx) {
          break;
        }

        idx = objectIdx;

        // If no object is intersected, break
        if (idx === -1) {
          break;
        }
        a = 255;

        // Compute the intersection point
        tempX = rayVectorX * closest;
        tempY = rayVectorY * closest;
        tempZ = rayVectorZ * closest;
        var pointAtTimeX = rayPointX + tempX;
        var pointAtTimeY = rayPointY + tempY;
        var pointAtTimeZ = rayPointZ + tempZ;

        // Compute the normal of the object surface at the intersection point
        tempX = pointAtTimeX - objects[idx][POINT][X];
        tempY = pointAtTimeY - objects[idx][POINT][Y];
        tempZ = pointAtTimeZ - objects[idx][POINT][Z];
        temp = length(tempX, tempY, tempZ);

        var sphereNormalX = tempX / temp;
        var sphereNormalY = tempY / temp;
        var sphereNormalZ = tempZ / temp;

        // Get the object colour
        var colorR = objects[idx][COLOR][R];
        var colorG = objects[idx][COLOR][G];
        var colorB = objects[idx][COLOR][B];

        var lambert = 0;

        // For each light source
        for (n = 0; n < this.constants.lightCount; n++) {
          // Compute the light vector and normalize it
          tempX = pointAtTimeX - lights[n][X];
          tempY = pointAtTimeY - lights[n][Y];
          tempZ = pointAtTimeZ - lights[n][Z];
          temp = length(tempX, tempY, tempZ);

          var lightVectorX = tempX / temp;
          var lightVectorY = tempY / temp;
          var lightVectorZ = tempZ / temp;

          closest = Infinity;
          objectIdx = -1;

          // For each object
          for (m = 0; m < this.constants.objectCount; m++) {
            // Check if the light can hit the object
            dist = sphereIntersection(lights[n][X], lights[n][Y], lights[n][Z], lightVectorX, lightVectorY, lightVectorZ, objects[m][POINT][X], objects[m][POINT][Y], objects[m][POINT][Z], objects[m][MISC][RADIUS]);

            // It can only hit the closest one
            if (dist > 0 && dist < closest) {
              closest = dist;
              objectIdx = m;
            }
          }

          // If the light can hit the object
          if (objectIdx === idx) {
            // Calculate and add the contribution
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

        // Diffuse value cannot exceed 1
        lambert = Math.min(1, lambert);

        // Compute the contribution of the current ray, and add to the colours
        t = lambert * objects[idx][PIE][DIFFUSE] * specular + objects[idx][PIE][AMBIENT] * specular;
        r += colorR * t;
        g += colorG * t;
        b += colorB * t;

        // If the contribution is lower than the threshold, do now trace the reflected ray any further
        if (t < JND) {
          break;
        }

        // Set the specular to the specular of the current object, so that the reflected ray will take this into account
        specular = objects[idx][PIE][SPECULAR];

        // Set ray point to the current point of intersection
        rayPointX = pointAtTimeX;
        rayPointY = pointAtTimeY;
        rayPointZ = pointAtTimeZ;

        // Set ray direction to the direction of the reflected ray
        t = 2 * dotProduct(rayVectorX, rayVectorY, rayVectorZ, sphereNormalX, sphereNormalY, sphereNormalZ);
        rayVectorX = sphereNormalX * t - rayVectorX;
        rayVectorY = sphereNormalY * t - rayVectorY;
        rayVectorZ = sphereNormalZ * t - rayVectorZ;
      }
    }
  }

  // Take average of all the rays casted and traced
  r /= numRays;
  g /= numRays;
  b /= numRays;

  // Set the color of the current pixel
  this.color(r / 255, g / 255, b / 255, a / 255);
}
