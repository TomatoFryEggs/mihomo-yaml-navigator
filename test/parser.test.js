const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseNavigation } = require('../src/parser');
const fs = require('node:fs');
test('demo names, types, providers and exact navigation offsets', () => {
  const text = fs.readFileSync(require('node:path').join(__dirname, '../examples/demo.yaml'), 'utf8');
  const { roots, errors } = parseNavigation(text);
  assert.equal(errors.length, 0);
  const section = key => roots.find(n => n.label === key);
  assert.deepEqual(section('proxy-groups').children.map(n => [n.label, n.description]), [['🚀 节点选择', 'select'], ['🤖 AI', 'select']]);
  assert.equal(section('proxies').children[1].label, '行内节点');
  assert.equal(section('proxy-providers').children[0].label, '示例订阅');
  assert.equal(section('rule-providers').children[0].description, 'http');
  for (const root of roots) {
    for (const node of [root, ...root.children]) {
      assert.equal(node.line, text.slice(0, node.offset).split('\n').length - 1);
      assert(node.end >= node.offset);
    }
  }
  assert.equal(text.slice(section('proxy-groups').children[0].offset, section('proxy-groups').children[0].offset + 5), 'name:');
});
test('quoted fields, CRLF, name after type, duplicate names and missing name', () => {
  const text = 'proxies:\r\n  - type: http\r\n    name: "a: b # c"\r\n  - {name: "a: b # c", type: socks5}\r\n  - type: direct\r\n';
  const nodes = parseNavigation(text).roots[0].children;
  assert.equal(nodes[0].label, 'a: b # c');
  assert.equal(nodes[0].line, 2);
  assert.equal(nodes[1].line, 3);
  assert.notEqual(nodes[0].id, nodes[1].id);
  assert.equal(nodes[2].label, '(未命名 #3)');
});
test('aliases and merged defaults preserve occurrence position; override wins', () => {
  const text = 'base: &b {name: Base, type: http}\nproxies:\n  - *b\n  - <<: *b\n    name: Override\n    type: socks5\n';
  const nodes = parseNavigation(text).roots.find(n => n.label === 'proxies').children;
  assert.equal(nodes[0].label, 'Base');
  assert.equal(nodes[0].line, 2);
  assert.equal(nodes[1].label, 'Override');
  assert.equal(nodes[1].description, 'socks5');
});
test('recursive merge graphs terminate', () => {
  const parsed = parseNavigation('base: &b {<<: *b}\nproxies: [*b]\n');
  assert.equal(parsed.roots[1].children[0].label, '*b');
});
test('all nested arrays/maps, scalar previews and type-specific icons', () => {
  const text = 'mixed-port: 7890\ndns:\n  enable: true\n  nameserver: [https://dns.example/dns-query, 1.1.1.1]\n  policy:\n    example: [8.8.8.8]\nproxy-groups:\n  - name: AI\n    type: select\n    use: [Airport]\n    proxies: [DIRECT]\n    health-check: {enable: false, interval: 300}\nrule-providers:\n  example:\n    type: http\n    path: ./rules.yaml\nrules:\n  - MATCH,DIRECT\n';
  const roots = parseNavigation(text).roots;
  assert.equal(roots[0].description, ': 7890');
  assert.equal(roots[0].kind, 'Number');
  const dns = roots[1];
  assert.equal(dns.kind, 'Module');
  assert.equal(dns.children[0].kind, 'Boolean');
  assert.equal(dns.children[0].description, ': true');
  assert.equal(dns.children[1].kind, 'Array');
  assert.deepEqual(dns.children[1].children.map(n => n.label), ['https://dns.example/dns-query', '1.1.1.1']);
  assert.equal(dns.children[2].children[0].children[0].label, '8.8.8.8');
  const group = roots[2].children[0];
  assert.deepEqual(group.children.map(n => n.label), ['use', 'DIRECT', 'health-check']);
  assert.equal(group.children[0].children[0].label, 'Airport');
  assert.equal(group.children[2].children[1].description, ': 300');
  assert.equal(roots[3].children[0].children[1].description, ': ./rules.yaml');
  assert.equal(roots[4].children[0].label, 'MATCH,DIRECT');
});
test('short and empty previews; multiline, long and sensitive values stay out of descriptions', () => {
  const roots = parseNavigation('empty-list: []\nempty-map: {}\ntext: hello\nnull-value: null\npassword: secret-value\nauthentication: [secret-value]\nlong: ' + 'x'.repeat(101) + '\nmultiline: |\n  hello\n  world\n').roots;
  assert.deepEqual(roots.slice(0,4).map(n => n.description), [': []', ': {}', ': hello', ': null']);
  assert.equal(roots[4].description, ': •••');
  assert.equal(roots[5].children.length, 0);
  assert.equal(roots[6].description, '');
  assert.equal(roots[7].description, '');
  assert(!JSON.stringify(roots).includes('secret-value'));
});
test('multiple documents, empty and malformed input', () => {
  assert.equal(parseNavigation('').roots.length, 0);
  const parsed = parseNavigation('proxies: []\n---\nproxy-groups: [{name: Two, type: select}]\n');
  assert.equal(parsed.roots[1].children[0].children[0].label, 'Two');
  assert(parseNavigation('proxies: [\n').errors.length > 0);
});
test('large file and secret values are not included in tree data', () => {
  const text = 'proxies:\n' + Array.from({length: 2000}, (_, i) => `  - {name: Node${i}, type: http, password: DO_NOT_DISPLAY}\n`).join('');
  const parsed = parseNavigation(text);
  assert.equal(parsed.roots[0].children.length, 2000);
  assert(!JSON.stringify(parsed).includes('DO_NOT_DISPLAY'));
});
test('group members appear once directly under name with exact block and flow positions', () => {
  const text = 'proxy-groups:\n  - name: AI\n    type: select\n    proxies:\n      - DIRECT\n      - "🇭🇰 Node"\n  - {name: Flow, type: select, proxies: [DIRECT, REJECT]}\n  - {name: Empty, type: select, proxies: []}\n';
  const groups = parseNavigation(text).roots[0].children;
  assert.deepEqual(groups[0].children.map(n => [n.label, n.line]), [['DIRECT', 4], ['🇭🇰 Node', 5]]);
  const flow = groups[1].children;
  assert.equal(text.slice(flow[1].offset, flow[1].offset + 6), 'REJECT');
  assert.equal(flow[1].line, 6);
  assert.equal(groups[2].children.length, 0);
  const repeated = parseNavigation('proxy-groups: [{name: AI, proxies: [DIRECT, DIRECT, REJECT]}]').roots[0].children[0];
  assert.deepEqual(repeated.children.map(n => n.label), ['DIRECT', 'REJECT']);
  assert(!JSON.stringify(repeated.children).includes('"label":"proxies"'));
});
