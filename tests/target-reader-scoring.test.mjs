import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreRawImpact } from '../src/target-reader/targetReaderEngine.js';

const center = { x: 0, y: 0 };

function scoreAt(radialMm, markRadiusMm = 1.75, source = 'MANUAL') {
  return scoreRawImpact({ x: radialMm, y: 0, radiusPx: markRadiusMm, source }, center, 1);
}

test('manual scoring uses the user-adjustable 3.5 mm ball edge and returns 9.5 at the 9 ring', () => {
  const result = scoreAt(3.25);
  assert.equal(result.score, 9);
  assert.equal(result.decimalScore, 9.5);
});

test('contact with the 9 ring line scores 9.0; moving inward increases tenths', () => {
  assert.equal(scoreAt(4.5).decimalScore, 9);
  assert.equal(scoreAt(3.25).decimalScore, 9.5);
  assert.equal(scoreAt(2).decimalScore, 10.1);
});

test('10 decimals use the 2.45 mm clearance rule consistently', () => {
  assert.equal(scoreAt(0, 2.25, 'DARK_HOLE').decimalScore, 10.9);
  assert.equal(scoreAt(0.25, 2.25, 'DARK_HOLE').decimalScore, 10.8);
  assert.equal(scoreAt(2.45, 2.25, 'DARK_HOLE').decimalScore, 10);
});

test('manual cross-and-ball scoring produces the five review-panel readings using a 3.5 mm ball', () => {
  const radialReadings = [1.42, 5.66, 1.10, 4.21, 2.77];
  const updated = radialReadings.map((radialMm) => scoreAt(radialMm).decimalScore);

  assert.deepEqual(updated, [10.4, 8.7, 10.5, 9.2, 9.7]);
});

test('RAW impacts retain the standard 4.5 mm scoring gauge', () => {
  const raw = scoreAt(5, 2.25, 'DARK_HOLE');
  assert.equal(raw.decimalScore, 9);
});

test('outer scoring limit is 30.5 mm from center with 1.1 at 30.4 mm', () => {
  assert.equal(scoreAt(32.85, 2.25, 'DARK_HOLE').decimalScore, 0);
  assert.equal(scoreAt(32.65, 2.25, 'DARK_HOLE').decimalScore, 1.1);
});
