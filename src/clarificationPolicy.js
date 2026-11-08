const AMBIGUOUS_STATUSES = new Set(['CLARIFICATION_REQUIRED', 'PRETEST_CLARIFICATION_REQUIRED']);

export function clarificationDecision(status, priorRequestCount = 0) {
  const count = Math.max(0, Number.isInteger(priorRequestCount) ? priorRequestCount : 0);
  const ambiguous = AMBIGUOUS_STATUSES.has(status);
  const askAgain = ambiguous && count < 2;
  return { ambiguous, askAgain, nextCount: askAgain ? count + 1 : count };
}
