# Project Overview

## Purpose
ZMK (Zephyr Mechanical Keyboard) firmware module for MLX90393 3-axis magnetic sensor driver. This driver reads input from the magnetic sensor and generates Z-axis state-dependent mouse operations:
- Normal state: Middle button + movement
- Pressed state: SHIFT + Middle button + movement

## Current Status
The project is in initial stage with only CLAUDE.md documentation file present. The actual implementation files need to be created based on the specifications.

## Target Architecture
Based on CLAUDE.md specifications:
- Main driver: `drivers/input/input_*.c`
- Device tree bindings: `dts/bindings/input/*.yaml`
- Build configuration: `CMakeLists.txt`, `Kconfig`
- Zephyr module definition: `zephyr/module.yml`

## Key Features to Implement
1. I2C communication with MLX90393 sensor
2. Z-axis threshold detection for two-state operation (normal/pressed)
3. State-dependent behavior binding system
4. Auto-calibration (30 seconds of inactivity)
5. Hysteresis functionality for motion detection
6. Dead zone functionality (X/Y: 3, Z: 5)
7. Relative input reporting (INPUT_REL_X, INPUT_REL_Y, INPUT_REL_WHEEL)

## Implementation Base
Should be based on Zephyr official MLX90394 implementation:
https://docs.zephyrproject.org/latest/build/dts/api/bindings/sensor/melexis%2Cmlx90394.html