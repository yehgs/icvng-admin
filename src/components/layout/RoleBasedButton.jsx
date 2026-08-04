import React from 'react';
import { getCurrentUser } from '../../utils/api';

// hqOverrideRoles: subRoles that, despite being listed in disabledRoles,
// should stay ENABLED when the current user is GLOBAL-scoped (HQ). Used so
// e.g. an HQ Manager can use pricing actions that a country/"foreign"
// Manager (same subRole) still can't — subRole alone can't tell them apart,
// scope has to be checked too. Matches the server-side isPricingOwnerRole
// checks in product.controller.js / directPricing.controller.js.
const RoleBasedButton = ({ disabledRoles = [], hqOverrideRoles = [], children, ...props }) => {
  const user = getCurrentUser();

  // If no user, don't disable (let the button work normally)
  if (!user) {
    return children;
  }

  // If no roles specified, allow everyone (don't disable)
  if (disabledRoles.length === 0) {
    return children;
  }

  // Check if user has any of the disabled roles
  const userSubRole = user.subRole;
  const isHQ = user.scope !== "COUNTRY";
  const hasHqOverride = hqOverrideRoles.includes(userSubRole) && isHQ;
  const shouldDisable = disabledRoles.includes(userSubRole) && !hasHqOverride;

  // If not disabled, return children as-is
  if (!shouldDisable) {
    return children;
  }

  // Clone the button element and update the disabled prop + cursor style
  const existingClassName = children.props.className || '';
  const newClassName = existingClassName.includes('cursor-not-allowed')
    ? existingClassName
    : `${existingClassName} cursor-not-allowed`.trim();

  return React.cloneElement(children, {
    disabled: true,
    className: newClassName,
  });
};

export default RoleBasedButton;
