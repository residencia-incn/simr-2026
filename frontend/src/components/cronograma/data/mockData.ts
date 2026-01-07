
import { DaySchedule, Speaker } from '../types';

export const SPEAKERS: Speaker[] = [
  { id: '1', name: 'Dr. Juan Pérez', role: 'Neurología Clínica', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYqxoiEpsIOCxRBsW0ywcf3lJjvMpxM9dNJRRLpggFwwtFvbL4CA3YRkdjQu_Ej9oDt7PGgKUh6JRd_w4c3qT3BvenlexAiRalHY7d0a5DTmnccshxG8iPtwjIaB-nN7vtfaN3A_e_iBwjzWh7ZdAkXqY17rIFObL_BWjMqZHCPw1xpVCZDra4xLqAQL3w8U4AHERcel0Jhw7n5u2ZpmGviTcPY1dAliqyCkCSdob8b6NQuxxQlMhvTEor93XvRU1CurbIjRMWgg' },
  { id: '2', name: 'Dra. Ana Gómez', role: 'Investigación', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCDue4nGImsS17cn_X1recIve5il1GDJCdQ8nsU2j0IPngRWoG0AljR0f-hMQe1yaEZMAi7cU5kOxUOYrSh_56G8pBpG3C3txKHvkHWU7II3gE7sw_88WU_UnjSfozaNWhXBcU3WNGINZRKaTdSCKKzcbcOGWDQ5PzeyZJU2FxME_btWVbEtGFpgganJ3IanbccQfOCVZmw9YhIsU3tou7BbXoRG2Xv_1ptB66TwK4Fffjt3mU3uxDOXxU3BMwMEVVo_LGm6KAvow' },
  { id: '3', name: 'Dr. Roberto Díaz', role: 'Pediatría', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCf8RRa7NxIRPCUlO3cR6nuXQq6HAnvrZlmQUExMLTp0yza_fqnk9pyJUp1KrUsBS6cW3FeISvDvZF3KiROBOeI6JIUISeKgeJQzK-RgPpUpOFAh7VsobPlu2hvITATCSfJ_Vb03A3c3IP_0jDm7z4z3s1lYlI3Ay1uvNa2r8JGHkSuglY3CJxEqlxKJXHjE9jVWLuVoANQyim9Y548BPUgrVA2LEtZxZWGPAbL3LYsXTIs324EuamMSwy0mnlbpa25InJDVp3vdw' },
  { id: '4', name: 'Dra. Maria L.', role: 'Neuroética', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3EdFxo0xIsi60AFBcqCQLrINxAt44nR4SPQOL6Q0_1zG06O8248JzPspLN8uLb7WpwJNv1yZdIDZKw-Tb1yEfrJQZwkWpA_3v15j3BE0IpVOtzZzyMfxPnnmyupZCIWCPDPJ0v90iDh4eU7kSGCCKvtAlNuHPOr4szhlcMpf8KJGjeFhvxk2sXfsATlyP6Ud0qVlwyJqSaxe2hUoMdA98ne8-EDZaD38JIvHnYpALaYFWq8L5_GQ2Fv12xEdT1g_CJ6VXVMfTKw' },
  { id: '5', name: 'Dr. Carlos Ruiz', role: 'Moderador', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBbusIm3kAG3yONdllfLW6ZmSAMakcBY9f1GIE2go5aw-AXadiWo8yw8N5SqzjcS5sTo6ND_EOnoseC-8GfA5ZKMCMMSMaTzf8O7tvoWne8LvnC2liofcns35-_oCxLsKl-sVA9MCbRfLOspIV49WSy_tPAv9zletGOeVMgt7FVWCyuTU5OrgEJYyX2KengSe_QCL7lDREhTNBnlL8A1jLDzikWILYeL3O2ApsaJcgeA-JJDkPl-CBwfegXSiHVyJeVb548ntG1w' },
];

export const INITIAL_SCHEDULE: DaySchedule[] = [
  {
    dayNumber: 1,
    date: '12 Nov',
    label: 'Inauguración',
    sessions: [
      { id: 'd1s1', timeStart: '15:00', timeEnd: '15:45', title: 'Inauguración y Bienvenida: El Futuro de la Neurología Virtual', category: 'Conferencia Magistral', categoryColor: 'purple', speakers: [SPEAKERS[0]], location: 'Auditorio Principal', status: 'Publicado' },
      { id: 'd1s2', timeStart: '16:00', timeEnd: '17:00', title: 'Avances en Neuroplasticidad Post-ACV', category: 'Trabajo Original', categoryColor: 'green', speakers: [SPEAKERS[1]], location: 'Sala A', status: 'Publicado' },
      { id: 'd1s3', timeStart: '17:15', timeEnd: '18:00', title: 'Caso Clínico: Esclerosis Múltiple Atípica en Paciente Pediátrico', category: 'Reporte de Caso', categoryColor: 'blue', speakers: [SPEAKERS[2]], location: 'Sala B', status: 'Borrador' },
      { id: 'd1s4', timeStart: '18:30', timeEnd: '19:30', title: 'Ética en la Neurología Moderna: Desafíos de la IA', category: 'Mesa Redonda', categoryColor: 'amber', speakers: [SPEAKERS[4], SPEAKERS[3]], location: 'Auditorio Principal', status: 'Publicado' },
      { id: 'd1s5', timeStart: '20:00', timeEnd: '21:00', title: 'Cierre del Día 1 y Networking', category: 'Evento Social', categoryColor: 'slate', speakers: [], location: 'Sala Virtual B', status: 'Publicado' },
    ]
  },
  {
    dayNumber: 2,
    date: '13 Nov',
    label: 'Neurodegenerativas',
    sessions: [
      { id: 'd2s1', timeStart: '09:00', timeEnd: '10:30', title: 'Alzheimer: Nuevos Biomarcadores', category: 'Plenaria', categoryColor: 'indigo', speakers: [SPEAKERS[0]], location: 'Auditorio Principal', status: 'Publicado' },
      { id: 'd2s2', timeStart: '11:30', timeEnd: '13:00', title: 'Taller: Manejo del Parkinson', category: 'Taller', categoryColor: 'orange', speakers: [SPEAKERS[1]], location: 'Sala C', status: 'Publicado' },
    ]
  },
  {
    dayNumber: 3,
    date: '14 Nov',
    label: 'Epilepsia y Sueño',
    sessions: [
      { id: 'd3s1', timeStart: '09:00', timeEnd: '10:00', title: 'Cirugía de Epilepsia', category: 'Plenaria', categoryColor: 'indigo', speakers: [SPEAKERS[2]], location: 'Auditorio Principal', status: 'Publicado' },
    ]
  },
  {
    dayNumber: 4,
    date: '15 Nov',
    label: 'Neuroinmunología',
    sessions: [
      { id: 'd4s1', timeStart: '10:00', timeEnd: '11:30', title: 'Esclerosis Múltiple 2024', category: 'Plenaria', categoryColor: 'indigo', speakers: [SPEAKERS[0]], location: 'Auditorio Principal', status: 'Publicado' },
    ]
  },
  {
    dayNumber: 5,
    date: '16 Nov',
    label: 'Clausura',
    sessions: [
      { id: 'd5s1', timeStart: '09:30', timeEnd: '10:30', title: 'Premiación Trabajos Libres', category: 'Ceremonia', categoryColor: 'rose', speakers: [SPEAKERS[4]], location: 'Auditorio Principal', status: 'Publicado' },
    ]
  }
];
