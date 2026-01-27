
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { NutritionPlanInputSchema, NutritionPlanOutputSchema, type NutritionPlanInput, type NutritionPlanOutput } from '@/ai/schemas/nutrition-plan-schema';

const dietTypeDescriptions = {
  weight_loss: 'pérdida de peso, enfocado en ser bajo en calorías pero alto en nutrientes y fibra',
  weight_gain: 'aumento de masa muscular y peso, enfocado en ser alto en calorías y proteínas',
  vegan: 'vegano, sin ningún producto de origen animal',
};

export async function createNutritionPlan(input: NutritionPlanInput): Promise<NutritionPlanOutput> {
  const result = await createNutritionPlanFlow(input);
  if (!result) {
    throw new Error("La IA no pudo generar un plan nutricional.");
  }
  return result;
}

const prompt = ai.definePrompt({
  name: 'createNutritionPlanPrompt',
  input: { schema: NutritionPlanInputSchema },
  output: { schema: NutritionPlanOutputSchema },
  prompt: `
    Eres un nutricionista experto en la gastronomía colombiana. Tu tarea es crear un plan de alimentación semanal (microciclo) económico y saludable para un deportista.

    El plan debe ser para una dieta de: {{{dietDescription}}}.

    Genera un plan de comidas para los 7 días de la semana (Lunes a Domingo). Para cada día, debes especificar 5 comidas:
    1.  Desayuno
    2.  Media Mañana (Snack 1)
    3.  Almuerzo
    4.  Media Tarde (Snack 2)
    5.  Cena

    **REQUISITOS IMPORTANTES:**
    -   **Ingredientes Colombianos y Económicos:** Utiliza ingredientes comunes, de fácil acceso y de bajo costo en Colombia. Piensa en alimentos como arepas, huevos, frijoles, arroz, plátano, yuca, papa, pollo, carnes económicas, y abundantes frutas y verduras locales.
    -   **Balance Nutricional:** Asegúrate de que cada día esté nutricionalmente balanceado para un deportista, considerando el tipo de dieta solicitado.
    -   **Formato de Salida:** La respuesta debe ser un objeto JSON que siga exactamente la estructura de salida definida, con los días de la semana como claves principales.
    -   **Idioma:** Toda la salida debe estar en español.
  `,
  // Augment the input with the description before sending to the prompt
  transform: (input) => ({
    ...input,
    dietDescription: dietTypeDescriptions[input.dietType]
  }),
});

const createNutritionPlanFlow = ai.defineFlow(
  {
    name: 'createNutritionPlanFlow',
    inputSchema: NutritionPlanInputSchema,
    outputSchema: NutritionPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("La IA no pudo generar un plan nutricional.");
    }
    return output;
  }
);
