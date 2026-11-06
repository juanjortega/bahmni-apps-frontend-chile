import {
  Loading,
  Header,
  useSidebarNavigation,
  ActionAreaLayout,
} from '@bahmni/design-system';
import {
  useTranslation,
  BAHMNI_HOME_PATH,
  getConfig,
  generateId,
  getFormattedPatientById,
  capitalize,
  hasPrivilege,
  PATIENT_NOT_FOUND_ERROR_KEY,
  type ConsultationEventPayload,
  useSubscribeConsultationStart,
} from '@bahmni/services';
import {
  LocationProvider,
  LocationSelector,
  ProgramDetails,
  useNotification,
  useUserPrivilege,
  useActivePractitioner,
  usePatientUUID,
  UserGlobalAction,
} from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'react-router';
import {
  type ConsultationMode,
  ConsultationModeSwitch,
} from '../chile/consulta/ConsultationModeSwitch';
import { LanguageSelector } from '../chile/consulta/LanguageSelector';
import { PatientAllergies } from '../chile/consulta/PatientAllergies';
import bandStyles from '../chile/consulta/styles/consulta.module.scss';
import { useConsultationPreference } from '../chile/consulta/useConsultationPreference';
import { useDiscardedOnPatientChange } from '../chile/consulta/useDiscardedOnPatientChange';
import ConsultationPadContainer from '../components/consultationPadContainer';
import DashboardContainer from '../components/dashboardContainer/DashboardContainer';
import PatientHeader from '../components/patientHeader/PatientHeader';
import { BAHMNI_CLINICAL_PATH } from '../constants/app';
import { ClinicalAppProvider } from '../providers/ClinicalAppProvider';
import { useClinicalConfig } from '../providers/clinicalConfig';
import { useObservationFormsStore } from '../stores/observationFormsStore';
import {
  DASHBOARD_CONFIG_URL,
  CURRENT_DASHBOARD_SEARCH_PARAMS_KEY,
  EPISODE_UUID_SEARCH_PARAMS_KEY,
  PROGRAM_UUID_SEARCH_PARAMS_KEY,
} from './constant';
import { DashboardConfig } from './models';
import dashboardConfigSchema from './schema.json';
import {
  getDefaultDashboard,
  getSidebarItems,
  filterSectionsByPrivileges,
  isPatientNotFoundError,
} from './util';

const addSectionIds = (config: DashboardConfig): DashboardConfig => {
  if (!config?.sections?.length) return config;
  return {
    ...config,
    sections: config.sections.map((section) =>
      section.id ? section : { ...section, id: generateId() },
    ),
  };
};

/**
 * ConsultationPage
 *
 * Main clinical consultation interface that displays patient information and clinical dashboard.
 * Integrates clinical layout with patient details, sidebar navigation, and dashboard content.
 * Dynamically loads dashboard configuration and handles navigation between different sections.
 *
 * @returns React component with clinical consultation interface
 */
