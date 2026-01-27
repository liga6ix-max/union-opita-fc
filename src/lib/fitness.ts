
'use client';

/**
 * Calculates Body Mass Index (BMI).
 * @param weightKg User's weight in kilograms.
 * @param heightCm User's height in centimeters.
 * @returns The calculated BMI, or null if inputs are invalid.
 */
export const calculateBmi = (weightKg?: number, heightCm?: number): number | null => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
};

/**
 * Calculates Body Fat Percentage (BFP) using the U.S. Navy formula.
 * @param gender User's gender ('Masculino' or 'Femenino').
 * @param heightCm User's height in centimeters.
 * @param waistCm User's waist circumference in centimeters.
 * @param neckCm User's neck circumference in centimeters.
 * @param hipCm User's hip circumference in centimeters (required for females).
 * @returns The calculated BFP, or null if inputs are invalid.
 */
export const calculateBodyFatPercentage = (
  gender?: 'Masculino' | 'Femenino',
  heightCm?: number,
  waistCm?: number,
  neckCm?: number,
  hipCm?: number,
): number | null => {
    if (!gender || !heightCm || !waistCm || !neckCm || heightCm <= 0 || waistCm <= 0 || neckCm <= 0) return null;
    
    try {
        if (gender === 'Masculino') {
            const bfp = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
            if (isNaN(bfp) || !isFinite(bfp)) return null;
            return parseFloat(bfp.toFixed(2));
        }

        if (gender === 'Femenino') {
            if (!hipCm || hipCm <= 0) return null; // Hip is required for women
            const bfp = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
            if (isNaN(bfp) || !isFinite(bfp)) return null;
            return parseFloat(bfp.toFixed(2));
        }
    } catch (error) {
        // Math.log10 can throw an error if the input is not positive
        return null;
    }
    
    return null;
}
