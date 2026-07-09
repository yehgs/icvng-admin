/**
 * contexts/CapabilitiesContext.jsx
 *
 * PHASE 2 — RBAC FOUNDATION (frontend)
 *
 * Fetches GET /api/admin/me/capabilities once after login and exposes the
 * user's effective permissions, scope, country, and languages to the whole
 * admin app. This is the single source of truth that replaces the scattered
 * `allowedSubRoles` arrays in App.jsx, AdminSidebar, and RoleBasedButton.
 *
 * Backward compatible: components that still use subRole keep working. New and
 * migrated components should prefer `can(permission)`.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { apiCall, getCurrentUser } from "../utils/api";

const CapabilitiesContext = createContext(null);

export function CapabilitiesProvider({ children }) {
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const current = getCurrentUser();
    if (!current || current.role !== "ADMIN") {
      setCapabilities(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiCall("/admin/profile/me/capabilities");
      if (res?.success && res.data) {
        setCapabilities(res.data);
        setError(null);
      } else {
        setError(res?.message || "Failed to load capabilities");
      }
    } catch (e) {
      setError(e?.message || "Failed to load capabilities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const permissions = capabilities?.permissions || [];
  const permSet = React.useMemo(() => new Set(permissions), [permissions]);

  /** Does the current admin hold a permission (or any of a list)? */
  const can = useCallback(
    (keyOrKeys) => {
      const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
      return keys.some((k) => permSet.has(k));
    },
    [permSet]
  );

  /** Does the current admin hold ALL of the given permissions? */
  const canAll = useCallback(
    (keys = []) => keys.every((k) => permSet.has(k)),
    [permSet]
  );

  const value = {
    capabilities,
    loading,
    error,
    reload: load,
    can,
    canAll,
    permissions,
    scope: capabilities?.scope || "GLOBAL",
    country: capabilities?.country || null,
    isHQ: !!capabilities?.isHQ,
    isGlobal: capabilities?.isGlobal !== false,
    languages: capabilities?.languages || { default: "en", supported: ["en"] },
    subRole: capabilities?.subRole || getCurrentUser()?.subRole || null,
  };

  return (
    <CapabilitiesContext.Provider value={value}>
      {children}
    </CapabilitiesContext.Provider>
  );
}

/** Primary hook: const { can, scope, isHQ } = useCapabilities(); */
export function useCapabilities() {
  const ctx = useContext(CapabilitiesContext);
  if (!ctx) {
    // Defensive fallback so a component used outside the provider doesn't crash;
    // it simply denies everything until the provider is mounted.
    return {
      capabilities: null,
      loading: false,
      error: null,
      reload: () => {},
      can: () => false,
      canAll: () => false,
      permissions: [],
      scope: "GLOBAL",
      country: null,
      isHQ: false,
      isGlobal: true,
      languages: { default: "en", supported: ["en"] },
      subRole: null,
    };
  }
  return ctx;
}

/**
 * <Can permission="orders.refund"> … </Can>
 * <Can permission={["orders.edit","orders.refund"]} mode="any"> … </Can>
 *
 * Renders children only if the current admin holds the permission(s).
 * Optional `fallback` renders otherwise.
 */
export function Can({ permission, mode = "any", fallback = null, children }) {
  const { can, canAll } = useCapabilities();
  const keys = Array.isArray(permission) ? permission : [permission];
  const ok = mode === "all" ? canAll(keys) : can(keys);
  return ok ? <>{children}</> : <>{fallback}</>;
}

export default CapabilitiesContext;
