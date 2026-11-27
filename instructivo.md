# PROYECTO: NEXBYTE MANAGER
## Sistema integral de gestión para servicio técnico informático

Asume el rol de un equipo senior de desarrollo de software compuesto por:

- Arquitecto de software.
- Desarrollador frontend especializado en React.
- Desarrollador backend especializado en Node.js.
- Especialista en bases de datos SQLite/libSQL y Turso.
- Diseñador UX/UI especializado en aplicaciones administrativas.
- Especialista en seguridad informática.
- Ingeniero DevOps especializado en Render.

Tu misión es diseñar, desarrollar e implementar un sistema de gestión integral para NEXBYTE, un emprendimiento de servicio técnico especializado en computadoras, notebooks, consolas y dispositivos electrónicos.

No quiero un prototipo, una demostración ni una interfaz con funcionalidades simuladas.

Quiero una aplicación funcional, con persistencia real de datos, operaciones CRUD completas, validaciones, autenticación, gestión documental y preparada para producción.

---

# 1. IDENTIDAD DEL SISTEMA

Nombre: NEXBYTE Manager.

Empresa: NEXBYTE.

Actividad: Servicio técnico de computadoras, notebooks, consolas y electrónica.

Identidad visual:
- Negro: #0B0D0F.
- Amarillo: utilizar el amarillo institucional de NEXBYTE.
- Blanco: #FFFFFF.
- Gris oscuro: #171A1F.
- Gris secundario: #8B929C.

Diseño inspirado en Windows Phone y Nokia Lumia.

La interfaz debe transmitir:
- Tecnología.
- Profesionalismo.
- Modernidad.
- Orden.
- Precisión.
- Confianza.

No utilizar dashboards administrativos genéricos.

La interfaz debe utilizar un sistema de mosaicos (tiles), iconografía reconocible, tipografía moderna, tarjetas geométricas y animaciones sutiles.

Utilizar React Bits para los componentes visuales y efectos que aporten valor.

IMPORTANTE:
La navegación debe ser visual, intuitiva y directa.

Evitar:
- Menús desplegables innecesarios.
- Barras laterales tradicionales demasiado cargadas.
- Interfaces saturadas.
- Formularios interminables.
- Botones sin iconografía.
- Animaciones excesivas.

Cada sección debe tener su propio icono identificativo.

La aplicación debe ser completamente responsive y funcionar correctamente en PC, tablets y teléfonos móviles.

---

# 2. ARQUITECTURA TECNOLÓGICA

Frontend:
- React.
- Vite.
- JavaScript o TypeScript.
- Tailwind CSS versión 3.
- React Bits.
- Lucide React para iconografía.
- React Router.
- React Hook Form.
- Zod para validaciones.
- Librería de gráficos cuando corresponda.

Backend:
- Node.js.
- Express.
- API REST.
- Autenticación mediante sesiones seguras o JWT almacenado en cookies HttpOnly.
- bcrypt para contraseñas.
- Middleware de autorización y validación.

Base de datos:
- Turso.
- libSQL.
- Modelo relacional.
- Migraciones SQL versionadas.

Infraestructura:
- Frontend desplegado en Render.
- Backend desplegado en Render.
- Base de datos alojada en Turso.
- Almacenamiento persistente de fotografías y documentos mediante Cloudinary o almacenamiento compatible con S3.

No guardar fotografías en el almacenamiento efímero del servidor de Render.

Configurar todas las credenciales mediante variables de entorno.

Preparar:
- .env.example.
- README.md.
- Scripts de instalación.
- Scripts de desarrollo.
- Scripts de producción.
- Migraciones.
- Datos iniciales.
- Configuración de despliegue.

---

# 3. AUTENTICACIÓN Y SEGURIDAD

El sistema inicialmente será de uso privado para el propietario de NEXBYTE.

Crear un módulo de inicio de sesión profesional.

Cuenta administradora inicial:

Correo: nexbyte.ok@gmail.com

La contraseña inicial debe establecerse mediante una variable de entorno segura durante la configuración inicial.

