export const API_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_SERVER_ERROR: 500,
};

export const API_ERRORS = {
    MISSING_PARAMS: "Missing required parameters (shop, productId)",
    INVALID_METHOD: "Method not allowed",
    INTERNAL_ERROR: "Internal server error processing request",
    DB_CONNECTION_ERROR: "Database connection failed",
};
