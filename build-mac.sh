#!/bin/bash
# 跳过TypeScript检查，直接构建
electron-vite build

# 然后使用electron-builder构建Mac版本
electron-builder --mac
