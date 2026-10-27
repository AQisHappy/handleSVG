# handleSVG

高级软件工程作业：SVG CLI 编辑器。

## 当前阶段

阶段二：SVG 领域模型与 Composite 结构。

已实现：

- `rect`、`circle`、`ellipse`、`line`、`text`、`g` 六种图形模型。
- 文档树、唯一 id 索引、父子关系和 z-order。
- 容器与叶子图形的统一移动、缩放、属性修改和删除。
- `group`、`ungroup`、`addto` 及非法结构操作保护。
- 阶段二领域单元测试。

## 测试命令

```powershell
npm test
```

监听模式：

```powershell
npm run test:watch
```

安装开发依赖后可执行 TypeScript 类型检查：

```powershell
npm install
npm run typecheck
```
