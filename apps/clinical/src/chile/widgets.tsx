/**
 * Widgets chilenos del tablero clínico (ADR-020 de urgencia-bahmni). Se usan en `dashboards/*.json` como
 * cualquier control:
 *
 *   { "type": "observationCurves", "config": { "curves": [ … secciones observationGraph del clásico … ] } }
 *   { "type": "clinicalDocuments", "config": { "sections": ["prescription", "laboratory"] } }
 *   { "type": "interconsultaRed" }
 *
 * El código vive en `@juanjortega/bahmni-clinical-ui/widgets` (los mismos componentes que usan las apps propias);
 * aquí solo se registran, agregando el paciente de la ruta. Es el único archivo del fork que los conoce, para que
 * los rebases sobre Bahmni sigan siendo simples. El código de los widgets se descarga recién cuando un tablero
 * los usa.
 */
import {
  registerWidget,
  usePatientUUID,
  type WidgetConfig,
} from '@bahmni/widgets';
import { lazy, type ComponentProps } from 'react';
// Estilos de los widgets, sin capa, y tokens tomados de Carbon, solo dentro de `.bcui-widget` (no cambian el resto).
import '@juanjortega/bahmni-clinical-ui/widgets-host.css';

/** `WidgetProps` no es público en `@bahmni/widgets`: se toma del tipo del componente registrado. */
type WidgetProps = ComponentProps<WidgetConfig['component']>;

export const CHILE_WIDGET_TYPES = [
  'observationCurves',
  'clinicalDocuments',
  'interconsultaRed',
] as const;

for (const type of CHILE_WIDGET_TYPES) {
  registerWidget({
    type,
    component: lazy(async () => {
      const { bahmniWidgets } = await import(
        '@juanjortega/bahmni-clinical-ui/widgets'
      );
      const Widget = bahmniWidgets[type];
      const ChileWidget = (props: WidgetProps) => {
        const patientUuid = usePatientUUID();
        if (!Widget || !patientUuid) return null;
        return <Widget {...props} patientUuid={patientUuid} />;
      };
      return { default: ChileWidget };
    }),
  });
}
