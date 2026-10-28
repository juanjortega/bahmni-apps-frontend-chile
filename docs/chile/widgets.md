# Widgets chilenos del tablero clínico

Decisión: ADR-020 de `urgencia-bahmni` (26-10-2026).
- **`main`** es espejo del oficial.
- **`release/chile`** lleva lo nuestro.
- Los widgets se compilan en la imagen.
- El código de los widgets vive en `@juanjortega/bahmni-clinical-ui/widgets` (repo `urgencia-bahmni`). Las apps propias usan los mismos componentes.
- En este fork solo se registran, en `apps/clinical/src/chile/widgets.tsx`.

| `type` | Qué es | Equivale en el clásico a |
|---|---|---|
| `observationCurves` | Curvas de signos vitales, exámenes y crecimiento (con CSV de referencia) | `observationGraph` |
| `clinicalDocuments` | Recetas e indicaciones de una visita: PDF por sección y emisor con firma; imprimir, descargar, guardar en la ficha y avisar por correo (`communication`) | tablero de órdenes (`allOrdersReact`) y `prescriptionPrint` |
| `interconsultaRed` | Interconsulta TEI: pendientes, detalle y «Finalizar y responder» | `interconsultaFinalize` |

## Configuración (`openmrs/apps/clinical/v2/dashboards/*.json`)

Se usan como cualquier control de una sección.

```json
{
  "name": "Tendencias",
  "controls": [
    {
      "type": "observationCurves",
      "config": {
        "curves": [
          { "title": "Presión arterial", "yAxisConcepts": ["Systolic blood pressure", "Diastolic blood pressure"],
            "yAxisConceptUuids": ["5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
            "xAxisConcept": "observationDateTime", "numberOfVisits": 10 },
          { "title": "Peso para la edad", "yAxisConcepts": ["Weight (kg)"],
            "yAxisConceptUuids": ["5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
            "referenceData": "crecimientoPesoEdad.csv", "numberOfVisits": 50 }
        ]
      }
    }
  ]
}
```

- **`observationCurves`**
  - Acepta las mismas claves que `observationGraph`, así que las secciones del `dashboard.json` del clásico se copian tal cual dentro de `curves`. También sirve la forma `{ "pesoEdad": { "type": "observationGraph", "config": {…} } }`.
  - Los CSV de referencia se leen de `/bahmni_config/openmrs/apps/clinical/`, o de `referenceBase`.
  - Sin `xAxisConcept`, una curva con referencia va contra la edad en meses.
- **`clinicalDocuments`**
  - Todo es opcional: `{ "sections": ["prescription", "laboratory", "imaging", "procedure", "referral"], "orderTypeNames": { "referral": "Referral Order" }, "logoUrl": "/bahmni_config/openmrs/apps/home/logo.png" }`.
  - El logo, el adjunto y el portal salen de `/bahmni/orders-pdf-runtime-config.json`, igual que en el clásico.
- **`interconsultaRed`**
  - `{ "mediatorBase": "/mediator" }` si el canal del mediador está en otra ruta.
  - Necesita el encuentro activo, que da el frontend nuevo (`activeEncounterUuid`).
- **Textos:** se pueden cambiar en `/bahmni_config/openmrs/i18n/clinical-widgets/locale_es.json`.

## Construcción
- **Dependencias:** `@juanjortega/bahmni-clinical-ui` 0.11.1 y `pdfmake` en el `package.json` raíz.
  - El paquete está en GitHub Packages; el `.npmrc` del repo solo dice el registro del scope.
  - El token va en el `~/.npmrc` de cada uno (`//npm.pkg.github.com/:_authToken=…`, con `read:packages`). No va en el repo: yarn 1 falla en todo comando si una variable del `.npmrc` no existe.
  - En CI: `actions/setup-node` con `registry-url: https://npm.pkg.github.com`, `scope: "@juanjortega"` y `NODE_AUTH_TOKEN`. Además, hay que darle al paquete acceso de lectura para este repositorio.
- `yarn.lock` ya tiene `bahmni-clinical-ui` 0.11.1 y `bahmni-clinical` 0.12.2, publicados el 27-10-2026.
- Build local: `nx build distro` necesita `NODE_OPTIONS=--max-old-space-size=8192`. Sin eso, webpack se queda sin memoria y termina sin mensaje.
- **Imagen:** `ghcr.io/juanjortega/bahmni-apps-frontend-chile`, con etiquetas fijas, nunca `latest`.
  - Primera: `1.1.0-chile.1` (y `sha-1c22526c8caf`), del commit `1c22526c`, publicada el 28-10-2026.
  - Se construye en un servidor de desarrollo, no en el PC, con `scripts/chile/build-imagen.sh`: `gh auth token | ssh <servidor> 'sh -s <commit> <etiqueta>' < scripts/chile/build-imagen.sh`.
  - El script trabaja en `~/build/bahmni-apps-frontend-chile`, usa un contenedor `node:22` con tope de 6 GB y una config de Docker propia, y borra el token al terminar.
  - No usa los workflows heredados de Bahmni: publican en su Docker Hub, y el `GITHUB_TOKEN` de este repo no lee los paquetes `@juanjortega`.
  - El paquete de ghcr quedó **privado**. Para bajarlo, el servidor necesita un login con `read:packages`, o hay que hacer público el paquete; eso lo decide Juanjo.
- **Pendiente:** reemplazar la imagen de serie en el .115 (`docker-compose.apps-frontend.yml`). Requiere un OK de despliegue aparte.
