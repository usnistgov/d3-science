embedded_template_example = {
  "inputs": [
    {
      "id": "input_0",
      "target": [
        10,
        "base"
      ]
    },
    {
      "id": "input_1",
      "target": null
    }
  ],
  "outputs": [
    {
      "id": "output_0",
      "target": [
        10,
        "output"
      ]
    }
  ],
  "modules": [
    {
      "config": {},
      "title": "fancy load",
      "x": 85,
      "y": 80,
      "module_def": {
        "name": "my module",
        "fields": [
          {"id": "specular", "target": [0, "filelist"]},
          {"id": "detector_np", "target": [1, "nonparalyzing"]},
          {"id": "detector_p", "target": [1, "paralyzing"]}
        ],
        "inputs": [],
        "outputs": [
          {"id": "output", "target": [4, "output"]}
        ],
        "modules": [
          {
            "module": "ncnr.refl.ncnr_load",
            "title": "Ncnr Load (cached)",
            "x": 10,
            "y": 25
          },
          {
            "module": "ncnr.refl.detector_dead_time",
            "title": "Detector Dead Time",
            "x": 360,
            "y": 25
          },
          {
            "module": "ncnr.refl.monitor_dead_time",
            "title": "Monitor Dead Time",
            "x": 565,
            "y": 25
          },
          {
            "module": "ncnr.refl.divergence",
            "title": "Divergence",
            "x": 215,
            "y": 25
          },
          {
            "module": "ncnr.refl.normalize",
            "title": "Normalize",
            "x": 765,
            "y": 25
          }
        ],
        "wires": [
          {
            "source": [
              1,
              "output"
            ],
            "target": [
              2,
              "data"
            ]
          },
          {
            "source": [
              0,
              "output"
            ],
            "target": [
              3,
              "data"
            ]
          },
          {
            "source": [
              3,
              "output"
            ],
            "target": [
              1,
              "data"
            ]
          },
          {
            "source": [
              2,
              "output"
            ],
            "target": [
              4,
              "data"
            ]
          }
        ]
      }
    },
    {
      "title": "load bg",
      "module": "ncnr.refl.super_load",
      "config": {
        "intent": "background"
      },
      "x": 150,
      "y": 140
    },
    {
      "title": "load slit",
      "module": "ncnr.refl.super_load",
      "config": {
        "intent": "slit"
      },
      "x": 150,
      "y": 180
    },
    {
      "title": "mask",
      "module": "ncnr.refl.mask_points",
      "x": 285,
      "y": 100
    },
    {
      "title": "mask",
      "module": "ncnr.refl.mask_points",
      "x": 285,
      "y": 140
    },
    {
      "title": "mask",
      "module": "ncnr.refl.mask_points",
      "x": 285,
      "y": 180
    },
    {
      "title": "join",
      "module": "ncnr.refl.join",
      "x": 420,
      "y": 100
    },
    {
      "title": "join",
      "module": "ncnr.refl.join",
      "x": 420,
      "y": 140
    },
    {
      "title": "join",
      "module": "ncnr.refl.join",
      "x": 421,
      "y": 179
    },
    {
      "title": "subtract",
      "module": "ncnr.refl.subtract_background",
      "x": 555,
      "y": 100
    },
    {
      "title": "normalize",
      "module": "ncnr.refl.divide_intensity",
      "x": 710,
      "y": 30
    }
  ],
  "wires": [
    {
      "source": [
        0,
        "output"
      ],
      "target": [
        3,
        "data"
      ]
    },
    {
      "source": [
        1,
        "output"
      ],
      "target": [
        4,
        "data"
      ]
    },
    {
      "source": [
        2,
        "output"
      ],
      "target": [
        5,
        "data"
      ]
    },
    {
      "source": [
        3,
        "output"
      ],
      "target": [
        6,
        "data"
      ]
    },
    {
      "source": [
        4,
        "output"
      ],
      "target": [
        7,
        "data"
      ]
    },
    {
      "source": [
        5,
        "output"
      ],
      "target": [
        8,
        "data"
      ]
    },
    {
      "source": [
        6,
        "output"
      ],
      "target": [
        9,
        "data"
      ]
    },
    {
      "source": [
        7,
        "output"
      ],
      "target": [
        9,
        "backp"
      ]
    },
    {
      "source": [
        8,
        "output"
      ],
      "target": [
        9,
        "backm"
      ]
    },
    {
      "source": [
        9,
        "output"
      ],
      "target": [
        10,
        "data"
      ]
    }
  ]
}
