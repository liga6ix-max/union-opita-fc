export type PhysicalEvaluation = {
  date: string;
  height: string; // cm
  weight: string; // kg
  sprint_20m: string; // seconds
  vertical_jump: string; // cm
  endurance_test: string; // minutes:seconds
};

export type Athlete = {
  id: number;
  name: string;
  emergencyContact: string;
  medicalInfo: string;
  team: string;
  monthlyFee: number;
  coachId: number;
  physicalEvaluations: PhysicalEvaluation[];
  trainingPlan: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };
};

export type Coach = {
  id: number;
  name:string;
};

export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';

export type Task = {
  id: number;
  title: string;
  description: string;
  assignedTo: number; // Coach ID
  deadline: string;
  status: TaskStatus;
};

export type Payment = {
  id: number;
  athleteId: number;
  month: string;
  amount: number;
  status: 'Pagado' | 'Pendiente';
  paymentDate?: string;
};

export type MicrocycleMethodology = 'tecnificacion' | 'futbol_medida' | 'periodizacion_tactica';

export type Microcycle = {
  id: number;
  week: string; // e.g., "Semana 1 (2024-08-19 - 2024-08-25)"
  coachId: number;
  methodology: MicrocycleMethodology;
  team: string;
  mainObjective: string;
  sessions: {
    day: string; // Lunes, Martes, etc.
    focus: string; // Calentamiento, Principal, Vuelta a la calma
    duration: number; // in minutes
    activities: string;
  }[];
};


export const coaches: Coach[] = [
  { id: 1, name: 'Carlos Rodriguez' },
  { id: 2, name: 'Sofia Vargas' },
];

const defaultTrainingPlan = {
    q1: "Fase de Acondicionamiento Físico General y técnica fundamental.",
    q2: "Desarrollo de la fuerza específica, velocidad y táctica de equipo.",
    q3: "Periodo competitivo, mantenimiento de la forma física y estrategia de partido.",
    q4: "Transición y recuperación activa, trabajo técnico de baja intensidad.",
};

export const athletes: Athlete[] = [
  { 
    id: 1, 
    name: 'Juan Pérez', 
    emergencyContact: 'Maria Pérez - 3101234567', 
    medicalInfo: 'Alergia a la penicilina', 
    team: 'Sub-17', 
    monthlyFee: 50000, 
    coachId: 1,
    physicalEvaluations: [
        { date: '2024-05-10', height: '175cm', weight: '70kg', sprint_20m: '3.1s', vertical_jump: '55cm', endurance_test: '10:30' },
        { date: '2024-08-01', height: '176cm', weight: '72kg', sprint_20m: '3.0s', vertical_jump: '58cm', endurance_test: '11:05' },
    ],
    trainingPlan: defaultTrainingPlan,
  },
  { 
    id: 2, 
    name: 'Ana Gómez', 
    emergencyContact: 'Luis Gómez - 3119876543', 
    medicalInfo: 'Ninguna', 
    team: 'Sub-17', 
    monthlyFee: 50000, 
    coachId: 1,
    physicalEvaluations: [
        { date: '2024-05-11', height: '168cm', weight: '58kg', sprint_20m: '3.4s', vertical_jump: '48cm', endurance_test: '12:15' },
        { date: '2024-08-02', height: '168cm', weight: '59kg', sprint_20m: '3.3s', vertical_jump: '50cm', endurance_test: '12:45' },
    ],
    trainingPlan: defaultTrainingPlan,
  },
  { 
    id: 3, 
    name: 'Luis Fernández', 
    emergencyContact: 'Elena Fernández - 3125550011', 
    medicalInfo: 'Asma (lleva inhalador)', 
    team: 'Sub-20', 
    monthlyFee: 60000, 
    coachId: 2,
    physicalEvaluations: [
         { date: '2024-05-12', height: '180cm', weight: '78kg', sprint_20m: '2.9s', vertical_jump: '65cm', endurance_test: '11:50' },
    ],
    trainingPlan: defaultTrainingPlan,
  },
  { 
    id: 4, 
    name: 'Maria Jiménez', 
    emergencyContact: 'Pedro Jiménez - 3134448899', 
    medicalInfo: 'Ninguna', 
    team: 'Sub-20', 
    monthlyFee: 60000, 
    coachId: 2,
    physicalEvaluations: [],
    trainingPlan: defaultTrainingPlan,
  },
  { 
    id: 5, 
    name: 'Pedro Martinez', 
    emergencyContact: 'Isabel Martinez - 3142223344', 
    medicalInfo: 'Ninguna', 
    team: 'Sub-17', 
    monthlyFee: 50000, 
    coachId: 1,
    physicalEvaluations: [
        { date: '2024-05-10', height: '178cm', weight: '74kg', sprint_20m: '3.2s', vertical_jump: '60cm', endurance_test: '10:55' },
    ],
    trainingPlan: defaultTrainingPlan,
  },
];

