
'use server';

import { ai } from '@/ai/genkit';
import { 
    TrainingPlanInputSchema, 
    TrainingPlanOutputSchema,
    TrainingPlanInputSchemaAI,
    type TrainingPlanInput, 
    type TrainingPlanOutput
} from '@/ai/schemas/training-plan-schema';


const methodologyDescriptions = {
  tecnificacion: 'Tecnificación (4-7 años): Enfocado en la familiarización con el balón, la coordinación motriz y juegos lúdicos. Las actividades deben ser simples, divertidas y con mucho contacto con la pelota.',
  futbol_medida: 'Fútbol a la Medida (8-11 años): Se introducen los fundamentos técnicos (pase, control, conducción, tiro) y los principios tácticos básicos (juego en equipo, ocupación de espacios). El juego sigue siendo el eje central, pero con mayor estructura.',
  periodizacion_tactica: 'Periodización Táctica (12-20 años): El entrenamiento se organiza en torno a un modelo de juego. Cada ejercicio tiene un objetivo táctico claro, y las dimensiones técnicas, físicas y psicológicas se trabajan de forma integrada dentro del contexto de juego.',
  unifit: 'Entrenamiento Funcional UNIFIT: Sesiones de alta intensidad en un circuito de 10 estaciones. Cada estación se enfoca en un ejercicio diferente utilizando materiales como balones de pilates, lazos, bancos, bandas de poder, sacos de boxeo, colchonetas, platillos, conos y vallas de salto. El objetivo es mejorar la fuerza, resistencia, agilidad y coordinación general.',
};

export async function createTrainingPlan(input: TrainingPlanInput): Promise<TrainingPlanOutput> {
  // Augment the input with the methodology description for the AI.
  const augmentedInput = {
    ...input,
    methodologyDescription: methodologyDescriptions[input.methodology],
  };
  const result = await createTrainingPlanFlow(augmentedInput);
  if (!result) {
    throw new Error("La IA no pudo generar un plan de entrenamiento.");
  }
  return result;
}


const prompt = ai.definePrompt({
    name: 'createTrainingPlanPrompt',
    input: { schema: TrainingPlanInputSchemaAI },
    output: { schema: TrainingPlanOutputSchema },
    prompt: `
        Eres un director deportivo y experto en metodología de fútbol base, especializado en la creación de planes de entrenamiento.
        Tu tarea es generar un plan de entrenamiento (mesociclo) completo y coherente basado en los siguientes parámetros:

        1.  **Categoría del Equipo:** {{{category}}}
        2.  **Metodología a Aplicar:** {{methodology}} - {{{methodologyDescription}}}
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
        -   'focus': El foco de la sesión (Técnico, Táctico, Físico, etc.). Si la metodología es UNIFIT, el foco debe ser 'Entrenamiento Funcional en Circuito'.
        -   'duration': La duración en minutos (ajusta la duración según la edad/metodología, ej: 45-60 min para tecnificación, 90 min para periodización táctica). Para UNIFIT, usa 60 minutos.
        -   'activities': Una descripción clara y concisa de los ejercicios. Estructura las actividades en "Calentamiento", "Parte Principal" y "Vuelta a la Calma". Para UNIFIT, la "Parte Principal" debe detallar 10 estaciones de ejercicios diferentes, especificando el tiempo de trabajo y descanso y los materiales (balones de pilates, lazos, bancos, bandas de poder, sacos de boxeo, colchonetas, platillos, conos, vallas de salto).
        -   'fieldDimensions': Las dimensiones del terreno a utilizar (Ej: 'Medio campo', '20x30m'). Para UNIFIT, usa 'Gimnasio / Zona Funcional'.
        -   'recoveryTime': Indicaciones sobre las pausas de recuperación e hidratación (Ej: 'Pausas de 2 min cada 15 min', 'Hidratación libre'). Para UNIFIT, especifica la recuperación entre estaciones.

        **IMPORTANTE:** El contenido debe ser 100% en español. Asegúrate de que la progresión de los objetivos y la complejidad de las actividades sean coherentes con la metodología y la categoría de edad.
    `,
});


const createTrainingPlanFlow = ai.defineFlow(
  {
    name: 'createTrainingPlanFlow',
    inputSchema: TrainingPlanInputSchemaAI,
    outputSchema: TrainingPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      // Throwing an error here is better for handling in the calling function.
      throw new Error("La IA no pudo generar un plan de entrenamiento.");
    }
    return output;
  }
);

