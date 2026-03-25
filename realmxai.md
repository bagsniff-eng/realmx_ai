RealmxAI Node Platform – Product Requirements Document
Product overview

RealmxAI is an open‑source platform designed to enhance privacy on the Bitcoin blockchain by letting users participate in privacy‑preserving transactions through a shared node. It provides a real‑time web interface built with Node.js and Express where users connect their crypto wallet, authenticate with a Google account, start “mining” sessions to earn points and refer friends. The platform must strike a balance between ease of use, legal compliance and robust security because Bitcoin is pseudonymous rather than anonymous — once an address is linked to a user, the entire transaction history becomes public. The product therefore prioritizes transparent messaging, minimising data collection and implementing privacy best practices.

Problem statement
Privacy leakage on the Bitcoin blockchain. Even though users expect anonymity, blockchain transactions are publicly visible and once linked to an identity can reveal a user’s entire history.
High barrier to participating in privacy techniques. Techniques like address reuse avoidance and CoinJoin require technical knowledge and tools.
Fragmented user experience. Many existing privacy tools are command‑line or desktop‑based. There is no single, user‑friendly platform to coordinate participation and reward users fairly.
Goals and objectives
Provide a web‑based entry point for privacy‑enhancing participation in Bitcoin transactions.
Ensure all user data (wallet addresses, Google IDs, session logs) is handled securely: encrypt traffic with TLS, validate and sanitize inputs, and limit abusive requests.
Offer real‑time dashboards and logs using secure WebSockets (via Socket.IO) with wss://.
Require dual authentication (wallet connect + Google sign‑in) to activate mining, ensuring user accountability.
Implement a referral program to reward user growth, generating unique codes and preventing duplicate rewards.
Provide an admin panel with role‑based access control to monitor sessions, users and referrals.
Build trust through clear privacy messaging and fair rewards, encouraging ethical adoption.
Target users and personas
Privacy‑conscious cryptocurrency users: individuals who value anonymity and are aware that Bitcoin transactions are publicly visible.
Crypto novices seeking simple tools: users who want to experiment with privacy technologies but find existing tools complex.
Influencers/community builders: users with large networks who are motivated by referral rewards and community participation.
Administrators/analysts: team members who need to monitor the platform, enforce rules and detect abuse.
User needs and jobs to be done
As a new user, I need to connect my wallet and verify my identity (via Google) so that I can start mining and earn points.
As a participant, I want to see real‑time updates on my session duration, points earned and referral statistics.
As a referrer, I need a unique code to share and an easy way to track the rewards from successful referrals.
As an administrator, I must be able to review user activity, detect suspicious sign‑ups and adjust rewards or disable accounts if needed.
As a privacy‑conscious user, I want reassurance that my data (wallet address, IP) is handled securely and that the service does not collect unnecessary personal information.
Solution overview

RealmxAI will be delivered as a single‑page web application (SPA) with a Node.js/Express backend. The front‑end will call REST and WebSocket endpoints to fetch and display data. Back‑end modules will handle authentication, real‑time sessions, referral logic and admin tasks. A PostgreSQL or MongoDB database will persist user profiles, referral codes, session logs and admin actions. Core infrastructure and open‑source tools are selected to minimise cost and maintain transparency.

