# Jeopardy Live Show - Reglas y Convenciones del Proyecto

Este archivo documenta las reglas de negocio, mecánicas de juego y arquitectura base para mantener la coherencia y estabilidad en todas las modificaciones futuras.

## Arquitectura Base
- La aplicación se ejecuta como una SPA autocontenida en un único archivo `index.html`.
- Sincronización en tiempo real vía Firebase Realtime Database (`/sessions/{sessionId}/...`), con soporte secundario para WebRTC P2P y BroadcastChannel.
- No depender de variables de compilación (`import.meta.env`) en `index.html` para permitir despliegues estáticos (por ejemplo, GitHub Pages).

---

## 1. Flujo de Inicio y Presentador
- **Pantalla inicial**: Requiere ingresar la contraseña (`Altair16`) para acceder al panel del juego.
- **Pantalla de configuración**: Permite cargar categorías, ajustar reglas, número de equipos (2 a 5) y desplegar los códigos QR de conexión.
- **Registro de participantes**:
  - Los participantes escanean el QR desde sus dispositivos móviles e ingresan su nombre.
  - El registro se guarda en Firebase bajo la ruta `/sessions/{sessionId}/teams/{teamId}/players/{playerId}` con `{ name, joinedAt }`.
  - La pantalla del presentador y el modal de QR mantienen un listener reactivo (`onValue`) que lista los nombres en tiempo real y actualiza el contador de registrados de inmediato.

---

## 2. Mecánica de Juego y Temporizadores
- **Apertura de pregunta**: Al hacer clic en una casilla de puntos, la pista se activa y los pulsadores móviles se habilitan para todos los participantes.
- **Temporizador de pregunta (10 segundos)**: Si transcurren 10 segundos desde la apertura sin que ningún participante pulse, el sistema revela automáticamente la respuesta correcta sin penalizaciones.
- **Cola de Timbre (Buzzer Queue)**: Las pulsaciones se registran cronológicamente con marca de tiempo en Firebase (`/buzzers`).
- **Turno otorgado**: El primer participante en pulsar obtiene el turno, se detiene la búsqueda de pulsadores y se inicia un temporizador de 10 segundos para emitir su respuesta.

---

## 3. Respuestas Incorrectas y Reasignación de Turno
- **Equipo bloqueado**: Si el equipo con el turno responde de forma incorrecta (o su temporizador llega a 0), queda bloqueado para esa pregunta específica y no puede volver a participar en ella.
- **Siguiente en la cola**: El turno se cede de forma automática e inmediata al siguiente participante registrado en la cola de buzzers cuyo equipo no esté bloqueado.
- **Reapertura de pulsadores**: Si la cola queda vacía y aún restan equipos sin bloquear, la pista vuelve a abrir los pulsadores con un nuevo temporizador de 10 segundos.
- **Agotamiento de intentos**: Si todos los equipos participantes fallan, el sistema revela automáticamente la respuesta correcta.

---

## 4. Botones de Control del Presentador
- **"Cerrar / Revelar Respuesta"**: Disponible durante la espera de pulsaciones o durante la formulación de respuesta. Detiene los temporizadores activos y muestra la pantalla de respuesta correcta de inmediato.
- **"Cerrar / Volver al Tablero"**: Presente en la vista de respuesta correcta. Marca la pregunta como respondida (`isAnswered: true`), resetea los estados temporales de la pista y de los timbres, y regresa la vista al tablero principal.

---

## 5. Funciones Globales
- **Reiniciar tablero**: Restablece puntuaciones a cero, limpia el historial y reactiva todas las casillas del tablero.
- **Cierre de sesión global**: Desconecta los pulsadores móviles vinculados a la sesión y redirige la aplicación a la pantalla de login con contraseña.
