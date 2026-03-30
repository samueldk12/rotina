// ====================================================
//  BIBLIOTECA DE EXERCÍCIOS COM REFERÊNCIAS DE MÍDIA
// ====================================================

const EXERCISE_LIBRARY = {
  // --- OMBRO / UPPER BODY ---
  'desenvolvimento': {
    name: 'Desenvolvimento com Halteres',
    muscles: ['Ombro', 'Tríceps'],
    image: 'images/ex_desenvolvimento.png',
    videoId: 'qEwKCR5JCog',
    tips: 'Cadência 3-0-3. Expire ao subir, inspire ao descer. Mantenha o core contraído.',
    category: 'upper'
  },
  'rotacao_interna': {
    name: 'Rotação Interna',
    muscles: ['Manguito Rotador'],
    image: 'images/upper_body.png',
    videoId: 'mK3F9cELFcM',
    tips: 'Movimento lento e controlado. Mantenha o cotovelo colado ao corpo a 90°.',
    category: 'upper'
  },
  'supino': {
    name: 'Supino com Halteres',
    muscles: ['Peito', 'Tríceps', 'Ombro'],
    image: 'images/ex_supino.png',
    videoId: 'VmB1G1K7v94',
    tips: 'Cadência 3-0-3. Aperte o peitoral no topo do movimento.',
    category: 'upper'
  },
  'elevacao_lateral': {
    name: 'Elevação Lateral',
    muscles: ['Deltóide Lateral'],
    image: 'images/ex_elevacao_lateral.png',
    videoId: '3VcKaXpzqRo',
    tips: 'Cotovelos levemente dobrados. Eleve até a altura dos ombros, não além.',
    category: 'upper'
  },
  'elevacao_frontal': {
    name: 'Elevação Frontal',
    muscles: ['Deltóide Anterior'],
    image: 'images/ex_desenvolvimento.png',
    videoId: 'gkZJNyFuWIY',
    tips: 'Não balance o corpo. Eleve até a linha dos ombros.',
    category: 'upper'
  },
  'remada_curvada': {
    name: 'Remada Curvada',
    muscles: ['Costas', 'Bíceps', 'Ombro Posterior'],
    image: 'images/ex_remada.png',
    videoId: 'roCP6wCXPqo',
    tips: 'Mantenha as costas neutras (não arredonde). Puxe os cotovelos para trás, não para cima.',
    category: 'upper'
  },
  'rotacao_externa': {
    name: 'Rotação Externa',
    muscles: ['Manguito Rotador', 'Deltóide Posterior'],
    image: 'images/upper_body.png',
    videoId: 'mK3F9cELFcM',
    tips: 'Costas neutras, cotovelo fixo. Rotacione lentamente.',
    category: 'upper'
  },
  'crucifixo_inverso': {
    name: 'Crucifixo Inverso',
    muscles: ['Deltóide Posterior', 'Trapézio'],
    image: 'images/upper_body.png',
    videoId: 'k7bDqCBm7YA',
    tips: 'Incline o tronco a 45°. Abra os braços como asas.',
    category: 'upper'
  },
  'crucifixo': {
    name: 'Crucifixo com Halteres',
    muscles: ['Peito', 'Bíceps'],
    image: 'images/ex_supino.png',
    videoId: 'eozdVDA78K0',
    tips: 'Mantenha os cotovelos levemente dobrados. Sinta o alongamento no peito.',
    category: 'upper'
  },
  'rosca_direta': {
    name: 'Rosca Direta',
    muscles: ['Bíceps'],
    image: 'images/ex_rosca_direta.png',
    videoId: 'ykJmrZ5v0Oo',
    tips: 'Não balance os cotovelos. Controle a descida (3 segundos).',
    category: 'upper'
  },
  'rosca_alternada': {
    name: 'Rosca Alternada',
    muscles: ['Bíceps', 'Braquial'],
    image: 'images/ex_rosca_direta.png',
    videoId: 'ykJmrZ5v0Oo',
    tips: 'Alterne os braços de forma controlada. Supine o pulso no topo.',
    category: 'upper'
  },
  'rosca_martelo': {
    name: 'Rosca Martelo',
    muscles: ['Bíceps', 'Braquiorradial'],
    image: 'images/ex_rosca_direta.png',
    videoId: 'TwD-YGVP4Bk',
    tips: 'Polegar aponta para cima durante todo o movimento.',
    category: 'upper'
  },
  'rosca_inversa': {
    name: 'Rosca Inversa',
    muscles: ['Braquiorradial', 'Antebraço'],
    image: 'images/ex_rosca_direta.png',
    videoId: 'nLvSjgqDpHM',
    tips: 'Pegada por cima (pronada). Movimento controlado.',
    category: 'upper'
  },
  'triceps_frances': {
    name: 'Tríceps Francês',
    muscles: ['Tríceps'],
    image: 'images/ex_triceps_frances.png',
    videoId: 'd_KZxkY_ifA',
    tips: 'Mantenha os cotovelos apontados para cima. Não mova os ombros.',
    category: 'upper'
  },
  'triceps_testa': {
    name: 'Tríceps Testa',
    muscles: ['Tríceps'],
    image: 'images/ex_triceps_frances.png',
    videoId: 'NIKsVeEoGhI',
    tips: 'Deitado. Abaixe lentamente até a testa. Estenda sem bloqueio.',
    category: 'upper'
  },
  'extensao_triceps': {
    name: 'Extensão de Tríceps',
    muscles: ['Tríceps'],
    image: 'images/ex_triceps_frances.png',
    videoId: 'YbX7Wd8jQ-Q',
    tips: 'Em pé ou deitado. Mantenha o cotovelo fixo. Total extensão.',
    category: 'upper'
  },
  'flexao_punho': {
    name: 'Flexão de Punho',
    muscles: ['Antebraço Flexor'],
    image: 'images/upper_body.png',
    videoId: 's3tQnKMI8B8',
    tips: 'Apoie o antebraço numa superfície. Mova apenas o punho.',
    category: 'upper'
  },
  'extensao_punho': {
    name: 'Extensão de Punho',
    muscles: ['Antebraço Extensor'],
    image: 'images/upper_body.png',
    videoId: 's3tQnKMI8B8',
    tips: 'Pegada por cima. Eleve o dorso da mão. Controle a descida.',
    category: 'upper'
  },

  // --- PERNA / LOWER BODY ---
  'agachamento': {
    name: 'Agachamento com Haltere',
    muscles: ['Quadríceps', 'Glúteo', 'Posterior'],
    image: 'images/ex_agachamento.png',
    videoId: 'ultWZbUMPL8',
    tips: 'Desça até joelhos a 90°. Joelhos alinhados com a ponta dos pés.',
    category: 'lower'
  },
  'agachamento_livre': {
    name: 'Agachamento Livre (Sem Peso)',
    muscles: ['Quadríceps', 'Glúteo'],
    image: 'images/ex_agachamento.png',
    videoId: 'aclHkVaku9U',
    tips: 'Peso no calcanhar. Mantenha o peito erguido.',
    category: 'lower'
  },
  'stepups': {
    name: 'Step-ups',
    muscles: ['Glúteo', 'Quadríceps', 'Panturrilha'],
    image: 'images/ex_stepup.png',
    videoId: 'dQqApCGd5Ss',
    tips: 'Suba com o calcanhar do pé que está no step. Controle a descida.',
    category: 'lower'
  },
  'terra_romeno': {
    name: 'Levantamento Terra Romeno',
    muscles: ['Isquiotibiais', 'Glúteo', 'Lombar'],
    image: 'images/ex_terra_romeno.png',
    videoId: '1uDiW5--rAE',
    tips: 'Mantenha os halteres perto do corpo. Sinta o alongamento na posterior.',
    category: 'lower'
  },
  'elevacao_pelvica': {
    name: 'Elevação Pélvica',
    muscles: ['Glúteo', 'Isquiotibiais'],
    image: 'images/lower_body.png',
    videoId: 'wPM8icPu6H8',
    tips: 'Espreme o glúteo no topo. Mantenha a posição por 1 segundo.',
    category: 'lower'
  },
  'avanco': {
    name: 'Avanço Alternado',
    muscles: ['Glúteo', 'Quadríceps', 'Isquiotibiais'],
    image: 'images/ex_avanco.png',
    videoId: 'D7KaRcUTQeE',
    tips: 'Joelho de trás quase toca o chão. Execute de forma explosiva nas séries de velocidade.',
    category: 'lower'
  },
  'panturrilha': {
    name: 'Elevação de Panturrilha',
    muscles: ['Gastrocnêmio', 'Sóleo'],
    image: 'images/lower_body.png',
    videoId: 'gwLzBJYoWlI',
    tips: '100 repetições totais. Pode fazer em partes. Suba na ponta dos pés ao máximo.',
    category: 'lower'
  },
  'stiff': {
    name: 'Stiff com Haltere (Unilateral)',
    muscles: ['Isquiotibiais', 'Glúteo'],
    image: 'images/ex_terra_romeno.png',
    videoId: '1uDiW5--rAE',
    tips: 'Uma perna de cada vez. Sinta o alongamento na posterior da coxa.',
    category: 'lower'
  },

  // --- CORE / FUNCIONAL ---
  'abdominal': {
    name: 'Abdominal',
    muscles: ['Abdômen'],
    image: 'images/ex_abdominal.png',
    videoId: 'jDwoBqPH0jk',
    tips: 'Expire ao subir. Não force o pescoço. Sinta a contração do abdômen.',
    category: 'core'
  },
  'flexao': {
    name: 'Flexão de Braço',
    muscles: ['Peito', 'Tríceps', 'Ombro'],
    image: 'images/ex_flexao.png',
    videoId: 'IODxDxX7oi4',
    tips: 'Corpo reto como uma prancha. Desça até o peito quase tocar o chão.',
    category: 'core'
  },
  'flexao_fechada': {
    name: 'Flexão Fechada (Diamante)',
    muscles: ['Tríceps', 'Peito'],
    image: 'images/ex_flexao.png',
    videoId: 'J0DXGy0-_v8',
    tips: 'Mãos formam um diamante. Foco no tríceps.',
    category: 'core'
  },
  'shadowing': {
    name: 'Shadowing (Shadow Boxing)',
    muscles: ['Ombro', 'Cardio', 'Coordenação'],
    image: 'images/ex_shadowing.png',
    videoId: 'gDrTFlbAj0c',
    tips: 'Com o haltere de 6kg: apenas movimentos curtos (holds). Não dê socos rápidos para proteger os cotovelos!',
    category: 'core'
  },
  'alongamento_horizontal': {
    name: 'Alongamento Horizontal',
    muscles: ['Peitoral', 'Ombro'],
    image: 'images/core_shadow.png',
    videoId: 'GEfzCBQb0Hg',
    tips: 'Braço cruzado na frente do peito. Segure 30 segundos. Respire profundamente.',
    category: 'core'
  },
  'alongamento_cabeca': {
    name: 'Alongamento Sobre a Cabeça',
    muscles: ['Tríceps', 'Latíssimo'],
    image: 'images/core_shadow.png',
    videoId: 'GEfzCBQb0Hg',
    tips: 'Eleve o braço, dobre o cotovelo, empurre o cotovelo para baixo com a outra mão.',
    category: 'core'
  },
  'alongamento_dinamico': {
    name: 'Alongamento Dinâmico',
    muscles: ['Corpo Todo'],
    image: 'images/core_shadow.png',
    videoId: 'bywiVXRbaAM',
    tips: 'Movimentos fluidos e progressivos. Não force os limites no início.',
    category: 'core'
  },
};

