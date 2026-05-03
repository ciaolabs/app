export function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

export function gaussian(rating: number, mean: number, spread: number) {
  return Math.exp(-((rating - mean) ** 2) / (2 * spread ** 2));
}

export function erfApproximation(value: number) {
  const sign = value < 0 ? -1 : 1;
  const absoluteValue = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * absoluteValue);
  const polynomial =
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t);
  const estimate = 1 - polynomial * Math.exp(-(absoluteValue ** 2));

  return sign * estimate;
}

export function normalCdf(value: number, mean: number, sd: number) {
  if (sd <= 0) {
    return value < mean ? 0 : 1;
  }

  return 0.5 * (1 + erfApproximation((value - mean) / (sd * Math.SQRT2)));
}

export function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function hashSeed(value: string) {
  let hash = 1779033703;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return (hash >>> 0) || 1;
}

export function mulberry32(seed: number) {
  let currentSeed = seed >>> 0;

  return () => {
    currentSeed += 0x6d2b79f5;
    let next = currentSeed;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export type MixtureComponent = {
  mean: number;
  spread: number;
  weight: number;
};

export function buildDistributionFromMixture(
  components: MixtureComponent[],
  total: number,
  floor: number,
  seed: number,
  ratingCount = 6,
) {
  const weights = Array.from({ length: ratingCount }, (_, index) => {
    const rating = index + 1;
    const mixture = components.reduce(
      (sum, component) => sum + component.weight * gaussian(rating, component.mean, component.spread),
      0,
    );
    const ripple = 0.012 * Math.sin((seed % 17) + rating * 1.37);

    return Math.max(floor + mixture + ripple, floor / 2);
  });

  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const counts = weights.map((value) => Math.max(1, Math.round((value / weightSum) * total)));
  const difference = total - counts.reduce((sum, value) => sum + value, 0);
  const targetIndex = counts.indexOf(Math.max(...counts));

  counts[targetIndex] += difference;

  return counts;
}
