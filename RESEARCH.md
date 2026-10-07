# 现有扩展调研

调研日期：2026-10-07。搜索范围：Visual Studio Marketplace 和 GitHub；关键词包括 YAML outline array name / label field，以及 Mihomo / Clash VS Code 扩展。

没有找到适合直接推荐给 Mihomo 配置、可按 `name` 展示数组对象的通用导航扩展。这是本次公开搜索的结论，不是对所有扩展的穷尽证明。

| 候选 | 核实的能力 | 是否满足本次需求 |
| --- | --- | --- |
| [YAML by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) | YAML 校验、补全和层级 Outline | 当前 [符号实现](https://github.com/redhat-developer/yaml-language-server/blob/main/src/languageservice/services/documentSymbols.ts) 的数组项标题是 `String(index)`，不是对象的 `name` |
| [YAML Outline](https://marketplace.visualstudio.com/items?itemName=wongyouth.yaml-outline) | 键路径符号导航、叶节点过滤、状态栏键路径 | 公布的设置中没有数组对象标题字段设置，不能据此推荐来解决 `name` 标题 |
| [Meta JSON Schema](https://marketplace.visualstudio.com/items?itemName=ClashMeta.meta-json-schema) | Mihomo 配置补全、错误提示、格式化 | 公布功能没有按名称显示数组项的导航树 |
| [Clash VSCode Snippets](https://marketplace.visualstudio.com/items?itemName=Fndroid.clash-vscode) | 节点、策略组和 Provider 代码片段 | 没有该导航功能 |
| [Clash](https://marketplace.visualstudio.com/items?itemName=suiwenfeng.vscode-clash) | 配置发现、分享、延迟测试、连接管理 | 没有公布该导航功能 |
| [CobiSymbolOutline](https://marketplace.visualstudio.com/items?itemName=cobinja.cobi-symbol-outline) | 展示其他语言扩展提供的符号，可排序、筛选 | YAML 依赖 Red Hat 的符号，未公布把数组项重新命名为字段值的功能 |
| [Galaxy Workflows](https://marketplace.visualstudio.com/items?itemName=davelopez.galaxy-workflows) | 自定义 Outline 可展示工作流步骤名称 | 面向 Galaxy 工作流格式，不能作为 Mihomo 通用扩展推荐 |
| [OpenChoreo (Unofficial)](https://marketplace.visualstudio.com/items?itemName=KavithLokuhewage.openchoreo-unofficial) | OpenChoreo YAML 数组可按 name/id/instanceName 命名 | 面向 OpenChoreo 平台及其资源，并依赖其 CLI / 登录环境，不适合作为单纯 Mihomo 配置导航工具 |

另排除 [Clash Toolkit](https://marketplace.visualstudio.com/items?itemName=LucasBollen.clash-toolkit)：它面向同名 Haskell 硬件描述语言，与代理配置无关。

因此交付本地扩展 **Mihomo YAML Navigator**：独立 TreeView 默认与 Red Hat YAML 共存，原生 DocumentSymbolProvider 作为可选项。实现参考 [VS Code Tree View API](https://code.visualstudio.com/api/extension-guides/tree-view) 和 [yaml 文档及 AST 范围 API](https://eemeli.org/yaml/)。
