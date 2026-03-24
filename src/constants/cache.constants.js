export const cacheKeys = {
    TENANT: (id) => `tenant:${id}`,
    LANDLORD: (id) => `landlord:${id}`,
    PROPERTY: (id) => `property:${id}`,
};
export const cacheKeysEnum  = Object.values(cacheKeys);

export const cacheTTL = {
    TENANT_TTL: 3600, // 1 hour
    LANDLORD_TTL: 3600, // 1 hour
    PROPERTY_TTL: 3600, // 1 hour
};
export const cacheTTLEnum = Object.values(cacheTTL);