import React from 'react';
import { getCurrentUser } from '../../utils/api';

const RoleBasedButton = ({ disabledRoles = [], children, ...props }) => {
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
  const shouldDisable = disabledRoles.includes(userSubRole);

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