IMPORTANTE:
No escribir contraseñas reales directamente en el código fuente, frontend, repositorio ni archivos públicos.

Implementar:
- Contraseñas cifradas mediante bcrypt.
- Sesiones seguras.
- Cookies HttpOnly.
- Protección CSRF cuando corresponda.
- Rate limiting.
- Protección contra SQL Injection.
- Validación de datos en backend.
- Cierre de sesión.
- Expiración de sesiones.
- Recuperación segura de acceso.
- Protección de endpoints.
- Registro de actividad administrativa.

Solicitar cambio obligatorio de contraseña en el primer inicio de sesión.

Nunca devolver contraseñas ni hashes en respuestas de la API.

---

# 4. DASHBOARD PRINCIPAL

Crear un panel de control inspirado en Windows Phone.

El dashboard debe presentar mosaicos visuales con información actualizada.

Módulos principales:

1. Agenda.
2. Clientes.
3. Recepción de equipos.
4. Órdenes de trabajo.
5. Equipos.
6. Inventario.
7. Finanzas.
8. Caja.
9. Reportes.
10. Configuración.

Cada mosaico debe tener:
- Icono.
- Nombre.
- Indicador numérico.
- Información contextual.
- Acceso directo.

Indicadores del dashboard:

- Equipos actualmente en reparación.
- Equipos pendientes de diagnóstico.
- Equipos listos para retirar.
- Equipos pendientes de entrega.
- Turnos del día.
- Clientes registrados.
- Ingresos del mes.
- Egresos del mes.
- Ganancias estimadas.
- Productos con stock bajo.

Agregar una sección de actividad reciente.

Mostrar alertas importantes:
- Turnos próximos.
- Plazos de reparación vencidos.
- Equipos sin actualizar.
- Señas pendientes.
- Pagos pendientes.
- Productos con stock crítico.

---

# 5. MÓDULO DE CLIENTES

Crear una agenda de clientes con base de datos persistente.

Cada cliente debe tener:

- ID interno.
- Nombre.
- Apellido.
- DNI opcional.
- Teléfono principal.
- Teléfono alternativo.
- Correo electrónico.
- Dirección opcional.
- Fecha de registro.
- Observaciones.
- Historial de servicios.

Funciones:

- Crear clientes.
- Editar información.
- Consultar clientes.
- Buscar por nombre.
- Buscar por teléfono.
- Buscar por correo.
- Consultar historial de equipos.
- Consultar órdenes anteriores.
- Consultar pagos.
- Consultar deudas pendientes.

Evitar duplicar clientes.

Antes de crear un nuevo cliente, comprobar si existe otro con el mismo teléfono o correo electrónico.

Un cliente podrá tener múltiples equipos y órdenes de trabajo.

---

# 6. MÓDULO DE AGENDA Y TURNOS

Crear un calendario de turnos.

Vistas:
- Diaria.
- Semanal.
- Mensual.

Cada turno debe permitir registrar:

- Cliente.
- Fecha.
- Hora.
- Tipo de equipo.
- Marca.
- Modelo.
- Servicio solicitado.
- Descripción del problema.
- Observaciones.
- Estado del turno.

Estados:

- Pendiente.
- Confirmado.
- En camino.
- Atendido.
- Cancelado.
- Ausente.

Permitir:
- Crear turnos.
- Modificar turnos.
- Cancelar turnos.
- Reprogramar.
- Asociar un turno con una orden de trabajo.
- Consultar disponibilidad.

Incluir indicadores visuales por estado.

---

# 7. MÓDULO PRINCIPAL: RECEPCIÓN DE EQUIPOS Y COMPROBANTES

ESTE ES EL MÓDULO MÁS IMPORTANTE DEL SISTEMA.

Debe permitir generar un comprobante profesional cada vez que un cliente entrega un equipo a NEXBYTE.

Cada recepción debe generar automáticamente:

- Número único de orden.
- Código identificador.
- Fecha y hora exactas.
- Registro del técnico receptor.
- Registro del cliente.
- Registro del equipo.
- Fotografías.
- Condiciones de recepción.
- Firma electrónica.
- Estado inicial.

