import standards from '../../standards';
import AbstractVirtualNode from '../../core/base/virtual-node/abstract-virtual-node';
import isNode from '../dom/is-node';

declare const axe: any;

/**
 * Get the "type" of role; either widget, composite, abstract, landmark or `null`
 * @method getRoleType
 * @memberof axe.commons.aria
 * @instance
 * @param {String|Null|Node|Element} role The role to check, or element to check the role of
 * @return {Mixed} String if a matching role and its type are found, otherwise `null`
 */
function getRoleType(role: any): string | null {
  if (role instanceof AbstractVirtualNode || isNode(role)) {
    role = axe.commons.aria.getRole(role);
  }
  const roleDef = standards.ariaRoles[role];
  return roleDef?.type || null;
}

export default getRoleType;
