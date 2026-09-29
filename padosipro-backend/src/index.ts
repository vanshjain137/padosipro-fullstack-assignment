import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import prisma from './db.js';
import { sendOTPEmail } from './email.js';
import jwt from 'jsonwebtoken';
import { seedTasks } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email is already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const otpHash = await bcrypt.hash(otp, 10);

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const otpCooldown = new Date(Date.now() + 30 * 1000);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        otpHash,
        otpExpiry,
        otpCooldown,
        otpAttempts: 0,
      },
    });

    await sendOTPEmail(email, otp);

    res.status(201).json({ 
      message: 'User registered! Please check your email for the OTP.', 
      email: newUser.email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    if (user.otpAttempts >= 5) {
      res.status(429).json({ error: 'Maximum verification attempts reached. Please request a new OTP.' });
      return;
    }

    if (!user.otpHash || !user.otpExpiry || user.otpExpiry < new Date()) {
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    const isMatch = await bcrypt.compare(otp, user.otpHash);

    if (!isMatch) {
      await prisma.user.update({
        where: { email },
        data: { otpAttempts: { increment: 1 } }
      });
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpHash: null,
        otpExpiry: null,
        otpAttempts: 0,
      },
    });

    res.status(200).json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Verify OTP server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ error: 'User is already verified' });
      return;
    }

    if (user.otpCooldown && user.otpCooldown > new Date()) {
      const waitTime = Math.ceil((user.otpCooldown.getTime() - Date.now()) / 1000);
      res.status(429).json({ error: `Please wait ${waitTime} seconds before requesting a new OTP.` });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const otpCooldown = new Date(Date.now() + 30 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        otpHash,
        otpExpiry,
        otpCooldown,
        otpAttempts: 0,
      },
    });

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'A new verification code has been sent to your email.' });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ error: 'Please verify your email before logging in.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '24h' });

    res.status(200).json({ 
      message: 'Login successful', 
      token,
      hasProfile: !!user.name
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Malformed token' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'fallback_secret';

  try {
    const decoded = jwt.verify(token, secret) as any;
    res.locals.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};

app.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { name, mobileNumber, address, businessName } = req.body;

    const mobileRegex = /^\+91\d{10}$/;
    if (!mobileNumber || !mobileRegex.test(mobileNumber)) {
      res.status(400).json({ error: 'Mobile number must be strictly +91 followed by 10 digits' });
      return;
    }

    if (!name || !address) {
      res.status(400).json({ error: 'Name and address are required' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        mobileNumber,
        address,
        businessName
      },
      select: { id: true, email: true, name: true, mobileNumber: true, address: true, businessName: true }
    });

    res.status(200).json({ 
      message: 'Profile updated successfully', 
      profile: updatedUser 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/user-tasks', authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds)) {
      res.status(400).json({ error: 'taskIds array is required' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        selectedTasks: {
          set: [],
          connect: taskIds.map((id: number) => ({ id })),
        }
      },
      include: {
        selectedTasks: true
      }
    });

    res.status(200).json({
      message: 'Tasks saved successfully',
      selectedTasks: updatedUser.selectedTasks
    });

  } catch (error) {
    console.error('Save tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/user-tasks', authenticate, async (req, res) => {
  try {
    const userId = res.locals.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { selectedTasks: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user.selectedTasks);
  } catch (error) {
    console.error('Fetch user tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    await seedTasks();
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;