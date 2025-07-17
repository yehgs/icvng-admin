import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Truck,
  Check,
  ChevronDown,
  Search,
} from 'lucide-react';
import { nigeriaStatesLgas } from '../../data/nigeria-states-lgas.js';

const LogisticsZoneModal = ({ isOpen, onClose, onSubmit, zone, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    states: [],
    isActive: true,
    sortOrder: 0,
    zone_type: 'mixed',
    priority: 'medium',
    coverage_area_km2: 0,
    population_estimate: 0,
    operational_notes: '',
  });

  const [errors, setErrors] = useState({});
  const [nigerianStates, setNigerianStates] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // State for LGA coverage management
  const [stateLgaCoverage, setStateLgaCoverage] = useState({});
  const [expandedStates, setExpandedStates] = useState({});

  // Geopolitical zones mapping
  const geopoliticalZones = {
    'North Central': [
      'Benue',
      'FCT',
      'Kogi',
      'Kwara',
      'Nasarawa',
      'Niger',
      'Plateau',
    ],
    'North East': ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'],
    'North West': [
      'Jigawa',
      'Kaduna',
      'Kano',
      'Katsina',
      'Kebbi',
      'Sokoto',
      'Zamfara',
    ],
    'South East': ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
    'South South': [
      'Akwa Ibom',
      'Bayelsa',
      'Cross River',
      'Delta',
      'Edo',
      'Rivers',
    ],
    'South West': ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo'],
  };

  useEffect(() => {
    if (isOpen) {
      loadNigerianStates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || '',
        code: zone.code || '',
        description: zone.description || '',
        states: zone.states || [],
        isActive: zone.isActive !== undefined ? zone.isActive : true,
        sortOrder: zone.sortOrder || 0,
        zone_type: zone.zone_type || 'mixed',
        priority: zone.priority || 'medium',
        coverage_area_km2: zone.coverage_area_km2 || 0,
        population_estimate: zone.population_estimate || 0,
        operational_notes: zone.operational_notes || '',
      });

      // Initialize state LGA coverage
      const initialCoverage = {};
      zone.states?.forEach((state) => {
        initialCoverage[state.name] = {
          coverage_type: state.coverage_type || 'all',
          covered_lgas: state.covered_lgas?.map((lga) => lga.name) || [],
        };
      });
      setStateLgaCoverage(initialCoverage);
      setSelectedStates(zone.states?.map((s) => s.name) || []);
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        states: [],
        isActive: true,
        sortOrder: 0,
        zone_type: 'mixed',
        priority: 'medium',
        coverage_area_km2: 0,
        population_estimate: 0,
        operational_notes: '',
      });
      setSelectedStates([]);
      setStateLgaCoverage({});
      setExpandedStates({});
    }
    setErrors({});
  }, [zone, isOpen]);

  const loadNigerianStates = async () => {
    try {
      setLoadingStates(true);

      // Get all Nigerian states using local data
      const statesData = nigeriaStatesLgas.map((stateInfo) => ({
        name: stateInfo.state,
        capital: stateInfo.capital,
        code: stateInfo.state.substring(0, 2).toUpperCase(),
        geopolitical_zone: stateInfo.region,
        population: stateInfo.population,
        lgas: stateInfo.lga.map((lgaName) => ({
          name: lgaName,
          major_towns: [lgaName],
          postal_codes: [],
        })),
      }));

      setNigerianStates(statesData);
    } catch (error) {
      console.error('Error loading Nigerian states:', error);
      setErrors({ general: 'Failed to load Nigerian states data' });
    } finally {
      setLoadingStates(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Zone name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Zone code is required';
    }

    if (selectedStates.length === 0) {
      newErrors.states = 'At least one state must be selected';
    }

    // Validate specific LGA coverage
    selectedStates.forEach((stateName) => {
      const coverage = stateLgaCoverage[stateName];
      if (
        coverage?.coverage_type === 'specific' &&
        coverage.covered_lgas.length === 0
      ) {
        newErrors.states = `Please select LGAs for ${stateName} or change coverage to 'All LGAs'`;
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

    // Initialize or remove LGA coverage for this state
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

    // Update formData with complete state objects
    const stateObjects = newSelectedStates.map((name) => {
      const stateData = nigerianStates.find((s) => s.name === name);
      const coverage = stateLgaCoverage[name] || {
        coverage_type: 'all',
        covered_lgas: [],
      };

      if (stateData) {
        return {
          name: stateData.name,
          code: stateData.code,
          capital: stateData.capital,
          geopolitical_zone: stateData.geopolitical_zone,
          population: stateData.population,
          coverage_type: coverage.coverage_type,
          available_lgas: stateData.lgas,
          covered_lgas:
            coverage.coverage_type === 'specific'
              ? coverage.covered_lgas.map(
                  (lgaName) =>
                    stateData.lgas.find((lga) => lga.name === lgaName) || {
                      name: lgaName,
                      major_towns: [],
                      postal_codes: [],
                    }
                )
              : [],
        };
      }
      return { name, code: name.substring(0, 2).toUpperCase() };
    });

    setFormData((prev) => ({
      ...prev,
      states: stateObjects,
    }));

    if (errors.states) {
      setErrors((prev) => ({ ...prev, states: '' }));
    }
  };

  const handleCoverageTypeChange = (stateName, coverageType) => {
    setStateLgaCoverage((prev) => ({
      ...prev,
      [stateName]: {
        ...prev[stateName],
        coverage_type: coverageType,
        covered_lgas:
          coverageType === 'all' ? [] : prev[stateName]?.covered_lgas || [],
      },
    }));

    // Update formData
    const updatedStates = formData.states.map((state) => {
      if (state.name === stateName) {
        return {
          ...state,
          coverage_type: coverageType,
          covered_lgas: coverageType === 'all' ? [] : state.covered_lgas || [],
        };
      }
      return state;
    });

    setFormData((prev) => ({
      ...prev,
      states: updatedStates,
    }));
  };

  const handleLgaToggle = (stateName, lgaName) => {
    const currentCoverage = stateLgaCoverage[stateName] || {
      coverage_type: 'all',
      covered_lgas: [],
    };
    const isSelected = currentCoverage.covered_lgas.includes(lgaName);

    const newCoveredLgas = isSelected
      ? currentCoverage.covered_lgas.filter((lga) => lga !== lgaName)
      : [...currentCoverage.covered_lgas, lgaName];

    setStateLgaCoverage((prev) => ({
      ...prev,
      [stateName]: {
        ...currentCoverage,
        covered_lgas: newCoveredLgas,
      },
    }));

    // Update formData
    const updatedStates = formData.states.map((state) => {
      if (state.name === stateName) {
        const stateData = nigerianStates.find((s) => s.name === stateName);
        return {
          ...state,
          covered_lgas: newCoveredLgas.map(
            (lgaName) =>
              stateData?.lgas.find((lga) => lga.name === lgaName) || {
                name: lgaName,
                major_towns: [],
                postal_codes: [],
              }
          ),
        };
      }
      return state;
    });

    setFormData((prev) => ({
      ...prev,
      states: updatedStates,
    }));
  };

  const toggleStateExpansion = (stateName) => {
    setExpandedStates((prev) => ({
      ...prev,
      [stateName]: !prev[stateName],
    }));
  };

  const getStateLgas = (stateName) => {
    const stateData = nigerianStates.find((s) => s.name === stateName);
    return stateData?.lgas || [];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const groupStatesByZone = () => {
    const grouped = {};
    nigerianStates.forEach((state) => {
      if (!grouped[state.geopolitical_zone]) {
        grouped[state.geopolitical_zone] = [];
      }
      grouped[state.geopolitical_zone].push(state);
    });
    return grouped;
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
                {zone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure coverage areas with LGA-level precision
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
                Zone Name *
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
                placeholder="e.g., Lagos Metro Zone"
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
                Zone Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors uppercase ${
                  errors.code
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., LMZ"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.code}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Zone Type
              </label>
              <select
                name="zone_type"
                value={formData.zone_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="urban">Urban</option>
                <option value="rural">Rural</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
              placeholder="Describe the zone coverage and special characteristics..."
            />
          </div>

          {/* State Selection with LGA Coverage */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Select States & Configure LGA Coverage *
            </h3>

            {loadingStates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Loading states...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupStatesByZone()).map(([zone, states]) => (
                  <div
                    key={zone}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      {zone}
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({states.length} states)
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {states.map((state) => (
                        <div
                          key={state.name}
                          className="border border-gray-100 dark:border-gray-700 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedStates.includes(state.name)}
                                onChange={() => handleStateToggle(state.name)}
                                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {state.name}
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                  ({state.capital})
                                </span>
                              </span>
                            </label>

                            {selectedStates.includes(state.name) && (
                              <button
                                type="button"
                                onClick={() => toggleStateExpansion(state.name)}
                                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                Configure LGAs
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    expandedStates[state.name]
                                      ? 'rotate-180'
                                      : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* LGA Coverage Configuration */}
                          {selectedStates.includes(state.name) &&
                            expandedStates[state.name] && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="mb-3">
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Coverage Type for {state.name}
                                  </label>
                                  <select
                                    value={
                                      stateLgaCoverage[state.name]
                                        ?.coverage_type || 'all'
                                    }
                                    onChange={(e) =>
                                      handleCoverageTypeChange(
                                        state.name,
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                  >
                                    <option value="all">
                                      All LGAs (Complete State Coverage)
                                    </option>
                                    <option value="specific">
                                      Specific LGAs Only
                                    </option>
                                  </select>
                                </div>

                                {stateLgaCoverage[state.name]?.coverage_type ===
                                  'specific' && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Select LGAs to Cover (
                                      {stateLgaCoverage[state.name]
                                        ?.covered_lgas?.length || 0}{' '}
                                      selected)
                                    </label>
                                    <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800">
                                      <div className="grid grid-cols-2 gap-2">
                                        {getStateLgas(state.name).map((lga) => (
                                          <label
                                            key={lga.name}
                                            className="flex items-center cursor-pointer text-sm"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={
                                                stateLgaCoverage[
                                                  state.name
                                                ]?.covered_lgas?.includes(
                                                  lga.name
                                                ) || false
                                              }
                                              onChange={() =>
                                                handleLgaToggle(
                                                  state.name,
                                                  lga.name
                                                )
                                              }
                                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 mr-2"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">
                                              {lga.name}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  {stateLgaCoverage[state.name]
                                    ?.coverage_type === 'all'
                                    ? `Covers all ${
                                        getStateLgas(state.name).length
                                      } LGAs in ${state.name}`
                                    : `Covers ${
                                        stateLgaCoverage[state.name]
                                          ?.covered_lgas?.length || 0
                                      } of ${
                                        getStateLgas(state.name).length
                                      } LGAs`}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errors.states && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.states}
              </p>
            )}

            {selectedStates.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                  Selected States ({selectedStates.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedStates.map((stateName) => {
                    const coverage = stateLgaCoverage[stateName];
                    const coverageText =
                      coverage?.coverage_type === 'all'
                        ? 'All LGAs'
                        : `${coverage?.covered_lgas?.length || 0} LGAs`;

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
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort Order
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
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operational Notes
            </label>
            <textarea
              name="operational_notes"
              value={formData.operational_notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
              placeholder="Any special instructions or notes for this zone..."
            />
          </div>

          {/* Status */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 transition-colors"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Active Zone
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingStates}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {zone ? 'Update Zone' : 'Create Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogisticsZoneModal;
