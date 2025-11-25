export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
};

const trimTrailingSlash = (url?: string) =>
  url ? url.replace(/\/+$/, '') : undefined;

const fallbackUserService = 'http://user-service:3002';
const fallbackAuthService = 'http://auth-service:3001';

const resolvedUserServiceUrl =
  trimTrailingSlash(process.env.USER_SERVICE_URL) || fallbackUserService;
const resolvedAuthServiceUrl =
  trimTrailingSlash(process.env.AUTH_SERVICE_URL) || fallbackAuthService;

export const serviceConfig = {
  port: process.env.PORT || 3003,
  userServiceUrl: resolvedUserServiceUrl,
  authServiceUrl: resolvedAuthServiceUrl,
  userApiBase:
    trimTrailingSlash(process.env.USER_API_BASE_URL) || resolvedUserServiceUrl,
  authApiBase:
    trimTrailingSlash(process.env.AUTH_API_BASE_URL) || resolvedAuthServiceUrl,
};
