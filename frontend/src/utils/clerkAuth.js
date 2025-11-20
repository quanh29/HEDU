/**
 * Get authentication token from Clerk using useAuth hook
 * Note: This function should be called from within a component that has access to Clerk context
 * @param {Function} getToken - getToken function from useAuth() hook
 * @returns {Promise<string|null>} JWT token or null
 */
export const getClerkTokenFromHook = async (getToken) => {
    try {
        if (!getToken) {
            console.warn('getToken function not provided');
            return null;
        }

        const token = await getToken();
        return token;
    } catch (error) {
        console.error('Error getting Clerk token from hook:', error);
        return null;
    }
};

/**
 * Wait for Clerk to be loaded
 * @param {number} timeout - Maximum wait time in milliseconds
 * @returns {Promise<boolean>}
 */
const waitForClerk = async (timeout = 5000) => {
    const startTime = Date.now();
    
    while (!window.Clerk) {
        if (Date.now() - startTime > timeout) {
            console.error('Clerk loading timeout');
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return true;
};

/**
 * Get authentication token from Clerk (fallback method using window.Clerk)
 * @returns {Promise<string|null>} JWT token or null
 */
export const getClerkToken = async () => {
    try {
        // Wait for Clerk to load
        const isLoaded = await waitForClerk();
        if (!isLoaded) {
            console.warn('Clerk failed to load');
            return null;
        }

        // Get session token
        const session = window.Clerk.session;
        if (!session) {
            console.warn('No active Clerk session');
            return null;
        }

        const token = await session.getToken();
        return token;
    } catch (error) {
        console.error('Error getting Clerk token:', error);
        return null;
    }
};

/**
 * Create axios config with Clerk authentication (using hook method)
 * @param {Function} getToken - getToken function from useAuth() hook
 * @returns {Promise<Object>} Axios config object with auth header
 */
export const getAuthConfigFromHook = async (getToken) => {
    const token = await getClerkTokenFromHook(getToken);
    
    if (!token) {
        return {};
    }

    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

/**
 * Create axios config with Clerk authentication
 * @returns {Promise<Object>} Axios config object with auth header
 */
export const getAuthConfig = async () => {
    const token = await getClerkToken();
    
    if (!token) {
        return {};
    }

    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};
