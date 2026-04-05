const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const resolveInterpretationBand = (value, bands = []) => {
  const numericValue = toFiniteNumber(value);
  if (numericValue == null) return null;

  return (
    bands.find((band) => {
      const min = band.min == null ? Number.NEGATIVE_INFINITY : Number(band.min);
      const max = band.max == null ? Number.POSITIVE_INFINITY : Number(band.max);
      return numericValue >= min && numericValue <= max;
    }) || null
  );
};

export const getBandLabel = (band) => band?.label || "";
export const getBandInterpretation = (band) => band?.interpretation || "";
export const getBandCareerImplication = (band) => band?.careerImplication || "";