Ejemplo de identificador:

NB-2026-00001

El número debe generarse automáticamente y nunca repetirse.

## 7.1 Datos de recepción

Fecha de ingreso:
Permitir seleccionar fecha y registrar automáticamente la hora.

Cliente:
- Nombre.
- Apellido.
- Teléfono.
- Teléfono alternativo.
- Correo electrónico.

Permitir seleccionar un cliente existente o crear uno nuevo desde el formulario sin abandonar la recepción.

## 7.2 Tipo de equipo

Crear selector visual mediante tarjetas con iconos.

Categorías iniciales:

- PC de escritorio.
- Notebook.
- Consola.

Cada categoría tendrá su propia base de datos de marcas precargadas.

### Computadoras de escritorio

Marcas iniciales:
- ASUS.
- Gigabyte.
- MSI.
- ASRock.
- Intel.
- AMD.
- HP.
- Dell.
- Lenovo.
- Acer.
- Apple.
- Genérica.
- Otra.

### Notebooks

Marcas iniciales:
- ASUS.
- Acer.
- Lenovo.
- HP.
- Dell.
- MSI.
- Apple.
- Samsung.
- Toshiba.
- Gigabyte.
- Huawei.
- Exo.
- Banghó.
- Positivo BGH.
- Otra.

### Consolas

Marcas iniciales:
- Sony.
- Microsoft.
- Nintendo.
- Otra.

Permitir que las marcas sean administrables desde configuración.

## 7.3 Información del equipo

Campos:

- Tipo de equipo.
- Marca.
- Modelo.
- Número de serie.
- Color.
- Accesorios entregados.
- Sistema operativo, cuando corresponda.
- Descripción adicional.

Accesorios:
- Cargador.
- Cable de alimentación.
- HDMI.
- Joystick.
- Batería.
- Funda.
- Otros.

Permitir múltiples accesorios.

## 7.4 Tipo de servicio

Crear selector de servicios:

- Limpieza integral.
- Mantenimiento general.
- Reparación.
- Diagnóstico.
- Instalación de sistema operativo.
- Recuperación de datos.
- Actualización de hardware.
- Cambio de componentes.
- Otro.

Permitir seleccionar más de un servicio.

Incluir descripción personalizada.

## 7.5 Condición de recepción

Crear un apartado obligatorio denominado:

ESTADO DEL EQUIPO AL MOMENTO DE LA RECEPCIÓN.

Debe permitir registrar:

- Estado físico general.
- Rayones.
- Golpes.
- Roturas.
- Pantalla dañada.
- Bisagras dañadas.
- Tornillos faltantes.
- Componentes faltantes.
- Puertos dañados.
- Señales de manipulación anterior.
- Suciedad.
- Humedad visible.
- Otros detalles.

Utilizar casillas de selección y un campo de observaciones.

Agregar una opción:

"El equipo se recibe sin observaciones físicas aparentes".

La selección de esta opción debe ser incompatible con otras observaciones de daños.

Incluir una descripción detallada de la condición en la que el cliente entrega el equipo.

## 7.6 Registro fotográfico

Incorporar una galería fotográfica directamente dentro de la orden de trabajo.

Permitir:

- Tomar fotografías desde el celular.
- Subir fotografías desde PC.
- Agregar múltiples imágenes.
- Visualizar fotografías.
- Eliminar fotografías antes de confirmar la recepción.
- Agregar descripciones a las imágenes.

Organizar las fotografías por categorías:

- Frente.
- Dorso.
- Laterales.
- Pantalla.
- Conexiones.
- Daños detectados.
- Componentes.
- Otros.

Cada fotografía debe quedar asociada permanentemente a su orden.

Registrar fecha de carga y usuario responsable.

Las fotografías deben almacenarse en un servicio de almacenamiento persistente y no directamente en la base de datos.

## 7.7 Plazo de reparación

Incorporar campos:

- Plazo estimado en días.
- Fecha estimada de finalización.
- Fecha real de finalización.
- Observaciones sobre el plazo.