const ConsultationPage: React.FC = () => {
  const { t } = useTranslation();
  const { clinicalConfig, isLoading: clinicalConfigLoading } =
    useClinicalConfig();
  const { userPrivileges } = useUserPrivilege();
  const { addNotification } = useNotification();
  const [isActionAreaVisible, setIsActionAreaVisible] = useState(false);
  const [isActionAreaExpanded, setIsActionAreaExpanded] = useState(false);
  // Distribución chilena (ADR-034): la ficha oculta la consulta sin desmontarla, y se recuerda el modo elegido.
  const [isConsultationHidden, setIsConsultationHidden] = useState(false);
  const { user: activeUser } = useActivePractitioner();
  const { preferred, remember } = useConsultationPreference(activeUser?.uuid);
  const consultationMode: ConsultationMode = isConsultationHidden
    ? 'ficha'
    : isActionAreaExpanded
      ? 'completa'
      : 'lateral';
  const handleModeChange = (mode: ConsultationMode) => {
    setIsConsultationHidden(mode === 'ficha');
    setIsActionAreaExpanded(mode === 'completa');
    if (mode !== 'ficha') remember(mode);
  };
  const [consultationPayload, setConsultationPayload] =
    useState<ConsultationEventPayload | null>(null);

  useSubscribeConsultationStart(
    useCallback((event) => {
      setConsultationPayload(event);
      setIsActionAreaVisible(true);
      setIsConsultationHidden(false);
      setIsActionAreaExpanded(preferred.current === 'completa');
    }, []),
  );
  const [searchParams] = useSearchParams();

  const viewingForm = useObservationFormsStore((state) => state.viewingForm);

  const patientUUID = usePatientUUID();
  const {
    data: patient,
    error: patientError,
    isError: isPatientError,
    isPending: isPatientPending,
  } = useQuery({
    queryKey: ['patient', patientUUID],
    queryFn: () => getFormattedPatientById(patientUUID!),
    enabled: !!patientUUID,
  });

  // Every patient fetch failure must produce visible feedback. A 400/404 — and
  // a malformed UUID, which getPatientById rejects with the same key before it
  // reaches the network — means the patient is missing; anything else is an
  // unexpected failure we report generically. The key is derived from the
  // classification rather than from the error's shape, because the api client
  // rejects with a bare string for non-key errors and an `instanceof Error`
  // guard would silently skip the one message this feature guarantees.
  const patientErrorMessageKey = useMemo(() => {
    if (!isPatientError) return null;
    return isPatientNotFoundError(patientError)
      ? PATIENT_NOT_FOUND_ERROR_KEY
      : 'ERROR_FETCHING_PATIENT_DATA';
  }, [isPatientError, patientError]);

  // Only mount the patient-scoped content (patient header + dashboard widgets)
  // once the patient is confirmed to exist. Those widgets each fetch data for
  // the UUID as soon as they mount and raise their own error toasts, so
  // rendering them for a missing patient would spam "Bad Request"/"Server Error"
  // alongside the single "Patient not found" message. On failure the content
  // area renders `error-loading-patient` instead, so the reason is stated in the
  // page and not only in a toast that disappears. `patientUUID` is absent only
  // outside the consultation route, where content should render as before.
  const shouldRenderPatientContent = !patientUUID || !!patient;

  const breadcrumbItems = useMemo(
    () => [
      { id: 'home', label: t('HOME_LABEL'), href: BAHMNI_HOME_PATH },
      {
        id: 'clinical',
        label: t('CLINICAL_LABEL'),
        href: BAHMNI_CLINICAL_PATH,
      },
      {
        id: 'current',
        label: patient?.fullName
          ? capitalize(patient.fullName)
          : t('CURRENT_PATIENT'),
        isCurrentPage: true,
      },
    ],
    [patient?.fullName, t],
  );

  const episodeUuids = useMemo(() => {
    const episodeUuid = searchParams.get(EPISODE_UUID_SEARCH_PARAMS_KEY);
    if (!episodeUuid) return [];
    return episodeUuid
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const currentDashboardParam = searchParams.get(
    CURRENT_DASHBOARD_SEARCH_PARAMS_KEY,
  );

  const currentDashboard = useMemo(() => {
    if (!clinicalConfig) return null;

    if (!currentDashboardParam) {
      return getDefaultDashboard(clinicalConfig.dashboards || []);
    }

    return clinicalConfig.dashboards?.find(
      (dashboard) => dashboard.name === currentDashboardParam,
    );
  }, [clinicalConfig, currentDashboardParam]);

  const dashboardURL = currentDashboard?.url ?? null;

  const {
    data: dashboardConfig,
    isLoading: isDashboardConfigLoading,
    error: dashboardConfigError,
  } = useQuery({
    queryKey: ['dashboardConfig', dashboardURL],
    queryFn: () =>
      getConfig<DashboardConfig>(
        DASHBOARD_CONFIG_URL(dashboardURL),
        dashboardConfigSchema,
      ),
    select: addSectionIds,
    enabled: !!dashboardURL,
  });

  useEffect(() => {
    if (dashboardConfigError) {
      addNotification({
        title: t('ERROR_LOADING_DASHBOARD_CONFIG'),
        message: t(dashboardConfigError.message),
        type: 'error',
      });
    }
  }, [dashboardConfigError]);

  useEffect(() => {
    if (!patientErrorMessageKey) return;
    addNotification({
      title: t('ERROR_DEFAULT_TITLE'),
      message: t(patientErrorMessageKey),
      type: 'error',
    });
  }, [patientErrorMessageKey, addNotification, t]);

  const filteredDashboardConfig = useMemo(() => {
    if (!dashboardConfig || !userPrivileges) return null;
    return {
      ...dashboardConfig,
      sections: filterSectionsByPrivileges(dashboardConfig.sections),
    };
  }, [dashboardConfig, userPrivileges]);

  const filteredPrintOptions = useMemo(() => {
    if (!currentDashboard?.printOptions || !userPrivileges) return [];
    return currentDashboard.printOptions.filter((option) =>
      hasPrivilege(userPrivileges, option.privileges),
    );
  }, [currentDashboard, userPrivileges]);

  const sidebarItems = useMemo(() => {
    if (!filteredDashboardConfig) return [];
    return getSidebarItems(filteredDashboardConfig, t);
  }, [filteredDashboardConfig, t]);

  const [scrollTrigger, setScrollTrigger] = useState(0);
  const { activeItemId, handleItemClick: originalHandleItemClick } =
    useSidebarNavigation(sidebarItems);

  const handleItemClick = useCallback(
    (id: string) => {
      originalHandleItemClick(id);
      setScrollTrigger((v) => v + 1);
    },
    [originalHandleItemClick],
  );

  if (clinicalConfigLoading) {
    return (
      <Loading
        id="loading-clinical-config"
        description={t('LOADING_CLINICAL_CONFIG')}
        role="status"
      />
    );
  }
  if (!userPrivileges) {
    return <Loading description={t('LOADING_USER_PRIVILEGES')} role="status" />;
  }
  if (!currentDashboard) {
    const errorMessage = currentDashboardParam
      ? t('ERROR_DASHBOARD_NOT_CONFIGURED', {
          dashboardName: currentDashboardParam,
        })
      : t('ERROR_NO_DEFAULT_DASHBOARD');

    addNotification({
      title: t('ERROR_DEFAULT_TITLE'),
      message: errorMessage,
      type: 'error',
    });
    return (
      <div
        id="error-no-default-dashboard"
        data-testid="error-no-default-dashboard-test-id"
      />
    );
  }

  if (isDashboardConfigLoading) {
    return (
      <Loading
        id="loading-dashboard-config"
        data-testid="loading-dashboard-config-test-id"
        description={t('LOADING_DASHBOARD_CONFIG')}
        role="status"
      />
    );
  }
  // Distribución chilena: una lectura fallida con datos en caché solo avisa; reemplazar la página borraría el borrador.
  if (!filteredDashboardConfig) {
    return (
      <div
        id="error-loading-dashboard-config"
        data-testid="error-loading-dashboard-config-test-id"
      >
        {t('ERROR_LOADING_DASHBOARD_CONFIG')}
      </div>
    );
  }

  const renderContextInformation = () => {
    const programUUID = searchParams.get(PROGRAM_UUID_SEARCH_PARAMS_KEY);
    if (programUUID && clinicalConfig.contextInformation?.program)
      return (
        <ProgramDetails
          programUUID={programUUID}
          config={{
            fields: clinicalConfig.contextInformation?.program?.fields ?? [],
          }}
        />
      );
    return null;
  };

  return (
    <ClinicalAppProvider episodeUuids={episodeUuids} patientId={patientUUID}>
      <div className={isConsultationHidden ? bandStyles.modeChart : undefined}>
        <ActionAreaLayout
          headerWSideNav={
            <>
              <Header
                breadcrumbItems={breadcrumbItems}
                globalFeatures={[
                  <div key="location" className={bandStyles.headerSelector}>
                    <LocationProvider>
                      <LocationSelector />
                    </LocationProvider>
                  </div>,
                  <div key="language" className={bandStyles.headerSelector}>
                    <LanguageSelector />
                  </div>,
                ]}
                userMenu={<UserGlobalAction />}
                sideNavItems={isActionAreaExpanded ? [] : sidebarItems}
                activeSideNavItemId={activeItemId}
                onSideNavItemClick={handleItemClick}
                isRail={isActionAreaVisible}
              />
              {/* Distribución chilena (ADR-034): la banda va sobre los dos paneles y se ve en todos los modos. */}
              {shouldRenderPatientContent && (
                <div
                  id="section-sticky-header"
                  data-testid="section-sticky-header-test-id"
                  role="region"
                  aria-label={t('PATIENT_HEADER_SECTION')}
                  className={[
                    bandStyles.band,
                    !isActionAreaExpanded &&
                      (isActionAreaVisible
                        ? bandStyles.withRail
                        : bandStyles.withSideNav),
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <PatientHeader
                    isActionAreaVisible={isActionAreaVisible}
                    printOptions={filteredPrintOptions}
                  />
                  <div className={bandStyles.bandRow}>
                    {patientUUID && (
                      <PatientAllergies patientUuid={patientUUID} />
                    )}
                    {isActionAreaVisible && (
                      <ConsultationModeSwitch
                        mode={consultationMode}
                        onChange={handleModeChange}
                      />
                    )}
                  </div>
                  {renderContextInformation()}
                </div>
              )}
            </>
          }
          mainDisplay={
            <Suspense
              data-testid="suspense-dashboard-container-test-id"
              fallback={
                <Loading
                  id="loading-dashboard-content"
                  data-testid="loading-dashboard-content-test-id"
                  description={t('LOADING_DASHBOARD_CONTENT')}
                  role="status"
                />
              }
            >
              {patientUUID && isPatientPending && (
                <Loading
                  id="loading-patient"
                  data-testid="loading-patient-test-id"
                  description={t('LOADING_PATIENT_DATA')}
                  role="status"
                />
              )}
              {patientErrorMessageKey && (
                <div
                  id="error-loading-patient"
                  data-testid="error-loading-patient-test-id"
                  role="alert"
                >
                  {t(patientErrorMessageKey)}
                </div>
              )}
              {shouldRenderPatientContent && (
                <DashboardContainer
                  sections={filteredDashboardConfig!.sections}
                  activeItemId={activeItemId}
                  scrollTrigger={scrollTrigger}
                />
              )}
            </Suspense>
          }
          isActionAreaVisible={isActionAreaVisible}
          isActionAreaExpanded={isActionAreaExpanded}
          layoutVariant={viewingForm ? 'extended' : 'default'}
          actionArea={
            consultationPayload && (
              <ConsultationPadContainer
                encounterSessionStartContext={consultationPayload}
                onClose={() => {
                  setIsActionAreaVisible((prev) => !prev);
                  setIsActionAreaExpanded(false);
                  setIsConsultationHidden(false);
                }}
                isActionAreaExpanded={isActionAreaExpanded}
                onToggleActionAreaExpand={() =>
                  setIsActionAreaExpanded((prev) => !prev)
                }
              />
            )
          }
        />
      </div>
    </ClinicalAppProvider>
  );
};

/**
 * Distribución chilena: la ruta `:patientUuid` reutiliza el mismo componente al cambiar de paciente (por ejemplo, con
 * Atrás del navegador). La clave lo vuelve a montar: la consulta abierta se cierra y su borrador se descarta, porque
 * nunca debe pasar al otro paciente.
 */
const ConsultationPageForPatient: React.FC = () => {
  const patientUUID = usePatientUUID();
  useDiscardedOnPatientChange(patientUUID);
  return <ConsultationPage key={patientUUID ?? 'no-patient'} />;
};

export default ConsultationPageForPatient;
