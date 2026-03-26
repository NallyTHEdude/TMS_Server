export const CacheEntities = {
    TENANT: `tenant`,
    LANDLORD: `landlord`,
    PROPERTY: `property`,
};
export const CacheEntitiesEnum = Object.values(CacheEntities);

export const CacheTTL = {
    TENANT_TTL: 3600, // 1 hour
    LANDLORD_TTL: 3600, // 1 hour
    PROPERTY_TTL: 3600, // 1 hour
};
export const CacheTTLEnum = Object.values(CacheTTL);

export const CacheIdentifiers = {
    KYC: (id) => `kyc:${id}`,
    GET_ALL_PROPERTIES: (id) => `getAllProperties:${id}`,
    GET_ONE_PROPERTY: (id) => `getOneProperty:${id}`,
    GET_ALL_TENANTS: (id) => `getAllTenants:${id}`,
    GET_ONE_TENANT: (id) => `getOneTenant:${id}`,
    GET_ALL_LANDLORDS: (id) => `getAllLandlords:${id}`,
    GET_ONE_LANDLORD: (id) => `getOneLandlord:${id}`,
    GET_ACTIVE_TENANTS_BY_PROPERTY: (id) => `getActiveTenantsByProperty:${id}`,
    GET_ALL_TENANTS_OF_PROPERTY: (id) => `getAllTenantsOfProperty:${id}`,
};
export const CacheIdentifiersEnum = Object.values(CacheIdentifiers);
