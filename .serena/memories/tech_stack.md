# Technology Stack

## Primary Technologies
- **Framework**: ZMK (Zephyr Mechanical Keyboard) firmware
- **Operating System**: Zephyr RTOS
- **Hardware**: MLX90393 3-axis magnetic sensor
- **Communication Protocol**: I2C
- **Language**: C (Zephyr/ZMK style)

## Development Environment
- **Platform**: Windows
- **Build System**: Just (justfile-based)
- **Version Control**: Git
- **Configuration**: West (Zephyr workspace tool)

## Key Dependencies
- Zephyr RTOS framework
- ZMK firmware framework
- MLX90393 sensor hardware support
- I2C subsystem
- Input subsystem
- Device Tree system

## Reference Implementation
- Zephyr official MLX90394 sensor binding as base reference
- ZMK input system integration patterns

## Logging and Debugging
- Zephyr logging system
- Log level: `CONFIG_INPUT_LOG_LEVEL`
- Log module: `tlx493d` (as mentioned in CLAUDE.md)