La fecha estimada debe calcularse automáticamente.

Permitir modificarla dejando registro de la modificación.

Mostrar advertencias cuando el plazo se encuentre vencido.

## 7.8 Firma electrónica del cliente

Implementar un apartado de firma electrónica.

Debe funcionar mediante un área de dibujo con el dedo, mouse o lápiz digital.

La firma debe quedar incorporada al comprobante.

Antes de firmar, el cliente deberá poder leer y aceptar las condiciones de recepción.

Registrar:

- Firma digitalizada.
- Fecha y hora.
- Número de orden.
- Identificación del cliente.
- Versión del texto de consentimiento.
- Evidencia de aceptación.

No permitir cerrar la recepción sin completar la firma y aceptación de condiciones.

La firma debe conservarse como evidencia asociada a la orden.

No presentar la firma manuscrita digitalizada como una firma digital certificada.

## 7.9 Condiciones de recepción y consentimiento

Crear un texto configurable de consentimiento.

Incluir, como mínimo:

- El cliente declara que entrega el equipo identificado en el comprobante.
- Se deja constancia de las condiciones físicas observadas al momento de la recepción.
- Las fotografías forman parte del registro de recepción.
- El cliente declara conocer el servicio solicitado.
- Los plazos informados son estimativos.
- El diagnóstico puede revelar problemas adicionales.
- Las reparaciones adicionales deberán ser autorizadas previamente.
- Se recomienda respaldar la información personal cuando corresponda.
- NEXBYTE registrará las intervenciones realizadas sobre el equipo.

Incluir un espacio para aclaraciones y condiciones particulares.

El texto debe poder editarse desde configuración.

## 7.10 Generación del comprobante

Una vez completada la información:

Generar un comprobante profesional en PDF.

El documento debe incluir:

- Logo NEXBYTE.
- Datos comerciales.
- Número de orden.
- Fecha de recepción.
- Datos del cliente.
- Datos del equipo.
- Marca y modelo.
- Número de serie.
- Servicios solicitados.
- Condición de recepción.
- Accesorios entregados.
- Fotografías.
- Plazo estimado.
- Condiciones aceptadas.
- Firma del cliente.
- Identificación de NEXBYTE.

Diseño limpio, profesional y apto para impresión A4.

Agregar un código QR que permita identificar la orden mediante el sistema, sin exponer información privada públicamente.

El comprobante debe poder:

- Descargar.
- Imprimir.
- Consultar posteriormente.
- Volver a generar conservando su versión original.
- Compartir con el cliente.

IMPORTANTE:

Una vez firmado y confirmado el comprobante, su contenido original debe quedar bloqueado.

Si posteriormente se necesita corregir o ampliar información, generar una modificación documentada, conservando el comprobante original y su historial.

---

# 8. MÓDULO DE ÓRDENES DE TRABAJO

Cada comprobante confirmado debe generar automáticamente una orden de trabajo.

Estados de la orden:

1. Recibido.
2. En control.
3. Pendiente de diagnóstico.
4. Diagnosticado.
5. Esperando autorización.
6. Esperando repuestos.
7. En reparación.
8. En pruebas.
9. Reparado.
10. Listo para entregar.
11. Entregado.
12. Sin reparación.
13. Cancelado.

Permitir cambiar estados manualmente.

Cada modificación debe registrar:

- Estado anterior.
- Estado nuevo.
- Fecha.
- Hora.
- Observación.
- Responsable.

Crear una línea de tiempo de acontecimientos.

Ejemplo:

27/11 - Equipo recibido.
27/11 - Control inicial.
28/11 - Diagnóstico realizado.
28/11 - Reparación autorizada.
29/11 - Reparación finalizada.
30/11 - Equipo entregado.

## Diagnóstico técnico

Incluir:

- Problema informado por el cliente.
- Diagnóstico técnico.
- Pruebas realizadas.
- Fallas detectadas.
- Componentes dañados.
- Solución propuesta.
- Repuestos necesarios.
- Costo estimado.
- Observaciones.

