export const UserRolesEnum = {
    ADMIN: 'admin',
    LANDLORD: 'landlord',
    TENANT: 'tenant'
}

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
    TODO : 'to_do',
    IN_PROGRESS : 'in_progress',
    DONE : 'done'
}

export const AvailableTaskStatus = Object.values(TaskStatusEnum);