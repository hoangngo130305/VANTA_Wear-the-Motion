// Lists every UI string passed to t('…') that has no Vietnamese entry in src/i18n/vi.js.
//   npm run i18n:check
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const viSrc = fs.readFileSync(path.join(ROOT, 'src/i18n/vi.js'), 'utf8').replace('export default', 'module.exports =');
const vi = {}; new Function('module', viSrc)({ set exports(v) { Object.assign(vi, v); } });

const missing = new Map();
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx|js)$/.test(p) && !/i18n[\/]vi\.js|seed\.js|defaults\.js/.test(p)) scan(p);
  }
}
function scan(file) {
  const ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee, a = p.node.arguments[0];
      if (c.type === 'Identifier' && c.name === 't' && a && a.type === 'StringLiteral' && /[A-Za-z]{3}/.test(a.value) && /[a-z]/.test(a.value) && !/@|^https?:|^VANTA/.test(a.value) && !(a.value in vi)) {
        if (!missing.has(a.value)) missing.set(a.value, []);
        missing.get(a.value).push(path.relative(ROOT, file) + ':' + a.loc.start.line);
      }
    }
  });
}
walk(path.join(ROOT, 'src'));
if (!missing.size) console.log('✓ every t() string has a Vietnamese translation');
else { console.log(missing.size + ' string(s) missing from src/i18n/vi.js:\n'); for (const [k, w] of missing) console.log('  ' + JSON.stringify(k) + '\n      ' + w[0]); process.exitCode = 1; }