// ====================================================
//  FICHAS DE TREINO
// ====================================================

const WORKOUT_SHEETS = {
  ficha1: {
    id: 'ficha1',
    name: 'Ficha 1',
    subtitle: 'Básica',
    description: 'Pouco Tempo / Recuperação',
    intensity: 'basic',
    intensityLabel: 'BÁSICA',
    intensityIcon: 'circleGreen',
    color: '#22c55e',
    restTime: 30,
    blocks: [
      {
        name: 'Bloco Diário Rápido',
        type: 'circuit',
        note: '1 série sem parar',
        exercises: [
          { key: 'shadowing', sets: 1, reps: '3 min', note: 'Aquecimento' },
          { key: 'flexao', sets: 1, reps: 'Máximo' },
          { key: 'abdominal', sets: 1, reps: 30 },
          { key: 'desenvolvimento', sets: 1, reps: 15 },
          { key: 'rotacao_interna', sets: 1, reps: 15 },
          { key: 'supino', sets: 1, reps: 20 },
        ]
      },
      {
        name: 'Circuito Funcional',
        type: 'circuit',
        note: '3 voltas · 30s de descanso',
        exercises: [
          { key: 'agachamento_livre', sets: 3, reps: 20 },
          { key: 'remada_curvada', sets: 3, reps: 20 },
          { key: 'rosca_direta', sets: 3, reps: 15 },
          { key: 'elevacao_frontal', sets: 3, reps: 15 },
        ]
      },
      {
        name: 'Finalização',
        type: 'stretch',
        note: '5 minutos, foco na respiração',
        exercises: [
          { key: 'alongamento_horizontal', sets: 1, reps: '30s cada lado' },
          { key: 'alongamento_cabeca', sets: 1, reps: '30s cada lado' },
        ]
      }
    ]
  },

  ficha2: {
    id: 'ficha2',
    name: 'Ficha 2',
    subtitle: 'Média Intensidade',
    description: 'Perna e Ombro',
    intensity: 'medium',
    intensityLabel: 'MÉDIA',
    intensityIcon: 'circleYellow',
    color: '#eab308',
    restTime: 50,
    blocks: [
      {
        name: 'Aquecimento',
        type: 'warmup',
        note: '3 séries',
        exercises: [
          { key: 'shadowing', sets: 3, reps: '2 min' },
          { key: 'flexao', sets: 3, reps: 'Máximo' },
          { key: 'abdominal', sets: 3, reps: 30 },
        ]
      },
      {
        name: 'Super-set Perna',
        type: 'superset',
        note: '4 séries · 45–60s descanso',
        exercises: [
          { key: 'agachamento', sets: 4, reps: 15 },
          { key: 'stepups', sets: 4, reps: 15, note: 'Cada perna' },
        ]
      },
      {
        name: 'Posterior e Glúteo',
        type: 'normal',
        note: '3 séries · 45–60s descanso',
        exercises: [
          { key: 'terra_romeno', sets: 3, reps: 20 },
          { key: 'elevacao_pelvica', sets: 3, reps: 20 },
        ]
      },
      {
        name: 'Ombro e Frontal',
        type: 'normal',
        note: '4 séries',
        exercises: [
          { key: 'desenvolvimento', sets: 4, reps: 15, note: 'Base diária' },
          { key: 'elevacao_frontal', sets: 4, reps: 20 },
        ]
      },
      {
        name: 'Antebraço',
        type: 'normal',
        note: '3 séries',
        exercises: [
          { key: 'flexao_punho', sets: 3, reps: 25 },
          { key: 'extensao_punho', sets: 3, reps: 25 },
        ]
      },
      {
        name: 'Finalização',
        type: 'stretch',
        note: '30s cada',
        exercises: [
          { key: 'alongamento_horizontal', sets: 1, reps: '30s cada lado' },
          { key: 'alongamento_cabeca', sets: 1, reps: '30s cada lado' },
        ]
      }
    ]
  },

  ficha3: {
    id: 'ficha3',
    name: 'Ficha 3',
    subtitle: 'Alta Intensidade',
    description: 'Completo – Foco Costas/Ombro',
    intensity: 'high',
    intensityLabel: 'ALTA',
    intensityIcon: 'circleRed',
    color: '#ef4444',
    restTime: 60,
    blocks: [
      {
        name: 'Aquecimento',
        type: 'warmup',
        note: '4 séries exaustivas',
        exercises: [
          { key: 'shadowing', sets: 4, reps: '3 min' },
          { key: 'flexao', sets: 4, reps: 'Máximo' },
          { key: 'abdominal', sets: 4, reps: 30 },
        ]
      },
      {
        name: 'Tri-set "Costas de Ferro"',
        type: 'triset',
        note: '4 séries · 1 min entre séries · sem descanso no bloco',
        exercises: [
          { key: 'remada_curvada', sets: 4, reps: 20 },
          { key: 'rotacao_externa', sets: 4, reps: 20 },
          { key: 'crucifixo_inverso', sets: 4, reps: 15 },
        ]
      },
      {
        name: 'Bi-set Peito e Ombro',
        type: 'bisset',
        note: '4 séries · 1 min entre séries',
        exercises: [
          { key: 'supino', sets: 4, reps: 20 },
          { key: 'elevacao_lateral', sets: 4, reps: 'Até a falha' },
        ]
      },
      {
        name: 'Giant-set Braços',
        type: 'giantset',
        note: '3 séries · 1 min entre séries',
        exercises: [
          { key: 'rosca_direta', sets: 3, reps: 12 },
          { key: 'triceps_frances', sets: 3, reps: 20 },
          { key: 'rosca_martelo', sets: 3, reps: 12 },
          { key: 'triceps_testa', sets: 3, reps: 15 },
        ]
      },
      {
        name: 'Finalizador',
        type: 'finisher',
        note: 'Até queimar!',
        exercises: [
          { key: 'rosca_inversa', sets: 1, reps: 'Até a falha' },
        ]
      }
    ]
  },

  ficha4: {
    id: 'ficha4',
    name: 'Ficha 4',
    subtitle: 'Vôlei + Recuperação',
    description: 'Quarta-feira',
    intensity: 'volleyball',
    intensityLabel: 'VÔLEI',
    intensityIcon: 'volleyball',
    color: '#3b82f6',
    restTime: 45,
    blocks: [
      {
        name: 'Pré-Vôlei',
        type: 'warmup',
        note: 'Antes do jogo',
        exercises: [
          { key: 'alongamento_dinamico', sets: 1, reps: '5 min' },
          { key: 'shadowing', sets: 1, reps: '3 min (leve)' },
        ]
      },
      {
        name: 'Bi-set Bíceps (Pós-Vôlei)',
        type: 'bisset',
        note: '4 séries de 15',
        exercises: [
          { key: 'rosca_direta', sets: 4, reps: 15 },
          { key: 'rosca_alternada', sets: 4, reps: 15, note: 'Cada braço' },
        ]
      },
      {
        name: 'Explosão de Perna',
        type: 'circuit',
        note: '3 séries de 20 rápidas',
        exercises: [
          { key: 'avanco', sets: 3, reps: 20, note: 'Alternado, rápido' },
        ]
      },
      {
        name: 'Panturrilha',
        type: 'finisher',
        note: '100 repetições totais',
        exercises: [
          { key: 'panturrilha', sets: 1, reps: '100 total' },
        ]
      }
    ]
  }
};

