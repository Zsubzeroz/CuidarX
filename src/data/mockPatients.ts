import { Patient, Appointment } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'marina-alves',
    name: 'Marina Alves',
    age: 43,
    condition: 'Onicocriptose',
    locationDetails: 'hálux direito',
    timeAgo: 'há 2 dias',
    tagColor: 'teal',
    phone: '(11) 98451-2093',
    cpf: '284.910.428-11',
    status: 'in-progress',
    isDiabetic: false,
    hasCirculatoryIssues: false,
    isHypertensive: false,
    allergies: 'Dipirona',
    painScale: 4,
    footStrike: 'pronada',
    shoeHabit: 'Tênis esportivo amortecido',
    footMarkers: [
      {
        id: 'mark-m1',
        foot: 'right',
        x: 34,
        y: 18,
        condition: 'Onicocriptose no Hálux',
        severity: 'moderate',
        notes: 'Prega ungueal lateral com espícula e inflamação moderada.',
        date: '12 de maio',
      },
      {
        id: 'mark-m2',
        foot: 'right',
        x: 48,
        y: 65,
        condition: 'Pressão no Arco Medial',
        severity: 'mild',
        notes: 'Pronação excessiva na corrida de rua.',
        date: '19 de maio',
      },
    ],
    notes: 'Sensibilidade aprimorada, sem histórico de diabetes. Pratica corrida de rua aos fins de semana.',
    timeline: [
      {
        id: 't-1',
        date: '12 de maio',
        title: 'Avaliação inicial',
        note: 'Unha encravada no hálux direito, sinais leves de inflamação lateral. Iniciado protocolo de redução de borda e assepsia profunda.',
        done: true,
        procedure: 'Espiculotomia e curativo com sulfadiazina'
      },
      {
        id: 't-2',
        date: '19 de maio',
        title: 'Sessão 2',
        note: 'Redução de borda ungueal e curativo. Paciente relata menos sensibilidade ao caminhar.',
        done: true,
        procedure: 'Desbastamento de sulco e aplicação de órtese metálica'
      },
      {
        id: 't-3',
        date: '26 de maio',
        title: 'Sessão 3',
        note: 'Melhora visível da inflamação, sem dor à palpação. Retorno em 15 dias para reavaliação.',
        done: false,
        procedure: 'Ajuste de tração e laserterapia cicatrizante'
      }
    ],
    photos: [
      {
        id: 'p-1',
        type: 'before',
        label: 'Antes',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
        date: '12 de maio'
      },
      {
        id: 'p-2',
        type: 'after',
        label: 'Depois',
        url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        date: '19 de maio'
      },
      {
        id: 'p-3',
        type: 'progress',
        label: 'Sulco ungueal',
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
        date: '26 de maio'
      },
      {
        id: 'p-4',
        type: 'progress',
        label: 'Órtese aplicada',
        url: 'https://images.unsplash.com/photo-1583912267670-6575ad373688?auto=format&fit=crop&w=600&q=80',
        date: '26 de maio'
      }
    ]
  },
  {
    id: 'joao-pedro',
    name: 'João Pedro Nogueira',
    age: 56,
    condition: 'Calo plantar',
    locationDetails: 'antepé esquerdo, 2º metatarso',
    timeAgo: 'há 5 dias',
    tagColor: 'clay',
    phone: '(11) 97120-8841',
    cpf: '159.340.718-40',
    status: 'in-progress',
    isDiabetic: true,
    hasCirculatoryIssues: true,
    isHypertensive: true,
    allergies: 'Nenhuma',
    painScale: 6,
    footStrike: 'neutra',
    shoeHabit: 'Bota de segurança / calçado de trabalho rígido',
    footMarkers: [
      {
        id: 'mark-jp1',
        foot: 'left',
        x: 48,
        y: 65,
        condition: 'Calo com Núcleo (Heloma Duro)',
        severity: 'severe',
        notes: '2º metatarso esquerdo com hiperqueratose acentuada e dor focal.',
        date: '02 de maio',
      },
      {
        id: 'mark-jp2',
        foot: 'left',
        x: 52,
        y: 152,
        condition: 'Fissura Calcânea',
        severity: 'moderate',
        notes: 'Pele muito xerótica no calcanhar esquerdo.',
        date: '15 de maio',
      },
    ],
    notes: 'Hiperqueratose mecânica por sobrecarga postural e uso prolongado de calçado de segurança.',
    timeline: [
      {
        id: 't-jp-1',
        date: '02 de maio',
        title: 'Desbastamento inicial',
        note: 'Remoção mecânica de calosidade com bisturi descartável nº 15 e lixamento podológico com micromotor.',
        done: true,
        procedure: 'Enucleação do heloma duro plantar'
      },
      {
        id: 't-jp-2',
        date: '15 de maio',
        title: 'Sessão 2 - Hidratação e Alívio',
        note: 'Aplicação de ureia 20% com oclusão e indicação de protetor de silicone para apoio dos metatarsos.',
        done: true,
        procedure: 'Podoprofilaxia e órtese de silicone sob medida'
      }
    ],
    photos: [
      {
        id: 'p-jp-1',
        type: 'before',
        label: 'Antes',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
        date: '02 de maio'
      },
      {
        id: 'p-jp-2',
        type: 'after',
        label: 'Depois',
        url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        date: '15 de maio'
      }
    ]
  },
  {
    id: 'helena-duarte',
    name: 'Helena Duarte',
    age: 31,
    condition: 'Alta do tratamento',
    locationDetails: 'verruga plantar resolvida',
    timeAgo: 'há 1 semana',
    tagColor: 'sage',
    phone: '(11) 99342-0199',
    cpf: '401.882.310-92',
    status: 'completed',
    notes: 'Paciente recebeu alta clínica após ciclo completo de 4 sessões com resposta tecidual excelente.',
    timeline: [
      {
        id: 't-hd-1',
        date: '10 de abril',
        title: 'Diagnóstico e Cauterização',
        note: 'Lesão circunscrita com pontos hemorrágicos característicos de HPV cutâneo. Aplicação de ácido nítrico.',
        done: true,
        procedure: 'Aplicação química tópica'
      },
      {
        id: 't-hd-2',
        date: '28 de abril',
        title: 'Reepitelização',
        note: 'Descamação satisfatória, sem dor espontânea ao apoio no solo.',
        done: true,
        procedure: 'Assepsia e laser de baixa intensidade'
      },
      {
        id: 't-hd-3',
        date: '18 de maio',
        title: 'Alta Médica / Podológica',
        note: 'Dermatoglifos íntegros reconstituídos. Orientação para proteção em áreas úmidas (academias/piscinas).',
        done: true,
        procedure: 'Exame dermatoscópico e alta'
      }
    ],
    photos: [
      {
        id: 'p-hd-1',
        type: 'before',
        label: 'Antes',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
        date: '10 de abril'
      },
      {
        id: 'p-hd-2',
        type: 'after',
        label: 'Alta',
        url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        date: '18 de maio'
      }
    ]
  },
  {
    id: 'carlos-mendes',
    name: 'Carlos Mendes',
    age: 62,
    condition: 'Pé Diabético Preventivo',
    locationDetails: 'ambos os membros inferiores',
    timeAgo: 'há 2 semanas',
    tagColor: 'clay',
    phone: '(11) 98112-4409',
    cpf: '098.541.229-87',
    status: 'in-progress',
    notes: 'DM tipo 2 compensado. Teste com monofilamento de Semmes-Weinstein 10g apresentou sensibilidade preservada.',
    timeline: [
      {
        id: 't-cm-1',
        date: '14 de maio',
        title: 'Rastreio de Neuropatia',
        note: 'Corte profilático reto das unhas, hidratação cutânea intensa, sem fissuras calcâneas.',
        done: true,
        procedure: 'Corte técnico e teste de sensibilidade protetora'
      }
    ],
    photos: [
      {
        id: 'p-cm-1',
        type: 'before',
        label: 'Registro',
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
        date: '14 de maio'
      }
    ]
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'ap-1',
    time: '14:00',
    patientId: 'marina-alves',
    patientName: 'Marina Alves',
    condition: 'Onicocriptose — Retorno / Ajuste',
    status: 'confirmed',
    type: 'Curativo e Órtese'
  },
  {
    id: 'ap-2',
    time: '15:30',
    patientId: 'joao-pedro',
    patientName: 'João Pedro Nogueira',
    condition: 'Calo plantar — Sessão 2',
    status: 'in_progress',
    type: 'Desbastamento mecânico'
  },
  {
    id: 'ap-3',
    time: '17:00',
    patientId: 'carlos-mendes',
    patientName: 'Carlos Mendes',
    condition: 'Pé Diabético Preventivo — Avaliação',
    status: 'confirmed',
    type: 'Podogeriatria profilática'
  }
];
