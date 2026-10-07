# Mihomo YAML Navigator

给 Mihomo / Clash YAML 配置提供按名称显示的导航树。最低要求：桌面版 VS Code 1.85。

## 安装

1. 在 VS Code 中打开扩展面板（macOS `⌘⇧X`，Windows / Linux `Ctrl+Shift+X`）。
2. 点击扩展面板右上角 `…` → **Install from VSIX… / 从 VSIX 安装…**。
3. 选择 `mihomo-yaml-navigator-0.2.0.vsix`。
4. 如果提示重新加载窗口，点击重新加载。

也可以在已配置 `code` 命令的终端执行：

```sh
code --install-extension ./mihomo-yaml-navigator-0.2.0.vsix
```

当前可从 [GitHub Releases](https://github.com/TomatoFryEggs/mihomo-yaml-navigator/releases) 下载 VSIX。Marketplace 上架正在准备中；`local-tools` 是本地包的临时发布者标识。

## 使用

打开 `.yaml` / `.yml` 配置，在左侧**资源管理器 → Mihomo 导航**中展开目录。无论文件名是否叫 `config.yaml` 都可使用；扩展读取当前编辑器的内容，包括尚未保存的修改。

```text
proxy-providers
  示例订阅              http
rule-providers
  示例规则              http
proxies
  🇭🇰 示例节点           socks5
  行内节点              http
proxy-groups
  🚀 节点选择            select
    DIRECT
    🇭🇰 示例节点
  🤖 AI                 select
    🚀 节点选择
    DIRECT
dns
rules
```

- 点击策略组或节点，跳到它的 `name:` 所在行。
- 展开 name 节点，直接查看成员；点击成员跳到列表中的对应行。支持块式和行内列表。
- 点击 Provider，跳到它的对象键名所在行。
- 点击 `dns`、`tun`、`rules` 等顶层字段，跳到该字段所在行。
- 修改配置后自动刷新（200 毫秒防抖）；标题栏刷新按钮可手动刷新。
- 点击标题栏搜索按钮，或打开命令面板运行 **Mihomo: 按名称跳转**，输入名称搜索。
- 如侧边栏未显示，运行 **View: Open View… / 视图: 打开视图…**，选择 **Mihomo 导航**。

可以保留 **YAML by Red Hat**。默认不注册原生符号提供器，因此侧边栏可以与它的 Outline 同时使用。

## 图标与单行值

参考 Red Hat YAML 的符号类型映射，对象、数组、字符串、数字、布尔值分别使用 VS Code 原生符号图标，适配当前主题。

短标量显示在字段名旁边，例如 `mixed-port : 7890`、`enable : true`、`path : ./rules.yaml`。超过 100 字符或包含换行的值不预览；VS Code 会按侧边栏实际宽度截断显示。空数组和空对象显示 `: []`、`: {}`，非空容器展开子项。数组中的标量直接显示其内容。名称对象的 `name` 和 `type` 已在标题行展示，不再重复生成字段行。深层目录默认折叠，避免展开后过长。

YAML 别名显示为 `*锚点` 引用，不递归展开引用目标，点击定位到引用处；有名称的对象别名仍可提取名称和类型。目录最多递归 64 层、详细展开 20000 项，超出后显示省略提示。

## 可选：原生 Outline 和 ⌘⇧O

如果更喜欢原生 Outline、面包屑或 Go to Symbol，在设置中搜索并勾选 `Mihomo Navigator: Enable Document Symbols`，或添加：

```json
{
  "mihomoNavigator.enableDocumentSymbols": true
}
```

随后 macOS `⌘⇧O` / Windows、Linux `Ctrl+Shift+O` 可按节点名称跳转。如果同时启用了其他 YAML 符号提供器，VS Code 可能合并或展示多个提供器的目录。此时可关闭本扩展的该选项，继续使用独立侧边栏。

## 支持范围

- `proxy-groups`、`proxies` 的直接 YAML 数组：取元素的 `name` 为标题，`type` 为描述。
- `rule-providers`、`proxy-providers` 的直接 YAML 对象：取对象键名为标题，`type` 为描述。
- 任意层级的对象和数组都可以展开，包括 `dns.nameserver`、`use`、`rules`、Provider 内部属性；有 `name` 的数组对象按名称显示，没有名称则显示 `(未命名 #N)`。
- 元素中直接声明的 `proxies` 列表成员直接作为 name 的子节点（不显示 proxies 中间层，同组同名成员只显示一次，定位至第一次出现处）；锚点继承的成员列表暂不展开。
- 块式 / 行内 YAML、中文、emoji、带引号的名称、CRLF 换行、多文档。
- 数组元素别名及元素的 `<<` 合并字段；显式字段优先。整段 `proxies: *alias` 等顶层容器别名不展开。
- 没有名称的数组元素显示 `(未命名 #N)`；同名项不会被合并。
- 名称来自锚点时，点击跳到该元素的本地引用或映射起始位置，而非锚点定义。
- YAML 有语法错误时，侧边栏提示目录可能不完整；语法修复后恢复。

它只做当前文件的导航，不检查 Mihomo 配置语义，不下载订阅或 Provider，不连接 Mihomo API，不修改配置。扩展自身没有网络请求或遥测；密码、令牌等常见敏感字段显示为 `•••`，不展开敏感数组内容。

## 从源码构建

需要 Node.js 22.12+ 和 npm（打包工具要求；安装 VSIX 不需要 Node.js）。

```sh
npm ci
npm test
npm run build
npm run test:integration
npm run package
```

`test:integration` 默认下载并启动隔离的 VS Code 测试实例。也可指定已有 VS Code 可执行文件，例如 macOS：

```sh
VSCODE_EXECUTABLE_PATH='/Applications/Visual Studio Code.app/Contents/MacOS/Code' npm run test:integration
```

用户数据和扩展目录使用独立临时目录，不覆盖日常 VS Code 配置。打开整个项目，构建后按 F5 可调试。`examples/demo.yaml` 是仅供导航演示的配置，里面的订阅网址是占位值。

完整源码、锁文件、测试和演示配置随项目 ZIP 交付；VSIX 内的运行代码已包含 YAML 解析库，安装后无需下载依赖。许可证见 `LICENSE` 和 `THIRD_PARTY_NOTICES.txt`，隐私说明见 [PRIVACY.md](PRIVACY.md)。
