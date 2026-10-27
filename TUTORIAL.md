# SVG CLI 操作教程

本教程对应阶段五完成后的可运行版本。当前版本支持完整编辑、结构树查看、画布调整、undo/redo、REPL，以及 SVG 文件读取和保存。

> 文件路径建议使用双引号包裹，尤其是包含空格的中文路径或 Windows 路径。

## 1. 环境要求

- Node.js 22.18 或更高版本。
- 在项目根目录执行命令：

```powershell
cd C:\study\year1\handleSVG\handleSVG
npm run cli
```

启动后会显示：

```text
svg-editor 0.1 — type 'help' for commands
svg> 
```

退出：

```text
exit
```

或：

```text
quit
```

## 2. 第一次使用

创建 800×600 画布：

```text
init 800 600
```

创建矩形：

```text
create rect r1 100 100 160 60 #4a90d9
```

查看结构树：

```text
tree
```

输出类似：

```text
svg (800x600)
└── rect#r1  x=100 y=100 w=160 h=60 fill=#4a90d9
```

查看单个图形：

```text
show r1
```

输出类似：

```text
rect#r1  parent=svg
  x=100 y=100 width=160 height=60
  fill=#4a90d9
```

### 2.1 读取已有 SVG

```text
read <file.svg>
```

示例：

```text
read "C:\diagrams\demo.svg"
```

读取成功后 CLI 会显示元素数量：

```text
read C:\diagrams\demo.svg (7 elements)
```

如果外部 SVG 中的元素缺少 id，会自动生成 id 并打印警告：

```text
warning: assigned id rect1 to unnamed <rect>
```

自动生成的 id 按 `标签名+序号` 形式构造，例如 `rect1`、`rect2`、`circle1`。

### 2.2 保存 SVG

无参数保存到最近一次读取或保存的路径：

```text
save
```

也可以指定新路径：

```text
save "C:\diagrams\output.svg"
```

成功输出：

```text
saved to C:\diagrams\output.svg (7 elements)
```

生成的 SVG 包含 XML 声明、`xmlns`、画布尺寸和 `viewBox`，可以直接用 Chrome、Edge 或 Firefox 打开。

保存失败不会改变当前文档：

```text
error: cannot write file: C:\diagrams\output.svg
```

## 3. 创建图形

所有图形必须使用唯一、大小写敏感的 id。

### 矩形

```text
create rect <id> <x> <y> <width> <height> [fill]
```

示例：

```text
create rect box1 50 50 200 100 #f5a623
```

### 圆

```text
create circle <id> <cx> <cy> <r> [fill]
```

示例：

```text
create circle dot1 300 200 30 red
```

### 椭圆

```text
create ellipse <id> <cx> <cy> <rx> <ry> [fill]
```

示例：

```text
create ellipse oval1 300 200 80 40 blue
```

### 直线

```text
create line <id> <x1> <y1> <x2> <y2> [stroke]
```

示例：

```text
create line edge1 250 150 450 150 black
```

### 文字

文字内容必须使用双引号：

```text
create text <id> <x> <y> "<content>"
```

示例：

```text
create text title1 20 40 "My Diagram"
```

### 空容器

```text
create g <id>
```

示例：

```text
create g group1
```

创建时可以直接指定父容器：

```text
create rect child1 10 10 100 50 red in group1
create text label1 20 40 "Child" in group1
```

## 4. 查看和画布

### 查看完整结构树

```text
tree
```

### 查看指定容器或图形的子树

```text
tree group1
```

### 查看图形属性

```text
show box1
```

### 查看画布尺寸

```text
canvas
```

输出示例：

```text
canvas 800x600
```

### 修改画布尺寸

```text
canvas 1024 768
```

修改画布属于文档类操作。执行后 undo/redo 会暂时锁定，下一次编辑命令会重新解锁。

### 查看帮助

```text
help
```

## 5. 修改图形

### 移动

```text
move <id> <dx> <dy>
```

例如向右移动 20、向下移动 10：

```text
move box1 20 10
```

移动容器时，容器中的全部子孙图形会一起移动。

