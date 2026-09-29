# DESIGN.md

## Architecture Overview

The system is designed as a decoupled, modern full-stack application separating the client interface from the business logic, ensuring scalability and maintainability.

**Backend (Node.js / Express / TypeScript):**
- **Language & Runtime:** Built with Node.js and TypeScript (configured with ES Modules) to enforce strict typing and prevent runtime errors.
- **Database ORM:** Prisma is used for database interactions. It provides a type-safe database client and manages PostgreSQL migrations deterministically.
- **Security & Authentication:** Passwords and OTPs are strictly hashed using `bcrypt`. Authentication is handled statelessly via JWTs, reducing database load on protected routes.
- **Environment:** Docker Compose is utilized to spin up PostgreSQL and Mailpit (a local SMTP catcher), ensuring the environment is perfectly reproducible across different machines with a single command.

**Mobile App (React Native / Expo):**
- **Framework:** Expo was chosen to streamline native module compilation and manage the React Native build process cleanly.
- **Navigation:** React Navigation (Native Stack) manages the routing, strictly ensuring unauthenticated users cannot access protected screens and avoiding dead-ends through logical stack resets.
- **State & Storage:** `expo-secure-store` is used to persist the JWT safely on the device keychain/keystore. Local component state manages UI logic without over-engineering with global state managers.
- **API Communication:** Axios is configured with an interceptor to automatically attach the JWT to all outgoing requests.

## Main Trade-offs

1. **Making "Business Name" Optional:** The prompt notes that PadosiPro serves households ("a household tells us what it needs"). Because the primary target audience is residential users requesting personal errands (e.g., groceries, home maintenance), forcing every user to input a "Business Name" would create significant friction and drop-off during onboarding. I made this optional to prioritize the B2C user experience.
2. **Mailpit vs. Live SMTP:** Rather than hardcoding real SendGrid or Gmail credentials (which risks exposing secrets or hitting spam limits during review), I integrated Mailpit via Docker. This perfectly simulates real SMTP email dispatching while keeping the review process entirely self-contained.
3. **Stateless JWT vs. Stateful Sessions:** I opted for a 24-hour stateless JWT over Redis/database-backed sessions. While stateful sessions offer immediate revocation, JWTs drastically reduce database reads on every single API call, which is highly preferable for a mobile API gateway.

## What Was Left Out

1. **Global State Management:** Libraries like Redux or Zustand were omitted. Given the focused scope of the assignment, introducing global state would be over-engineering. React's local state and context were sufficient.
2. **Refresh Tokens:** The current system uses a single 24-hour JWT. In a production environment, a short-lived access token combined with a long-lived HTTP-only refresh token is necessary for optimal security.
3. **Infrastructure Rate Limiting:** The OTP 5-attempt limit and 30-second cooldown are handled successfully at the database level. However, DDoS protection or IP-based rate limiting (via Nginx or Redis) was left out to keep the local setup simple.

## What I Would Do Next (With Another Week)

1. **End-to-End (E2E) Testing:** While the risky backend logic is unit-tested with Jest, I would implement Detox or Maestro to write automated E2E tests for the mobile app, ensuring the physical UI flows (Register -> OTP -> Profile -> Select Tasks) never regress.
2. **Robust CI/CD Pipeline:** I would set up GitHub Actions to automatically run the Jest tests, linting, and type-checking on every pull request, and configure it to trigger EAS Preview builds automatically upon merging to the main branch.
3. **UI/UX Polish & Accessibility:** I would implement a proper design system (or a UI library like Restyle/Tamagui) to standardize spacing, typography, and colors. I would also conduct a full accessibility (a11y) audit, adding screen-reader labels and dynamic type support for visually impaired users.
4. **Advanced Backend Caching:** I would introduce Redis to handle the OTP cooldowns and attempt tracking in memory, rather than hitting the PostgreSQL database for temporary verification states.