export const tasks: Task[] = [
  { id: 1, title: 'Planificar entrenamiento de defensa', description: "Diseñar 3 nuevos ejercicios de posicionamiento defensivo para la categoría Sub-17.", assignedTo: 1, deadline: '2024-08-15', status: 'En Progreso' },
  { id: 2, title: 'Revisar videos del último partido', description: "Analizar el video del partido contra 'Los Pumas' y preparar un informe de 5 puntos clave.", assignedTo: 1, deadline: '2024-08-10', status: 'Completada' },
  { id: 3, title: 'Preparar charla técnica para la final', description: "Crear la presentación para la charla técnica del partido final de la Sub-20.", assignedTo: 2, deadline: '2024-08-20', status: 'Pendiente' },
  { id: 4, title: 'Organizar prueba de resistencia física', description: "Coordinar y ejecutar el test de Cooper para todos los jugadores de la Sub-20.", assignedTo: 2, deadline: '2024-08-12', status: 'En Progreso' },
];

export const payments: Payment[] = [
  { id: 1, athleteId: 1, month: 'Julio 2024', amount: 50000, status: 'Pagado', paymentDate: '2024-07-05' },
  { id: 2, athleteId: 1, month: 'Agosto 2024', amount: 50000, status: 'Pendiente' },
  { id: 3, athleteId: 2, month: 'Julio 2024', amount: 50000, status: 'Pagado', paymentDate: '2024-07-03' },
  { id: 4, athleteId: 2, month: 'Agosto 2024', amount: 50000, status: 'Pagado', paymentDate: '2024-08-01' },
  { id: 5, athleteId: 3, month: 'Julio 2024', amount: 60000, status: 'Pagado', paymentDate: '2024-07-08' },
  { id: 6, athleteId: 3, month: 'Agosto 2024', amount: 60000, status: 'Pendiente' },
  { id: 7, athleteId: 4, month: 'Julio 2024', amount: 60000, status: 'Pendiente' },
  { id: 8, athleteId: 4, month: 'Agosto 2024', amount: 60000, status: 'Pendiente' },
];

export const microcycles: Microcycle[] = [
  {
    id: 1,
    week: "Semana 34 (19 Ago - 25 Ago)",
    coachId: 1,
    methodology: 'periodizacion_tactica',
    team: 'Sub-17',
    mainObjective: 'Mejorar la transición defensa-ataque.',
    sessions: [
      { day: 'Lunes', focus: 'Técnica/Táctica', duration: 90, activities: 'Rondos de posesión. Ejercicios de salida de balón bajo presión. Partido condicionado.' },
      { day: 'Miércoles', focus: 'Físico/Táctico', duration: 90, activities: 'Circuito de fuerza funcional. Trabajo de contraataque 3vs2 y 4vs3. Fútbol en espacio reducido.' },
      { day: 'Viernes', focus: 'Estrategia', duration: 75, activities: 'Análisis de video del rival. Práctica de balón parado (ofensivo y defensivo). Partido táctico 11vs11.' }
    ]
  }
];
