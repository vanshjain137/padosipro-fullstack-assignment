import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import prisma from '../db.js';
import bcrypt from 'bcrypt';

// Mock the email service so we don't send real emails during tests
jest.mock('../email.js', () => ({
  sendOTPEmail: jest.fn(),
}));

describe('Authentication & OTP Risky Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Prisma spies to safely intercept DB calls
    jest.spyOn(prisma.user, 'findUnique').mockReset();
    jest.spyOn(prisma.user, 'update').mockReset();
  });

  it('1. Rejects login if the user is unverified', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      isVerified: false,
    } as any);

    const response = await request(app)
      .post('/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Please verify your email before logging in.');
  });

  it('2. Blocks verification if 5 wrong attempts have been made', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      email: 'test@example.com',
      otpHash: 'some_hash',
      otpExpiry: new Date(Date.now() + 10000), 
      otpAttempts: 5, 
    } as any);

    const response = await request(app)
      .post('/verify-otp')
      .send({ email: 'test@example.com', otp: '123456' });

    expect(response.status).toBe(429);
    expect(response.body.error).toContain('Maximum verification attempts reached');
  });

  it('3. Rejects an expired OTP', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      email: 'test@example.com',
      otpHash: 'some_hash',
      otpExpiry: new Date(Date.now() - 5 * 60 * 1000), // Past date
      otpAttempts: 0,
    } as any);

    const response = await request(app)
      .post('/verify-otp')
      .send({ email: 'test@example.com', otp: '123456' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('OTP has expired. Please request a new one.');
  });

  it('4. Increments the attempt counter on a wrong OTP', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      email: 'test@example.com',
      otpHash: 'valid_hash',
      otpExpiry: new Date(Date.now() + 10000),
      otpAttempts: 1,
    } as any);
    
    // Mock the update function to prevent real DB writes
    jest.spyOn(prisma.user, 'update').mockResolvedValue({} as any);
    // Force bcrypt to return false (wrong password)
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false) as any);

    const response = await request(app)
      .post('/verify-otp')
      .send({ email: 'test@example.com', otp: '999999' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid OTP');
    
    // Verify the attempt counter was properly incremented
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      data: { otpAttempts: { increment: 1 } },
    });
  });
});