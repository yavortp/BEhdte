const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default API_BASE_URL;
export const getApiUrl = (endpoint: string): string => {

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (!API_BASE_URL || API_BASE_URL === '') {
        return cleanEndpoint;

    }

    return `${API_BASE_URL}${cleanEndpoint}`;
};
