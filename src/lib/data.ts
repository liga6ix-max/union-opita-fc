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
};

export type Coach = {
  id: number;
  name:string;
};

export type Task = {
  id: number;
  title: string;
  assignedTo: number; // Coach ID
  deadline: string;
  status: 'Pendiente' | 'En Progreso' | 'Completada';
};

export type Payment = {
  id: number;
  athleteId: number;
  month: string;
  amount: number;
  status: 'Pagado' | 'Pendiente';
  paymentDate?: string;
};

export const coaches: Coach[] = [
  { id: 1, name: 'Carlos Rodriguez' },
  { id: 2, name: 'Sofia Vargas' },
];

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
    ]
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
    ]
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
    ]
  },
  { 
    id: 4, 
    name: 'Maria Jiménez', 
    emergencyContact: 'Pedro Jiménez - 3134448899', 
    medicalInfo: 'Ninguna', 
    team: 'Sub-20', 
    monthlyFee: 60000, 
    coachId: 2,
    physicalEvaluations: []
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
    ]
  },
];

export const tasks: Task[] = [
  { id: 1, title: 'Planificar entrenamiento de defensa', assignedTo: 1, deadline: '2024-08-15', status: 'En Progreso' },
  { id: 2, title: 'Revisar videos del último partido', assignedTo: 1, deadline: '2024-08-10', status: 'Completada' },
  { id: 3, title: 'Preparar charla técnica para la final', assignedTo: 2, deadline: '2024-08-20', status: 'Pendiente' },
  { id: 4, title: 'Organizar prueba de resistencia física', assignedTo: 2, deadline: '2024-08-12', status: 'En Progreso' },
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