Incluir autorización del cliente para reparaciones adicionales.

---

# 9. MÓDULO DE ENTREGA Y COBROS

Cuando un equipo esté listo, permitir registrar la entrega.

Datos:

- Fecha de entrega.
- Estado final.
- Reparaciones realizadas.
- Pruebas efectuadas.
- Observaciones.
- Accesorios devueltos.
- Importe total.
- Importe abonado.
- Saldo pendiente.

## Gestión de pagos

Permitir registrar:

- Seña.
- Pago parcial.
- Pago total.
- Saldo pendiente.
- Devolución.
- Ajustes.

Medios de pago:

- Efectivo.
- Transferencia.
- Mercado Pago.
- Tarjeta.
- Otro.

Cada movimiento debe registrar:

- Fecha.
- Importe.
- Método.
- Referencia o comprobante.
- Orden asociada.
- Observaciones.

Calcular automáticamente:

TOTAL DEL SERVICIO.

SEÑAS RECIBIDAS.

PAGOS ADICIONALES.

SALDO PENDIENTE.

No permitir registrar un saldo negativo por errores de carga.

Una orden puede entregarse con saldo pendiente únicamente si el administrador lo autoriza y queda registrado.

Generar comprobante de pago.

La entrega debe requerir confirmación del técnico y registrar fecha y hora.

---

# 10. MÓDULO DE INVENTARIO

Crear un inventario de productos, componentes y herramientas.

Categorías:

- Memorias RAM.
- Discos HDD.
- SSD.
- Fuentes.
- Procesadores.
- Placas madre.
- Placas de video.
- Gabinetes.
- Ventiladores.
- Pasta térmica.
- Cables.
- Adaptadores.
- Componentes de notebooks.
- Componentes de consolas.
- Herramientas.
- Insumos.
- Otros.

Cada artículo debe contener:

- Código interno.
- Nombre.
- Categoría.
- Marca.
- Modelo.
- Descripción.
- Cantidad.
- Stock mínimo.
- Costo de adquisición.
- Precio de venta.
- Proveedor.
- Ubicación.
- Fecha de ingreso.

Funciones:

- Registrar productos.
- Editar.
- Eliminar mediante baja lógica.
- Aumentar stock.
- Disminuir stock.
- Registrar compras.
- Registrar consumo interno.
- Asociar repuestos a órdenes de trabajo.
- Consultar movimientos.
- Alertas de stock bajo.

Cada movimiento debe quedar registrado.

El inventario debe actualizarse automáticamente cuando se utilicen componentes en una reparación.

No permitir stock negativo sin una autorización explícita.

---

# 11. MÓDULO FINANCIERO

Crear un módulo de administración financiera.

Debe permitir controlar ingresos y egresos del negocio.

## Ingresos

Categorías:

- Reparaciones.
- Limpiezas.
- Mantenimiento.
- Venta de componentes.
- Venta de accesorios.
- Señas.
- Otros.

## Egresos

Categorías:

- Compra de componentes.
- Herramientas.
- Insumos.
- Servicios.
- Publicidad.
- Transporte.
- Gastos operativos.
- Otros.

Cada movimiento debe registrar:

- Fecha.
- Tipo.
- Categoría.
- Descripción.
- Importe.
- Medio de pago.
- Comprobante.
- Observaciones.

Diferenciar:

- Ingresos efectivamente cobrados.
- Servicios facturados o presupuestados.
- Señas.
- Saldos pendientes.

No contabilizar un presupuesto como dinero ingresado.

Crear indicadores:

- Ingresos diarios.
- Ingresos semanales.
- Ingresos mensuales.
- Egresos.
- Resultado neto.
- Dinero disponible.
- Cuentas pendientes de cobro.

Permitir filtrar por fechas y categorías.

---

# 12. CAJA

Crear un módulo de caja para registrar movimientos de dinero.

Permitir:

- Apertura de caja.
- Cierre de caja.
- Ingresos.
- Egresos.
- Arqueo.
- Diferencias.
- Observaciones.

Mostrar:

