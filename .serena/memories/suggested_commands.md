# Suggested Commands

## Windows-specific Commands
Since the project is developed on Windows, use these commands:

### File Operations
- `dir` - List directory contents
- `type filename` - Display file contents
- `copy source dest` - Copy files
- `del filename` - Delete files
- `mkdir dirname` - Create directory

### Git Operations
- `git status` - Check repository status
- `git add .` - Stage all changes
- `git commit -m "message"` - Commit changes
- `git push` - Push to remote
- `git pull` - Pull from remote
- `git branch` - List branches
- `git checkout -b branch-name` - Create and switch to new branch

### Build Commands (MANDATORY)
**Critical**: After any implementation or modification, run:
```bash
export ZMK_CONFIG=zmk-config-MKB2
just init
XDG_RUNTIME_DIR=/tmp just build MKB_L_MODULE_RZT
```

**Note**: Build may take several minutes. Wait for complete finish before determining success.

### Development Workflow Commands
1. **Before implementation**: Consult repository experts
2. **After changes**: Run mandatory build verification
3. **On success**: Update documentation
4. **Testing**: Use appropriate ZMK testing frameworks (TBD)

### Branch Management
- **Stable branch**: `v1`
- **Breaking changes**: Bump to `v2`
- **Non-breaking changes**: Create from `v1` with prefix `v1-`

### Environment Setup
- Use `just` for build automation
- Set `ZMK_CONFIG=zmk-config-MKB2` environment variable
- Set `XDG_RUNTIME_DIR=/tmp` for build process

### Debugging Commands
- Check Zephyr logs with appropriate log level settings
- Use `CONFIG_INPUT_LOG_LEVEL` for input-specific logging
- Monitor `tlx493d` log module for sensor-specific debug info