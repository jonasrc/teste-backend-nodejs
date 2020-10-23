export const ROLES = {
    ROLE_ADMIN: 'admin',
    ROLE_USER: 'user'
};

export function verify(role: string) {
    return role === ROLES.ROLE_USER || role === ROLES.ROLE_ADMIN;
}

module.exports = {
    roles: ROLES,
    verify: verify
};