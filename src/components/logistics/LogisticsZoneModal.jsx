// admin/src/components/logistics/LogisticsZoneModal.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { logisticsAPI } from '../../utils/api.js';
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

// countryCode: which country's states/LGAs this zone belongs to (edit:
// zone.countryCode; create: the parent page's country switcher / the
// admin's own assignedCountry — see LogisticsManagement.jsx). Used to
// fetch the right divisions instead of always showing Nigeria's — that
// was the actual bug: this modal used to import a hardcoded
// nigeria-states-lgas.js + a hardcoded Nigeria geopolitical-zone grouping
// directly, so creating a Togo (or any non-Nigeria) zone still showed
// Nigerian states like "North East (6 states)".
const LogisticsZoneModal = ({ isOpen, onClose, onSubmit, zone, loading, countryCode = 'NG' }) => {
  const { t } = useAdminTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    states: [],
    isActive: true,
    sortOrder: 0,
    zone_type: 'mixed',
    priority: 'medium',
    operational_notes: '',
  });

  const [errors, setErrors] = useState({});
  const [selectedStates, setSelectedStates] = useState([]);
  const [stateLgaCoverage, setStateLgaCoverage] = useState({});
  const [expandedStates, setExpandedStates] = useState({});

  // Fetched dynamically per country — replaces the old hardcoded
  // nigeriaStatesLgas import + geopoliticalZones map. Each entry is
  // { state, capital, region, lga: [...] } (see
  // server/utils/countryGeoData.js) — grouped below by `region` instead
  // of a Nigeria-specific geopolitical-zone lookup table.
  const [divisions, setDivisions] = useState([]);
  const [divisionsLoading, setDivisionsLoading] = useState(false);
  const targetCountry = zone?.countryCode || countryCode || 'NG';

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setDivisionsLoading(true);
    logisticsAPI
      .getGeoDivisions(targetCountry)
      .then((res) => {
        if (!cancelled && res.success) setDivisions(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setDivisions([]);
      })
      .finally(() => {
        if (!cancelled) setDivisionsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, targetCountry]);

  // Group the fetched divisions by their `region` field (e.g. Nigeria's
  // "North East"/"South West" geopolitical zones, Benin's "North"/"South",
  // Italy's "Northwest Italy"/"Central Italy" — whatever grouping each
  // country's own data uses; Togo's regions are their own top-level
  // divisions so each forms a single-item group, which is expected).
  const groupDivisionsByRegion = () => {
    const grouped = {};
    divisions.forEach((division) => {
      const groupKey = division.region || division.state;
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(division);
    });
    return grouped;
  };

  useEffect(() => {
    if (zone) {
      // Edit mode
      setFormData({
        name: zone.name || '',
        description: zone.description || '',
        states: zone.states || [],
        isActive: zone.isActive !== undefined ? zone.isActive : true,
        sortOrder: zone.sortOrder || 0,
        zone_type: zone.zone_type || 'mixed',
        priority: zone.priority || 'medium',
        operational_notes: zone.operational_notes || '',
      });

      // Initialize state selection and LGA coverage
      const stateNames = zone.states?.map((s) => s.name) || [];
      setSelectedStates(stateNames);

      const initialCoverage = {};
      zone.states?.forEach((state) => {
        initialCoverage[state.name] = {
          coverage_type: state.coverage_type || 'all',
          covered_lgas: state.covered_lgas || [],
        };
      });
      setStateLgaCoverage(initialCoverage);
    } else {
      // Create mode
      resetForm();
    }
    setErrors({});
  }, [zone, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      states: [],
      isActive: true,
      sortOrder: 0,
      zone_type: 'mixed',
      priority: 'medium',
      operational_notes: '',
    });
    setSelectedStates([]);
    setStateLgaCoverage({});
    setExpandedStates({});
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('logistics.zoneModal.nameRequired');
    }

    if (selectedStates.length === 0) {
      newErrors.states = t('logistics.zoneModal.statesRequired');
    }

    // Validate specific LGA coverage
    selectedStates.forEach((stateName) => {
      const coverage = stateLgaCoverage[stateName];
      if (
        coverage?.coverage_type === 'specific' &&
        (!coverage.covered_lgas || coverage.covered_lgas.length === 0)
      ) {
        newErrors.states = t('logistics.zoneModal.lgasRequired', { state: stateName });
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleStateToggle = (stateName) => {
    const newSelectedStates = selectedStates.includes(stateName)
      ? selectedStates.filter((s) => s !== stateName)
      : [...selectedStates, stateName];

    setSelectedStates(newSelectedStates);

    // Initialize or remove LGA coverage
    if (newSelectedStates.includes(stateName) && !stateLgaCoverage[stateName]) {
      setStateLgaCoverage((prev) => ({
        ...prev,
        [stateName]: {
          coverage_type: 'all',
          covered_lgas: [],
        },
      }));
    } else if (!newSelectedStates.includes(stateName)) {
      const newCoverage = { ...stateLgaCoverage };
      delete newCoverage[stateName];
      setStateLgaCoverage(newCoverage);
    }

    if (errors.states) {
      setErrors((prev) => ({ ...prev, states: '' }));
    }
  };

  const handleCoverageTypeChange = (stateName, coverageType) => {
    setStateLgaCoverage((prev) => ({
      ...prev,
      [stateName]: {
        coverage_type: coverageType,
        covered_lgas:
          coverageType === 'all' ? [] : prev[stateName]?.covered_lgas || [],
      },
    }));
  };

  const handleLgaToggle = (stateName, lgaName) => {
    const currentCoverage = stateLgaCoverage[stateName] || {
      coverage_type: 'all',
      covered_lgas: [],
    };

    const currentLgas = Array.isArray(currentCoverage.covered_lgas)
      ? currentCoverage.covered_lgas
      : [];

    const isSelected = currentLgas.includes(lgaName);
    const newCoveredLgas = isSelected
      ? currentLgas.filter((lga) => lga !== lgaName)
      : [...currentLgas, lgaName];

    setStateLgaCoverage((prev) => ({
      ...prev,
      [stateName]: {
        ...currentCoverage,
        covered_lgas: newCoveredLgas,
      },
    }));
  };

  const toggleStateExpansion = (stateName) => {
    setExpandedStates((prev) => ({
      ...prev,
      [stateName]: !prev[stateName],
    }));
  };

  const getStateLgas = (stateName) => {
    const stateData = divisions.find((s) => s.state === stateName);
    return stateData?.lga || [];
  };

  const groupStatesByZone = () => groupDivisionsByRegion();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare submission data
    const submitData = {
      ...formData,
      states: selectedStates.map((stateName) => {
        const stateData = divisions.find((s) => s.state === stateName);
        const coverage = stateLgaCoverage[stateName] || {
          coverage_type: 'all',
          covered_lgas: [],
        };

        return {
          name: stateName,
          code:
            stateData?.state.substring(0, 2).toUpperCase() ||
            stateName.substring(0, 2).toUpperCase(),
          coverage_type: coverage.coverage_type,
          available_lgas: stateData?.lga || [],
          covered_lgas:
            coverage.coverage_type === 'specific' ? coverage.covered_lgas : [],
        };
      }),
    };

    // countryCode travels with the submission so the server (which also
    // independently validates/stamps it — see resolveTargetCountry in
    // shipping.controller.js) creates/updates this zone under the right
    // country rather than defaulting to Nigeria for a GLOBAL admin.
    submitData.countryCode = targetCountry;

    console.log('Submitting zone data:', JSON.stringify(submitData, null, 2));
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {zone ? t('logistics.zoneModal.editTitle') : t('logistics.zoneModal.createTitle')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('logistics.zoneModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {errors.general && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-700 dark:text-red-300">{errors.general}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('logistics.zoneModal.nameLabel')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.name
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={t('logistics.zoneModal.namePlaceholder')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('logistics.zoneModal.typeLabel')}
              </label>
              <select
                name="zone_type"
                value={formData.zone_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="urban">{t("logistics2.urban")}</option>
                <option value="rural">{t("logistics2.rural")}</option>
                <option value="mixed">{t("logistics2.mixed")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('logistics.zoneModal.priorityLabel')}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="low">{t('logistics.zoneModal.low')}</option>
                <option value="medium">{t("notificationsExt.medium")}</option>
                <option value="high">{t('logistics.zoneModal.high')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('logistics.zoneModal.descriptionLabel')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
              placeholder={t('logistics.zoneModal.descPlaceholder')}
            />
          </div>

          {/* State Selection with LGA Coverage */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {t('logistics.zoneModal.selectStatesTitle')}
            </h3>

            <div className="space-y-4">
              {divisionsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('logistics.zoneModal.loadingStates', { country: targetCountry })}
                </div>
              ) : divisions.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t('logistics.zoneModal.noGeoData', { country: targetCountry })}
                </div>
              ) : (
              Object.entries(groupStatesByZone()).map(([zoneName, states]) => (
                <div
                  key={zoneName}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    {zoneName}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({t('logistics.zones.state', { count: states.length })})
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {states.map((state) => (
                      <div
                        key={state.state}
                        className="border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStates.includes(state.state)}
                              onChange={() => handleStateToggle(state.state)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {state.state}
                            </span>
                          </label>

                          {selectedStates.includes(state.state) && (
                            <button
                              type="button"
                              onClick={() => toggleStateExpansion(state.state)}
                              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              {t('logistics.zoneModal.configureLgas')}
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedStates[state.state]
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* LGA Coverage Configuration */}
                        {selectedStates.includes(state.state) &&
                          expandedStates[state.state] && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  {t('logistics.zoneModal.coverageTypeFor', { state: state.state })}
                                </label>
                                <select
                                  value={
                                    stateLgaCoverage[state.state]
                                      ?.coverage_type || 'all'
                                  }
                                  onChange={(e) =>
                                    handleCoverageTypeChange(
                                      state.state,
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                >
                                  <option value="all">
                                    {t('logistics.zoneModal.allLgasOption')}
                                  </option>
                                  <option value="specific">
                                    {t('logistics.zoneModal.specificLgasOption')}
                                  </option>
                                </select>
                              </div>

                              {stateLgaCoverage[state.state]?.coverage_type ===
                                'specific' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('logistics.zoneModal.selectLgasToCover', {
                                      count: stateLgaCoverage[state.state]?.covered_lgas?.length || 0,
                                    })}
                                  </label>
                                  <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800">
                                    <div className="grid grid-cols-2 gap-2">
                                      {getStateLgas(state.state).map(
                                        (lgaName) => (
                                          <label
                                            key={lgaName}
                                            className="flex items-center cursor-pointer text-sm"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={
                                                stateLgaCoverage[
                                                  state.state
                                                ]?.covered_lgas?.includes(
                                                  lgaName
                                                ) || false
                                              }
                                              onChange={() =>
                                                handleLgaToggle(
                                                  state.state,
                                                  lgaName
                                                )
                                              }
                                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 mr-2"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">
                                              {lgaName}
                                            </span>
                                          </label>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {stateLgaCoverage[state.state]
                                  ?.coverage_type === 'all'
                                  ? t('logistics.zoneModal.coversAllLgas', {
                                      count: getStateLgas(state.state).length,
                                      state: state.state,
                                    })
                                  : t('logistics.zoneModal.coversSomeLgas', {
                                      covered: stateLgaCoverage[state.state]?.covered_lgas?.length || 0,
                                      total: getStateLgas(state.state).length,
                                    })}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
              )}
            </div>

            {errors.states && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.states}
              </p>
            )}

            {selectedStates.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                  {t('logistics.zoneModal.selectedStatesCount', { count: selectedStates.length })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedStates.map((stateName) => {
                    const coverage = stateLgaCoverage[stateName];
                    const coverageText =
                      coverage?.coverage_type === 'all'
                        ? t('logistics.zoneModal.allLgasShort')
                        : t('logistics.zoneModal.lgasCountShort', { count: coverage?.covered_lgas?.length || 0 });

                    return (
                      <span
                        key={stateName}
                        className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs"
                      >
                        {stateName} ({coverageText})
                        <button
                          type="button"
                          onClick={() => handleStateToggle(stateName)}
                          className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('logistics.zoneModal.sortOrderLabel')}
              </label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                min="0"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('logistics.zoneModal.activeZoneLabel')}
                </span>
              </label>
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('logistics.zoneModal.operationalNotesLabel')}
            </label>
            <textarea
              name="operational_notes"
              value={formData.operational_notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
              placeholder={t('logistics.zoneModal.notesPlaceholder')}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {zone ? t('logistics.zoneModal.updateZone') : t('logistics.zoneModal.createZoneBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogisticsZoneModal;
