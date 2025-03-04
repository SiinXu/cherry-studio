#!/bin/bash
# 跳过TypeScript检查，直接构建
NODE_ENV=production electron-vite build

# 然后使用electron-builder构建Mac版本，并跳过node-gyp重建
NODE_GYP_FORCE_PYTHON=python3 ELECTRON_BUILDER_SKIP_REBUILD=true electron-builder --mac -c.mac.identity=null
