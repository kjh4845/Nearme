import dotenv from 'dotenv';

dotenv.config();

const required = ['ES_NODE_URL', 'JWT_SECRET'] as const;

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
});

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  esNode: process.env.ES_NODE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  tokenExpiresIn: process.env.TOKEN_EXPIRES_IN || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
};
