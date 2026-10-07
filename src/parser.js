'use strict';
const YAML = require('yaml');

// Read only the requested scalar field; never expand an entire alias graph.
function field(node, key, doc, seen = new Set()) {
  if (!node || seen.has(node) || seen.size > 64) return undefined;
  seen.add(node);
  if (YAML.isAlias(node)) return field(node.resolve(doc), key, doc, seen);
  if (!YAML.isMap(node)) return undefined;
  const pair = node.items.find(p => YAML.isScalar(p.key) && p.key.value === key);
  if (pair) {
    let value = pair.value;
    if (YAML.isAlias(value)) value = value.resolve(doc);
    return YAML.isScalar(value) ? value.value : undefined;
  }
  const merge = node.items.find(p => YAML.isScalar(p.key) && (p.key.value === '<<' || typeof p.key.value === 'symbol'));
  if (!merge) return undefined;
  const sources = YAML.isSeq(merge.value) ? merge.value.items : [merge.value];
  for (const source of sources) {
    const value = field(source, key, doc, new Set(seen));
    if (value !== undefined) return value;
  }
}
function label(value, fallback) {
  return value === undefined || value === null || String(value).trim() === ''
    ? fallback : String(value).replace(/[\r\n]+/g, ' ');
}
function parseNavigation(text) {
  const lineCounter = new YAML.LineCounter();
  const docs = YAML.parseAllDocuments(text, { lineCounter, strict: false });
  const roots = [], errors = [];
  const sensitive = /^(password|passwd|secret|token|authorization|authentication|private-key|uuid)$/i;
  const kind = node => YAML.isMap(node) ? 'Module' : YAML.isSeq(node) ? 'Array'
    : YAML.isAlias(node) ? 'Variable' : YAML.isScalar(node)
      ? typeof node.value === 'number' ? 'Number' : typeof node.value === 'boolean' ? 'Boolean'
        : node.value === null ? 'Variable' : 'String' : 'Variable';
  const preview = (node, key) => {
    if (sensitive.test(key)) return ': •••';
    if (YAML.isAlias(node)) return `: *${node.source}`;
    if (YAML.isMap(node)) return node.items.length ? '' : ': {}';
    if (YAML.isSeq(node)) return node.items.length ? '' : ': []';
    const value = YAML.isScalar(node) ? node.value : null;
    const valueText = value === null ? 'null' : String(value);
    return valueText.includes('\n') || valueText.includes('\r') || valueText.length > 100 ? '' : `: ${valueText}`;
  };
  const make = (title, description, node, selection, id, children = []) => {
    const start = node?.range?.[0] ?? selection?.range?.[0] ?? 0;
    const offset = selection?.range?.[0] ?? start;
    const pos = lineCounter.linePos(offset);
    return { label: title, description, kind: kind(node), start,
      end: Math.max(node?.range?.[1] ?? start, offset), offset,
      line: pos.line - 1, column: pos.col - 1, id, children };
  };
  docs.forEach((doc, di) => {
    errors.push(...doc.errors.map(e => ({ message: e.message, offset: e.pos?.[0] ?? 0 })));
    let count = 0;
    const build = (node, title, selection, id, depth = 0, named = false) => {
      if (depth > 64 || ++count > 20000) return make('…', '目录过大，已省略后续内容', node, selection, id);
      const children = [];
      if (YAML.isMap(node)) {
        node.items.forEach((pair, pi) => {
          if (!YAML.isScalar(pair.key)) return;
          const key = String(pair.key.value);
          if (named && (key === 'name' || key === 'type')) return;
          if (named && key === 'proxies' && YAML.isSeq(pair.value)) {
            const names = new Set();
            pair.value.items.forEach((member, mi) => {
              const child = sequenceItem(member, mi, `${id}/${pi}/${mi}`, depth + 1);
              if (names.has(child.label)) return;
              names.add(child.label);
              children.push(child);
            });
          } else {
            const child = build(pair.value, key, pair.key, `${id}/${pi}`, depth + 1);
            if (sensitive.test(key)) { child.description = ': •••'; child.children = []; }
            children.push(child);
          }
        });
      } else if (YAML.isSeq(node)) {
        node.items.forEach((item, i) => children.push(sequenceItem(item, i, `${id}/${i}`, depth + 1)));
      }
      const result = make(title, named ? label(field(node, 'type', doc), '') : preview(node, title), node, selection, id, children);
      // Provider maps retain their key as title and expose their configuration children.
      if (!named && YAML.isMap(node) && field(node, 'type', doc) !== undefined) result.description = label(field(node, 'type', doc), '');
      return result;
    };
    const sequenceItem = (item, i, id, depth) => {
      const name = field(item, 'name', doc);
      const namePair = YAML.isMap(item) && item.items.find(p => YAML.isScalar(p.key) && p.key.value === 'name');
      if (YAML.isMap(item) || YAML.isAlias(item)) {
        const title = label(name, YAML.isAlias(item) ? `*${item.source}` : `(未命名 #${i + 1})`);
        return build(item, title, namePair?.key || item, id, depth, name !== undefined);
      }
      if (YAML.isScalar(item)) return make(label(item.value, 'null'), '', item, item, id);
      return build(item, `[${i}]`, item, id, depth);
    };
    if (!YAML.isMap(doc.contents)) return;
    const sections = build(doc.contents, `文档 ${di + 1}`, doc.contents, `doc/${di}`).children;
    if (docs.length > 1) roots.push(make(`文档 ${di + 1}`, '', doc.contents, doc.contents, `doc/${di}`, sections));
    else roots.push(...sections);
  });
  return { roots, errors };
}
module.exports = { parseNavigation };
