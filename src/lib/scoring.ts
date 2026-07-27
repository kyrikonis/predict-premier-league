export function scorePrediction(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) return 3;

  const predictedResult = Math.sign(predictedHome - predictedAway);
  const actualResult = Math.sign(actualHome - actualAway);

  return predictedResult === actualResult ? 1 : 0;
}
