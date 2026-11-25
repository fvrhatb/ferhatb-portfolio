const { test } = require('node:test');
const assert = require('node:assert/strict');
const renderer = require('../public/js/cv-render');

test('each CV renders its own languages, interests and references including empty lists', () => {
  const data = { cv: { languages: [{name:'Ortak'}], interests:['Ortak'], references:[{name:'Ortak'}], versions:[
    {id:'a', languages:[{name:'Türkçe'}], interests:['Müzik'], references:[{name:'Ayşe'}]},
    {id:'b', languages:[{name:'English'}], interests:[], references:[{name:'Ali'}]}
  ] } };
  const a=renderer.resolve(data,'a'), b=renderer.resolve(data,'b');
  assert.equal(a.languages[0].name,'Türkçe'); assert.deepEqual(a.interests,['Müzik']); assert.equal(a.references[0].name,'Ayşe');
  assert.equal(b.languages[0].name,'English'); assert.deepEqual(b.interests,[]); assert.equal(b.references[0].name,'Ali');
});

test('legacy versions continue to show shared data', () => {
  const result=renderer.resolve({cv:{languages:[{name:'İngilizce'}], interests:['Kitap'], references:[{name:'Deniz'}], versions:[{id:'old'}]}},'old');
  assert.equal(result.languages[0].name,'İngilizce'); assert.deepEqual(result.interests,['Kitap']); assert.equal(result.references[0].name,'Deniz');
});
