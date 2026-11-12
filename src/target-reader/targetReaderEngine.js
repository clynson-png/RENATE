const AIR_RIFLE_10M = Object.freeze({
  id: 'AIR_RIFLE_10M',
  title: 'Carabina de ar · 10 m',
  projectileDiameterMm: 4.5,
  tenDecimalReferenceRadiusMm: 2.45,
  outerScoringRadiusMm: 30.5,
  calibrationDiameterMm: 30.5,
  ringDiametersMm: [0.5, 5.5, 10.5, 15.5, 20.5, 25.5, 30.5, 35.5, 40.5, 45.5],
  ringScores: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
});

const MAX_SOURCE_SIDE = 1400;

export async function loadTargetReaderOpenCV() {
  const { loadOpenCV } = await import('@opencvjs/web');
  return loadOpenCV();
}

export function prepareTargetReaderImage(cv, sourceCanvas) {
  const sourceMat = cv.imread(sourceCanvas);
  const gray = new cv.Mat();
  let resized = null;
  try {
    if (sourceMat.channels() === 4) cv.cvtColor(sourceMat, gray, cv.COLOR_RGBA2GRAY);
    else if (sourceMat.channels() === 3) cv.cvtColor(sourceMat, gray, cv.COLOR_BGR2GRAY);
    else sourceMat.copyTo(gray);
    const scale = Math.min(1, MAX_SOURCE_SIDE / Math.max(gray.cols, gray.rows));
    let working = gray;
    if (scale < 1) {
      resized = new cv.Mat();
      cv.resize(gray, resized, new cv.Size(Math.round(gray.cols * scale), Math.round(gray.rows * scale)), 0, 0, cv.INTER_AREA);
      working = resized;
    }
    return { gray: working, sourceGray: gray, resized, sourceMat, width: working.cols, height: working.rows };
  } catch (error) {
    resized?.delete(); gray.delete(); sourceMat.delete();
    throw error;
  }
}

export function releaseTargetReaderImage(image) {
  image?.resized?.delete();
  image?.sourceGray?.delete();
  image?.sourceMat?.delete();
}

// Independent RENATE clone of QGCoach's manually calibrated RAW rifle path.
export function analyzeCalibratedRifleTarget(cv, gray, calibration) {
  const center = { x: Number(calibration.centerX) * gray.cols, y: Number(calibration.centerY) * gray.rows };
  const referenceRadiusPx = Number(calibration.referenceRadius) * gray.cols;
  const pixelsPerMm = referenceRadiusPx / (AIR_RIFLE_10M.calibrationDiameterMm / 2);
  if (![center.x, center.y, referenceRadiusPx, pixelsPerMm].every(Number.isFinite) || referenceRadiusPx <= 0 || pixelsPerMm <= 0) {
    throw new Error('Calibre o centro e o círculo de referência dos cinco alvos antes de ler.');
  }
  const impacts = detectCalibratedImpactCandidates(cv, gray, AIR_RIFLE_10M, center, pixelsPerMm);
  markOverlaps(impacts);
  return impacts.map((impact, index) => {
    const scored = scoreRawImpact(impact, center, pixelsPerMm);
    return {
      ...impact,
      ...scored,
      direction: rifleDirection(impact, center, pixelsPerMm),
      displayNumber: index + 1,
      needsReview: Boolean(impact.overlap || scored.ringBoundary || impact.confidence < 0.42),
    };
  });
}

