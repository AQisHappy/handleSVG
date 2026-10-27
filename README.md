# handleSVG

高级软件工程作业：SVG CLI 编辑器。

## 当前状态

阶段六：质量保证与项目文档已完成。

已实现：

- `rect`、`circle`、`ellipse`、`line`、`text`、`g` 六种图形模型。
- 文档树、唯一 id 索引、父子关系和 z-order。
- Command 模式、Composite、ShapeFactory、UndoManager 和 SVG IO Adapter。
- 完整命令：`init`、`read`、`save`、`canvas`、`create`、`delete`、`move`、`scale`、`set`、`group`、`ungroup`、`addto`、`front`、`back`、`tree`、`show`、`undo`、`redo`、`help`。
- SVG XML 读取、序列化、缺 id 补全和 round-trip。
- REPL、错误隔离和浏览器可直接打开的 SVG 输出。
- 61 项自动化测试。

## 文档

- [项目架构、过程记录、一致性自查与质量保证](./doc/README.md)
- [完整操作教程](./TUTORIAL.md)

## 运行 CLI

```powershell
npm run cli
```

退出：

```text
exit
```

## 验证命令

```powershell
npm run verify
```

该命令依次执行 TypeScript 语法检查、严格类型检查和全部自动化测试。

严格类型检查也可以单独执行：

```powershell
npm run typecheck
```