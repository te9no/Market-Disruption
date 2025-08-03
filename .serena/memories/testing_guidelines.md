# Testing Guidelines

## Testing Framework
- ZMK uses its own testing framework based on Zephyr
- Specific testing commands to be determined based on ZMK expert consultation
- Hardware-in-the-loop testing may be required for sensor functionality

## Test Categories

### 1. Unit Testing
- Test individual driver functions
- Test I2C communication layer
- Test sensor data processing functions
- Test calibration algorithms
- Test threshold detection logic

### 2. Integration Testing
- Test device tree configuration parsing
- Test behavior binding integration
- Test input system integration
- Test state management between normal and pressed modes

### 3. Hardware Testing
- Test with actual MLX90393 sensor hardware
- Verify I2C communication stability
- Test sensor calibration accuracy
- Verify threshold detection reliability
- Test hysteresis functionality

### 4. Performance Testing
- Verify 10ms polling interval performance
- Test sensor responsiveness
- Monitor CPU usage and power consumption
- Test long-term stability

## Testing Requirements

### Pre-Implementation Testing
- Consult ZMK repository expert for current testing practices
- Understand ZMK testing framework capabilities
- Plan test coverage for new sensor driver

### During Development Testing
- Incremental testing of each component
- Mock hardware testing for I2C communication
- Unit test critical algorithms

### Build Testing (MANDATORY)
Always run the mandatory build verification:
```bash
export ZMK_CONFIG=zmk-config-MKB2
just init
XDG_RUNTIME_DIR=/tmp just build MKB_L_MODULE_RZT
```

### Post-Implementation Testing
- Full integration testing
- Hardware compatibility testing
- Performance verification
- Long-term stability testing

## Test Environment Setup
- Windows development environment
- Zephyr RTOS testing tools
- ZMK testing framework
- Hardware testing setup with MLX90393 sensor

## Debug and Logging for Testing
- Use `CONFIG_INPUT_LOG_LEVEL` for input subsystem debugging
- Monitor `tlx493d` log module for sensor-specific logs
- Enable Zephyr logging system for comprehensive debugging
- Use appropriate log levels for different test phases

## Test Documentation
- Document test procedures
- Maintain test result records
- Document known issues and workarounds
- Update testing guidelines based on experience