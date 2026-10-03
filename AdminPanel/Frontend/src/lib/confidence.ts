// The model returns confidence as a probability (0-1); the dashboard shows it on a 0-5 scale.
export const toFiveScale = (confidence: unknown): number => {
  const value = Math.min(Math.max(Number(confidence) || 0, 0), 1);
  return Math.round(value * 50) / 10;
};

// Average on the 0-5 scale -> percentage (e.g. 4.5 -> 90)
export const fiveScaleToPercent = (score: number): number => (score / 5) * 100;
