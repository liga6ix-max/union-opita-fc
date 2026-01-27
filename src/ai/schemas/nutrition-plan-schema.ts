import { z } from 'zod';

export const NutritionPlanInputSchema = z.object({
  dietType: z.enum(["weight_loss", "weight_gain", "vegan"]),
});
export type NutritionPlanInput = z.infer<typeof NutritionPlanInputSchema>;

const dailyMealPlanSchema = z.object({
  breakfast: z.string().describe("Comida para el desayuno."),
  snack1: z.string().describe("Comida para la media mañana."),
  lunch: z.string().describe("Comida para el almuerzo."),
  snack2: z.string().describe("Comida para la media tarde."),
  dinner: z.string().describe("Comida para la cena."),
});

export const NutritionPlanOutputSchema = z.object({
  Lunes: dailyMealPlanSchema,
  Martes: dailyMealPlanSchema,
  Miércoles: dailyMealPlanSchema,
  Jueves: dailyMealPlanSchema,
  Viernes: dailyMealPlanSchema,
  Sábado: dailyMealPlanSchema,
  Domingo: dailyMealPlanSchema,
});
export type NutritionPlanOutput = z.infer<typeof NutritionPlanOutputSchema>;