export function scoreRawImpact(impact, center, pixelsPerMm) {
  const radialPixels = Math.hypot(Number(impact.x) - center.x, Number(impact.y) - center.y);
  const radialMm = radialPixels / pixelsPerMm;
  const impactRadiusMm = Number(impact.radiusPx || 0) / pixelsPerMm;
  // Manual review uses the 3.5 mm adjustable marker. RAW scoring always uses
  // the standard 4.5 mm pellet gauge; a torn or merged paper component must
  // not enlarge the scoring radius and change the result from one target to another.
  const scoringRadiusMm = impact.source === 'MANUAL'
    ? impactRadiusMm
    : AIR_RIFLE_10M.projectileDiameterMm / 2;
  const nearestEdgeMm = Math.max(0, radialMm - scoringRadiusMm);
  const rings = rifleScoringRings();
  const touchedRing = rings.find((ring) => nearestEdgeMm <= ring.radiusMm);
  const closestBoundaryMm = Math.min(...rings.map((ring) => Math.abs(nearestEdgeMm - ring.radiusMm)));
  const toleranceMm = Math.max(0.5, scoringRadiusMm * 0.2);
  const score = touchedRing?.score ?? 0;
  const nextHigherRing = touchedRing && rings.find((ring) => ring.score === touchedRing.score + 1);
  // For 10.x, count the clearance between the target center and the nearest
  // pellet edge: a centered shot is 10.9 (2.45 mm), and edge contact at center
  // is 10.0. All other rings retain their existing decimal progression.
  let decimalTenths = 0;
  if (touchedRing && score === 10) {
    const clearanceMm = Math.max(0, AIR_RIFLE_10M.tenDecimalReferenceRadiusMm - radialMm);
    decimalTenths = Math.min(9, Math.floor((clearanceMm / AIR_RIFLE_10M.tenDecimalReferenceRadiusMm) * 10));
  } else if (touchedRing) {
    const outerBoundaryMm = touchedRing.radiusMm;
    const innerBoundaryMm = nextHigherRing?.radiusMm;
    const radialBandMm = outerBoundaryMm - (innerBoundaryMm ?? 0);
    const progressTowardCenter = radialBandMm > 0
      ? Math.max(0, Math.min(1, (outerBoundaryMm - nearestEdgeMm) / radialBandMm))
      : 0;
    // Contact with a scoring line starts that ring's first decimal bin.
    decimalTenths = Math.min(9, Math.ceil(progressTowardCenter * 10));
  }
  return {
    score,
    decimalScore: touchedRing ? score + decimalTenths / 10 : 0,
    radialMm: round(radialMm),
    impactRadiusMm: round(impactRadiusMm),
    ringBoundary: closestBoundaryMm <= toleranceMm,
    miss: !touchedRing,
  };
}

function rifleScoringRings() {
  const rings = [{ radiusMm: 0.25, score: 10 }, { radiusMm: 2.75, score: 9 }];
  const remainingBandWidthMm = (AIR_RIFLE_10M.outerScoringRadiusMm - 2.75) / 8;
  for (let score = 8; score >= 1; score -= 1) {
    rings.push({ radiusMm: rings[rings.length - 1].radiusMm + remainingBandWidthMm, score });
  }
  return rings;
}

function rifleDirection(impact, center, pixelsPerMm) {
  const dxMm = (impact.x - center.x) / pixelsPerMm;
  const dyMm = (impact.y - center.y) / pixelsPerMm;
  if (Math.hypot(dxMm, dyMm) <= Number(AIR_RIFLE_10M.projectileDiameterMm) / 2) return 'C';
  // Image coordinates grow downwards: Q1=upper-right, then counter-clockwise.
  if (dxMm >= 0 && dyMm < 0) return 'Q1';
  if (dxMm < 0 && dyMm < 0) return 'Q2';
  if (dxMm < 0 && dyMm >= 0) return 'Q3';
  return 'Q4';
}

