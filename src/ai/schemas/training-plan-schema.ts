
import { z } from 'zod';

const sessionSchema = z.object({
  day: z.string().describe("Día de la semana de la sesión (Ej: Lunes, Martes)."),
  focus: z.string().describe("Foco principal de la sesión (Ej: Técnica, Táctica, Físico, Estrategia)."),
  duration: z.number().describe("Duración de la sesión en minutos."),
  activities: z.string().describe("Descripción detallada de las actividades y ejercicios a realizar. Usa saltos de línea para separar las fases (Calentamiento, Parte Principal, Vuelta a la Calma)."),
  fieldDimensions: z.string().describe("Dimensiones del terreno de juego a utilizar para los ejercicios principales (Ej: 'Medio campo', '20x30 metros', 'Espacio reducido'). Debe ser apropiado para la categoría y el objetivo.").optional(),
  recoveryTime: z.string().describe("Indicaciones sobre los tiempos de recuperación o pausas para hidratación (Ej: 'Pausas de 2 min cada 15 min', 'Hidratación libre', 'Recuperación activa entre series'). Debe ser apropiado para la intensidad y la edad de los jugadores.").optional(),
});

const microcycleSchema = z.object({
    week: z.string().describe("Nombre o número de la semana (Ej: Semana 1, Semana 34)."),
    mainObjective: z.string().describe("El objetivo principal a trabajar durante este microciclo."),
    sessions: z.array(sessionSchema).describe("Lista de sesiones de entrenamiento para la semana."),
});

// Zod schema for the AI input, used for validation and type generation.
export const TrainingPlanInputSchemaAI = z.object({
  category: z.string().describe("La categoría o equipo para el que se genera el plan (Ej: Sub-17, Tecnificación)."),
  methodology: z.enum(['tecnificacion', 'futbol_medida', 'periodizacion_tactica']).describe("La metodología de formación a aplicar."),
  methodologyDescription: z.string().describe("La descripción de la metodología seleccionada."),
  mesocycleObjective: z.string().describe("El objetivo principal a lograr durante todo el mesociclo (varias semanas)."),
  weeks: z.coerce.number().describe("El número de semanas que durará el mesociclo (cuántos microciclos generar)."),
});

// Zod schema for the form input. It's almost the same but doesn't need methodologyDescription.
export const TrainingPlanInputSchema = z.object({
  category: z.string().min(1, "La categoría es requerida."),
  methodology: z.enum(['tecnificacion', 'futbol_medida', 'periodizacion_tactica'], { required_error: 'La metodología es requerida.'}),
  mesocycleObjective: z.string().min(10, "El objetivo debe tener al menos 10 caracteres."),
  weeks: z.coerce.number().min(1, "Debe ser al menos 1 semana.").max(8, "No se pueden generar más de 8 semanas a la vez."),
});
export type TrainingPlanInput = z.infer<typeof TrainingPlanInputSchema>;


export const TrainingPlanOutputSchema = z.object({
  mesocycleObjective: z.string().describe("El objetivo principal del mesociclo generado."),
  microcycles: z.array(microcycleSchema).describe("Una lista de los microciclos (planes semanales) que componen el mesociclo."),
});
export type TrainingPlanOutput = z.infer<typeof TrainingPlanOutputSchema>;
