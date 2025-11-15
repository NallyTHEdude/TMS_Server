export const UserRolesEnum = {
    ADMIN: 'admin',
    PROJECT_ADMIN: 'project_admin',
    MEMBER: 'member'
}
export const AvailableUserRoles = Object.values(UserRolesEnum);


export const TaskStatusEnum = {
    TODO : 'to_do',
    IN_PROGRESS : 'in_progress',
    DONE : 'done'
}
export const AvailableTaskStatus = Object.values(TaskStatusEnum);


//   enum: ["vacant", "occupied", "under-maintenance", "inactive"],
export const PropertyStatusEnum = {
    VACANT: 'vacant',
    OCCUPIED: 'occupied',
    UNDER_MAINTENANCE: 'under_maintenance',
    INACTIVE: 'inactive'
}
export const AvailablePropertyStatus = Object.values(PropertyStatusEnum);


// enum: ["apartment", "villa", "flat", "commercial"],
export const PropertyTypesEnum = {
    APARTMENT: 'apartment',
    VILLA: 'villa',
    FLAT: 'flat',
    COMMERCIAL: 'commercial'
}
export const AvailablePropertyTypes = Object.values(PropertyTypesEnum);