var cpu = createRenderer('cpu');
var gpu = createRenderer('gpu');

function render() {
  var kernel = usingGPU ? gpu : cpu;
  kernel(camera, lights, objects);
  var parent = document.getElementById('parent');
  var canvas = document.getElementsByTagName('canvas')[0];
  var newCanvas = kernel.getCanvas();
  newCanvas.style.cssText = 'width: 960px; height: 720px;';
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
var usingGPU = true;
var throttle = true;
var speed = 10;
var zoom = 1;
var rawCamera = [camera[POINT][X], camera[POINT][Y], camera[POINT][Z]];
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
  earthR += Math.random() / 510 * speed;
  earthG += Math.random() / 470 * speed;
  earthB += Math.random() / 430 * speed;
  moon1R += Math.random() / 410 * speed;
  moon1G += Math.random() / 370 * speed;
  moon1B += Math.random() / 310 * speed;
  moon2R += Math.random() / 290 * speed;
  moon2G += Math.random() / 230 * speed;
  moon2B += Math.random() / 190 * speed;
  moon3R += Math.random() / 170 * speed;
  moon3G += Math.random() / 130 * speed;
  moon3G += Math.random() / 110 * speed;

  moon1 += Math.random() / 110 * speed;
  moon2 += Math.random() / 130 * speed;
  moon3 += Math.random() / 170 * speed;

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
  render();
}

function changeSize(e) {
  width = $(e.target).find('input').val();
  height = width / 4 * 3;
  cpu = createRenderer('cpu');
  gpu = createRenderer('gpu');
  render();
}

function changeBounces(e) {
  camera[MISC][DEPTH] = $(e.target).find('input').val();
  render();
}

var cos1 = Math.cos(0.0174533);
var sin1 = Math.sin(0.0174533);
var cos_1 = Math.cos(-0.0174533);
var sin_1 = Math.sin(-0.0174533);

var n = 10, m = 1;

function updateCamera() {
  camera[POINT][X] = rawCamera[X] * zoom;
  camera[POINT][Z] = rawCamera[Z] * zoom;
  camera[VECTOR][X] = camera[POINT][X] / 2;
  camera[VECTOR][Z] = camera[POINT][Z] / 2;
}

function left() {
  var x = cos1 * rawCamera[X] - sin1 * rawCamera[Z];
  var z = sin1 * rawCamera[X] + cos1 * rawCamera[Z];
  rawCamera[X] = x;
  rawCamera[Z] = z;

  updateCamera();

  render();

  n -= 1;
  if (n > 0) {
    requestAnimationFrame(left);
  }
}

function right() {
  var x = cos_1 * rawCamera[X] - sin_1 * rawCamera[Z];
  var z = sin_1 * rawCamera[X] + cos_1 * rawCamera[Z];
  rawCamera[X] = x;
  rawCamera[Z] = z;

  updateCamera();

  render();

  n -= 1;
  if (n > 0) {
    requestAnimationFrame(right);
  }
}

function rotateLeft() {
  n = 10;
  left();
}

function rotateRight() {
  n = 10;
  right();
}

function resetCamera() {
  n = Math.acos(dotProduct(rawCamera, [0, 0, 20]) / (length(rawCamera) * length([0, 0, 20]))) * 180 / Math.PI;

  if (n < 5) {
    rawCamera[X] = 0;
    rawCamera[Z] = 20;
    updateCamera();

    render();
  } else {
    var normal = crossProduct(rawCamera, [0, 0, 20]);
    if (normal[Y] < 0) {
      left();
    } else {
      right();
    }
  }
}

function decreaseSpeed() {
  if (speed > 1) {
    speed--;
  }
}

function increaseSpeed() {
  if (speed < 20) {
    speed++;
  }
}

function resetSpeed() {
  speed = 10;
}

function enlarge() {
  if (zoom > 0.5) {
    zoom -= 0.01;
    updateCamera();
    render();
  }

  if (zoom > m) {
    requestAnimationFrame(enlarge);
  }
}

function shrink() {
  if (zoom < 1.5) {
    zoom += 0.01;
    updateCamera();
    render();
  }

  if (zoom < m) {
    requestAnimationFrame(shrink);
  }
}

function zoomIn() {
  if (zoom > 0.5) {
    m = zoom - 0.1;
    enlarge();
  }
}

function zoomOut() {
  if (zoom < 1.5) {
    m = zoom + 0.1;
    shrink();
  }
}

function resetZoom() {
  m = 1;
  if (zoom > m) {
    enlarge();
  } else if (zoom < m) {
    shrink();
  }
}

render();

$('#switch').click(flip);
$('#toggle').click(toggle);
$('.btn-antialiasing').click(antiAliasing);
$('.btn-resolution').click(changeSize);
$('.btn-bounces').click(changeBounces);
$('#rotateLeft').click(rotateLeft);
$('#rotateRight').click(rotateRight);
$('#resetCamera').click(resetCamera);
$('#decreaseSpeed').click(decreaseSpeed);
$('#resetSpeed').click(resetSpeed);
$('#increaseSpeed').click(increaseSpeed);
$('#zoomIn').click(zoomIn);
$('#zoomOut').click(zoomOut);
$('#resetZoom').click(resetZoom);
$('button').tooltip();
