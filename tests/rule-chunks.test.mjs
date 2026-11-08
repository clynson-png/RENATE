import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRuleChunks } from '../scripts/rule_chunks.mjs';

test('reconhece capítulo romano e alínea de OCR CBTE', () => {
  const chunks = makeRuleChunks('II- Descrição da Prova\n   b) Alvo\n     De pistola de ar da ISSF.\n\n   c) Posição\n     De pé, sem nenhum tipo de apoio ou suporte.');
  const target = chunks.find((chunk) => chunk.text.includes('De pistola de ar'));
  assert.equal(target.locator, 'II.b');
  assert.ok(target.locatorAliases.includes('Section II'));
  assert.equal(target.locator, 'II.b');
  const posture = chunks.find((chunk) => chunk.text.includes('De pé'));
  assert.equal(posture.locator, 'II.c');
});

test('mantém hierarquia romana, alínea e subitem numérico', () => {
  const chunks = makeRuleChunks('II- Descrição da Prova\n d) Arma\n 1. Serão permitidas as armas abaixo.\n 1.1. Calibre 4,5mm e cano basculante.');
  const item = chunks.find((chunk) => chunk.text.includes('1.1. Calibre'));
  assert.equal(item.locator, 'II.d.1.1');
  assert.ok(item.locatorAliases.includes('II.d.1'));
  assert.ok(item.locatorAliases.includes('d.1'));
  assert.ok(item.locatorAliases.includes('Section II'));
});

test('não deixa capítulo anterior contaminar uma nova seção', () => {
  const chunks = makeRuleChunks('II- Descrição\n b) Alvo\n Texto do alvo.\nIII- Disposições gerais\n a) Aplicação\n Texto geral.');
  const general = chunks.find((chunk) => chunk.text.includes('Texto geral'));
  assert.equal(general.locator, 'III.a');
  assert.ok(!general.locatorAliases.includes('Section II'));
  assert.ok(general.locatorAliases.includes('Section III'));
});

test('expõe abreviações do caminho hierárquico usado pelo ATLAS', () => {
  const chunks = makeRuleChunks('II- Descrição\n d) Equipamento\n 2.3. Ajuste permitido.');
  const target = chunks.find((chunk) => chunk.text.includes('Ajuste permitido'));
  assert.equal(target.locator, 'II.d.2.3');
  assert.ok(target.locatorAliases.includes('d.2.3'));
});

test('reconhece capítulos alfanuméricos WRABF e itens parentéticos', () => {
  const chunks = makeRuleChunks('C.12 Comandos básicos da Linha de Tiro\n1) Carregar a arma.\n4) Cessar fogo.\nE.8 Área de Inspeção');
  assert.ok(chunks.some((chunk) => chunk.locator === 'C.12'));
  assert.ok(chunks.some((chunk) => chunk.locatorAliases.includes('C.12(1)')));
  assert.ok(chunks.some((chunk) => chunk.locator === 'E.8'));
});

test('preserva o apêndice e a página indicada no OCR como aliases consultáveis', () => {
  const chunks = makeRuleChunks('Appendix 6\nP5 10m Air Pistol Standard\n--- PDF PAGE 0034 | method=TESSERACT_OCR ---\n3\nOther Specifications\nNumber of sighting shots One series of five shots.');
  const target = chunks.find((chunk) => chunk.text.includes('Other Specifications'));
  assert.equal(target.locator, 'Appendix 6 §3');
  assert.ok(target.locatorAliases.includes('PDF p. 34'));
  const portuguese = makeRuleChunks('Apêndice 6\n3 Outras especificações\nPeso máximo da pistola 1500g.');
  assert.equal(portuguese.find((chunk) => chunk.text.includes('Peso máximo')).locator, 'Appendix 6 §3');
  const decimal = makeRuleChunks('Appendix 6\n3 Other Specifications\n3.2 Measuring box\nBox size 420mm.');
  assert.equal(decimal.find((chunk) => chunk.text.includes('Box size')).locator, 'Appendix 6 §3.2');
});

test('expõe observações numeradas e subitens com letra entre parênteses', () => {
  const chunks = makeRuleChunks('g) Comandos\nObs.: 1 - Armas abertas e descarregadas.\n2 - Não é permitido municiamento.\n3 - Durante a preparação pode fazer visada.\n3.7.1.1(a) Texto do subitem.');
  assert.ok(chunks.some((chunk) => chunk.locatorAliases.includes('Observation 2')));
  assert.ok(chunks.some((chunk) => chunk.locator === 'Observação 3'));
  const lettered = chunks.find((chunk) => chunk.text.includes('Texto do subitem'));
  assert.equal(lettered.locator, '3.7.1.1(a)');
  assert.ok(lettered.locatorAliases.includes('3.7.1.1.a'));
});

test('associa alíneas OCR em linha separada ao número da regra pai', () => {
  const chunks = makeRuleChunks('3.7.1.1 A high stool shall comply with these rules:\na) Maximum height is determined from the floor.\nb) The base shall be stable.\n3.7.1.2 Other rule.');
  const subitem = chunks.find((chunk) => chunk.text.includes('Maximum height'));
  assert.equal(subitem.locator, '3.7.1.1(a)');
  assert.ok(subitem.locatorAliases.includes('3.7.1.1.a'));
  const second = chunks.find((chunk) => chunk.text.includes('base shall be stable'));
  assert.equal(second.locator, '3.7.1.1(b)');
  assert.ok(chunks.some((chunk) => chunk.locator === '3.7.1.2'));
  const appendix = makeRuleChunks('Appendix 2\n5.1.1.2 Entry fee:\n(b) Grand Prix: EUR 10 per athlete.');
  const fee = appendix.find((chunk) => chunk.text.includes('Grand Prix'));
  assert.equal(fee.locator, 'Appendix 2 §5.1.1.2(b)');
  assert.ok(fee.locatorAliases.includes('5.1.1.2(b)'));
});
