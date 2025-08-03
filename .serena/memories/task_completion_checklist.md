# Task Completion Checklist

## Before Starting Any Implementation

### 1. Expert Consultation (MANDATORY)
- [ ] Consult ZMK repository expert via Deepwiki MCP server (repoName: `zmkfirmware/zmk`)
- [ ] Consult Zephyr repository expert via Deepwiki MCP server (repoName: `zephyrproject-rtos/zephyr`)
- [ ] Share current implementation details with experts
- [ ] Share identified problems or requirements
- [ ] Share proposed implementation approach
- [ ] Validate implementation strategy with experts

### 2. Planning
- [ ] Understand current ZMK architecture and APIs
- [ ] Verify latest ZMK best practices
- [ ] Plan implementation based on expert feedback
- [ ] Consider backward compatibility requirements

## During Implementation

### 3. Code Development
- [ ] Follow ZMK and Zephyr coding conventions
- [ ] Base implementation on official Zephyr MLX90394 sensor binding
- [ ] Implement proper error handling
- [ ] Use Zephyr logging system appropriately
- [ ] Follow device tree conventions

### 4. Testing During Development
- [ ] Test I2C communication functionality
- [ ] Verify sensor data reading
- [ ] Test Z-axis threshold detection
- [ ] Verify state-dependent behavior binding
- [ ] Test auto-calibration functionality
- [ ] Test hysteresis and dead zone features

## After Implementation (MANDATORY)

### 5. Build Verification
- [ ] Run mandatory build command:
  ```bash
  export ZMK_CONFIG=zmk-config-MKB2
  just init
  XDG_RUNTIME_DIR=/tmp just build MKB_L_MODULE_RZT
  ```
- [ ] Wait for complete build finish (may take several minutes)
- [ ] Fix any build failures and retry until successful
- [ ] Verify no warnings or errors

### 6. Documentation Update
- [ ] Update README.md with new features
- [ ] Document usage instructions
- [ ] Document configuration options
- [ ] Update implementation status
- [ ] Document any breaking changes

### 7. Quality Assurance
- [ ] Verify code follows project conventions
- [ ] Check for proper error handling
- [ ] Verify logging implementation
- [ ] Test with actual hardware if available
- [ ] Review for security considerations

### 8. Version Control
- [ ] Choose appropriate branch strategy
- [ ] Commit with clear commit messages
- [ ] Consider branch naming for breaking vs non-breaking changes
- [ ] Update version if necessary

## Branch Strategy Compliance
- [ ] Use `v1` for stable features
- [ ] Create `v1-*` branches for non-breaking changes from `v1`
- [ ] Bump to `v2` only for breaking changes
- [ ] Update user's west.yml compatibility notes if needed