function detectCalibratedImpactCandidates(cv, gray, target, center, pixelsPerMm) {
  const width = gray.cols;
  const height = gray.rows;
  const expectedDiameterPx = Math.max(5, target.projectileDiameterMm * pixelsPerMm);
  // A legal impact center cannot extend more than one pellet radius beyond
  // the outer scoring ring; the former 10 mm margin included paper/label noise.
  const searchRadius = (target.outerScoringRadiusMm + target.projectileDiameterMm / 2) * pixelsPerMm;
  const referenceRadius = (target.calibrationDiameterMm / 2) * pixelsPerMm;
  const dark = new cv.Mat();
  const light = new cv.Mat();
  const adaptiveDark = new cv.Mat();
  const adaptiveLight = new cv.Mat();
  const darkRoi = new cv.Mat(height, width, cv.CV_8UC1, new cv.Scalar(0));
  const lightRoi = new cv.Mat(height, width, cv.CV_8UC1, new cv.Scalar(0));
  const darkMasked = new cv.Mat();
  const lightMasked = new cv.Mat();
  const adaptiveDarkMasked = new cv.Mat();
  const adaptiveLightMasked = new cv.Mat();
  try {
    cv.threshold(gray, dark, 78, 255, cv.THRESH_BINARY_INV);
    cv.threshold(gray, light, 170, 255, cv.THRESH_BINARY);
    const minSide = Math.min(width, height);
    let adaptiveBlockSize = Math.max(15, Math.round(expectedDiameterPx * 3));
    if (adaptiveBlockSize % 2 === 0) adaptiveBlockSize += 1;
    if (adaptiveBlockSize > minSide) adaptiveBlockSize = minSide % 2 === 0 ? minSide - 1 : minSide;
    if (adaptiveBlockSize >= 3) {
      // Local thresholds compensate for shadows and illumination shifts along a strip.
      cv.adaptiveThreshold(gray, adaptiveDark, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, adaptiveBlockSize, 8);
      cv.adaptiveThreshold(gray, adaptiveLight, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, adaptiveBlockSize, 8);
    }
    cv.circle(darkRoi, new cv.Point(Math.round(center.x), Math.round(center.y)), Math.round(searchRadius), new cv.Scalar(255), cv.FILLED);
    cv.circle(darkRoi, new cv.Point(Math.round(center.x), Math.round(center.y)), Math.round(referenceRadius * 1.04), new cv.Scalar(0), cv.FILLED);
    cv.circle(lightRoi, new cv.Point(Math.round(center.x), Math.round(center.y)), Math.round(referenceRadius * 1.04), new cv.Scalar(255), cv.FILLED);
    cv.bitwise_and(dark, darkRoi, darkMasked);
    cv.bitwise_and(light, lightRoi, lightMasked);
    cv.bitwise_and(adaptiveDark, darkRoi, adaptiveDarkMasked);
    cv.bitwise_and(adaptiveLight, lightRoi, adaptiveLightMasked);
    const candidates = [
      ...componentsAsImpactCandidates(cv, darkMasked, gray, center, searchRadius, expectedDiameterPx, 'DARK_HOLE'),
      ...componentsAsImpactCandidates(cv, lightMasked, gray, center, searchRadius, expectedDiameterPx, 'BRIGHT_TEAR'),
      ...componentsAsImpactCandidates(cv, adaptiveDarkMasked, gray, center, searchRadius, expectedDiameterPx, 'RAW_LOCAL_DARK'),
      ...componentsAsImpactCandidates(cv, adaptiveLightMasked, gray, center, searchRadius, expectedDiameterPx, 'RAW_LOCAL_LIGHT'),
    ];
    const unique = [];
    for (const candidate of candidates.sort((a, b) => b.confidence - a.confidence)) {
      if (!unique.some((item) => Math.hypot(item.x - candidate.x, item.y - candidate.y) < expectedDiameterPx * 0.72)) unique.push(candidate);
    }
    const clearest = unique.sort((a, b) => b.confidence - a.confidence)[0]
      || findStrongestLocalContrastCandidate(gray, center, searchRadius, expectedDiameterPx);
    return clearest ? [{ ...clearest, id: `RAW_${Math.round(clearest.x)}_${Math.round(clearest.y)}_1` }] : [];
  } finally {
    dark.delete(); light.delete(); adaptiveDark.delete(); adaptiveLight.delete(); darkRoi.delete(); lightRoi.delete(); darkMasked.delete(); lightMasked.delete(); adaptiveDarkMasked.delete(); adaptiveLightMasked.delete();
  }
}

