
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { zodToDataURL } from 'zod-form-data';

const methodologyDescriptions = {
  tecnificacion: 'Tecnificación (4-7 años): Enfocado en la familiarización con el balón, la coordinación motriz y juegos lúdicos. Las actividades deben ser simples, divertidas y con mucho contacto con la pelota.',
  futbol_medida: 'Fútbol a la Medida (8-11 años): Se introducen los fundamentos técnicos (pase, control, conducción, tiro) y los principios tácticos básicos (juego en equipo, ocupación de espacios). El juego sigue siendo el eje central, pero con mayor estructura.',
  periodizacion_tactica: 'Periodización Táctica (12-20 años): El entrenamiento se organiza en torno a un modelo de juego. Cada ejercicio tiene un objetivo táctico claro, y las dimensiones técnicas, físicas y psicológicas se trabajan de forma integrada dentro del contexto de juego.',
};

const sessionSchema = z.object({
  day: z.string().describe("Día de la semana de la sesión (Ej: Lunes, Martes)."),
  focus: z.string().describe("Foco principal de la sesión (Ej: Técnica, Táctica, Físico, Estrategia)."),
  duration: z.number().describe("Duración de la sesión en minutos."),
  activities: z.string().describe("Descripción detallada de las actividades y ejercicios a realizar. Usa saltos de línea para separar las fases (Calentamiento, Parte Principal, Vuelta a la Calma)."),
});

const microcycleSchema = z.object({
    week: z.string().describe("Nombre o número de la semana (Ej: Semana 1, Semana 34)."),
    mainObjective: z.string().describe("El objetivo principal a trabajar durante este microciclo."),
    sessions: z.array(sessionSchema).describe("Lista de sesiones de entrenamiento para la semana."),
});

export const TrainingPlanInputSchema = z.object({
  category: z.string().describe("La categoría o equipo para el que se genera el plan (Ej: Sub-17, Tecnificación)."),
  methodology: z.enum(['tecnificacion', 'futbol_medida', 'periodizacion_tactica']).describe("La metodología de formación a aplicar."),
  mesocycleObjective: z.string().describe("El objetivo principal a lograr durante todo el mesociclo (varias semanas)."),
  weeks: z.coerce.number().describe("El número de semanas que durará el mesoclo (cuántos microciclos generar)."),
});
export type TrainingPlanInput = z.infer<typeof TrainingPlanInputSchema>;


export const TrainingPlanOutputSchema = z.object({
  mesocycleObjective: z.string().describe("El objetivo principal del mesociclo generado."),
  microcycles: z.array(microcycleSchema).describe("Una lista de los microciclos (planes semanales) que componen el mesociclo."),
});
export type TrainingPlanOutput = z.infer<typeof TrainingPlanOutputSchema>;


export async function createTrainingPlan(input: TrainingPlanInput): Promise<TrainingPlanOutput> {
  return createTrainingPlanFlow(input);
}


const prompt = ai.definePrompt({
    name: 'createTrainingPlanPrompt',
    input: { schema: TrainingPlanInputSchema },
    output: { schema: TrainingPlanOutputSchema },
    prompt: `
        Eres un director deportivo y experto en metodología de fútbol base, especializado en la creación de planes de entrenamiento.
        Tu tarea es generar un plan de entrenamiento (mesociclo) completo y coherente basado en los siguientes parámetros:

        1.  **Categoría del Equipo:** {{{category}}}
        2.  **Metodología a Aplicar:** {{methodology}} - {{methodologyDescriptions[methodology]}}
        3.  **Objetivo Principal del Mesociclo:** {{{mesocycleObjective}}}
        4.  **Duración del Mesociclo:** {{{weeks}}} semanas

        Basado en esta información, debes generar una estructura JSON que contenga:
        -   Un campo 'mesocycleObjective' con el objetivo principal que te he proporcionado.
        -   Una lista de 'microcycles', donde cada microciclo representa una semana del plan. El número de microciclos debe ser igual a las 'weeks' solicitadas.

        Para cada **microciclo**, debes definir:
        -   'week': Un nombre para la semana (Ej: "Semana 1 de 4: Adaptación").
        -   'mainObjective': Un objetivo específico para esa semana, que debe ser un sub-objetivo del objetivo principal del mesociclo. Los objetivos de los microciclos deben tener una progresión lógica.
        -   'sessions': Una lista de 3 sesiones de entrenamiento para esa semana (Ej: Lunes, Miércoles, Viernes).

        Para cada **sesión**, debes definir:
        -   'day': El día de la semana.
        -   'focus': El foco de la sesión (Técnico, Táctico, Físico, etc.).
        -   'duration': La duración en minutos (ajusta la duración según la edad/metodología, ej: 45-60 min para tecnificación, 90 min para periodización táctica).
        -   'activities': Una descripción clara y concisa de los ejercicios. Estructura las actividades en "Calentamiento", "Parte Principal" y "Vuelta a la Calma".

        **IMPORTANTE:** El contenido debe ser 100% en español. Asegúrate de que la progresión de los objetivos y la complejidad de las actividades sean coherentes con la metodología y la categoría de edad.
    `,
    config: {
        model: 'googleai/gemini-2.5-flash',
    }
});


const createTrainingPlanFlow = ai.defineFlow(
  {
    name: 'createTrainingPlanFlow',
    inputSchema: TrainingPlanInputSchema,
    outputSchema: TrainingPlanOutputSchema,
  },
  async (input) => {
    // Agregamos la descripción de la metodología al input para que el prompt la pueda usar.
    const augmentedInput = {
        ...input,
        methodologyDescriptions: methodologyDescriptions
    };

    const { output } = await prompt(augmentedInput);
    if (!output) {
      throw new Error("La IA no pudo generar un plan de entrenamiento.");
    }
    return output;
  }
);
