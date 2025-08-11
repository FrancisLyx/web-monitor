# Vue3 + TypeScript Monorepo Template

基于 Vue 3 + TypeScript 的现代化 Monorepo 架构模板，集成完整的代码质量保障工具链。

## 特性

- 🏗️ **Monorepo 架构**: 使用 pnpm workspace 管理多包项目
- ⚡ **Vue 3 + TypeScript**: 最新的 Vue 3 Composition API + 完整 TypeScript 支持
- 🔧 **完整工程化**: ESLint、Stylelint、Prettier、CommitLint 等代码质量工具
- 📦 **包管理**: pnpm 高效包管理，支持依赖提升和缓存
- 🎯 **类型检查**: 严格的 TypeScript 配置，保证代码质量
- 🚀 **开发体验**: 热重载、快速构建、智能提示

## 包含的工程化工具

### 代码质量

- **ESLint**: JavaScript/TypeScript 代码检查，支持 Vue 3 语法
- **Stylelint**: CSS/SCSS 样式检查，支持 Vue SFC
- **Prettier**: 代码格式化，统一代码风格
- **TypeScript**: 类型检查，提供完整的类型安全

### 提交规范

- **Commitizen (cz-git)**: 交互式提交信息生成
- **CommitLint**: 提交信息格式验证
- **Husky**: Git hooks 管理，自动化代码检查

### 拼写检查

- **CSpell**: 代码拼写检查，支持自定义词典

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 代码检查
pnpm lint           # ESLint 检查并修复
pnpm lint:style     # Stylelint 样式检查
pnpm spellcheck     # 拼写检查

# 提交代码
git add .           # 添加暂存区
pnpm commit         # 使用 commitizen 交互式提交
```

## 项目结构

```
vue3-ts-monorepo-template/
├── packages/
│   └── core/           # 核心应用包
├── apps/               # 应用目录（可选）
├── eslint.config.js    # ESLint 配置
├── stylelint.config.js # Stylelint 配置
├── commitlint.config.js # CommitLint 配置
├── pnpm-workspace.yaml # pnpm workspace 配置
└── package.json        # 根包配置
```

## 配置说明

### ESLint

- 支持 Vue 3 + TypeScript
- 严格的类型检查规则
- 自动导入排序
- 安全规则检查

### Stylelint

- 支持 Vue SFC 样式检查
- CSS 标准规则
- 自动修复格式问题

### CommitLint

- 遵循 Conventional Commits 规范
- 支持中英文提交信息
- 自动生成 CHANGELOG

## 添加新包

```bash
# 在 packages/ 目录下创建新包
mkdir packages/new-package
cd packages/new-package
pnpm init

# 安装包依赖
pnpm add dependency-name --filter new-package
```
