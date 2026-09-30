# PadosiPro - Full-Stack Assignment

This repository contains the complete full-stack solution for the PadosiPro assignment, including a native Expo React Native mobile app and a Node/Express/Prisma backend.

## Prerequisites
- Node.js (v18+)
- Docker (for the PostgreSQL database and Mailpit local email catcher)
- Expo CLI (`npm install -g eas-cli`)

## Backend Setup

The backend utilizes PostgreSQL for data storage and Mailpit to trap outgoing OTP emails locally without requiring real SMTP credentials.

1. Navigate to the backend directory:
   ```bash
   cd padosipro-backend
   ```
2. Start the database and Mailpit via Docker:
   ```bash
   docker-compose up -d
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Setup environment variables:
   - Copy `.env.example` to `.env`
   - `cp .env.example .env`
5. Push the schema to the database (this also generates the Prisma client):
   ```bash
   npx prisma db push
   ```
6. Start the server (this automatically seeds the 20 tasks into the catalogue):
   ```bash
   npx tsx src/index.ts
   ```

**Testing OTP Emails:**
OTP emails are caught by the local Mailpit instance. Once the backend is running and you request an OTP in the app, open `http://localhost:8025` in your browser to view the email and retrieve the 6-digit code.

**Running Automated Tests:**
The backend includes a Jest testing suite covering the risky logic (OTP generation, expiry, attempt limits, and login rules).
```bash
npm test
```

## Mobile App Setup

The mobile application is built natively using React Native and Expo. 

1. Navigate to the mobile directory:
   ```bash
   cd padosipro-mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start -c
   ```

## Building the APK

To compile the standalone Android APK using EAS (Expo Application Services):

1. Ensure you are logged into your Expo account (`eas login`).
2. Run the build command from inside the `padosipro-mobile` folder:
   ```bash
   eas build -p android --profile preview
   ```
3. Once the build finishes, EAS will provide a direct link to download the `.apk` file.