// USERE ENUMS
export const UserRolesEnum = {
    ADMIN: 'admin',
    LANDLORD: 'landlord',
    TENANT: 'tenant'
}
export const AvailableUserRoles = Object.values(UserRolesEnum);



// PROPERTY ENUMS
export const PropertyTypesEnum = {
    APPARTMENT : 'appartment',
    VILLA : 'villa',
    FLAT : 'flat',
    COMMERCIAL : 'commercial'
}
export const AvailablePropertyTypes = Object.values(PropertyTypesEnum);

export const PropertyStatusEnum = {
    VACANT: 'vacant',
    OCCUPIED: 'occupied',
    UNDER_MAINTENANCE: 'under_maintenance',
    INACTIVE : 'inactive', // When a landlord wants to pause listing it, or the admin hides it for rule violations or data issues.
}
export const AvailablePropertyStatus = Object.values(PropertyStatusEnum);

