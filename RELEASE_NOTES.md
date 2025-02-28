# Cherry Studio 1.0.1 发布说明

## 新特性

- 增强的类型安全性，预防了"Cannot read properties of undefined"类型的运行时错误
- 实现了安全的数组和对象访问工具函数，提高了应用程序稳定性
- 修复了TypeScript类型定义问题，确保更好的开发体验

## 安装说明

### macOS

1. 下载适合您的Mac处理器的版本:
   - Apple Silicon (M系列芯片): `Cherry Studio-1.0.1-arm64.dmg`
   - Intel处理器: `Cherry Studio-1.0.1-x64.dmg`

2. 打开DMG文件，将Cherry Studio拖到Applications文件夹中

3. 如果遇到"无法打开Cherry Studio，因为Apple无法检查其是否包含恶意软件"的提示，请在终端中运行以下命令:
   ```bash
   sudo xattr -r -d com.apple.quarantine /Applications/Cherry\ Studio.app
   ```

### Windows

Windows版本需要在Windows环境下构建。要在Windows上构建应用程序：

1. 克隆代码库并安装依赖:
   ```bash
   git clone https://github.com/yourorg/cherry-studio.git
   cd cherry-studio
   yarn install
   ```

2. 构建Windows版本:
   ```bash
   yarn build:win
   ```

3. 构建完成后，安装包将位于`dist`目录中

## 已知问题

- 在macOS上构建Windows版本可能会遇到原生模块编译问题，建议在Windows环境下构建
- 某些模型设置页面可能需要调整以适应不同的屏幕尺寸

## 反馈与支持

如有任何问题或建议，请通过GitHub issues提交反馈。
