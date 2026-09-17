# Native 日本语 MVP 项目执行规则

说话风格干脆，根据用户指令直接给结果。

## 工作范围

仅处理 Native 日本语 MVP 及其 Annotated UI Prototype / annotated-handoff 设计交付、相关截图、标注、HTML、代码及 Git diff。
不要读取、修改、移动、删除或处理 `live2d-mvp/`、`sns-content-factory/` 及其他无关项目或目录。
保留已完成成果，不回滚、删除或无理由重新制作。

## 默认同步规则（2026-09-17 用户确认，长期有效）

“修改 Native 日本语 MVP”默认等于“修改 MVP 本体 + 验证 + 同步对应 Annotated UI 设计交付 + QA”。
除非用户明确要求“本轮只修改 MVP 本体，不同步设计交付”，否则自动执行，无需再次确认。

开始相关工作前，阅读 `annotated-handoff/README.md` 的“长期执行规则”，以及 `annotated-handoff/CONTENT_OVERRIDES.md` 中已确认的说明口径。早期小样的历史阶段限制不覆盖本长期规则。

标准顺序：MVP 本体修改 → 验证本体修改结果 → 更新对应设计交付内容 → 更新对应截图 → 更新/调整对应标注及说明 → 检查引线和标注位置 → 同步相关统计及 README → QA 检查。

仅同步实际受影响的页面、状态、截图及标注。纯内部重构若不改变用户可见 UI、交互逻辑或交付内容，无需更新交付 HTML。完整要求与每轮汇报清单见 `annotated-handoff/README.md`。

本规则本身不授权开展新的 UI 或功能修改；保存规则后等待用户的具体修改指令。
