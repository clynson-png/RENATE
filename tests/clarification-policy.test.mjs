import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clarificationDecision } from '../src/clarificationPolicy.js';

test('ambiguidade permite exatamente dois pedidos e depois encerra', () => {
  assert.deepEqual(clarificationDecision('CLARIFICATION_REQUIRED', 0), { ambiguous: true, askAgain: true, nextCount: 1 });
  assert.deepEqual(clarificationDecision('PRETEST_CLARIFICATION_REQUIRED', 1), { ambiguous: true, askAgain: true, nextCount: 2 });
  assert.deepEqual(clarificationDecision('CLARIFICATION_REQUIRED', 2), { ambiguous: true, askAgain: false, nextCount: 2 });
});

test('busca sem correspondência não pede esclarecimento como substituto de uma resposta', () => {
  assert.deepEqual(clarificationDecision('RULE_FALLBACK', 0), { ambiguous: false, askAgain: false, nextCount: 0 });
});