function findStrongestLocalContrastCandidate(gray, center, searchRadius, expectedDiameterPx) {
  const stride = Math.max(2, Math.round(expectedDiameterPx * 0.45));
  let best = null;
  const minX = Math.max(0, Math.floor(center.x - searchRadius));
  const maxX = Math.min(gray.cols - 1, Math.ceil(center.x + searchRadius));
  const minY = Math.max(0, Math.floor(center.y - searchRadius));
  const maxY = Math.min(gray.rows - 1, Math.ceil(center.y + searchRadius));
  for (let y = minY; y <= maxY; y += stride) for (let x = minX; x <= maxX; x += stride) {
    if (Math.hypot(x - center.x, y - center.y) > searchRadius) continue;
    const contrast = measurePatchContrast(gray, x, y, expectedDiameterPx * 0.35, expectedDiameterPx * 0.72);
    const radiusPenalty = Math.hypot(x - center.x, y - center.y) > searchRadius * 0.72 ? 0.72 : 1;
    const clarity = contrast * radiusPenalty;
    if (!best || clarity > best.clarity) best = { x, y, clarity, contrast };
  }
  if (!best || best.contrast <= 0) return null;
  return {
    x: best.x,
    y: best.y,
    radiusPx: expectedDiameterPx / 2,
    confidence: round(Math.min(0.41, best.contrast / 100)),
    source: 'RAW_REVIEW',
    confirmed: false,
  };
}

function componentsAsImpactCandidates(cv, binary, gray, center, searchRadius, expectedDiameterPx, source) {
  const labels = new cv.Mat(); const stats = new cv.Mat(); const centroids = new cv.Mat();
  try {
    const count = cv.connectedComponentsWithStats(binary, labels, stats, centroids, 8, cv.CV_32S);
    const candidates = [];
    for (let index = 1; index < count; index += 1) {
      const width = stats.intAt(index, cv.CC_STAT_WIDTH); const height = stats.intAt(index, cv.CC_STAT_HEIGHT); const area = stats.intAt(index, cv.CC_STAT_AREA);
      const x = centroids.doubleAt(index, 0); const y = centroids.doubleAt(index, 1); const diameter = (width + height) / 2;
      const aspect = Math.min(width, height) / Math.max(width, height); const fill = area / (Math.PI * (diameter / 2) ** 2);
      if (Math.hypot(x - center.x, y - center.y) > searchRadius) continue;
      if (diameter < expectedDiameterPx * 0.35 || diameter > expectedDiameterPx * 2.25 || aspect < 0.48 || fill < 0.22) continue;
      const contrast = measurePatchContrast(gray, x, y, Math.max(3, diameter * 0.35), Math.max(5, diameter * 0.72));
      if (contrast < 24) continue;
      candidates.push({ x, y, radiusPx: diameter / 2, confidence: round(Math.min(0.99, contrast / 100) * Math.min(1, fill / 0.65)), source, confirmed: false });
    }
    return candidates;
  } finally { labels.delete(); stats.delete(); centroids.delete(); }
}

function measurePatchContrast(gray, x, y, innerRadius, outerRadius) {
  const inner = []; const outer = [];
  for (let offsetY = -outerRadius; offsetY <= outerRadius; offsetY += 1) for (let offsetX = -outerRadius; offsetX <= outerRadius; offsetX += 1) {
    const px = Math.round(x + offsetX); const py = Math.round(y + offsetY);
    if (px < 0 || px >= gray.cols || py < 0 || py >= gray.rows) continue;
    const value = gray.data[py * gray.cols + px];
    if (Math.hypot(offsetX, offsetY) <= innerRadius) inner.push(value);
    else if (Math.hypot(offsetX, offsetY) <= outerRadius) outer.push(value);
  }
  return Math.abs(average(inner) - average(outer));
}

function markOverlaps(impacts) {
  for (let left = 0; left < impacts.length; left += 1) for (let right = left + 1; right < impacts.length; right += 1) {
    if (Math.hypot(impacts[left].x - impacts[right].x, impacts[left].y - impacts[right].y) <= (impacts[left].radiusPx + impacts[right].radiusPx) * 1.08) {
      impacts[left].overlap = true; impacts[right].overlap = true;
    }
  }
}

function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function round(value) { return Math.round(Number(value) * 100) / 100; }

export { AIR_RIFLE_10M };
