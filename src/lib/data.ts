

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
  birthDate: string;
  gender: 'Masculino' | 'Femenino';
  bloodType: string; // e.g., 'O+', 'A-', etc.
  documentType: 'TI' | 'CC' | 'RC'; // Tarjeta de Identidad, Cédula, Registro Civil
  documentNumber: string;
  emergencyContact: string;
  medicalInfo: string;
  team: string;
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
  salary: number;
  team: string;
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

export type PaymentStatus = 'Pagado' | 'Pendiente' | 'En Verificación' | 'Rechazado';

export type Payment = {
  id: number;
  athleteId: number;
  month: string;
  amount: number;
  status: PaymentStatus;
  paymentDate?: string;
  referenceNumber?: string;
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

export type TrainingEvent = {
  id: number;
  date: string;
  time: string;
  team: string;
  coachId: number;
  title: string;
  location: string;
};


export const coaches: Coach[] = [
  { id: 1, name: 'Carlos Rodriguez', salary: 1800000, team: 'Juvenil' },
  { id: 2, name: 'Sofia Vargas', salary: 1800000, team: 'Mayores' },
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
    birthDate: '2007-03-15',
    gender: 'Masculino',
    bloodType: 'O+',
    documentType: 'TI',
    documentNumber: '1001234567',
    emergencyContact: 'Maria Pérez - 3101234567', 
    medicalInfo: 'Alergia a la penicilina', 
    team: 'Juvenil', 
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
    birthDate: '2008-01-20',
    gender: 'Femenino',
    bloodType: 'A+',
    documentType: 'TI',
    documentNumber: '1002345678',
    emergencyContact: 'Luis Gómez - 3119876543', 
    medicalInfo: 'Ninguna', 
    team: 'Juvenil', 
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
    birthDate: '2004-09-05',
    gender: 'Masculino',
    bloodType: 'B-',
    documentType: 'CC',
    documentNumber: '1003456789',
    emergencyContact: 'Elena Fernández - 3125550011', 
    medicalInfo: 'Asma (lleva inhalador)', 
    team: 'Mayores', 
    coachId: 2,
    physicalEvaluations: [
         { date: '2024-05-12', height: '180cm', weight: '78kg', sprint_20m: '2.9s', vertical_jump: '65cm', endurance_test: '11:50' },
    ],
    trainingPlan: defaultTrainingPlan,
  },
  { 
    id: 4, 
    name: 'Maria Jiménez', 
    birthDate: '2005-11-12',
    gender: 'Femenino',
    bloodType: 'AB+',
    documentType: 'CC',
    documentNumber: '1004567890',
    emergencyContact: 'Pedro Jiménez - 3134448899', 
    medicalInfo: 'Ninguna', 
    team: 'Mayores', 
    coachId: 2,
    physicalEvaluations: [],
    trainingPlan: defaultTrainingPlan,
  },
  { 
    id: 5, 
    name: 'Pedro Martinez',
    birthDate: '2011-07-25',
    gender: 'Masculino',
    bloodType: 'A-',
    documentType: 'TI',
    documentNumber: '1005678901',
    emergencyContact: 'Isabel Martinez - 3142223344', 
    medicalInfo: 'Ninguna', 
    team: 'Pre-Juvenil', 
    coachId: 1,
    physicalEvaluations: [
        { date: '2024-05-10', height: '158cm', weight: '54kg', sprint_20m: '3.8s', vertical_jump: '40cm', endurance_test: '08:55' },
    ],
    trainingPlan: defaultTrainingPlan,
  },
  { 
    id: 6, 
    name: 'Lucia Diaz',
    birthDate: '2015-02-10',
    gender: 'Femenino',
    bloodType: 'O-',
    documentType: 'RC',
    documentNumber: '1006789012',
    emergencyContact: 'Jorge Diaz - 3158889900', 
    medicalInfo: 'Ninguna', 
    team: 'Infantil', 
    coachId: 2,
    physicalEvaluations: [],
    trainingPlan: defaultTrainingPlan,
  },
  { 
    id: 7, 
    name: 'Mateo Sanchez',
    birthDate: '2018-10-30',
    gender: 'Masculino',
    bloodType: 'B+',
    documentType: 'RC',
    documentNumber: '1007890123',
    emergencyContact: 'Ana Sanchez - 3167776655', 
    medicalInfo: 'Ninguna', 
    team: 'Promesas', 
    coachId: 2,
    physicalEvaluations: [],
    trainingPlan: defaultTrainingPlan,
  },
  {
    id: 8,
    name: 'Valentina Rojas',
    birthDate: '2007-08-20',
    gender: 'Femenino',
    bloodType: 'A+',
    documentType: 'TI',
    documentNumber: '1008901234',
    emergencyContact: 'Carlos Rojas - 3178887766',
    medicalInfo: 'Ninguna',
    team: 'Juvenil',
    coachId: 1,
    physicalEvaluations: [],
    trainingPlan: defaultTrainingPlan,
  },
  {
    id: 9,
    name: 'David Silva',
    birthDate: '2012-04-12',
    gender: 'Masculino',
    bloodType: 'O+',
    documentType: 'TI',
    documentNumber: '1009012345',
    emergencyContact: 'Laura Silva - 3189998877',
    medicalInfo: 'Ninguna',
    team: 'Pre-Juvenil',
    coachId: 1,
    physicalEvaluations: [],
    trainingPlan: defaultTrainingPlan,
  },
];