- Saldo inicial.
- Ingresos.
- Egresos.
- Saldo esperado.
- Saldo real.
- Diferencia.

Cada movimiento debe quedar asociado a una operación.

---

# 13. REPORTES

Crear un módulo de reportes con gráficos y estadísticas.

Reportes:

- Equipos recibidos por período.
- Servicios más solicitados.
- Reparaciones realizadas.
- Equipos pendientes.
- Equipos entregados.
- Clientes frecuentes.
- Ingresos mensuales.
- Egresos mensuales.
- Rentabilidad.
- Componentes más utilizados.
- Stock disponible.

Permitir exportar información a CSV y PDF.

Incluir filtros por fechas.

---

# 14. CONFIGURACIÓN

Crear un módulo de configuración administrativa.

Permitir modificar:

- Nombre comercial.
- Logo.
- Teléfono.
- Correo.
- Dirección.
- Redes sociales.
- Datos de contacto.
- Marcas de equipos.
- Categorías de servicios.
- Condiciones de recepción.
- Plantilla de comprobantes.
- Métodos de pago.
- Categorías de ingresos.
- Categorías de egresos.
- Datos del técnico.

Preparar soporte para incorporar usuarios adicionales en futuras versiones.

---

# 15. EXPERIENCIA VISUAL Y UX/UI

La aplicación debe sentirse como un sistema operativo moderno.

Tomar como referencia visual Windows Phone 8 y Nokia Lumia.

Características:

- Diseño basado en mosaicos.
- Iconos grandes.
- Tipografía Segoe UI o similar.
- Transiciones suaves.
- Animaciones discretas.
- Tarjetas geométricas.
- Navegación visual.
- Excelente jerarquía de información.

La pantalla principal debe presentar los módulos mediante tiles.

Utilizar iconografía Lucide React.

Los iconos deben ser reconocibles y mantener coherencia visual.

No utilizar emojis como sustituto de iconos profesionales.

Diseñar especialmente para escritorio, pero garantizar adaptación completa a dispositivos móviles.

En móvil:
- Los mosaicos deben reorganizarse.
- Los formularios deben ser cómodos.
- La firma debe funcionar con el dedo.
- La cámara debe permitir fotografiar equipos.
- Los botones deben tener dimensiones táctiles adecuadas.

Utilizar React Bits para animaciones y componentes decorativos únicamente cuando mejoren la experiencia.

Priorizar rendimiento y velocidad.

---

# 16. BASE DE DATOS

Diseñar una estructura relacional correctamente normalizada.

Tablas sugeridas:

- users
- clients
- appointments
- equipment_types
- equipment_brands
- equipment
- service_categories
- service_orders
- order_services
- order_accessories
- order_conditions
- order_photos
- order_signatures
- order_consents
- order_status_history
- technical_diagnostics
- repair_authorizations
- inventory_categories
- inventory_items
- inventory_movements
- order_parts
- payments
- financial_movements
- cash_registers
- cash_movements
- suppliers
- business_settings
- audit_logs

Utilizar claves foráneas, índices, restricciones y validaciones.

Implementar transacciones cuando una operación involucre varias tablas.

Las órdenes confirmadas deben preservar su integridad histórica.

Al eliminar clientes, equipos u otros registros relacionados, utilizar estrategias que no destruyan el historial de las órdenes.

Todas las fechas deben almacenarse de forma consistente y visualizarse utilizando la zona horaria America/Argentina/Cordoba.

Los importes deben manejarse con precisión decimal, evitando errores de punto flotante.

Moneda predeterminada: pesos argentinos (ARS).

---

# 17. RESPALDO Y PROTECCIÓN DE INFORMACIÓN

La información de los clientes y las órdenes es crítica.

Implementar:

- Copias de seguridad automáticas.
- Registro de actividad.
- Protección de documentos.
- Acceso autenticado a fotografías.
- Validación de archivos.
- Límites de tamaño.
- Protección de datos sensibles.
- Recuperación ante errores.
- Manejo centralizado de excepciones.