### 缩放

```text
scale <id> <factor>
```

例如放大为原来的 1.5 倍：

```text
scale box1 1.5
```

缩放容器时，所有子孙图形会递归缩放。因子必须大于 0。

### 修改属性

```text
set <id> <attribute> <value>
```

通用样式属性：

| 属性 | 示例 |
|---|---|
| `fill` | `set box1 fill #f5a623` |
| `stroke` | `set box1 stroke black` |
| `stroke-width` | `set box1 stroke-width 2` |

几何属性：

| 图形 | 可设置属性 |
|---|---|
| rect | `x`、`y`、`width`、`height` |
| circle | `cx`、`cy`、`r` |
| ellipse | `cx`、`cy`、`rx`、`ry` |
| line | `x1`、`y1`、`x2`、`y2` |
| text | `x`、`y`、`text` |

修改文字内容：

```text
set title1 text "Updated title"
```

未知属性会返回错误，例如：

```text
error: unknown attribute: opacity
```

### 删除

```text
delete <id>
```

删除容器时，会连同全部子孙一起删除。

## 6. 分组和层级

### 创建时放入容器

```text
create g node1
create rect node-bg 100 100 160 60 #4a90d9 in node1
create text node-label 120 135 "Start" in node1
```

### 收编已有图形

```text
group <newGid> <id1> <id2> ...
```

示例：

```text
group markers c1 box1
```

### 把已有图形移入容器

```text
addto <gid> <id>
```

示例：

```text
addto node1 edge1
```

### 解散容器

```text
ungroup <gid>
```

注意事项：

- 根级容器不能直接 `ungroup`。
- 容器不能收编自己的祖先或子孙。
- `group` 中不能同时选择某容器及其子孙。

### 调整 z-order

```text
front <id>
back <id>
```

## 7. 撤销和重做

撤销上一次编辑：

```text
undo
```

重做：

```text
redo
```

规则：

- 一条编辑命令对应一个 undo 单元。
- 执行新编辑后，redo 栈会被清空。
- `tree`、`show`、`help` 不进入历史栈。
- 执行 `init`、`read`、`save`、修改 `canvas` 等文档操作后，undo/redo 会暂时锁定，下一次编辑后重新解锁。
- `read` 会替换当前文档并清空历史；`save` 不会改变文档结构。

## 8. 完整示例：普通示意图

可以逐行复制以下命令：

```text
init 800 600
create rect bg 0 0 800 600 #ffffff
create text title 20 40 "My Diagram"
create circle c1 100 100 20 red
create rect box 200 80 60 60 #3366ff
group markers c1 box
tree
show c1
move c1 30 0
undo
redo
set title text "My Diagram v2"
delete box
undo
tree
save "demo.svg"
exit
```

## 9. 完整示例：两节点流程图

```text
init 800 600
create g flowchart
create g node1 in flowchart
create rect start 120 100 160 60 #4a90d9 in node1
create text start-label 155 135 "开始" in node1
create g node2 in flowchart
create rect process 520 100 160 60 #f5a623 in node2
create text process-label 545 135 "处理数据" in node2
create line arrow1 280 130 520 130 black in flowchart
tree
move node2 0 100
undo
set process-label text "处理数据 v2"
tree flowchart
save "flowchart.svg"
exit
```

## 10. 常见错误

图形 id 不存在：

```text
error: no such shape: missing
```

图形 id 重复：

```text
error: id already exists: r1
```

父容器不存在：

```text
error: no such container: missing
```

目标不是容器：

```text
error: not a container: r1
```

非法缩放因子：

```text
error: scale factor must be positive
```

未创建画布就执行编辑：

```text
error: no document. use 'init' or 'read' first
```

文件不存在或无法解析：

```text
error: cannot read file: C:\diagrams\missing.svg
```

文件不可写：

```text
error: cannot write file: C:\diagrams\output.svg
```

首次保存但没有当前路径：

```text
error: save requires a file path
```

## 11. 运行测试

```powershell
cd C:\study\year1\handleSVG\handleSVG
npm test
```