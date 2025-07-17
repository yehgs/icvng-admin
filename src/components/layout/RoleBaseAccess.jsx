//admin
import React from 'react';
import { getCurrentUser } from '../../utils/api';

const RoleBasedAccess = ({ allowedRoles = [], children }) => {
  const user = getCurrentUser();

  // If no user, don't show anything
  if (!user) return null;

  // If no roles specified, show to everyone
  if (allowedRoles.length === 0) return children;

  // Check if user has any of the allowed roles
  const userSubRole = user.subRole;
  const hasAccess = allowedRoles.includes(userSubRole);

  // Return children if user has access, otherwise nothing
  return hasAccess ? children : null;
};

export default RoleBasedAccess;