// ====================================================
//  ROTINA SEMANAL
// ====================================================

const WEEKLY_ROUTINE = {
  0: { // Domingo
    dayName: 'Domingo',
    dayShort: 'Dom',
    dayImage: 'images/lower_body.png',
    studies: [
      { subject: 'Matemática', duration: '1h30', iconKey: 'ruler', color: '#a855f7' },
      { subject: 'Raciocínio Lógico', duration: '1h', iconKey: 'brain', color: '#6366f1' },
      { subject: 'Economia', duration: '30 min', iconKey: 'barChart', color: '#14b8a6' },
    ],
    workout: {
      sheetId: 'ficha1',
      focus: 'Ombro, Perna, Alongamento',
      module: 'Módulo: Alongamento e Perna',
      label: 'Básica',
    }
  },
  1: { // Segunda
    dayName: 'Segunda-feira',
    dayShort: 'Seg',
    dayImage: 'images/ex_desenvolvimento.png',
    studies: [
      { subject: 'Inteligência Artificial', duration: '2h30', iconKey: 'ai', color: '#00d4ff' },
      { subject: 'Português', duration: '1h', iconKey: 'pen', color: '#f59e0b' },
      { subject: 'Regimento Interno', duration: '30 min', iconKey: 'scale', color: '#64748b' },
    ],
    workout: {
      sheetId: 'ficha2',
      focus: 'Ombro, Perna, Alongamento',
      module: 'Módulo: Completo',
      label: 'Média – Perna e Ombro',
    }
  },
  2: { // Terça
    dayName: 'Terça-feira',
    dayShort: 'Ter',
    dayImage: 'images/ex_remada.png',
    studies: [
      { subject: 'Governança', duration: '1h', iconKey: 'building', color: '#8b5cf6' },
      { subject: 'Computação', duration: '1h', iconKey: 'monitor', color: '#06b6d4' },
      { subject: 'Português', duration: '1h', iconKey: 'pen', color: '#f59e0b' },
    ],
    workout: {
      sheetId: 'ficha3',
      focus: 'Ombro, Costas, Peito, Bíceps, Tríceps, Antebraço',
      module: 'Módulo: Completo',
      label: 'Alta – Completo Costas/Ombro',
    }
  },
  3: { // Quarta
    dayName: 'Quarta-feira',
    dayShort: 'Qua',
    dayImage: 'images/ex_avanco.png',
    studies: [
      { subject: 'Banco de Dados', duration: '3h', iconKey: 'database', color: '#f97316' },
      { subject: 'Português', duration: '1h', iconKey: 'pen', color: '#f59e0b' },
    ],
    workout: {
      sheetId: 'ficha4',
      focus: 'Vôlei, Bíceps, Perna, Alongamento',
      module: 'Módulo: Alongamento e Perna',
      label: 'Básica – Vôlei + Recuperação',
    }
  },
  4: { // Quinta
    dayName: 'Quinta-feira',
    dayShort: 'Qui',
    dayImage: 'images/ex_supino.png',
    studies: [
      { subject: 'Computação', duration: '2h', iconKey: 'monitor', color: '#06b6d4' },
      { subject: 'Engenharia de Software', duration: '1h', iconKey: 'gear', color: '#10b981' },
      { subject: 'Português', duration: '1h', iconKey: 'pen', color: '#f59e0b' },
    ],
    workout: {
      sheetId: 'ficha3',
      focus: 'Ombro, Costas, Peito, Bíceps, Tríceps, Antebraço',
      module: 'Módulo: Completo',
      label: 'Média – Completo',
    }
  },
  5: { // Sexta
    dayName: 'Sexta-feira',
    dayShort: 'Sex',
    dayImage: 'images/ex_agachamento.png',
    studies: [
      { subject: 'Redes', duration: '3h', iconKey: 'globe', color: '#22d3ee' },
      { subject: 'Português', duration: '1h', iconKey: 'pen', color: '#f59e0b' },
    ],
    workout: {
      sheetId: 'ficha2',
      focus: 'Ombro, Perna, Alongamento',
      module: 'Módulo: Alongamento e Perna',
      label: 'Alta – Perna e Ombro',
    }
  },
  6: { // Sábado
    dayName: 'Sábado',
    dayShort: 'Sáb',
    dayImage: 'images/ex_triceps_frances.png',
    studies: [
      { subject: 'Arquitetura de Computadores', duration: '1h30', iconKey: 'cpu', color: '#7c3aed' },
      { subject: 'Segurança', duration: '1h30', iconKey: 'lock', color: '#dc2626' },
      { subject: 'Português', duration: '1h', iconKey: 'pen', color: '#f59e0b' },
    ],
    workout: {
      sheetId: 'ficha3',
      focus: 'Ombro, Costas, Peito, Bíceps, Tríceps, Antebraço',
      module: 'Módulo: Completo',
      label: 'Alta – "Esmaga"',
    }
  }
};

const DAILY_BASE = [
  { key: 'desenvolvimento', reps: 15 },
  { key: 'rotacao_interna', reps: 15 },
  { key: 'supino', reps: 20 },
  { key: 'abdominal', reps: 30 },
  { key: 'flexao', reps: 'Máximo' },
  { key: 'shadowing', reps: '3 min' },
];

const OPTIMIZATION_TIPS = [
  { iconKey: 'timer', title: 'Cadência 3-0-3', text: '3s concêntrica (subida) + 3s excêntrica (descida). Dobra o tempo sob tensão com os 6kg.' },
  { iconKey: 'target', title: 'Foco Unilateral em Pernas', text: 'Use uma perna de cada vez no Stiff e Agachamento para maximizar a carga sentida.' },
  { iconKey: 'bolt', title: 'Cuidado no Shadowing', text: 'Com o haltere: apenas movimentos curtos (holds). Não soque rápido para proteger os cotovelos!' },
];
