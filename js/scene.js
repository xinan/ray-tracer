// The Scene
var SPHERE = 1;

var camera = [
  [
    0,      // point.x
    0,      // point.y
    10      // point.z
  ],
  [
    0,      // vector.x
    0,      // vector.y
    3       // vector.z
  ],
  [
    45,     // field of view
    0,      // dummy
    0       // dummy
  ]
];

var lights = [
  [
    -10,    // point.x
    10,    // point.y
    20      // point.z
  ]
];

var objects = [
  [
    [
      0,      // point.x
      0,      // point.y
      0       // point.z
    ],
    [
      128,    // color.x
      192,    // color.y
      64      // color.z
    ],
    [
      SPHERE, // type
      2,      // radius
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
      1.5,      // point.x
      -2.598076211353316,      // point.y
      0       // point.z
    ],
    [
      64,    // color.x
      128,    // color.y
      128     // color.z
    ],
    [
      SPHERE, // type
      0.3,    // radius
      0       // dummy
    ],
    [
      0.1,    // specular
      0.9,    // diffuse
      0.1     // ambient
    ]
  ],
  [
    [
      1.5,     // point.x
      2.598076211353316,      // point.y
      0      // point.z
    ],
    [
      128,    // color.x
      64,    // color.y
      192     // color.z
    ],
    [
      SPHERE, // type
      0.3,    // radius
      0       // dummy
    ],
    [
      0.1,    // specular
      0.9,    // diffuse
      0.1     // ambient
    ]
  ],
  [
    [
      -3,     // point.x
      0,      // point.y
      0      // point.z
    ],
    [
      192,    // color.x
      128,    // color.y
      128     // color.z
    ],
    [
      SPHERE, // type
      0.3,    // radius
      0       // dummy
    ],
    [
      0.1,    // specular
      0.9,    // diffuse
      0.1     // ambient
    ]
  ]
];
