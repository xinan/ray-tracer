// Setup
var c = document.getElementById('c'),
    width = 640,
    height = 480;

var x, y;

c.width = width;
c.height = height;
c.style.cssText = 'width: 640px; height: 480px;';

var ctx = c.getContext('2d'),
    data = ctx.getImageData(0, 0, width, height);

// The Scene
var scene = {};

scene.camera = {
  point: {
    x: 0,
    y: 1.8,
    z: 10
  },
  fieldOfView: 45,
  vector: {
    x: 0,
    y: 3,
    z: 0
  }
};

scene.lights = [
  {
    x: -30,
    y: -10,
    z: 20
  }
];

scene.objects = [
  {
    type: 'sphere',
    point: {
      x: 0,
      y: 3.5,
      z: -3
    },
    color: {
      x: 155,
      y: 200,
      z: 155
    },
    specular: 0.2,
    lambert: 0.7,
    ambient: 0.1,
    radius: 3
  },
  {
    type: 'sphere',
    point: {
      x: -4,
      y: 2,
      z: -1
    },
    color: {
      x: 155,
      y: 155,
      z: 155
    },
    specular: 0.1,
    lambert: 0.9,
    ambient: 0.0,
    radius: 0.2
  },
  {
    type: 'sphere',
    point: {
      x: -4,
      y: 3,
      z: -1
    },
    color: {
      x: 255,
      y: 255,
      z: 255
    },
    specular: 0.2,
    lambert: 0.7,
    ambient: 0.1,
    radius: 0.1
  }
];

// Throwing rays
function render(scene) {
  var camera = scene.camera,
      objects = scene.objects,
      lights = scene.lights;

  var eyeVector = Vector.unitVector(Vector.subtract(camera.vector, camera.point)),
      vpRight = Vector.unitVector(Vector.crossProduct(eyeVector, Vector.UP)),
      vpUp = Vector.unitVector(Vector.crossProduct(vpRight, eyeVector)),
      fovRadians = Math.PI * (camera.fieldOfView / 2) / 180,
      heightWidthRatio = height / width,
      halfWidth = Math.tan(fovRadians),
      halfHeight = heightWidthRatio * halfWidth,
      cameraWidth = halfWidth * 2,
      cameraHeight = halfHeight * 2,
      pixelWidth = cameraWidth / (width - 1),
      pixelHeight = cameraHeight / (height - 1);

  var index, color;

  var ray = {
    point: camera.point
  };

  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      var xcomp = Vector.scale(vpRight, (x * pixelWidth) - halfWidth),
          ycomp = Vector.scale(vpUp, (y * pixelHeight) - halfHeight);

      ray.vector = Vector.unitVector(Vector.add3(eyeVector, xcomp, ycomp));

      color = trace(ray, scene, 0);
      index = (x * 4) + (y * width * 4);

      data.data[index + 0] = color.x;
      data.data[index + 1] = color.y;
      data.data[index + 2] = color.z;
      data.data[index + 3] = color === Vector.WHITE ? 0 : 255;
    }
  }

  ctx.putImageData(data, 0, 0);
}

// Trace
function trace(ray, scene, depth) {
  if (depth > 1) return;

  var distObject = intersectScene(ray, scene);

  if (distObject[0] === Infinity) {
    return Vector.WHITE;
  }

  var dist = distObject[0],
      object = distObject[1];

  var pointAtTime = Vector.add(ray.point, Vector.scale(ray.vector, dist));

  return surface(ray, scene, object, pointAtTime, sphereNormal(pointAtTime, object), depth);
}

// Detecting collisions against all objects
function intersectScene(ray, scene) {
  var closest = [Infinity, null];

  for (var i = 0; i < scene.objects.length; i++) {
    var object = scene.objects[i],
        dist = sphereIntersection(ray, object);

    if (dist !== undefined && dist < closest[0]) {
      closest = [dist, object];
    }
  }

  return closest;
}

function sphereIntersection(ray, sphere) {
  var eyeToCenter = Vector.subtract(sphere.point, ray.point),
      v = Vector.dotProduct(eyeToCenter, ray.vector),
      eoDot = Vector.dotProduct(eyeToCenter, eyeToCenter),
      discriminant = (sphere.radius * sphere.radius) - eoDot + (v * v);

  if (discriminant > 0) {
    return v - Math.sqrt(discriminant);
  }
}

function sphereNormal(pos, sphere) {
  return Vector.unitVector(Vector.subtract(pos, sphere.point));
}

// Surface
function surface(ray, scene, object, pointAtTime, normal, depth) {
  var b = object.color,
      c = Vector.ZERO,
      lambertAmount = 0;

  if (object.lambert) {
    for (var i = 0; i < scene.lights.length; i++) {
      var lightPoint = scene.lights[i];

      if (!isLightVisible(pointAtTime, scene, lightPoint)) {
        continue;
      }

      var contribution = Vector.dotProduct(Vector.unitVector(Vector.subtract(lightPoint, pointAtTime)), normal);

      if (contribution > 0) {
        lambertAmount += contribution;
      }
    }
  }

  if (object.specular) {
    var reflectedRay = {
      point: pointAtTime,
      vector: Vector.reflectThrough(ray.vector, normal)
    };

    var reflectedColor = trace(reflectedRay, scene, ++depth);

    if (reflectedColor) {
      c = Vector.add(c, Vector.scale(reflectedColor, object.specular));
    }
  }

  lambertAmount = Math.min(1, lambertAmount);

  return Vector.add3(c, Vector.scale(b, lambertAmount * object.lambert), Vector.scale(b, object.ambient));
}

function isLightVisible(point, scene, light) {
  var diff = Vector.subtract(point, light);
  var lightVector = Vector.unitVector(diff);

  var distObject = intersectScene({
    point: point,
    vector: lightVector
  }, scene);

  return distObject[0] > -0.005;
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

  scene.objects[1].point.x = Math.sin(planet1) * 3.5;
  scene.objects[1].point.z = -3 + (Math.cos(planet1) * 3.5);

  scene.objects[2].point.x = Math.sin(planet2) * 4;
  scene.objects[2].point.z = -3 + (Math.cos(planet2) * 4);

  FPS.updateFPS();
  render(scene);

  if (playing) {
    requestAnimationFrame(tick);
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

render(scene);

$('#switch').click(flip);
$('#play').click(play);
$('#stop').click(stop);























