# Inventario: mejoras de la GUI Angular chilena y su estado en la GUI React

Fuente: `openmrs-module-bahmniapps-chile`, rama `origin/release/chile-hosp`: 163 commits propios sobre
`upstream/master` (merge-base 255bc4ef5). La config sale de `standard-config-chile`
(`release/chile-hosp`) y `standard-config-cmdf`. El inventario está hecho el 2026-10-23 sobre
`bahmni-apps-frontend` 844a717e (1.1.0).

**Estado en React:**
- **hecho**: portado en este fork.
- **existe**: React ya lo cubre.
- **portar**: hay que hacerlo.
- **config**: se resuelve en `standard-config-cmdf` (`openmrs/apps/*/v2`, `openmrs/i18n`).
- **no aplica**: CSS o build de AngularJS.

Prioridad: **1** lo usa el personal todos los días, **2** importante, **3** después.

## Base: sesión, idioma, i18n

| mejora | commits Angular | estado en React | prio | notas |
|---|---|---|---|---|
| Sexo del paciente traducido en la cabecera | — (fallo propio de React) | **hecho** | 1 | GENDER_F/M/O/U |
| Idioma: prioridad elección explícita → `defaultLocale` del usuario → GP `default_locale`; selector visible | 2a08e6c26, 14edfc490, 0ca59de5a, 95a86849e, 2ee7346f7 | **hecho** | 1 | `resolveUserLocale`; selector en el menú de usuario con los `allowedLocales` del servidor |
| Hora en el formato del idioma (24 h en `es`) | 65a603644, 0745a8a7a | **hecho** | 1 | `getTimeFormat()` y `getDateFnsLocale()`; meses en el idioma de la GUI |
| Booleanos «Yes/No» traducidos | 4772afa60, fecead4ff, cd92ba74b | existe / **hecho** | 1 | las observaciones FHIR ya usan `YES`/`NO`; el resultado de laboratorio decía «Positive/Negative» fijo, ahora `LAB_RESULT_POSITIVE/NEGATIVE` |
| Errores HTTP por idioma, sin la excepción Java en los 500 | 602f288a5 | portar | 2 | 400/409 conservan el mensaje del servidor |
| «No tienes aplicaciones» en vez de pantalla en blanco | 6a602d48d | existe | — | React muestra «No hay módulos disponibles» |
| Logout encadenado OpenMRS → oauth2-proxy → Keycloak; adoptar sesión del borde | d7df5c60d, 78ee7956f, 12ddea673, 3bb38ad5d | portar | 1 | React hace `DELETE /session` y vuelve al login legacy; bajo SSO debe ir a `/bahmni/logout.html` |
| Títulos de pestaña por clave, sin marca | 26e24c8f1, e413d7a8c, 1c2e9be40… | portar | 3 | |
| Capa es-CL de traducciones (config) | cfg-cl 7a0d2ed… (≈30) | config | 1 | muchas claves coinciden; hay que revisar `openmrs/i18n/<app>/locale_es.json` para los namespaces v2 |
| Superusuario («System Developer») ve las apps | — (fallo propio de React) | pendiente de decisión | 1 | `/session` no lista privilegios del superusuario y React lo deja sin nada; ver preguntas |

## Paciente y registro

| mejora | commits | estado | prio | notas |
|---|---|---|---|---|
| RUN visible junto al nombre; nombre con `familyName2`; identificador primario por `preferred` | 3714cefca, 97131b5a1, 5d7afc821, d3449709c, 6e5b9592a, ec4e0a92c | portar | 1 | tipos clave: RUN, RUN Provisorio, Pasaporte, FONASA |
| Segundo apellido en el registro | ad45085b8; cfg-cl 70d45d2 | portar | 1 | `showSecondLastName`, `isSecondLastNameMandatory` |
| Validador RUN módulo 11 y normalización | 30d9d6bf1; cfg-cl 3248d7f… | portar | 1 | |
| Identificadores prominentes, bajo demanda, repetibles y ocultos | 9cc55762e…; backend `eisidentity/identifier-metadata` | portar | 2 | |
| Demografía EIS (dirección DEIS, previsión) | cfg-cl 8b448ea… | config | 2 | `registration/v2/app.json` |
| Fecha de nacimiento sin desfase de zona horaria | 6cb9fa9b5 | revisar | 2 | |
| Pulsera con QR, pueblo originario, relación Madre/Hijo(a) | cfg-cmdf 455ef66, dbefe5a | config/portar | 3 | |

