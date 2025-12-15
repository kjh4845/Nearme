import { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/authService';

export async function register(req: Request, res: Response) {
  const { email, password, nickname } = req.body || {};
  if (!email || !password || !nickname) {
    return res.status(400).json({ message: 'email, password, nickname are required' });
  }
  try {
    const user = await registerUser(email, password, nickname);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }
  try {
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
}