Features and requirements
Real‑time dashboard
Provide a dashboard showing the number of users online, active session duration, total points and referral statistics.
Use Socket.IO to push updates to the client; ensure secure connections (wss://) and validate origin headers.
Limit message size and rate to prevent DoS; implement token‑based authentication in the WebSocket handshake.
Authentication & user accounts
Wallet authentication: integrate WalletConnect or MetaMask. Require the user to sign a “Sign‑In with Ethereum” (or BTC) message; verify the signature server‑side to confirm ownership.
Google sign‑in: use Passport.js with the Google OAuth strategy. Users must link both a wallet and Google account to activate mining.
Store Google IDs, wallet addresses and referral codes in the database. Ensure unique constraints to prevent duplicate accounts. Use environment variables to store OAuth credentials.
Referral program
Generate a unique referral code (via uuid) when a user signs up.
On registration, check for a valid referral code and update the referredBy field; credit the referrer with points/rewards.
Prevent abuse by verifying that the referred wallet and Google account are not already registered; monitor IP/device fingerprinting to detect duplicate sign‑ups.
Display referral status and earned rewards in the user dashboard; allow users to copy/share their code easily.
Admin panel
Integrate AdminJS for an internal admin route. The panel provides CRUD access to Users, Sessions, Referrals and Rewards and supports role‑based access control.
Only admin accounts with proper credentials can access this panel. Add multi‑factor authentication (e.g., OTP) for extra security.
Provide analytics: total users, daily active users, number of active sessions, number of referrals, flagged accounts and actions log.
Data management
Use PostgreSQL (through Supabase) or MongoDB (via MongoDB Atlas) free tiers to store persistent data. Define tables/collections for Users, NodeSessions, Referrals, AdminUsers, Rewards and AuditLogs.
Use an ORM/ODM (e.g., Prisma, TypeORM or Mongoose) to abstract database interactions and enforce validation.
Encrypt sensitive fields (e.g., Google refresh tokens, user settings) and store session tokens securely (e.g., JWT in HTTP‑only cookies).
Logging & monitoring
Use morgan for HTTP request logging and pino or winston for structured application logs. Configure log rotation and remote storage.
Use pm2 or forever for process management and clustering. Optionally integrate a free monitoring stack (Prometheus + Grafana) or SaaS like BetterStack to track uptime and performance.
Emit events to the Socket.IO Admin UI to monitor connected clients and rooms.
Security and privacy compliance
Enforce TLS across all endpoints (HTTP and WebSocket). Obtain certificates via Let’s Encrypt.
Apply Helmet to set security headers and disable X‑Powered‑By.
Rate‑limit requests using express-rate-limit to mitigate DoS and brute force.
Validate and sanitize all inputs using express-validator and sanitize libraries. Ensure that WebSocket messages are validated to prevent injection attacks.
Store secrets in environment variables. Use bcrypt to hash admin passwords. Implement two‑factor authentication for admin login.
Provide a clear privacy policy explaining what data is collected, how it is used and users’ rights to access or delete their data. Emphasize that Bitcoin transactions are pseudonymous, not anonymous.
Social promotion & community
Develop a content plan for platforms such as X (Twitter), LinkedIn, Telegram and Discord to explain Bitcoin privacy and RealmxAI’s mission. Use shareable infographics and short videos.
Encourage users to share their referral codes; host AMA sessions and community events. Use free scheduling tools (e.g., Buffer or Hootsuite) to post regularly.
Educate the community on responsible use of privacy tools, emphasising that the platform does not encourage illegal activities.
Non‑functional requirements
Security: The system must protect all communications with TLS, prevent injection attacks, and limit request rates.
Reliability: The platform should handle at least 1 000 concurrent users with no downtime. Implement health checks and auto‑restart services on crash.
Scalability: Use horizontal scaling and database connection pooling to handle growth. Socket.IO rooms should be distributed across nodes (e.g., with Redis adapter).
Performance: Web pages should load within 2 seconds on 4G networks. Use caching for frequently accessed data and lazy load heavy components.
Compliance: Comply with GDPR/Indian data protection laws. Provide mechanisms for data export and account deletion.
Success metrics
User growth: Number of new registrations per month, growth in referral sign‑ups.
Engagement: Average session duration, number of active node sessions per day.
Security incidents: Number of blocked attacks (rate‑limited requests, rejected invalid WebSocket connections), time to patch vulnerabilities.
Retention: Percentage of users returning weekly or monthly.
Satisfaction: User feedback scores or Net Promoter Score (NPS) from surveys.
Assumptions and out‑of‑scope items
The platform operates on top of the Bitcoin network but does not provide built‑in CoinJoin or zero‑knowledge transaction protocols; it coordinates external services. Integrating on‑chain privacy protocols is out of scope for the MVP.
Users are responsible for complying with their local regulations. The platform provides educational material but does not provide legal advice.
Mobile applications (iOS/Android) are not included in the initial release; the project focuses on a responsive web interface.
Handling fiat payments or token sales is out of scope; the platform offers non‑monetary points/rewards only.
Next steps and timeline
Research & design (2 weeks): Finalise data models, wireframes and user flows. Draft privacy policy and terms.
MVP development (4 weeks): Set up Express server, database, authentication, and real‑time dashboard. Implement referral logic and admin panel.
Testing & hardening (2 weeks): Perform security audits, load tests and user acceptance testing. Integrate rate limiting, input validation and TLS configuration.
Launch & promotion (1 week): Deploy on a free tier (e.g., Render or Supabase), announce on social channels and onboard early users. Monitor logs and user feedback.

This product requirements document outlines the vision, scope, features, and technical requirements for the RealmxAI platform. It aligns user needs with a secure, real‑time architecture built on proven open‑source tools and emphasises privacy compliance and community building.