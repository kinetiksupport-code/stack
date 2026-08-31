# Stack

Stack es un workspace de creación asistida por IA para construir **videojuegos, mundos interactivos, aplicaciones y webs** desde una descripción. La primera versión combina el contrato World Model documentado en `stack-worlds.zip` con una interfaz tipo builder: proyectos a la izquierda, conversación de build, preview seguro y editor de código.

## Qué incluye esta primera versión

- Workspace responsive con navegación de proyectos.
- Autenticación mediante el OAuth incluido en el scaffold, con botón de acceso preparado para el flujo de cuenta.
- Persistencia de proyectos por usuario con Drizzle y la base de datos gestionada del proyecto.
- Generación server-side con `z-ai/glm-5.2:free` cuando existe `OPENROUTER_API_KEY`.
- Fallback local para probar el flujo sin credenciales.
- Preview HTML en un iframe con `sandbox="allow-scripts"`.
- Editor de `index.html`, copia de código y guardado de cambios.
- Vista de la arquitectura World Model: State Space, Action Space, Transition, Render y Goals.
- Posicionamiento y textos del prompt visual adaptados a Stack, sin mostrar proveedores externos en la interfaz.

## Modelo y privacidad de claves

OpenRouter muestra actualmente `z-ai/glm-5.2:free` con precio **Free**. Los endpoints gratuitos están sujetos a límites de capacidad y velocidad. La clave no se solicita desde el navegador ni se guarda en el frontend: debe configurarse como secreto del proyecto bajo `OPENROUTER_API_KEY`.

El código usa `OPENROUTER_BASE_URL` opcional, con valor predeterminado `https://openrouter.ai/api/v1`, y `OPENROUTER_MODEL` opcional, con valor predeterminado `z-ai/glm-5.2:free`. Stack no presenta el nombre del proveedor como parte de la experiencia de usuario.

## World Model

Los videojuegos generados siguen la arquitectura descrita por el material adjunto:

1. `state`: player, enemies, entities, camera, world y game.
2. `actionSpace`: controles traducidos a acciones discretas.
3. `transition(state, action, dt)`: física, colisiones y comportamiento.
4. `render(ctx, state)`: observación visual en Canvas 2D.
5. `gameLoop`: actualización con `requestAnimationFrame`.
6. `checkGoals(state)`: condiciones de victoria y derrota.

La arquitectura es una **implementación de producto inspirada en World Models**. No pretende reproducir internamente Genie 3 ni sus pesos propietarios.

## Configuración local / despliegue

1. Configura `OPENROUTER_API_KEY` en los secretos del proyecto.
2. Comprueba el esquema con `pnpm drizzle-kit generate` y aplica migraciones mediante el flujo de base de datos del proyecto.
3. Ejecuta `pnpm check`, `pnpm test` y `pnpm build`.
4. Guarda un checkpoint del proyecto antes de publicarlo.
5. Para GitHub y Vercel, conecta el repositorio cuando se decida el flujo de publicación. La publicación de proyectos creados por usuarios será una fase posterior y requerirá un servicio de despliegue aislado por proyecto.

## Siguiente fase

La autenticación de la primera entrega utiliza el OAuth ya integrado en la plataforma de ejecución. Para tener específicamente **“Continuar con Google” a través de Supabase**, todavía hay que conectar el proyecto Supabase del usuario, activar Google Provider, definir las URLs de callback y sincronizar la identidad de Supabase con la sesión server-side. También queda pendiente la publicación de cada build en un subdominio Vercel individual; no se activa automáticamente porque requiere credenciales de GitHub/Vercel y un diseño de permisos por proyecto.