export const tasks: Task[] = [
  { id: 1, title: 'Planificar entrenamiento de defensa', description: "Diseñar 3 nuevos ejercicios de posicionamiento defensivo para la categoría Juvenil.", assignedTo: 1, deadline: '2024-08-15', status: 'En Progreso' },
  { id: 2, title: 'Revisar videos del último partido', description: "Analizar el video del partido contra 'Los Pumas' y preparar un informe de 5 puntos clave.", assignedTo: 1, deadline: '2024-08-10', status: 'Completada' },
  { id: 3, title: 'Preparar charla técnica para la final', description: "Crear la presentación para la charla técnica del partido final de la categoría Mayores.", assignedTo: 2, deadline: '2024-08-20', status: 'Pendiente' },
  { id: 4, title: 'Organizar prueba de resistencia física', description: "Coordinar y ejecutar el test de Cooper para todos los jugadores de la categoría Mayores.", assignedTo: 2, deadline: '2024-08-12', status: 'En Progreso' },
];

export const payments: Payment[] = [
  { id: 1, athleteId: 1, month: 'Julio 2024', amount: 50000, status: 'Pagado', paymentDate: '2024-07-05', referenceNumber: 'REF-JUL-001' },
  { id: 2, athleteId: 1, month: 'Agosto 2024', amount: 50000, status: 'Pendiente' },
  { id: 3, athleteId: 2, month: 'Julio 2024', amount: 50000, status: 'Pagado', paymentDate: '2024-07-03', referenceNumber: 'REF-JUL-002' },
  { id: 4, athleteId: 2, month: 'Agosto 2024', amount: 50000, status: 'Pagado', paymentDate: '2024-08-01', referenceNumber: 'REF-AGO-002' },
  { id: 5, athleteId: 3, month: 'Julio 2024', amount: 60000, status: 'Pagado', paymentDate: '2024-07-08', referenceNumber: 'REF-JUL-003' },
  { id: 6, athleteId: 3, month: 'Agosto 2024', amount: 60000, status: 'En Verificación', paymentDate: '2024-08-06', referenceNumber: 'REF-AGO-003' },
  { id: 7, athleteId: 4, month: 'Julio 2024', amount: 60000, status: 'Pendiente' },
  { id: 8, athleteId: 4, month: 'Agosto 2024', amount: 60000, status: 'Pendiente' },
  { id: 9, athleteId: 5, month: 'Agosto 2024', amount: 48000, status: 'Rechazado' },
  { id: 10, athleteId: 6, month: 'Agosto 2024', amount: 45000, status: 'Pendiente' },
  { id: 11, athleteId: 7, month: 'Agosto 2024', amount: 40000, status: 'Pendiente' },
];

export const microcycles: Microcycle[] = [
  {
    id: 1,
    week: "Semana 34 (19 Ago - 25 Ago)",
    coachId: 1,
    methodology: 'periodizacion_tactica',
    team: 'Juvenil',
    mainObjective: 'Mejorar la transición defensa-ataque.',
    sessions: [
      { day: 'Lunes', focus: 'Técnica/Táctica', duration: 90, activities: 'Rondos de posesión. Ejercicios de salida de balón bajo presión. Partido condicionado.' },
      { day: 'Miércoles', focus: 'Físico/Táctico', duration: 90, activities: 'Circuito de fuerza funcional. Trabajo de contraataque 3vs2 y 4vs3. Fútbol en espacio reducido.' },
      { day: 'Viernes', focus: 'Estrategia', duration: 75, activities: 'Análisis de video del rival. Práctica de balón parado (ofensivo y defensivo). Partido táctico 11vs11.' }
    ]
  },
  {
    id: 2,
    week: "Semana 34 (19 Ago - 25 Ago)",
    coachId: 2,
    methodology: 'futbol_medida',
    team: 'Infantil',
    mainObjective: 'Mejora del control y pase.',
    sessions: [
      { day: 'Lunes', focus: 'Técnica', duration: 60, activities: 'Juegos de conducción de balón. Ejercicios de pases en parejas y tríos.' },
      { day: 'Miércoles', focus: 'Coordinación', duration: 60, activities: 'Circuitos de agilidad y coordinación con escaleras y conos.' },
      { day: 'Viernes', focus: 'Juego', duration: 60, activities: 'Partidos en campo reducido 4vs4 y 5vs5.' }
    ]
  }
];

export const trainingEvents: TrainingEvent[] = [
    { id: 1, date: '2024-08-19', time: '16:00', team: 'Juvenil', coachId: 1, title: 'Entrenamiento Táctico', location: 'Cancha Principal' },
    { id: 2, date: '2024-08-20', time: '16:00', team: 'Mayores', coachId: 2, title: 'Entrenamiento Físico', location: 'Cancha Principal' },
    { id: 3, date: '2024-08-21', time: '16:00', team: 'Pre-Juvenil', coachId: 1, title: 'Entrenamiento Físico/Táctico', location: 'Cancha Principal' },
    { id: 4, date: '2024-08-22', time: '16:00', team: 'Infantil', coachId: 2, title: 'Práctica de Fútbol', location: 'Cancha Principal' },
    { id: 5, date: '2024-08-23', time: '16:00', team: 'Promesas', coachId: 1, title: 'Estrategia y Balón Parado', location: 'Cancha Principal' },
];
