# 🏃‍♂️ SportChallenge - App de Retos Deportivos

Una aplicación web moderna de retos deportivos, optimizada para dispositivos móviles con diseño responsive y una experiencia de usuario excepcional.

## ✨ Características

- 🎯 **Retos Deportivos Personalizados**: Crea y participa en retos de diferentes disciplinas
- 📊 **Seguimiento de Progreso**: Visualiza tu progreso en tiempo real
- 🏆 **Sistema de Logros**: Gana insignias y sube de nivel
- 📱 **PWA Ready**: Instalable en dispositivos móviles
- 🎨 **Diseño Moderno**: UI/UX intuitiva inspirada en las mejores apps del mercado
- ⚡ **Rendimiento Óptimo**: Built with Next.js 14 y React 18
- 🔔 **Notificaciones**: Sistema de notificaciones integrado
- 📈 **Estadísticas**: Visualiza tus estadísticas y actividad

## 🛠️ Tecnologías

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **Estilos**: Tailwind CSS 3.4
- **Animaciones**: Framer Motion
- **Estado**: Zustand
- **Iconos**: Lucide React
- **Forms**: React Hook Form + Zod
- **Fechas**: date-fns

## 📋 Requisitos Previos

- Node.js 18.17 o superior
- npm, yarn, pnpm o bun

## 🚀 Instalación

1. **Clonar o navegar al directorio del proyecto**

```bash
cd app_deportes
```

2. **Instalar dependencias**

```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Ejecutar en modo desarrollo**

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

4. **Abrir en el navegador**

Navega a [http://localhost:3000](http://localhost:3000)

## 📱 Instalación como PWA

### En iOS (Safari)
1. Abre la app en Safari
2. Toca el botón "Compartir" (icono de cuadrado con flecha)
3. Selecciona "Añadir a pantalla de inicio"
4. Toca "Añadir"

### En Android (Chrome)
1. Abre la app en Chrome
2. Toca el menú (tres puntos)
3. Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio"

## 📦 Build para Producción

```bash
npm run build
npm start
```

O con otros gestores de paquetes:

```bash
yarn build
yarn start

# o
pnpm build
pnpm start
```

## 🏗️ Estructura del Proyecto

```
app_deportes/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página de inicio (Home)
│   │   ├── globals.css        # Estilos globales
│   │   ├── challenges/        # Retos
│   │   │   ├── page.tsx       # Lista de retos
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Detalle de reto
│   │   ├── activity/          # Actividad y estadísticas
│   │   │   └── page.tsx
│   │   └── profile/           # Perfil de usuario
│   │       └── page.tsx
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── Layout.tsx
│   │   └── challenges/       # Componentes de retos
│   │       ├── ChallengeCard.tsx
│   │       ├── ChallengeGrid.tsx
│   │       └── CategoryFilter.tsx
│   ├── store/                # Estado global (Zustand)
│   │   └── useAppStore.ts
│   ├── lib/                  # Utilidades y helpers
│   │   ├── utils.ts
│   │   └── mockData.ts
│   └── types/                # TypeScript types
│       └── index.ts
├── public/                   # Archivos estáticos
├── mocks/                    # Mockups SVG originales
├── tailwind.config.ts        # Configuración Tailwind
├── tsconfig.json            # Configuración TypeScript
├── next.config.js           # Configuración Next.js
└── package.json             # Dependencias

```

## 🎨 Paleta de Colores

- **Primary (Rosa/Rojo)**: `#FC0230` - Color principal de la marca
- **Accent (Naranja)**: `#FF6B35` - Color de acento
- **Success (Verde)**: `#10B981` - Estados de éxito
- **Warning (Amarillo)**: `#F59E0B` - Advertencias
- **Error (Rojo)**: `#EF4444` - Errores

## 🧩 Componentes Principales

### Layout Components
- `Header`: Barra superior con notificaciones y hora
- `BottomNav`: Navegación inferior con 4 pestañas
- `Layout`: Wrapper principal con safe areas

### UI Components
- `Button`: Botón con variantes y estados
- `Card`: Tarjeta con diferentes estilos
- `Badge`: Etiqueta de estado o categoría
- `ProgressBar`: Barra de progreso animada

### Challenge Components
- `ChallengeCard`: Tarjeta de reto individual
- `ChallengeGrid`: Grid 3x3 para tareas visuales
- `CategoryFilter`: Filtro de categorías horizontal

## 📱 Páginas

1. **Home** (`/`): Página principal con resumen de actividad
2. **Challenges** (`/challenges`): Lista de todos los retos disponibles
3. **Challenge Detail** (`/challenges/[id]`): Detalle completo de un reto
4. **Activity** (`/activity`): Historial de actividad y estadísticas
5. **Profile** (`/profile`): Perfil de usuario y configuración

## 🔧 Personalización

### Cambiar colores del tema

Edita `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    500: '#TU_COLOR',
    // ...
  }
}
```

### Agregar nuevos retos

Edita `src/lib/mockData.ts`:

```typescript
export const mockChallenges: Challenge[] = [
  {
    id: 'nuevo-reto',
    title: 'Mi Reto',
    // ...
  }
]
```

## 🧪 Testing

```bash
npm run lint        # Linter
npm run type-check  # TypeScript check
```

## 📝 Buenas Prácticas Implementadas

- ✅ **Arquitectura Modular**: Componentes reutilizables
- ✅ **TypeScript**: Tipado estático completo
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Accessibility**: ARIA labels y navegación por teclado
- ✅ **Performance**: Lazy loading y code splitting
- ✅ **SEO**: Metadata optimizado
- ✅ **PWA**: Service workers y manifest
- ✅ **State Management**: Zustand con persist
- ✅ **Animaciones**: Smooth animations con Framer Motion

## 🚀 Próximas Funcionalidades

- [ ] Autenticación con OAuth
- [ ] Backend real con API
- [ ] Integración con wearables
- [ ] Compartir en redes sociales
- [ ] Sistema de amigos
- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] Modo offline completo
- [ ] Análisis avanzado de datos

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autor

Desarrollado por Andrea Corrales

## 🙏 Agradecimientos

- Diseño inspirado en los mockups proporcionados
- Iconos por [Lucide Icons](https://lucide.dev/)
- Imágenes de [Unsplash](https://unsplash.com/)

---

⭐ Si te gusta este proyecto, dale una estrella!

