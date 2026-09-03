import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().optional(),
  REDIS_URL: Joi.string().uri().optional(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().integer().min(8).max(15).default(12),
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  MINIO_ENDPOINT: Joi.string().uri().allow('').optional(),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_ACCESS_KEY: Joi.string().allow('').optional(),
  MINIO_SECRET_KEY: Joi.string().allow('').optional(),
  MINIO_BUCKET: Joi.string().default('staynest'),
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  CORS_ORIGIN: Joi.string().default('*'),
  API_PREFIX: Joi.string().default('api/v1'),
});