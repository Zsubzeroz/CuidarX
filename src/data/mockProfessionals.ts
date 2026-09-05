import { Professional } from '../types';

export const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: 'fabricia-rodrigues',
    name: 'Dra. Fabrícia Rodrigues',
    title: 'Podóloga Especialista & Fundadora',
    crpo: 'CRPO/SP 48.912',
    avatar: 'https://ui-avatars.com/api/?name=Fabr%C3%ADcia+Rodrigues&background=E3EEEC&color=0F766E&bold=true&size=200',
    color: '#0F766E',
    email: 'fabricia@cuidarx.com.br',
    phone: '(19) 99722-2694',
    specialties: [
      'Tratamento de Onicocriptose (Unha Encravada)',
      'Tratamento de Órteses Ungueais',
      'Laserterapia Aplicada',
      'Podologia Geral & Profilaxia',
    ],
    bio: 'Mais de 12 anos de atuação clínica dedicada à saúde dos pés, com foco em alívio imediato da dor, desobstrução técnica e estética ungueal.',
    availableDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    workingHours: '08:00 - 18:00',
    active: true,
    rating: 4.98,
    reviewsCount: 142,
  },
];
