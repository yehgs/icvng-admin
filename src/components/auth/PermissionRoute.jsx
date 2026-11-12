// admin/src/components/auth/PermissionRoute.jsx
//
// Route guard driven by the server's effective permissions (CapabilitiesContext) instead of a
// hard-coded subRole list, so a role/permission change on the server takes effect in the UI with
// no front-end edit. Falls back to `fallbackSubRoles` only if capabilities could not be loaded.
import React from "react";
import { Navigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { getCurrentUser } from "../../utils/api";
import { useCapabilities } from "../../contexts/CapabilitiesContext.jsx";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

export default function PermissionRoute({ permission, fallbackSubRoles = [], children }) {
  const user = getCurrentUser();
  const { can, capabilities, loading } = useCapabilities();
  const { t } = useAdminTranslation();

  if (!user || user.role !== "ADMIN") return <Navigate to="/" replace />;
  if (loading) return <div className="p-10 text-center text-gray-500">{t("common.loading")}</div>;

  const allowed = capabilities ? can(permission) : fallbackSubRoles.includes(user.subRole);
  if (allowed) return children;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{t("common.accessDenied")}</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">{t("common.accessDeniedBody")}</p>
        <button onClick={() => window.history.back()} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">{t("common.back")}</button>
      </div>
    </div>
  );
}
