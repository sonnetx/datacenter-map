const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/states.json'), 'utf8'));
// Run the actual browser model in isolation; no duplicate scoring implementation.
const source = template.slice(template.indexOf('const FACTORS ='), template.indexOf('// cividis-like ramp'));
const activeWeights = template.match(/function activeWeights\(\)\{[^\n]+\}/)[0];
function model(states = data) {
  const context = vm.createContext({STATES: structuredClone(states)});
  vm.runInContext(source + '\n' + activeWeights + '\ncompute();', context);
  return code => vm.runInContext(code, context);
}
const neutral = {n:'Example',p:20,pw:3,po:3,op:3,w:3,h:3,c:3,x:3,mo:1};

test('balanced fit gives all eight factors equal shares and contributions sum to fit', () => {
  const run = model([{...neutral,a:'A'}]);
  assert.equal(run('BY.A.total'), 50);
  assert.equal(run('FACTORS.length'), 8);
  assert.equal(run('Object.values(weights).every(w=>w/totalWeight(weights)===0.125)'), true);
  assert.equal(run('FACTORS.reduce((sum,f)=>sum+contribution(BY.A,f.k),0)'), 50);
  assert.equal(run('sub({...BY.A,pw:4},"pw")-sub(BY.A,"pw")'), 25);
});

test('cost anchors clamp at endpoints and distinguish expensive states', () => {
  const run = model();
  assert.equal(run('sub({p:5},"p")'), 100);
  assert.equal(run('sub({p:35},"p")'), 0);
  assert.equal(run('sub({p:40},"p")'), 0);
  assert.equal(run('sub({p:15},"p")>sub({p:20},"p")'), true);
  assert.equal(run('new Set(STATES.map(s=>sub(s,"p"))).size'), new Set(data.map(s=>s.p)).size);
});

test('momentum does not influence fit or political outlook', () => {
  const run = model([{...neutral,a:'A',mo:1},{...neutral,a:'B',mo:5}]);
  assert.equal(run('BY.A.total===BY.B.total && BY.A.pol===BY.B.pol'), true);
  assert.equal(run('BY.A.rank===1 && BY.B.rank===1 && BY.A.tied && BY.B.tied'), true);
});

test('reception and regulation contribute nothing to fit, rank or the reference views', () => {
  const open = {pb:'Low',wt:0,pg:0,zn:0,tx:0,n:'Nothing in force.'};
  const closed = {pb:'High',wt:3,pg:3,zn:3,tx:3,n:'Restrictions in force.'};
  const run = model([{...neutral,a:'A',rr:open},{...neutral,a:'B',rr:closed}]);
  assert.equal(run('BY.A.total===BY.B.total && BY.A.phy===BY.B.phy && BY.A.pol===BY.B.pol'), true);
  assert.equal(run('BY.A.rank===1 && BY.B.rank===1 && BY.A.tied && BY.B.tied'), true);
  assert.equal(run('deliveryTier(BY.A)===deliveryTier(BY.B)'), true);
  // The real dataset scores identically with the whole record stripped out.
  // Arrays cross a vm realm boundary, so compare serialized output.
  const scores = 'JSON.stringify(STATES.map(s=>[s.a,s.total,s.rank,s.phy,s.pol]))';
  const withRR = model(), without = model(data.map(({rr, ...rest}) => rest));
  assert.equal(without(scores), withRR(scores));
});

test('delivery first prevents strong other factors from offsetting a delivery concern', () => {
  const run = model([{...neutral,a:'A',p:5,pw:1,po:5,w:5,h:5,c:5,x:5},{...neutral,a:'B'}]);
  assert.equal(run('BY.A.rank'), 1);
  run('rankMode="delivery";compute()');
  assert.equal(run('BY.B.rank'), 1);
  assert.equal(run('BY.A.rank'), 2);
});

test('one-rating sensitivity crosses neighboring ranks, holding other states fixed', () => {
  const run = model([{...neutral,a:'A',p:19},{...neutral,a:'B',p:20},{...neutral,a:'C',p:21}]);
  assert.equal(run('BY.B.rank'), 2);
  assert.equal(run('BY.B.rankMin'), 1);
  assert.equal(run('BY.B.rankMax'), 3);
  run('weights=Object.fromEntries(FACTORS.map(f=>[f.k,f.k==="p"?1:0]));compute()');
  assert.equal(run('BY.B.rankMin===2 && BY.B.rankMax===2'), true);
});

test('zero weights remove scores and ranks, while reference views remain defined', () => {
  const run = model();
  run('Object.keys(weights).forEach(k=>weights[k]=0);compute()');
  assert.equal(run('STATES.every(s=>s.total===null && s.rank===null && s.rankMin===null && s.rankMax===null && Number.isFinite(s.phy))'), true);
});

test('all presets and views yield bounded scores, ranks and sensitivity', () => {
  const run = model();
  assert.equal(run(`Object.keys(PRESETS).every(preset=>{
    weights={...PRESETS[preset]};
    return ['all','politics','physical'].every(lens=>{
      view=lens;
      return ['fit','delivery'].every(mode=>{
        rankMode=mode;compute();
        return STATES.every(s=>s.total>=0 && s.total<=100 && s.rankMin>=1 && s.rankMax<=50 && s.rankMin<=s.rank && s.rank<=s.rankMax);
      });
    });
  })`), true);
});
