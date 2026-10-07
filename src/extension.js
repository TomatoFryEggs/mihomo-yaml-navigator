'use strict';
const vscode = require('vscode');
const { parseNavigation } = require('./parser');
function isYaml(doc) { return doc && (doc.languageId === 'yaml' || /\.ya?ml$/i.test(doc.uri.path)); }
function activate(context) {
  const emitter = new vscode.EventEmitter();
  let document;
  let data = { roots: [], errors: [] };
  let timer;
  let view;
  const refresh = () => {
    clearTimeout(timer);
    document = vscode.window.activeTextEditor?.document;
    try { data = isYaml(document) ? parseNavigation(document.getText()) : { roots: [], errors: [] }; }
    catch { data = { roots: [], errors: [{ message: '无法解析当前 YAML；请检查语法。' }] }; }
    view.description = isYaml(document) ? document.uri.path.split('/').pop() : '';
    view.message = !isYaml(document) ? '打开 Mihomo / Clash YAML 配置以查看导航。'
      : data.errors.length ? `YAML 有 ${data.errors.length} 个语法问题；当前目录可能不完整。请先修复 YAML。`
      : data.roots.length ? undefined : '当前文件没有可导航的顶层字段。';
    emitter.fire(undefined);
  };
  const provider = {
    onDidChangeTreeData: emitter.event,
    getChildren: node => node ? node.children : data.roots,
    getTreeItem: node => {
      const item = new vscode.TreeItem(node.label, node.children.length
        ? node.id.split('/').length <= 3 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None);
      item.id = `${document.uri.toString()}/${node.id}`;
      item.description = node.description;
      item.tooltip = `${node.label}${node.description ? ` · ${node.description}` : ''}\n第 ${node.line + 1} 行`;
      const icons = { Module: 'symbol-module', Array: 'symbol-array', String: 'symbol-string',
        Number: 'symbol-number', Boolean: 'symbol-boolean', Variable: 'symbol-variable' };
      item.iconPath = new vscode.ThemeIcon(icons[node.kind] || 'symbol-variable');
      item.command = { command: 'mihomoNavigator.jump', title: '跳转', arguments: [document.uri, node.offset, document.version] };
      return item;
    }
  };
  view = vscode.window.createTreeView('mihomoNavigator.tree', { treeDataProvider: provider, showCollapseAll: true });
  const jump = async (uri, offset, version) => {
    const doc = await vscode.workspace.openTextDocument(uri);
    if (doc.version !== version) { refresh(); return; }
    const editor = await vscode.window.showTextDocument(doc, { preview: false });
    const pos = doc.positionAt(offset);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  };
  const find = async () => {
    refresh();
    if (!isYaml(document)) return;
    const uri = document.uri, version = document.version;
    const choices = [];
    const visit = (nodes, parent = '') => nodes.forEach(node => {
      choices.push({ label: node.label, description: node.description, detail: parent, node });
      visit(node.children, node.label);
    });
    visit(data.roots);
    const selected = await vscode.window.showQuickPick(choices, { placeHolder: '输入策略组、节点、Provider 或顶层字段名称', matchOnDescription: true });
    if (selected) await jump(uri, selected.node.offset, version);
  };
  let symbols;
  const configureSymbols = () => {
    symbols?.dispose(); symbols = undefined;
    if (!vscode.workspace.getConfiguration('mihomoNavigator').get('enableDocumentSymbols')) return;
    symbols = vscode.languages.registerDocumentSymbolProvider([{ language: 'yaml' }, { pattern: '**/*.yaml' }, { pattern: '**/*.yml' }], {
      provideDocumentSymbols(doc) {
        const parsed = parseNavigation(doc.getText());
        const convert = node => {
          const range = new vscode.Range(doc.positionAt(Math.min(node.start, node.offset)), doc.positionAt(node.end));
          const pos = doc.positionAt(node.offset);
          const symbol = new vscode.DocumentSymbol(node.label, node.description,
            vscode.SymbolKind[node.kind] ?? vscode.SymbolKind.Variable, range, new vscode.Range(pos, pos));
          symbol.children = node.children.map(convert);
          return symbol;
        };
        return parsed.roots.map(convert);
      }
    }, { label: 'Mihomo Outline' });
  };
  context.subscriptions.push(view, emitter,
    vscode.commands.registerCommand('mihomoNavigator.refresh', refresh),
    vscode.commands.registerCommand('mihomoNavigator.find', find),
    vscode.commands.registerCommand('mihomoNavigator.jump', jump),
    vscode.window.onDidChangeActiveTextEditor(refresh),
    vscode.workspace.onDidChangeTextDocument(event => {
      if (event.document === vscode.window.activeTextEditor?.document) {
        clearTimeout(timer); timer = setTimeout(refresh, 200);
      }
    }),
    vscode.workspace.onDidChangeConfiguration(e => { if (e.affectsConfiguration('mihomoNavigator')) configureSymbols(); }),
    { dispose() { clearTimeout(timer); symbols?.dispose(); } }
  );
  configureSymbols(); refresh();
  // Shared provider enables actual extension-host integration tests.
  return { provider, refresh };
}
module.exports = { activate };
