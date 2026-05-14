# Google Stitch MCP（本仓库）

远程地址在 [.cursor/mcp.json](D:/test/.cursor/mcp.json) 的 `mcpServers.stitch.url`（`https://stitch.googleapis.com/mcp`）。密钥仅应保存在本地，勿提交到版本库。

## 与 Cursor 一起使用

在 Cursor 中启用 Stitch MCP 后，可用内置 MCP 工具调用与下方脚本相同的 JSON-RPC `tools/call`。

## 与 `scripts/stitch-bootstrap.mjs` 一起使用

在项目根目录执行（需 Node 18+）：

```bash
node scripts/stitch-bootstrap.mjs
```

脚本会：

1. 读取 `.cursor/mcp.json` 中的 Stitch `url` 与 `X-Goog-Api-Key`
2. 调用 `create_project` → `create_design_system` → 按数组对每个屏幕调用 `generate_screen_from_text`
3. 将汇总元数据写入仓库根目录 `stitch-output.json`

### 复用已有 `projectId`

若你已在一次运行中得到 `stitch-output.json` 里的 `projectId`，可不重复创建项目：在脚本中为 `create_project` 加条件跳过，或手工把 `projectId` / `designSystemId` 填回脚本常量后再生成新屏。详见 [scripts/stitch-bootstrap.mjs](D:/test/scripts/stitch-bootstrap.mjs) 文件头注释。

### 设计对齐

生成 prompt 时建议附带与 [docs/stitch_prd_design_generator/DESIGN.md](D:/test/docs/stitch_prd_design_generator/DESIGN.md) 一致的约束：羊皮纸背景 `#F7F4ED`、炭黑主色 `#1C1C1C`、分割线 `#ECEAE4`。需要深色参考时在 prompt 中明确要求 **dark mode / night theme**；落地实现仍以小程序内主题变量为准。

## 小程序页面

设计稿 HTML 位于 [docs/stitch_prd_design_generator](D:/test/docs/stitch_prd_design_generator)，真机 UI 以 `pages/**` 的 WXML/WXSS 为准。
