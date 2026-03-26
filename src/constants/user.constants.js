export const UserRolesEnum = {
    ADMIN: 'admin',
    LANDLORD: 'landlord',
    TENANT: 'tenant',
};
export const AvailableUserRoles = Object.values(UserRolesEnum);

export const PluralUserRolesEnum = {
    LANDLORDS: 'landlords',
    TENANTS: 'tenants',
    ADMINS: 'admins',
};
export const AvailablePluralUserRoles = Object.values(PluralUserRolesEnum);
