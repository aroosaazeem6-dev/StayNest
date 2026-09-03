export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  },
  refreshToken: {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET ?? 'staynest',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },
  api: {
    prefix: process.env.API_PREFIX ?? 'api/v1',
  },
});