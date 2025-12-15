import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { config } from '../lib/env';
import { User } from '../types';
import { findUserByEmail, userStore } from '../data/store';

export interface TokenPayload {
  id: string;
  email: string;
  nickname: string;
}

export function generateToken(payload: TokenPayload) {
  return jwt.sign(payload as jwt.JwtPayload, config.jwtSecret as jwt.Secret, {
    expiresIn: config.tokenExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export async function registerUser(email: string, password: string, nickname: string) {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const id = uuid();
  const user: User = {
    id,
    email,
    passwordHash,
    nickname,
    createdAt: new Date().toISOString(),
  };
  userStore.set(id, user);
  return { id: user.id, email: user.email, nickname: user.nickname };
}

export async function loginUser(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({ id: user.id, email: user.email, nickname: user.nickname });
  return {
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname },
  };
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