## Tablero clínico

| mejora | commits | estado | prio | notas |
|---|---|---|---|---|
| **Tablero de órdenes**: todas las órdenes y formularios, PDF y envío por correo | 278cd8094 … 6e93ff1a4 | portar | 1 | ya es React (`micro-frontends/.../AllOrders`); se registra como widget `allOrders` |
| Documentos entregados (PDF guardado en la ficha antes del aviso) y huella sha256 | 19475c813 … 3f86f0ef2 | portar | 1 | va con el tablero de órdenes |
| **Firma del profesional**: «Mi firma», «Administrar firmas» y estampado en los PDF | e2c4cfab0, 4a055ee96, c7d4424be | portar | 1 | backend `/ws/rest/v1/provider-signature` (omod `provider-signature`, está en el lab) |
| **Tendencias** (gráficos de observaciones, conceptos por uuid) | 69bc2d608, 8a6490a7c, 70adf63dc, 1596c1daf, 24f57bdcc, ba0eef803 | portar | 1 | React no tiene gráficos; `@carbon/charts-react` encaja con Carbon |
| **Curvas de crecimiento** OMS/norma chilena (4 curvas, eje no-edad) | dc05af208, 178195fd8, 44564e737, 0124fdf17 | portar | 2 | CSV de referencia en la config |
| Alergias: severidad y reacciones traducidas | c9d5ce5db, e9997ce72 | revisar | 1 | |
| Condiciones: «Antecedente(s)» | eca2da4bd | config | 2 | |
| Interconsulta (TEI): pendientes, detalle y «Finalizar y responder» | 6d6762c56 … 7956a9860 | portar | 2 | ya es React; widget `interconsultaFinalize` |
| Teleconsulta: ventana de video arrastrable con Jitsi | 602f43ca7 … 974b7ea49 | portar | 3 | |
| Impresión del tablero | a1a09eb62 … 6b5504d5d | revisar | 2 | React imprime por plantillas del servidor |
| Formularios 2.0 en castellano (decimal, «Seleccione…») | 3c2d02c08, 52d707feb… | revisar | 2 | corregir en `@bahmni/form2-controls`, no con parche |
| Receta: solo el nombre del medicamento; instrucciones en texto libre; enlace a Receta Minsal | b0ab9257a, e669b0d99, a35c52cce | revisar | 2 | |
| Ocultar «Consulta» sin `app:clinical:consultationWrite` | d155b26cf | portar | 2 | |
| Cabecera que no tape al paciente | ba1fa1a4f… | revisar | 3 | sólo CSS de AngularJS |

## Fuera de la GUI clínica

| mejora | estado | notas |
|---|---|---|
| Marca genérica, logo y título desde la config | config/portar | `/bahmni_config/openmrs/apps/home/logo.svg`, `whiteLabel.json` |
| Portada v2: mosaicos de Mi Agenda, Urgencia, Dental y Administración de medicamentos | existe (config) | `home/v2/extension.json` de cmdf |
| Agenda y citas | config | coordinar con la sesión «Bahmni agenda 3.0» (`clinicalModuleUrl`) |
| Build, CI, Karma | no aplica | |

## Bloqueos de backend en el 115 (no son de la GUI)

- El 115 no tiene FHIR **EncounterBundle**, que es con lo que esta GUI guarda las consultas. Tampoco
  tiene **Appointment**, y su **Condition** rechaza `category` y `clinical-status`. El laboratorio
  FHIR (fhir2 2.5.1, fhir2Extension, fhir2addlextension, episodes 2.0.0) sí los tiene.
- `GET /openmrs/ws/rest/v1/bahmni/app/setting?module=commons` da 404 en el laboratorio. React cae al
  formato de fecha del navegador.
- `Immunization` con `status`/`_sort` da 400 en el laboratorio.
