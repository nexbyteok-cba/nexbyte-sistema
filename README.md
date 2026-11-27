# NEXBYTE Manager ⚡
## Sistema Integral de Gestión para Servicio Técnico Informático

Sistema de gestión técnica profesional diseñado e implementado para **NEXBYTE** (especializado en computadoras de escritorio, notebooks, consolas y electrónica).

Inspirado en la filosofía de diseño **Windows Phone / Nokia Lumia (Metro Design)** con paleta de alto contraste: Negro `#0B0D0F`, Amarillo institucional `#FFE600`, Blanco `#FFFFFF` y tarjetas geométricas `#171A1F`.

---

## 🚀 Características Principales

1. **Autenticación y Seguridad:**
   - Cuentas con contraseñas cifradas en **bcrypt**.
   - Sesiones y tokens JWT gestionados mediante cookies **HttpOnly**.
   - Cambio forzoso de contraseña en el primer inicio de sesión.
   - Cuenta administradora inicial: `nexbyte.ok@gmail.com`.
   - Protección contra rate limiting, inyección SQL y logs de auditoría inviolables.

2. **Panel Principal (Dashboard Lumia Tiles):**
   - Sistema de mosaicos vivos en tiempo real: equipos en reparación, diagnóstico, listos para retirar, turnos del día, stock crítico, ingresos, egresos y resultado neto del mes.
   - Feed de actividad reciente con trazabilidad de cada cambio de estado.

3. **Módulo Estrella: Recepción de Equipos y Comprobantes A4:**
   - Generación automática de número de orden único garantizado (`NB-2026-00001`).
   - Selector visual de categorías: PC de escritorio, Notebooks, Consolas con marcas precargadas.
   - Declaración obligatoria de **Estado Físico al Momento de la Recepción** con regla estricta de incompatibilidad (si no tiene observaciones, no admite marcar daños físicos).
   - Accesorios entregados y selección múltiple de servicios.
   - **Registro fotográfico** del equipo desde celular o PC.
   - **Firma electrónica manuscrita digitalizada** del cliente sobre pantalla táctil o mouse.
   - Aceptación obligatoria de términos legales de consentimiento.
   - Emisión instantánea y descarga de **Comprobante en PDF A4** profesional con código QR y bloqueo inmutable de la recepción.

4. **Órdenes de Trabajo y Flujo de Estados:**
   - 13 estados técnicos secuenciales.
   - Línea de tiempo cronológica de acontecimientos.
   - Panel de diagnóstico técnico profesional y cotización.
   - Registro de autorizaciones de reparación del cliente (WhatsApp, llamada, etc.).
   - Integración directa con inventario: descuenta repuestos automáticamente al agregarlos a la orden.

5. **Entregas, Señas y Cobros:**
   - Registro de señas iniciales, pagos parciales y saldos.
   - Prevención de saldo negativo por error.
   - Control estricto de entrega con saldo pendiente: solo permitida si es expresamente autorizada por el técnico responsable.
   - Checklist de accesorios devueltos al cliente.

6. **Control de Caja Diaria (Arqueo):**
   - Apertura de sesión con saldo inicial en efectivo.
   - Registro de ingresos por cobros y egresos menores de taller.
   - Cierre de caja con arqueo obligatorio: comparación de saldo esperado vs real y diferencias.

7. **Control de Inventario:**
   - Catálogo de repuestos, componentes y herramientas.
   - Alertas automáticas de stock crítico o mínimo.
   - Movimientos de inventario trazables (ingreso, egreso, uso en reparación).

8. **Finanzas y Reportes Analíticos:**
   - Comparativa de ingresos efectivos vs presupuestos.
   - Gráficos interactivos de flujo mensual, tipos de equipos y servicios más solicitados.
   - Exportación de listados a formato CSV.

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18, Vite, Tailwind CSS v3, Lucide React, Recharts, jsPDF, html2canvas.
- **Backend:** Node.js, Express, libSQL (`@libsql/client`), bcryptjs, jsonwebtoken, cookie-parser, multer, cloudinary.
- **Base de Datos:** SQLite / libSQL compatible con **Turso Cloud Database**.
- **Infraestructura:** Preparado para despliegue en **Render** con `render.yaml`.

---

## 💻 Instalación y Ejecución Local

### 1. Clonar e instalar dependencias
```bash
# Instalar dependencias del servidor y cliente
npm --prefix server install
npm --prefix client install
```

### 2. Configurar variables de entorno
Copiar `.env.example` a `server/.env`:
```bash
cp server/.env.example server/.env
```

### 3. Migrar y poblar base de datos inicial
```bash
npm --prefix server run seed
```

### 4. Iniciar en modo desarrollo
En dos terminales (o con un runner):
```bash
# Terminal 1: Backend API (Puerto 5000)
npm --prefix server run dev

# Terminal 2: Frontend Vite (Puerto 5173)
npm --prefix client run dev
```

Abrir navegador en `http://localhost:5173`.

### 🔑 Credenciales Iniciales:
- **Usuario:** `nexbyte.ok@gmail.com`
- **Contraseña:** `Nexbyte2026!Admin` (definida en `server/.env`)
- *Al ingresar por primera vez, el sistema solicitará obligatoriamente cambiar la contraseña temporal por una contraseña definitiva.*

---

## ☁️ Despliegue en Producción (Render)

1. Crear una base de datos en **Turso** (`turso db create nexbyte-db`) y obtener la URL y Token.
2. Conectar el repositorio en **Render**.
3. Seleccionar **Blueprints** usando el archivo `render.yaml` incluido, o crear un **Web Service**:
   - **Build Command:** `npm --prefix client install && npm --prefix client run build && npm --prefix server install`
   - **Start Command:** `npm --prefix server run start`
   - Configurar variables de entorno:
     - `TURSO_DATABASE_URL=libsql://...`
     - `TURSO_AUTH_TOKEN=...`
     - `JWT_SECRET=clave_segura`
     - `COOKIE_SECRET=clave_cookie_segura`
     - `ADMIN_INITIAL_PASSWORD=TuPasswordAdmin`
