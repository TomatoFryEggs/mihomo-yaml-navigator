# 验证记录

日期：2026-10-07；环境：macOS，Node.js 26.10.0，VS Code 1.141.0。

- 9 项解析测试通过：名称和类型、精确行号和偏移、行内对象、CRLF、emoji、引号、缺失名称、重复名称、别名和合并字段、循环合并终止、多文档、损坏 YAML、2000 节点配置、直接成员子节点、同组成员去重、块式和行内位置、任意嵌套对象和数组、单行值预览、类型图标映射。
- 真实 VS Code 扩展宿主测试通过：扩展发现及激活、TreeView 标题和类型、实际跳转至 name 及 proxies 成员的行与列、编辑后自动刷新、旧目录命令的偏移保护、可选原生 DocumentSymbolProvider、数组及布尔值图标、嵌套 nameserver 点击定位、切换到非 YAML 编辑器后清空目录。
- esbuild 成功打包，YAML 运行依赖已内嵌。
- VSCE 成功生成 VSIX；隔离扩展目录实际安装成功，列出 `local-tools.mihomo-yaml-navigator@0.2.0`。
- VSIX 的运行代码与源码构建结果逐字节一致；无 node_modules、测试缓存或用户配置被打包。

这些是自动化解析、VS Code API 集成与安装测试。没有声称测试了所有 VS Code 版本、所有 YAML 写法或 Mihomo 内核运行结果。未在用户日常 VS Code 配置中安装扩展。