Nunca exponer fotografías, firmas ni información de clientes mediante enlaces públicos permanentes.

Crear una estrategia de recuperación de datos y documentar el procedimiento.

---

# 18. REGLAS IMPORTANTES DE FUNCIONAMIENTO

1. No utilizar datos ficticios como sustituto de funcionalidades reales.
2. No dejar botones sin implementar.
3. No simular persistencia.
4. No almacenar información crítica únicamente en localStorage.
5. No generar números de órdenes duplicados.
6. No permitir modificar silenciosamente comprobantes firmados.
7. No perder el historial de pagos.
8. No permitir eliminar movimientos financieros sin trazabilidad.
9. No permitir que un error en una operación deje datos inconsistentes.
10. Validar todos los formularios en frontend y backend.
11. Implementar estados de carga, éxito y error.
12. Utilizar mensajes de confirmación para operaciones importantes.

---

# 19. METODOLOGÍA DE DESARROLLO

No intentes construir todo en un único archivo.

Organizar el proyecto profesionalmente.

Separar:

- Componentes.
- Páginas.
- Servicios.
- Hooks.
- Contextos.
- Rutas.
- Controladores.
- Modelos.
- Middleware.
- Validaciones.
- Migraciones.
- Configuraciones.

Desarrollar por etapas:

ETAPA 1:
Arquitectura, configuración, base de datos y autenticación.

ETAPA 2:
Diseño visual, dashboard y navegación.

ETAPA 3:
Clientes y agenda.

ETAPA 4:
Recepción de equipos, comprobantes PDF, fotografías y firma electrónica.

ETAPA 5:
Órdenes de trabajo, diagnósticos y estados.

ETAPA 6:
Entregas, señas y pagos.

ETAPA 7:
Inventario y movimientos.

ETAPA 8:
Finanzas y caja.

ETAPA 9:
Reportes y configuración.

ETAPA 10:
Pruebas, seguridad y despliegue.

Al terminar cada etapa:
- Verificar funcionamiento.
- Corregir errores.
- Comprobar persistencia.
- Probar integraciones.
- Documentar lo implementado.

---

# 20. PRUEBAS Y CRITERIOS DE ACEPTACIÓN

Antes de considerar terminado el sistema, realizar pruebas reales de funcionamiento.

Escenario principal:

1. Iniciar sesión como administrador.
2. Registrar un cliente.
3. Crear una recepción.
4. Seleccionar tipo de equipo.
5. Seleccionar marca.
6. Cargar modelo y número de serie.
7. Seleccionar servicios.
8. Registrar condiciones físicas.
9. Fotografiar el equipo.
10. Establecer plazo estimado.
11. Obtener consentimiento.
12. Registrar firma.
13. Confirmar recepción.
14. Generar PDF.
15. Consultar la orden.
16. Modificar estado.
17. Registrar diagnóstico.
18. Autorizar reparación.
19. Registrar repuestos utilizados.
20. Finalizar reparación.
21. Registrar una seña.
22. Registrar el pago restante.
23. Entregar el equipo.
24. Generar comprobante de pago.
25. Consultar el historial completo del cliente.

Comprobar que toda la información permanece disponible después de cerrar sesión y volver a ingresar.

Probar también el funcionamiento desde un teléfono móvil.

---

# OBJETIVO FINAL

Construir NEXBYTE Manager como una plataforma profesional de gestión técnica, diseñada para acompañar el crecimiento del emprendimiento.

No quiero una aplicación improvisada.

Quiero un sistema sólido, escalable, seguro y visualmente distintivo.

La prioridad absoluta es la gestión de recepción de equipos y la generación de comprobantes que permitan documentar profesionalmente el estado en el que cada cliente entrega su dispositivo.

Cada equipo debe tener trazabilidad desde el momento en que ingresa hasta que vuelve a manos de su propietario.

Cada pago debe quedar registrado.

Cada componente del inventario debe poder controlarse.

Cada cliente debe tener un historial.

Cada operación importante debe dejar evidencia.

El resultado debe ser una herramienta de trabajo real para NEXBYTE.