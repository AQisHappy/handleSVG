# handleSVG

高级软件工程作业：SVG CLI 编辑器。

## 当前阶段

阶段五：SVG 读写与持久化。

已实现：

- `rect`、`circle`、`ellipse`、`line`、`text`、`g` 六种图形模型。
- 文档树、唯一 id 索引、父子关系和 z-order。
- 容器与叶子图形的统一移动、缩放、属性修改和删除。
- `group`、`ungroup`、`addto` 及非法结构操作保护。
- Command 模式、命令分发器和 ShapeFactory。
- 完整命令：`init`、`read`、`save`、`canvas`、`create`、`delete`、`move`、`scale`、`set`、`group`、`ungroup`、`addto`、`front`、`back`、`tree`、`show`、`undo`、`redo`、`help`。
- SVG XML 读取、序列化和浏览器可直接打开的 SVG 输出。
- 外部 SVG 缺失 id 时自动补全并输出警告。
- `save` 支持默认保存到读取路径或显式指定新路径。
- 读写失败不影响当前文档和历史状态。
- 结构树内联几何属性，`show` 展示单个图形详情。
- 一条编辑命令对应一个 undo 单元，redo 栈在新编辑后清空。
- 文档类命令后的 undo/redo 锁定规则。
- 支持注释和双引号参数的 REPL，错误统一以 `error:` 输出。

## 操作教程

完整教程见 [TUTORIAL.md](./TUTORIAL.md)。

## 运行 CLI

```powershell
npm run cli
```

退出 REPL：

```text
exit
```

或：

```text
quit
```

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