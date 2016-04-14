// The Scene
var SPHERE = 1;

var camera = [
  [
    0,      // point.x
    1.8,    // point.y
    10      // point.z
  ],
  [
    0,      // vector.x
    3,      // vector.y
    0       // vector.z
  ],
  [
    45,     // field of view
    0,      // dummy
    0       // dummy
  ]
];

var lights = [
  [
    -30,    // point.x
    -10,    // point.y
    20      // point.z
  ]
];

var objects = [
  [
    [
      0,      // point.x
      3.5,    // point.y
      -3      // point.z
    ],
    [
      155,    // color.x
      200,    // color.y
      155     // color.z
    ],
    [
      SPHERE, // type
      3,      // radius
      0       // dummy
    ],
    [
      0.2,    // specular
      0.7,    // diffuse
      0.1     // ambient
    ]
  ],
  [
    [
      -4,     // point.x
      2,      // point.y
      -1      // point.z
    ],
    [
      155,    // color.x
      155,    // color.y
      155     // color.z
    ],
    [
      SPHERE, // type
      0.2,    // radius
      0       // dummy
    ],
    [
      0.1,    // specular
      0.9,    // diffuse
      0.0     // ambient
    ]
  ],
  [
    [
      -4,     // point.x
      3,      // point.y
      -1      // point.z
    ],
    [
      255,    // color.x
      255,    // color.y
      255     // color.z
    ],
    [
      SPHERE, // type
      0.1,    // radius
      0       // dummy
    ],
    [
      0.2,    // specular
      0.7,    // diffuse
      0.1     // ambient
    ]
  ]
];
