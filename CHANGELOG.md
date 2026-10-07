# Changelog

## 0.2.1

- 扩展、侧边栏和命令显示名称统一为 Mihomo Outline。
- 使用小猫轮廓、导航树与 mihomo 字样的 PNG 图标。
- 保持扩展 ID、命令 ID 和配置键不变，支持原有正式版升级。

## 0.2.0

- 递归显示任意顶层字段中的对象与数组，包括 dns、use、rules、Provider 属性。
- 根据对象、数组、字符串、数字、布尔值等类型匹配 VS Code 原生符号图标。
- 字段后显示短单行值；长文本、多行文本省略预览，敏感字段隐藏值。
- 保留 name 标题和 proxies 成员直接挂在名称下的布局。

## 0.1.2

- 去掉策略组内部的 proxies 中间层，直接展示成员子节点；同组同名成员仅显示一次，定位到第一次出现的位置。

## 0.1.1

- 策略组 name 节点下展开 proxies 字段及成员列表；支持块式、行内列表和成员点击定位。

## 0.1.0

- Name-based Mihomo / Clash YAML sidebar with type descriptions and source navigation.
- Proxy and rule provider navigation, top-level section navigation, quick search.
- Automatic refresh, aliases / merge fields, optional native document symbols.
