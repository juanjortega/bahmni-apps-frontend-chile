# Distribución chilena de la GUI React de Bahmni

Este fork (`juanjortega/bahmni-apps-frontend-chile`, rama `release/chile`) lleva a la GUI React lo que
la distribución chilena agregó a la GUI AngularJS (`openmrs-module-bahmniapps-chile`, rama
`release/chile-hosp`) y repara lo que falla en un Bahmni chileno.

- [Inventario de mejoras de la GUI Angular y su estado en React](inventario.md)
- [Inventario de la GUI: React, AngularJS y qué conviene hacer](inventario-gui.md)
- [Manual de usuario de la consulta](manual-consulta.md)
- [Widgets chilenos del tablero clínico](widgets.md): curvas, recetas e indicaciones, interconsulta de red
- Cómo desarrollar contra el laboratorio FHIR del 115: más abajo.

## Cambios de comportamiento frente a Bahmni

- **Clínico, página del paciente:** no tiene la búsqueda de pacientes en la barra. El paciente se elige en la lista de
  Clínico. Si el paciente cambia con una consulta abierta (por ejemplo, con Atrás del navegador), la consulta se cierra
  y su borrador se descarta: nunca pasa al otro paciente, y aparece un aviso (ADR-034 de `urgencia-bahmni`).
- **Clínico, consulta:** banda sobre los dos paneles, modos, temas y confirmaciones al salir. El código está en
  `apps/clinical/src/chile/consulta/`; los puntos tocados de Bahmni son `pages/ConsultationPage.tsx`,
  `components/consultationPad/index.tsx` y `providers/clinicalConfig/models.ts`.

## Temas de la consulta (configuración de cada centro)

En `openmrs/apps/clinical/v2/app.json`, dentro de `consultationPad`. Sin esta clave, la consulta queda como en Bahmni.

```json
"tabs": [
  { "id": "evaluacion", "label": "CONSULTATION_TAB_EVALUATION", "inputControls": ["allergies", "immunizationHistory"] },
  { "id": "diagnosticos", "label": "CONSULTATION_TAB_DIAGNOSES", "inputControls": ["conditionsAndDiagnoses"] },
  { "id": "tratamiento", "label": "CONSULTATION_TAB_TREATMENT", "inputControls": ["medication", "stopMedications", "vaccination", "immunizationAdministration"] },
  { "id": "ordenes", "label": "CONSULTATION_TAB_ORDERS", "inputControls": ["investigations"] },
  { "id": "formularios", "label": "CONSULTATION_TAB_FORMS", "inputControls": ["observationForms"] }
]
```

- `label` es una clave de traducción: agréguela en `openmrs/i18n/clinical/locale_<idioma>.json`.
- `inputControls` usa el `type` de cada control. Lo no listado aparece en «Otros».
- Los temas sin controles visibles para el rol no se muestran. Con un solo tema, o en una edición puntual, no hay barra.

## Desarrollo contra el laboratorio FHIR del 115

El laboratorio (`~/lab-fhir` en el 115) es una copia desechable de la base del 115 con fhir2 2.5.1,
que es lo que necesita esta GUI. Sólo escucha en `127.0.0.1:18080` del 115.

```bash
ssh -N -L 18080:127.0.0.1:18080 bahmni-115          # túnel, en otra terminal
export BAHMNI_TARGET=http://127.0.0.1:18080/
export BAHMNI_CONFIG_DIR=<carpeta con openmrs/>      # p. ej. un `git archive` de standard-config-cmdf
export BAHMNI_DEV_JSESSIONID=<JSESSIONID de una sesión del lab>
yarn nx serve distro                                # http://localhost:3000/bahmni-v2/home
```

`BAHMNI_DEV_JSESSIONID` lo pone el proxy en cada petición: el `JSESSIONID` del navegador es HttpOnly
y no se puede reemplazar desde la consola. La sesión se obtiene en el 115, sin que la contraseña del
lab salga de ahí:

```bash
ssh bahmni-115 '. ~/lab-fhir/lab.env; curl -s -c - -u "admin:$LAB_ADMIN_PASS" \
  http://127.0.0.1:18080/openmrs/ws/rest/v1/session -o /dev/null | awk "/JSESSIONID/{print \$7}"'
```

Antes del primer `serve` hay que compilar los paquetes compartidos:
`yarn nx run-many -t build -p @bahmni/services @bahmni/design-system @bahmni/widgets`.

Sin yarn instalado globalmente, `npx yarn@1.22.22 …` sirve para todo, incluido el hook de pre-commit,
si se pone un `yarn` en el PATH que llame a npx.
