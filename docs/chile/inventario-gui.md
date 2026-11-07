# Inventario de la GUI: React, AngularJS y qué conviene hacer

**Fecha:** 6 de noviembre de 2026.
**Recomendación:** seguir en este fork, cerca de upstream, y migrar módulo por módulo. No conviene separarse en un fork completo ni pasar ahora a O3.

Este documento compara pantallas y flujos. El detalle de mejoras chilenas sigue en [inventario.md](inventario.md).

## Qué se comprobó y qué no

**Comprobado:**
- Código de `release/chile`, de `upstream/main` y de `openmrs-module-bahmniapps-chile` (`release/chile-hosp`).
- Tamaño del fork y simulación del merge con `git`.
- Mosaicos y tablero en `standard-config-chile` (`home/v2/extension.json`, `clinical/v2/dashboards/general.json`).
- En el navegador, solo Clínico en el laboratorio FHIR, y con los límites del ADR-034.

**Sin comprobar:**
- No se recorrió cada pantalla: «cubre» significa que existe el código, no que se probó con usuarios.
- Los «no tiene» vienen de buscar términos en el código, así que una función con otro nombre puede no aparecer.
- No se leyó la configuración de cada centro: un centro puede enviar un mosaico a otra pantalla.
- No hay una hoja de ruta publicada de Bahmni revisada. Lo de upstream sale de su código y su historial.
- La columna «Distancia» es una apreciación, no una estimación de esfuerzo.

## Pantallas y flujos

Upstream es `bahmni-apps-frontend` en `main`. Los archivos son `.js` y `.html` de `ui/app/<módulo>`.

| Área | AngularJS | React en `release/chile` | Upstream (React) | Distancia |
|---|---|---|---|---|
| Inicio y login | `home` (19 archivos) | `home`. El login sigue en Angular: al vencer la sesión, la v2 va a `/bahmni/home/index.html#/login` | Igual | Media |
| Búsqueda en Clínico | `clinical` | `apps/clinical/pages/list`. El mosaico de la configuración leída aún entra por Angular (`/bahmni/clinical/index.html#/v2/patient/search`) | Tiene la lista | Baja |
| Tablero clínico | `clinical`, `common/displaycontrols` | 17 widgets y 3 chilenos (curvas, recetas e indicaciones, interconsulta) | Los 17 | Media |
| Consulta | `clinical/consultation` | Panel con diagnósticos, alergias, exámenes, medicamentos, vacunas y formularios | Lo mismo | Media: ver ADR-034 |
| Disposición, bacteriología, tabla pivote | Sí | No se encontró | No se encontró | Alta, si un centro los usa |
| Programas | `clinical/#/programs` | Widget del tablero. El mosaico entra por Angular | El widget | Media |
| Registro | `registration` (53 archivos), con RUN, segundo apellido e identificadores | `apps/registration`: búsqueda, alta y edición. Lo chileno está pendiente (inventario.md) | Búsqueda, alta y edición | Media a alta |
| Citas | `/appointments` (frontend aparte) | `apps/appointments`: gestión, servicios e indisponibilidad | Lo mismo | Media |
| Documentos | `document-upload` (11 archivos) | `apps/patient-documents` | Lo mismo, con cambios recientes | Baja a media |
| Reportes | `reports` (12 archivos) | `apps/reports` | Lo mismo, con cambios recientes | Media |
| Administración | `admin` (26 archivos) | `apps/admin`: auditoría y CSV | Lo mismo | Media |
| Órdenes | `orders` (10 archivos) | No tiene; hay widget de recetas y órdenes | No tiene | Media a alta |
| Camas y hospitalización | `bedmanagement` (46), `adt` (32) | No tiene | Enlace externo a una OWA de camas (BAH-5136) | Alta |
| Pabellón | `ot` (52 archivos) | No tiene | No tiene | Alta; `pabellon-bahmni` es otra vía |

## Distancia con upstream

| Medida | Resultado |
|---|---|
| Diferencia del fork con upstream, con el merge y el cambio del buscador | 44 archivos, +1175 / −68 líneas |
| Simular traer 25 commits de upstream | 1 conflicto de texto (`package.json`) |
| Actividad de upstream desde el 1 de septiembre | 75 commits; Clínico 26, Registro 11, Documentos 11 |
| Diferencia del fork de AngularJS con su upstream | 349 archivos, +16.430 / −2.382 líneas; 163 commits propios |

Lo chileno de React es pequeño y Bahmni lo sigue mejorando. El fork de AngularJS muestra lo que cuesta alejarse.

## Las tres opciones

| | **A. Este fork, cerca de upstream, por módulo** | B. Fork completo separado | C. OpenMRS 3 |
|---|---|---|---|
| Código nuevo de Bahmni | Sigue llegando | Se corta o cuesta cada vez más | Se deja |
| Costo inmediato | Bajo: ya funciona | Parece bajo, y crece con cada mejora que no llega | 16 a 48 semanas-persona con O3 por debajo; 47 a 109 con O3 completo (piloto, cifras no calibradas) |
| Libertad de cambio | Limitada: hay que cuidar los puntos tocados | Total | Total, pero con otra arquitectura |
| Riesgo principal | Bahmni cambie zonas que tocamos (6 archivos de la consulta en 2 semanas) | Mantener solos todo el frontend | `bahmnicore` no arranca aún sobre O3 |
| Convive con AngularJS | Sí | Sí | No directamente |

**Por qué A:**
- El fork ya está cerca: el último merge simulado tuvo un solo conflicto de texto, aunque falta compilarlo y probarlo por completo.
- Lo que falta no se resuelve separándose: camas, pabellón y órdenes tampoco están en React, y habría que construirlos en las tres opciones.
- Separarse tiene sentido solo si Bahmni deja de ser útil o bloquea algo importante. Hoy no hay evidencia de eso.
- El piloto de O3 sigue parcial: `bahmnicore` no arrancó y nuestro fork no se probó (PR #60 de `urgencia-bahmni`).

**Revisar esta recomendación si:**
- traer upstream empieza a dar conflictos grandes de forma repetida;
- Bahmni abandona `bahmni-apps-frontend`;
- el piloto de O3 logra arrancar `bahmnicore`, y el costo baja mucho.

## Orden sugerido para migrar
1. Consulta y barra (ADR-034, en curso).
2. Registro con lo chileno: RUN, segundo apellido e identificadores. Lo usa el personal todos los días.
3. Entrada a Clínico y Programas por React, para reducir los saltos a Angular.
4. Órdenes, si los centros lo necesitan.
5. Camas, hospitalización y pabellón: decidir antes si van a React o si bastan los módulos propios e IPD.
