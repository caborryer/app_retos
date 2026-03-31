import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

const ChallengeCategory = {
  RUNNING: 'RUNNING',
  CYCLING: 'CYCLING',
  GYM: 'GYM',
  SWIMMING: 'SWIMMING',
  YOGA: 'YOGA',
  TEAM_SPORTS: 'TEAM_SPORTS',
  OUTDOOR: 'OUTDOOR',
  MIXED: 'MIXED',
  PETS: 'PETS',
} as const;

const ChallengeDifficulty = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  EXPERT: 'EXPERT',
} as const;

type ChallengeCategory = (typeof ChallengeCategory)[keyof typeof ChallengeCategory];
type ChallengeDifficulty = (typeof ChallengeDifficulty)[keyof typeof ChallengeDifficulty];
import bcrypt from 'bcryptjs';

config({ path: '.env.local' });
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Missing DATABASE_URL in environment');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ────────────────────────────────────────────────────────────────
  const hashedUserPassword = await bcrypt.hash('user123', 12);
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);

  const regularUser = await prisma.user.upsert({
    where: { email: 'andrea@sportchallenge.com' },
    update: {},
    create: {
      name: 'Andrea Corrales',
      email: 'andrea@sportchallenge.com',
      password: hashedUserPassword,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      level: 12,
      points: 2450,
      badges: {
        create: [
          { name: 'Corredor Inicial', description: 'Completaste tu primer reto de running', icon: '🏃', rarity: 'COMMON' },
          { name: 'Maratonista', description: 'Completaste 10 retos de running', icon: '🏅', rarity: 'RARE' },
        ],
      },
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sport.com' },
    update: {},
    create: {
      name: 'Admin Sport',
      email: 'admin@sport.com',
      password: hashedAdminPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400',
      level: 99,
      points: 0,
    },
  });

  console.log('✅ Users created:', regularUser.email, adminUser.email);

  // ─── Boards & Challenges ──────────────────────────────────────────────────

  const boards = [
    {
      id: 'board-running',
      title: 'Running',
      emoji: '🏃',
      color: '#FF5327',
      active: true,
      challenges: [
        {
          title: '111 mts. de desnivel positivo',
          description: 'Corre al menos 5km con 111mts de desnivel positivo.',
          category: ChallengeCategory.RUNNING,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 500, duration: 30, icon: '🏃', color: '#FF5327',
          images: ['https://pedalia.cc/wp-content/uploads/2018/05/desnivel-positivo-597x1024.jpg'],
          participants: 1234,
          tasks: [
            { title: 'Actividad registrada en Strava', description: 'Sube el link de Strava con la actividad', photoRequired: true },
            { title: 'Foto en la cima', description: 'Sube una foto en la cima del desnivel', photoRequired: true },
          ],
        },
        {
          title: 'Corre con medias disparejas',
          description: 'Completa una carrera usando medias de colores distintos.',
          category: ChallengeCategory.RUNNING,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 300, duration: 7, icon: '🧦', color: '#FC0230',
          images: ['https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400'],
          participants: 856,
          tasks: [
            { title: 'Foto de las medias', description: 'Muestra las medias disparejas antes de correr', photoRequired: true },
            { title: 'Actividad completada', description: 'Adjunta tu actividad de Strava', photoRequired: false },
          ],
        },
        {
          title: 'Cadencia promedio 175',
          description: 'Corre manteniendo una cadencia promedio de 175 pasos por minuto.',
          category: ChallengeCategory.RUNNING,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 400, duration: 14, icon: '👟', color: '#10B981',
          images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
          participants: 2341,
          tasks: [
            { title: 'Captura de cadencia', description: 'Muestra la cadencia promedio en tu app', photoRequired: true },
            { title: 'Actividad en Strava', description: 'Link de la actividad en Strava', photoRequired: false },
          ],
        },
        {
          title: 'Zona 2 por 45 minutos',
          description: 'Corre durante 45 minutos manteniéndote en Zona 2 de frecuencia cardíaca.',
          category: ChallengeCategory.RUNNING,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 350, duration: 7, icon: '❤️', color: '#EF4444',
          images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'],
          participants: 987,
          tasks: [
            { title: 'Captura de frecuencia cardíaca', description: 'Muestra el monitor de FC durante la carrera', photoRequired: true },
          ],
        },
        {
          title: 'Run en ayunas',
          description: 'Realiza una carrera en ayunas de al menos 30 minutos.',
          category: ChallengeCategory.RUNNING,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 450, duration: 3, icon: '🌅', color: '#F59E0B',
          images: ['https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400'],
          participants: 654,
          tasks: [
            { title: 'Foto de madrugada', description: 'Foto antes de salir en ayunas', photoRequired: true },
            { title: 'Actividad registrada', description: 'Adjunta la actividad de Strava', photoRequired: false },
          ],
        },
        {
          title: 'Carrera nocturna',
          description: 'Completa una carrera después de las 20:00h.',
          category: ChallengeCategory.RUNNING,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 300, duration: 7, icon: '🌙', color: '#6366F1',
          images: ['https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=400'],
          participants: 1102,
          tasks: [
            { title: 'Foto nocturna', description: 'Foto corriendo de noche', photoRequired: true },
          ],
        },
        {
          title: 'Pace menor a 5:30/km',
          description: 'Completa 5km con un pace promedio menor a 5:30 minutos por kilómetro.',
          category: ChallengeCategory.RUNNING,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 600, duration: 14, icon: '⚡', color: '#8B5CF6',
          images: ['https://images.unsplash.com/photo-1434596922112-19c563067271?w=400'],
          participants: 445,
          tasks: [
            { title: 'Captura de pace', description: 'Muestra el pace en tu aplicación', photoRequired: true },
            { title: 'Actividad en Strava', description: 'Link de Strava con el pace verificado', photoRequired: false },
          ],
        },
        {
          title: 'Escalera de intensidad',
          description: 'Corre intervalos en escalera: 1min, 2min, 3min, 2min, 1min a máxima intensidad.',
          category: ChallengeCategory.RUNNING,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 550, duration: 7, icon: '🔥', color: '#DC2626',
          images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400'],
          participants: 321,
          tasks: [
            { title: 'Actividad de intervalos', description: 'Adjunta la actividad con los intervalos visibles', photoRequired: false },
            { title: 'Selfie post entrenamiento', description: 'Foto después del entrenamiento', photoRequired: true },
          ],
        },
      ],
    },
    {
      id: 'board-gym',
      title: 'Gym & Fuerza',
      emoji: '💪',
      color: '#FC0230',
      active: false,
      challenges: [
        {
          title: '100 sentadillas diarias',
          description: 'Completa 100 sentadillas cada día durante una semana.',
          category: ChallengeCategory.GYM,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 400, duration: 7, icon: '🏋️', color: '#FC0230',
          images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'],
          participants: 1567,
          tasks: [
            { title: 'Video de sentadillas', description: 'Graba o fotografía tu sesión de sentadillas', photoRequired: true },
          ],
        },
        {
          title: 'Press de banca tu peso corporal',
          description: 'Levanta en press de banca el equivalente a tu peso corporal.',
          category: ChallengeCategory.GYM,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 700, duration: 30, icon: '🏆', color: '#EF4444',
          images: ['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400'],
          participants: 234,
          tasks: [
            { title: 'Video del levantamiento', description: 'Graba el momento del logro', photoRequired: true },
            { title: 'Foto con el peso', description: 'Muestra la barra con el peso', photoRequired: true },
          ],
        },
        {
          title: 'Rutina de 5 días seguidos',
          description: 'Entrena en el gym 5 días consecutivos sin saltarte ninguno.',
          category: ChallengeCategory.GYM,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 350, duration: 7, icon: '📅', color: '#10B981',
          images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400'],
          participants: 2103,
          tasks: [
            { title: 'Foto día 1', description: 'Foto en el gym el primer día', photoRequired: true },
            { title: 'Foto día 3', description: 'Foto en el gym el tercer día', photoRequired: true },
            { title: 'Foto día 5', description: 'Foto en el gym el quinto día', photoRequired: true },
          ],
        },
        {
          title: 'Dominadas perfectas x10',
          description: 'Completa 10 dominadas con técnica perfecta en una sola serie.',
          category: ChallengeCategory.GYM,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 600, duration: 30, icon: '💪', color: '#8B5CF6',
          images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400'],
          participants: 389,
          tasks: [
            { title: 'Video de las dominadas', description: 'Graba las 10 dominadas en un solo video', photoRequired: true },
          ],
        },
        {
          title: 'Plancha 3 minutos',
          description: 'Mantén la posición de plancha durante 3 minutos continuos.',
          category: ChallengeCategory.GYM,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 450, duration: 14, icon: '⏱️', color: '#3B82F6',
          images: ['https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=400'],
          participants: 876,
          tasks: [
            { title: 'Video de la plancha', description: 'Graba los 3 minutos completos', photoRequired: true },
          ],
        },
        {
          title: 'Peso muerto récord personal',
          description: 'Supera tu récord personal en peso muerto.',
          category: ChallengeCategory.GYM,
          difficulty: ChallengeDifficulty.EXPERT,
          points: 800, duration: 30, icon: '🥇', color: '#F59E0B',
          images: ['https://images.unsplash.com/photo-1504394088710-d65b71b7abd5?w=400'],
          participants: 156,
          tasks: [
            { title: 'Foto del peso', description: 'Muestra el peso en la barra', photoRequired: true },
            { title: 'Video del levantamiento', description: 'Graba el levantamiento récord', photoRequired: true },
          ],
        },
        {
          title: 'Entrenamiento funcional 30 min',
          description: 'Completa una sesión de entrenamiento funcional de 30 minutos.',
          category: ChallengeCategory.GYM,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 250, duration: 7, icon: '🤸', color: '#EC4899',
          images: ['https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400'],
          participants: 1890,
          tasks: [
            { title: 'Foto del entrenamiento', description: 'Foto durante la sesión funcional', photoRequired: true },
          ],
        },
        {
          title: 'Superserie sin descanso',
          description: 'Completa una superserie de 4 ejercicios sin descanso entre ellos.',
          category: ChallengeCategory.GYM,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 500, duration: 7, icon: '💥', color: '#DC2626',
          images: ['https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400'],
          participants: 567,
          tasks: [
            { title: 'Video de la superserie', description: 'Graba los 4 ejercicios continuos', photoRequired: true },
          ],
        },
      ],
    },
    {
      id: 'board-swimming',
      title: 'Natación',
      emoji: '🏊',
      color: '#06B6D4',
      active: false,
      challenges: [
        {
          title: '1km en la piscina',
          description: 'Nada 1 kilómetro completo sin parar.',
          category: ChallengeCategory.SWIMMING,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 500, duration: 14, icon: '🏊', color: '#06B6D4',
          images: ['https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400'],
          participants: 678,
          tasks: [
            { title: 'Foto en la piscina', description: 'Foto al terminar el kilómetro', photoRequired: true },
            { title: 'Registro de distancia', description: 'Muestra el marcador de tu reloj o app', photoRequired: true },
          ],
        },
        {
          title: '4 estilos en una sesión',
          description: 'Completa al menos 2 largos de cada uno de los 4 estilos: libre, espalda, pecho y mariposa.',
          category: ChallengeCategory.SWIMMING,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 650, duration: 7, icon: '🦋', color: '#0EA5E9',
          images: ['https://images.unsplash.com/photo-1560090995-01632a28895b?w=400'],
          participants: 234,
          tasks: [
            { title: 'Video de mariposa', description: 'El estilo más difícil, grábalo', photoRequired: true },
            { title: 'Selfie post sesión', description: 'Foto al salir de la piscina', photoRequired: true },
          ],
        },
        {
          title: 'Natación en mar abierto',
          description: 'Nada al menos 500m en mar abierto o lago.',
          category: ChallengeCategory.SWIMMING,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 700, duration: 30, icon: '🌊', color: '#1D4ED8',
          images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'],
          participants: 145,
          tasks: [
            { title: 'Foto en el agua', description: 'Foto nadando en el mar o lago', photoRequired: true },
            { title: 'Ubicación del lugar', description: 'Foto del lugar donde nadaste', photoRequired: true },
          ],
        },
        {
          title: '30 largos seguidos',
          description: 'Nada 30 largos de 25 metros sin detenerte.',
          category: ChallengeCategory.SWIMMING,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 450, duration: 14, icon: '🏁', color: '#7C3AED',
          images: ['https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400'],
          participants: 445,
          tasks: [
            { title: 'Contador de largos', description: 'Foto del contador o app al terminar', photoRequired: true },
          ],
        },
        {
          title: 'Mejora tu tiempo en 50m',
          description: 'Baja tu tiempo personal en los 50 metros libres.',
          category: ChallengeCategory.SWIMMING,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 350, duration: 21, icon: '⏱️', color: '#059669',
          images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400'],
          participants: 567,
          tasks: [
            { title: 'Tiempo anterior', description: 'Muestra tu tiempo anterior', photoRequired: true },
            { title: 'Nuevo tiempo', description: 'Muestra tu nuevo récord', photoRequired: true },
          ],
        },
        {
          title: 'Clase de natación',
          description: 'Asiste a una clase grupal de natación.',
          category: ChallengeCategory.SWIMMING,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 200, duration: 7, icon: '👨‍🏫', color: '#F59E0B',
          images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400'],
          participants: 1234,
          tasks: [
            { title: 'Foto en la clase', description: 'Foto durante la clase de natación', photoRequired: true },
          ],
        },
        {
          title: 'Entrenamiento con paletas',
          description: 'Nada 500m usando paletas de natación.',
          category: ChallengeCategory.SWIMMING,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 380, duration: 7, icon: '🫳', color: '#EC4899',
          images: ['https://images.unsplash.com/photo-1597635985139-d58c9c8f9038?w=400'],
          participants: 312,
          tasks: [
            { title: 'Foto con las paletas', description: 'Muestra las paletas de natación', photoRequired: true },
          ],
        },
        {
          title: 'Duración: 1 hora continua',
          description: 'Nada durante 1 hora sin interrupciones.',
          category: ChallengeCategory.SWIMMING,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 600, duration: 14, icon: '⌛', color: '#DC2626',
          images: ['https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=400'],
          participants: 189,
          tasks: [
            { title: 'Inicio de sesión', description: 'Foto al comenzar', photoRequired: true },
            { title: 'Fin de sesión', description: 'Foto al terminar la hora', photoRequired: true },
          ],
        },
      ],
    },
    {
      id: 'board-yoga',
      title: 'Yoga & Mente',
      emoji: '🧘',
      color: '#10B981',
      active: false,
      challenges: [
        {
          title: '14 días de yoga matutino',
          description: 'Practica yoga cada mañana durante 14 días consecutivos.',
          category: ChallengeCategory.YOGA,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 300, duration: 14, icon: '🧘', color: '#10B981',
          images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'],
          participants: 3456,
          tasks: [
            { title: 'Foto día 1', description: 'Foto de tu primera sesión', photoRequired: true },
            { title: 'Foto día 7', description: 'A mitad del reto', photoRequired: true },
            { title: 'Foto día 14', description: 'Foto del último día', photoRequired: true },
          ],
        },
        {
          title: 'Postura del árbol 2 minutos',
          description: 'Mantén la postura del árbol durante 2 minutos en cada pierna.',
          category: ChallengeCategory.YOGA,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 400, duration: 7, icon: '🌳', color: '#059669',
          images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400'],
          participants: 1234,
          tasks: [
            { title: 'Video de la postura', description: 'Graba la postura del árbol', photoRequired: true },
          ],
        },
        {
          title: 'Meditación 10 min diarios',
          description: 'Medita durante 10 minutos cada día por una semana.',
          category: ChallengeCategory.YOGA,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 200, duration: 7, icon: '🧠', color: '#8B5CF6',
          images: ['https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400'],
          participants: 4567,
          tasks: [
            { title: 'Foto de tu espacio de meditación', description: 'Muestra tu espacio meditativo', photoRequired: true },
          ],
        },
        {
          title: 'Postura del guerrero 5 min',
          description: 'Mantén las 3 posturas del guerrero durante 5 minutos cada una.',
          category: ChallengeCategory.YOGA,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 350, duration: 7, icon: '⚔️', color: '#DC2626',
          images: ['https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=400'],
          participants: 876,
          tasks: [
            { title: 'Foto guerrero I', description: 'Foto en postura guerrero I', photoRequired: true },
            { title: 'Foto guerrero II', description: 'Foto en postura guerrero II', photoRequired: true },
            { title: 'Foto guerrero III', description: 'Foto en postura guerrero III', photoRequired: true },
          ],
        },
        {
          title: 'Sun Salutation x10',
          description: 'Completa 10 saludos al sol seguidos.',
          category: ChallengeCategory.YOGA,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 250, duration: 3, icon: '☀️', color: '#F59E0B',
          images: ['https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400'],
          participants: 2345,
          tasks: [
            { title: 'Video del saludo al sol', description: 'Graba al menos 2 saludos al sol', photoRequired: true },
          ],
        },
        {
          title: 'Yoga en la naturaleza',
          description: 'Practica yoga al aire libre en un parque o espacio natural.',
          category: ChallengeCategory.YOGA,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 300, duration: 14, icon: '🌿', color: '#16A34A',
          images: ['https://images.unsplash.com/photo-1588286840104-8957b019727f?w=400'],
          participants: 1678,
          tasks: [
            { title: 'Foto en la naturaleza', description: 'Foto practicando yoga al aire libre', photoRequired: true },
          ],
        },
        {
          title: 'Postura de la paloma',
          description: 'Domina la postura de la paloma manteniendo 3 minutos por lado.',
          category: ChallengeCategory.YOGA,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 500, duration: 21, icon: '🕊️', color: '#64748B',
          images: ['https://images.unsplash.com/photo-1561799891-7e73f2eb3c5d?w=400'],
          participants: 456,
          tasks: [
            { title: 'Video postura derecha', description: 'Graba el lado derecho', photoRequired: true },
            { title: 'Video postura izquierda', description: 'Graba el lado izquierdo', photoRequired: true },
          ],
        },
        {
          title: 'Clase de yoga en estudio',
          description: 'Asiste a una clase presencial de yoga en un estudio.',
          category: ChallengeCategory.YOGA,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 200, duration: 14, icon: '🏫', color: '#A78BFA',
          images: ['https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400'],
          participants: 2109,
          tasks: [
            { title: 'Foto en el estudio', description: 'Foto en la clase de yoga', photoRequired: true },
          ],
        },
      ],
    },
    {
      id: 'board-cycling',
      title: 'Ciclismo',
      emoji: '🚴',
      color: '#3B82F6',
      active: false,
      challenges: [
        {
          title: '50km en una salida',
          description: 'Completa una salida en bici de 50 kilómetros.',
          category: ChallengeCategory.CYCLING,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 550, duration: 14, icon: '🚴', color: '#3B82F6',
          images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
          participants: 892,
          tasks: [
            { title: 'Actividad en Strava', description: 'Link de la actividad con 50km', photoRequired: false },
            { title: 'Foto en ruta', description: 'Foto durante la salida', photoRequired: true },
          ],
        },
        {
          title: '500m de desnivel acumulado',
          description: 'Sube 500 metros de desnivel en una sola salida.',
          category: ChallengeCategory.CYCLING,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 700, duration: 14, icon: '⛰️', color: '#1D4ED8',
          images: ['https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400'],
          participants: 345,
          tasks: [
            { title: 'Captura del desnivel', description: 'Muestra los 500m de desnivel en Strava', photoRequired: false },
            { title: 'Foto en la subida', description: 'Foto en algún punto de la subida', photoRequired: true },
          ],
        },
        {
          title: 'Promedio de 28 km/h',
          description: 'Completa un recorrido de al menos 30km con velocidad promedio de 28km/h.',
          category: ChallengeCategory.CYCLING,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 650, duration: 14, icon: '⚡', color: '#EF4444',
          images: ['https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400'],
          participants: 234,
          tasks: [
            { title: 'Captura de velocidad promedio', description: 'Muestra la velocidad media en Strava', photoRequired: false },
          ],
        },
        {
          title: 'Rodada nocturna',
          description: 'Realiza una salida en bici después de las 20:00h.',
          category: ChallengeCategory.CYCLING,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 300, duration: 7, icon: '🌙', color: '#6366F1',
          images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400'],
          participants: 1234,
          tasks: [
            { title: 'Foto nocturna en bici', description: 'Foto durante la rodada nocturna', photoRequired: true },
          ],
        },
        {
          title: '3 días seguidos en bici',
          description: 'Sal en bici 3 días consecutivos.',
          category: ChallengeCategory.CYCLING,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 350, duration: 5, icon: '📅', color: '#10B981',
          images: ['https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=400'],
          participants: 1567,
          tasks: [
            { title: 'Actividad día 1', description: 'Link de Strava día 1', photoRequired: false },
            { title: 'Actividad día 2', description: 'Link de Strava día 2', photoRequired: false },
            { title: 'Actividad día 3', description: 'Link de Strava día 3', photoRequired: false },
          ],
        },
        {
          title: 'Ruta de montaña',
          description: 'Completa una ruta de montaña off-road.',
          category: ChallengeCategory.CYCLING,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 600, duration: 14, icon: '🏔️', color: '#78716C',
          images: ['https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5?w=400'],
          participants: 445,
          tasks: [
            { title: 'Foto en la montaña', description: 'Foto en el trail de montaña', photoRequired: true },
            { title: 'Actividad en Strava', description: 'Link de la actividad MTB', photoRequired: false },
          ],
        },
        {
          title: 'Reparación básica de bici',
          description: 'Aprende y realiza una reparación básica: cambio de neumático.',
          category: ChallengeCategory.CYCLING,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 250, duration: 7, icon: '🔧', color: '#F59E0B',
          images: ['https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400'],
          participants: 2345,
          tasks: [
            { title: 'Foto de la reparación', description: 'Foto antes y después del cambio de neumático', photoRequired: true },
          ],
        },
        {
          title: '100km acumulados en la semana',
          description: 'Acumula 100 kilómetros en bici durante una semana.',
          category: ChallengeCategory.CYCLING,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 500, duration: 7, icon: '📊', color: '#06B6D4',
          images: ['https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400'],
          participants: 678,
          tasks: [
            { title: 'Total semanal en Strava', description: 'Captura de los km semanales acumulados', photoRequired: false },
          ],
        },
      ],
    },
    {
      id: 'board-outdoor',
      title: 'Outdoor',
      emoji: '🧗',
      color: '#8B5CF6',
      active: false,
      challenges: [
        {
          title: 'Senderismo 10km',
          description: 'Completa una ruta de senderismo de al menos 10km.',
          category: ChallengeCategory.OUTDOOR,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 400, duration: 14, icon: '🥾', color: '#8B5CF6',
          images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=400'],
          participants: 2345,
          tasks: [
            { title: 'Foto en la ruta', description: 'Foto durante el senderismo', photoRequired: true },
            { title: 'Actividad en Strava', description: 'Adjunta la actividad de senderismo', photoRequired: false },
          ],
        },
        {
          title: 'Escalada en roca',
          description: 'Completa una sesión de escalada en roca natural o rocódromo.',
          category: ChallengeCategory.OUTDOOR,
          difficulty: ChallengeDifficulty.ADVANCED,
          points: 600, duration: 14, icon: '🧗', color: '#DC2626',
          images: ['https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400'],
          participants: 456,
          tasks: [
            { title: 'Foto escalando', description: 'Foto durante la escalada', photoRequired: true },
          ],
        },
        {
          title: 'Amanecer en la montaña',
          description: 'Sube a un punto alto para ver el amanecer.',
          category: ChallengeCategory.OUTDOOR,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 450, duration: 30, icon: '🌄', color: '#F59E0B',
          images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400'],
          participants: 1234,
          tasks: [
            { title: 'Foto del amanecer', description: 'Foto del amanecer desde la altura', photoRequired: true },
          ],
        },
        {
          title: 'Camping una noche',
          description: 'Pasa una noche acampando en la naturaleza.',
          category: ChallengeCategory.OUTDOOR,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 500, duration: 30, icon: '⛺', color: '#16A34A',
          images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400'],
          participants: 789,
          tasks: [
            { title: 'Foto del campamento', description: 'Foto de tu tienda de campaña', photoRequired: true },
            { title: 'Foto nocturna', description: 'Foto del cielo estrellado desde el campamento', photoRequired: true },
          ],
        },
        {
          title: 'Kayak o paddle surf',
          description: 'Practica kayak o paddle surf durante al menos 1 hora.',
          category: ChallengeCategory.OUTDOOR,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 350, duration: 14, icon: '🚣', color: '#0EA5E9',
          images: ['https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400'],
          participants: 567,
          tasks: [
            { title: 'Foto en el agua', description: 'Foto practicando kayak o paddle', photoRequired: true },
          ],
        },
        {
          title: 'Vuelta en bici de montaña',
          description: 'Completa un trail de bici de montaña de al menos 15km.',
          category: ChallengeCategory.OUTDOOR,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 480, duration: 14, icon: '🚵', color: '#78716C',
          images: ['https://images.unsplash.com/photo-1501147830916-ce44a6359892?w=400'],
          participants: 345,
          tasks: [
            { title: 'Foto en el trail', description: 'Foto durante la ruta MTB', photoRequired: true },
            { title: 'Actividad en Strava', description: 'Link del trail de mountain bike', photoRequired: false },
          ],
        },
        {
          title: 'Fotografía en la naturaleza',
          description: 'Toma al menos 10 fotos de naturaleza durante una salida.',
          category: ChallengeCategory.OUTDOOR,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 200, duration: 14, icon: '📸', color: '#EC4899',
          images: ['https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400'],
          participants: 2345,
          tasks: [
            { title: 'Collage de fotos', description: 'Comparte tus mejores fotos de la salida', photoRequired: true },
          ],
        },
        {
          title: 'Orientación sin GPS',
          description: 'Completa una ruta usando solo mapa y brújula.',
          category: ChallengeCategory.OUTDOOR,
          difficulty: ChallengeDifficulty.EXPERT,
          points: 750, duration: 30, icon: '🧭', color: '#B45309',
          images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400'],
          participants: 123,
          tasks: [
            { title: 'Foto con el mapa', description: 'Foto usando el mapa físico en la ruta', photoRequired: true },
            { title: 'Foto en el destino', description: 'Foto al llegar al destino correcto', photoRequired: true },
          ],
        },
      ],
    },
    {
      id: 'board-pets',
      title: 'Mascotas',
      emoji: '🐾',
      color: '#F59E0B',
      active: false,
      challenges: [
        {
          title: 'Paseo diario 30 min con tu mascota',
          description: 'Lleva a tu mascota de paseo durante 30 minutos cada día por una semana.',
          category: ChallengeCategory.PETS,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 250, duration: 7, icon: '🐕', color: '#F59E0B',
          images: ['https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400'],
          participants: 3456,
          tasks: [
            { title: 'Foto del paseo día 1', description: 'Foto de tu mascota en el paseo', photoRequired: true },
            { title: 'Foto del paseo día 7', description: 'Foto del último paseo semanal', photoRequired: true },
          ],
        },
        {
          title: 'Entrenamiento básico de obediencia',
          description: 'Enseña a tu mascota 3 comandos básicos: sentado, quieto y ven.',
          category: ChallengeCategory.PETS,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 350, duration: 14, icon: '🎓', color: '#10B981',
          images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'],
          participants: 1234,
          tasks: [
            { title: 'Video de "sentado"', description: 'Graba a tu mascota haciendo el comando', photoRequired: true },
            { title: 'Video de "quieto"', description: 'Graba el comando de quieto', photoRequired: true },
            { title: 'Video de "ven"', description: 'Graba el comando de venir', photoRequired: true },
          ],
        },
        {
          title: 'Carrera con tu perro',
          description: 'Corre al menos 3km acompañado de tu perro.',
          category: ChallengeCategory.PETS,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 300, duration: 7, icon: '🏃', color: '#FC0230',
          images: ['https://images.unsplash.com/photo-1530281700549-e82ad432f5fa?w=400'],
          participants: 2345,
          tasks: [
            { title: 'Foto corriendo juntos', description: 'Foto de ti corriendo con tu perro', photoRequired: true },
            { title: 'Actividad en Strava', description: 'Link de Strava con la carrera', photoRequired: false },
          ],
        },
        {
          title: 'Agility casero',
          description: 'Crea un circuito de agility casero y haz pasar a tu mascota por él.',
          category: ChallengeCategory.PETS,
          difficulty: ChallengeDifficulty.INTERMEDIATE,
          points: 450, duration: 14, icon: '🏆', color: '#8B5CF6',
          images: ['https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400'],
          participants: 567,
          tasks: [
            { title: 'Foto del circuito', description: 'Muestra el circuito que creaste', photoRequired: true },
            { title: 'Video del agility', description: 'Graba a tu mascota haciendo el circuito', photoRequired: true },
          ],
        },
        {
          title: 'Baño y grooming',
          description: 'Baña y acicala a tu mascota en casa.',
          category: ChallengeCategory.PETS,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 200, duration: 7, icon: '🛁', color: '#06B6D4',
          images: ['https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400'],
          participants: 1890,
          tasks: [
            { title: 'Foto antes y después', description: 'Foto de tu mascota antes y después del baño', photoRequired: true },
          ],
        },
        {
          title: 'Visita al veterinario',
          description: 'Lleva a tu mascota a su chequeo anual o vacuna.',
          category: ChallengeCategory.PETS,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 300, duration: 30, icon: '🏥', color: '#EF4444',
          images: ['https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400'],
          participants: 2345,
          tasks: [
            { title: 'Foto en el veterinario', description: 'Foto con tu mascota en la consulta', photoRequired: true },
          ],
        },
        {
          title: 'Juego interactivo 20 min',
          description: 'Dedica 20 minutos a juego interactivo con tu mascota cada día por 5 días.',
          category: ChallengeCategory.PETS,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 250, duration: 5, icon: '🎾', color: '#F59E0B',
          images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400'],
          participants: 3123,
          tasks: [
            { title: 'Foto de juego día 1', description: 'Foto jugando con tu mascota', photoRequired: true },
            { title: 'Foto de juego día 5', description: 'Foto del último día de juego', photoRequired: true },
          ],
        },
        {
          title: 'Aventura pet-friendly',
          description: 'Visita un lugar pet-friendly (parque, playa, cafetería) con tu mascota.',
          category: ChallengeCategory.PETS,
          difficulty: ChallengeDifficulty.BEGINNER,
          points: 350, duration: 14, icon: '🌟', color: '#EC4899',
          images: ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400'],
          participants: 1678,
          tasks: [
            { title: 'Foto en el lugar', description: 'Foto con tu mascota en el lugar pet-friendly', photoRequired: true },
          ],
        },
      ],
    },
  ];

  for (const boardData of boards) {
    const { challenges, ...boardFields } = boardData;
    const board = await prisma.board.upsert({
      where: { id: boardFields.id },
      update: { title: boardFields.title, emoji: boardFields.emoji, color: boardFields.color, active: boardFields.active },
      create: boardFields,
    });

    for (const challengeData of challenges) {
      const { tasks, ...challengeFields } = challengeData;
      const existing = await prisma.challenge.findFirst({ where: { title: challengeFields.title, boardId: board.id } });
      
      const challenge = existing
        ? existing
        : await prisma.challenge.create({ data: { ...challengeFields, boardId: board.id } });

      for (const task of tasks) {
        const existingTask = await prisma.challengeTask.findFirst({ where: { title: task.title, challengeId: challenge.id } });
        if (!existingTask) {
          await prisma.challengeTask.create({ data: { ...task, challengeId: challenge.id } });
        }
      }
    }
    console.log(`✅ Board "${board.title}" seeded`);
  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
