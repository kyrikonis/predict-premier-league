export function scorePrediction(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  isWildcard = false
): number {
  let points: number;

  if (predictedHome === actualHome && predictedAway === actualAway) {
    points = 3;
  } else {
    const predictedResult = Math.sign(predictedHome - predictedAway);
    const actualResult = Math.sign(actualHome - actualAway);
    points = predictedResult === actualResult ? 1 : 0;
  }

  return isWildcard ? points * 2 : points;
}
