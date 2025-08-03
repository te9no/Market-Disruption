# Code Style and Conventions

## General Principles
- Follow ZMK and Zephyr coding conventions
- Base implementation on official Zephyr MLX90394 sensor binding
- Maintain consistency with existing ZMK input drivers

## Critical Development Rules
1. **MANDATORY**: Consult ZMK repository expert before ANY implementation changes
2. **MANDATORY**: Consult Zephyr repository expert for Zephyr-specific details
3. **NO ASSUMPTIONS**: Always verify current ZMK practices before implementation
4. **EXPERT FIRST**: Consult experts before coding, not after build failures

## File Naming Conventions
- Driver implementation: `drivers/input/input_*.c`
- Driver headers: `drivers/input/input_*.h`
- Device tree bindings: `dts/bindings/input/*.yaml`
- Build files: `CMakeLists.txt`, `Kconfig`
- Module definition: `zephyr/module.yml`

## Coding Standards
- C language following Zephyr style guidelines
- Proper error handling throughout
- Use Zephyr logging system for debugging
- Follow device tree conventions for configuration
- Implement proper I2C communication patterns

## Configuration Naming
- Use consistent prefix for configuration options
- Follow ZMK behavior binding patterns
- Device tree properties should match expected conventions:
  - `polling-interval-ms`
  - `z-press-threshold`
  - `z-hysteresis`
  - `normal-binding`
  - `pressed-binding`

## Documentation Requirements
- Update README.md after any changes
- Maintain clear documentation of features and usage
- Document configuration options and their effects