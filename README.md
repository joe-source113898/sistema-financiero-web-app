# 💰 Sistema financiero

> **Suite para controlar tus finanzas con IA, dashboard moderno y OCR para tickets.**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🎯 ¿Qué incluye?

- 📊 **Dashboard visual** con KPIs y gráficas.
- 🤖 **Agente IA** que registra transacciones por chat y entiende tickets.
- 📸 **OCR** con Gemini Vision para leer facturas/fotos.
- 📝 **Formularios manuales** para quien prefiere entrada tradicional.
- ♻️ **Gastos recurrentes** y módulo de **ahorro/inversión** dedicado.

Funciona perfecto para personas, familias o pequeños negocios que quieren un panorama claro de ingresos/gastos.

---

## 🤖 Para asistentes de IA

### Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                 Next.js 15 (Full Stack)             │
├─────────────────────────────────────────────────────┤
│ FRONTEND (App Router)                               │
│ ├─ app/page.tsx               → Dashboard           │
│ ├─ app/registro/              → Formulario          │
│ ├─ app/agente-mejorado/       → Chat con IA         │
│ ├─ app/ahorro-inversion/      → Módulo ahorro       │
│ └─ components/*.tsx           → UI reutilizable     │
├─────────────────────────────────────────────────────┤
│ BACKEND (API Routes)                                │
│ └─ app/api/*                                         │
│     ├─ transacciones/route.ts → GET transacciones    │
│     ├─ chat/stream/route.ts   → Chat + function call │
│     └─ upload-image/route.ts  → OCR + Storage        │
├─────────────────────────────────────────────────────┤
│ DATABASE (Supabase / PostgreSQL)                    │
│ ├─ Tabla `transacciones`                            │
│ ├─ Tabla `objetivos_ahorro`                         │
│ └─ Tabla `gastos_mensuales`                         │
└─────────────────────────────────────────────────────┘
```

### Esquema de base de datos (copiar/pegar)

```sql
-- Objetivos de ahorro
CREATE TABLE objetivos_ahorro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  nombre TEXT NOT NULL,
  meta NUMERIC(10,2),
  descripcion TEXT,
  color TEXT,
  icono TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_objetivos_usuario ON objetivos_ahorro(usuario_id);

ALTER TABLE objetivos_ahorro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view objetivos"
  ON objetivos_ahorro FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can manage objetivos"
  ON objetivos_ahorro FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Tabla de transacciones (ahora enlaza a objetivos)
CREATE TABLE transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMP NOT NULL DEFAULT NOW(),
  tipo TEXT CHECK (tipo IN ('ingreso', 'gasto')) NOT NULL,
  monto NUMERIC(10, 2) NOT NULL CHECK (monto > 0),
  categoria TEXT NOT NULL,
  concepto TEXT DEFAULT 'Transacción manual',
  descripcion TEXT,
  metodo_pago TEXT CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia')),
  registrado_por TEXT,
  foto_url TEXT,
  objetivo_id UUID REFERENCES objetivos_ahorro(id),
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transacciones_fecha ON transacciones(fecha DESC);
CREATE INDEX idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX idx_transacciones_usuario ON transacciones(usuario_id);
CREATE INDEX idx_transacciones_objetivo ON transacciones(objetivo_id);

ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transacciones FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own transactions"
  ON transacciones FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);
```

La migración incluida (`supabase/migrations/20250221_setup_finanzas.sql`) también crea `gastos_mensuales` para el módulo de recurrentes y añade todos los índices/políticas.

### Categorías y constantes (hardcodeadas)

```ts
const CATEGORIAS_GASTOS = [
  'Alimentación', 'Transporte', 'Vivienda', 'Salud',
  'Entretenimiento', 'Educación', 'Ahorro/inversión', 'Otros gastos'
]

const CATEGORIAS_INGRESOS = [
  'Salario', 'Ventas', 'Servicios', 'Inversiones', 'Otros ingresos'
]

const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia']
```

### Modificaciones frecuentes

1. **Agregar categoría:** editar arrays en `app/registro/page.tsx` o `app/api/chat/stream/route.ts`.
2. **Agregar campo nuevo:** `ALTER TABLE` + actualizar interfaces en `components/DataViews.tsx`.
3. **Cambiar modelo de IA:** modificar `model` en `app/api/chat/stream/route.ts`.
4. **Nuevos KPIs:** modificar `fetchKPIs()` en `app/page.tsx`.

### Flujo de datos

```
Acción del usuario → Componente React → Ruta API → Supabase → Respuesta JSON
```

Ejemplo: el usuario escribe “Gasté $200 en gasolina” → `/api/chat/stream` → Gemini llama a `registrar_gasto` → se inserta en `transacciones` → dashboard se actualiza.

---

## 🚀 Guía rápida

### Requisitos

- Node.js 20+
- Cuenta en Supabase
- (Opcional) API Key de [OpenRouter](https://openrouter.ai/) para IA

### 1. Clonar proyecto

```bash
git clone https://github.com/danielcarreon/sistema-financiero-app.git
cd sistema-financiero-app
```

### 📱 PWA lista para Android e iOS

- La app ahora genera un `manifest.webmanifest`, íconos adaptativos y un `service worker` con `next-pwa`.  
- **Modo offline:** cuando no hay red se muestra `public/offline.html` con un mensaje amigable.  
- **Agregar a inicio:** abre `http://localhost:3000` en tu móvil (Chrome/Edge/ Safari) y usa la opción “Agregar a la pantalla principal”. Se instala como app independiente (display `standalone`).  
- **Cambios visuales:** se definen `theme_color`, `background_color` y metadatos `appleWebApp` para status bar oscuro/claro.  
- **Desarrollo:** `npm run dev` trabaja como siempre; para probar el service worker ejecuta `npm run build && npm run start` porque la caché sólo se registra fuera de modo desarrollo.

### 2. Instalar dependencias

```bash
npm install    # o pnpm install
```

### 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com/).
2. Entra al **SQL Editor** y ejecuta el esquema mostrado arriba (o usa la sección de CLI).
3. Copia `Project URL` y `anon key` desde **Settings → API**.

### 4. Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-instancia.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
OPENROUTER_API_KEY=sk-or-...          # opcional (solo IA)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5. Servidor de desarrollo

```bash
npm run dev
# o pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). Primer uso: agrega gastos manuales o conversa con el agente IA.

### 6. Autenticación

- En Supabase → **Authentication → Users** crea al menos un usuario (correo + contraseña).
- Inicia sesión en [http://localhost:3000/login](http://localhost:3000/login) usando ese correo/contraseña.
- Todas las rutas (Dashboard, Registro, Ahorro, etc.) requieren sesión y los datos se guardan asociados a ese usuario.

### ⚙️ Automatizar Supabase con CLI

Ya incluimos `supabase/config.toml` y una migración. Solo haz:

```bash
brew install supabase/tap/supabase   # o npm install -g supabase
supabase login                       # pega tu access token
supabase link --project-ref TU_REF --env-file .env.local
supabase db push                     # aplica schema y políticas
supabase storage create-bucket facturas --public
```

Cada que edites `supabase/migrations`, ejecuta `supabase db push` otra vez. El bucket `facturas` solo se crea una vez.

---

## 📁 Estructura

```
sistema-financiero-app/
├── app/
│   ├── page.tsx                  # Dashboard
│   ├── registro/page.tsx         # Formulario manual
│   ├── agente-mejorado/page.tsx  # Chat IA + OCR
│   ├── ahorro-inversion/page.tsx # Sección ahorro/inversión
│   ├── gastos-recurrentes/...    # Gestión suscripciones
│   └── api/                      # Rutas backend (Supabase, OpenRouter)
├── components/                   # Header, KPICard, TrendChart, etc.
├── hooks/                        # useEnhancedChat, useImageUpload
├── lib/supabase.ts               # Cliente Supabase singleton
├── supabase/                     # Config + migraciones para CLI
├── package.json / pnpm-lock.yaml
└── README.md
```

---

## 🎨 Funcionalidades

### 1. Dashboard
- KPIs (ingresos, gastos, balance, #transacciones).
- Gráfica de tendencia (Chart.js) con filtros diario/semanal/mensual/personalizado.
- Tabla de transacciones con filtros y controles de rango.
- Lógica en `app/page.tsx` + `components/DataViews.tsx`.

### 2. Agente IA
- Chat natural con Gemini 2.5 Flash vía OpenRouter.
- Respuestas en streaming (SSE) + indicador de “pensando/escribiendo”.
- Subida de imágenes al bucket `facturas` y OCR con Gemini Vision.
- Function calling (`registrar_gasto` / `registrar_ingreso`) para guardar en Supabase.

### 3. Registro manual
- Formulario clásico con validaciones.
- Subida opcional de foto (se guarda en Storage).
- Selección de categoría, método de pago, notas y foto.

### 4. Gastos recurrentes
- CRUD sobre `gastos_mensuales`.
- Procesamiento automático diario (`app/api/gastos-recurrentes/procesar/route.ts`) que inserta en `transacciones`.

### 5. Ahorro e inversión
- Nueva sección `app/ahorro-inversion/page.tsx` con **objetivos de ahorro** (tabla `objetivos_ahorro`).
- Registra aportes/retiros por objetivo y visualiza el balance acumulado, metas y porcentaje completado.
- Mini formulario para crear objetivos, selector de objetivo en cada movimiento y botón de “reset” que limpia transacciones + metas.
- Gráficas (donut + línea) que muestran distribución y evolución de los movimientos.

---

## 🛠️ Desarrollo

```bash
npm run dev     # desarrollo
npm run build   # build producción
npm run start   # sirve build
```

### Stack

| Capa        | Tecnologías |
|-------------|-------------|
| Frontend    | Next.js 15, React 19, TypeScript, Tailwind 4, Chart.js, Lucide |
| Backend     | Next.js API Routes, Node.js 20, Supabase JS, OpenRouter |
| IA / OCR    | Gemini 2.5 Flash (chat) y Gemini Vision (tickets) |
| Base de datos | PostgreSQL (Supabase) + RLS habilitado |
| Storage     | Supabase Storage (`facturas`) |

---

## 🚢 Despliegue

### Vercel (recomendado)

1. Push a GitHub.
2. En Vercel → **New Project** → importa repo.
3. Configura variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   OPENROUTER_API_KEY=...
   NEXT_PUBLIC_SITE_URL=https://tu-app.vercel.app
   ```
4. Deploy (≈2 minutos) → listo.

### Otros proveedores

Netlify, Railway, Render o Cloudflare Pages funcionan igual (usa Node 20 + variables de entorno).

---

## 🔐 Seguridad

- No subas `.env.local`; solo comparte `.env.example`.
- Configura las RLS en Supabase (ya incluidas en la migración).
- Mantén el `OPENROUTER_API_KEY` privado (solo servidor).
- El `anon key` de Supabase puede estar en el frontend gracias a RLS.

---

## 🤝 Contribuciones

1. Haz fork.
2. Crea rama: `git checkout -b feat/mi-cambio`.
3. Commits siguiendo [Conventional Commits](https://www.conventionalcommits.org/).
4. PR a `main`.

Etiquetas sugeridas:
```
feat: nueva funcionalidad
fix: corrección
docs: documentación
style: estilo/formato
refactor: refactorización
test: pruebas
chore: mantenimiento
```

---

## 📄 Licencia

MIT – consulta el archivo [LICENSE](LICENSE).

---

## 🙏 Créditos

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [OpenRouter](https://openrouter.ai/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)
- [Lucide Icons](https://lucide.dev/)

---

## 📧 Soporte

- Issues: [GitHub Issues](https://github.com/danielcarreon/sistema-financiero-app/issues)
- Discusiones: [GitHub Discussions](https://github.com/danielcarreon/sistema-financiero-app/discussions)
- Email: daniel.carreon@example.com

---

## 📚 Recursos útiles

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación Supabase](https://supabase.com/docs)
- [Documentación OpenRouter](https://openrouter.ai/docs)
- [Documentación Tailwind](https://tailwindcss.com/docs)

---

<div align="center">
Hecho con ❤️ y mucha automatización.
<br/>⭐ Dale una estrella si este proyecto te resulta útil.
</div>
