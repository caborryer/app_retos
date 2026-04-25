'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'info',
    title: 'Info',
    content: (
      <div className="space-y-2 text-sm text-secondary-600 leading-relaxed">
        <p>
          <span className="font-semibold text-secondary-900">Bingo</span> es una plataforma de retos deportivos
          en formato tablero de bingo. Cada casilla del tablero representa un reto diferente que debes completar.
        </p>
        <p>
          Al completar una casilla sube una foto o adjunta tu actividad de Strava como evidencia. El admin
          revisará tu envío y lo aprobará o rechazará.
        </p>
        <ul className="space-y-1 mt-2">
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold mt-0.5">→</span>
            Para iniciar un reto, haz click en la tarjeta o recuadro correspondiente del tablero.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold mt-0.5">→</span>
            Completa 8 casillas y gana el <span className="font-semibold">BINGO</span>.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold mt-0.5">→</span>
            Acumula puntos con cada reto completado y sube de nivel.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-500 font-bold mt-0.5">→</span>
            Cada tablero tiene una temática diferente: Running, Gym, Natación, y más.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'reglas',
    title: 'Reglas',
    content: (
      <ol className="space-y-2 text-sm text-secondary-600 leading-relaxed list-none">
        {[
          'Cada participante debe completar los retos de forma honesta y en el tiempo indicado.',
          'La evidencia de cada reto debe ser una foto propia o el link de la actividad en Strava.',
          'No se aceptan fotos o links de terceros ni de actividades anteriores al inicio del reto.',
          'El equipo organizador validará cada envío. Las decisiones de aprobación son definitivas.',
          'Cada reto completado y aprobado suma los puntos indicados en la casilla.',
          'La casilla central (libre) se cuenta como completada automáticamente.',
          'Al completar el tablero se otorga una bonificación adicional de puntos.',
          'Cualquier intento de trampa descalificará al participante del tablero activo.',
        ].map((rule, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
    ),
  },
  // {
  //   id: 'tyc',
  //   title: 'Términos y Condiciones',
  //   content: (
  //     <div className="space-y-3 text-sm text-secondary-600 leading-relaxed">
  //       <p>
  //         Al participar en Bingo aceptas los siguientes términos:
  //       </p>
  //       <div className="space-y-2">
  //         <div>
  //           <p className="font-semibold text-secondary-800">1. Uso de la plataforma</p>
  //           <p>
  //             El uso de Bingo está destinado exclusivamente a personas mayores de 16 años.
  //             La plataforma es de uso personal e intransferible.
  //           </p>
  //         </div>
  //         <div>
  //           <p className="font-semibold text-secondary-800">2. Privacidad</p>
  //           <p>
  //             Las fotos e información compartida en los retos son visibles para el equipo
  //             organizador con fines de validación. No se compartirán con terceros.
  //           </p>
  //         </div>
  //         <div>
  //           <p className="font-semibold text-secondary-800">3. Modificaciones</p>
  //           <p>
  //             Los organizadores se reservan el derecho de modificar reglas, tableros y
  //             puntuaciones con previo aviso a los participantes.
  //           </p>
  //         </div>
  //         <div>
  //           <p className="font-semibold text-secondary-800">4. Responsabilidad</p>
  //           <p>
  //             Cada participante es responsable de su propia seguridad al realizar los retos.
  //             Bingo no se hace responsable de lesiones o daños derivados de la práctica deportiva.
  //           </p>
  //         </div>
  //       </div>
  //       <p className="text-xs text-secondary-400 mt-2">
  //         Última actualización: Marzo 2026
  //       </p>
  //     </div>
  //   ),
  // },
  {
    id: 'faq',
    title: 'FAQ',
    content: (
      <div className="space-y-4 text-sm text-secondary-600 leading-relaxed">
        {[
          {
            q: '¿Cuánto tiempo tengo para completar un tablero?',
            a: 'Cada tablero tiene una duración definida por el organizador. Puedes ver la fecha límite en los detalles de cada reto.',
          },
          {
            q: '¿Puedo subir el link de Strava en lugar de una foto?',
            a: 'Sí, en los retos deportivos (running, ciclismo, gym, natación, etc.) puedes adjuntar el link de tu actividad en Strava como evidencia válida.',
          },
          {
            q: '¿Qué pasa si mi envío es rechazado?',
            a: 'Recibirás una notificación con el motivo del rechazo. Podrás volver a subir la evidencia correcta para que sea revisada nuevamente.',
          },
          {
            q: '¿Cómo se calculan los puntos?',
            a: 'Cada reto tiene un valor en puntos indicado en la casilla. Al completar y ser aprobado, los puntos se suman automáticamente a tu perfil.',
          },
          {
            q: '¿Puedo participar en varios tableros al mismo tiempo?',
            a: 'Actualmente solo hay un tablero activo por vez. Al completar el bingo podrás pasar al siguiente tablero disponible.',
          },
        ].map(({ q, a }, i) => (
          <div key={i} className="border-b border-secondary-100 pb-3 last:border-0 last:pb-0">
            <p className="font-semibold text-secondary-800 mb-1">{q}</p>
            <p>{a}</p>
          </div>
        ))}
      </div>
    ),
  },
];

export default function InfoAccordion() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white overflow-hidden divide-y divide-secondary-100">
      {SECTIONS.map((section) => {
        const isOpen = openId === section.id;

        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                isOpen ? 'bg-primary-50' : 'hover:bg-secondary-50'
              )}
            >
              <span
                className={cn(
                  'flex-1 font-semibold text-sm',
                  isOpen ? 'text-primary-600' : 'text-secondary-900'
                )}
              >
                {section.title}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isOpen ? 'text-primary-500' : 'text-secondary-400'
                  )}
                />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1">
                    {section.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
