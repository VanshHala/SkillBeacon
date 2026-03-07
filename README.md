# SkillBeacon

SkillBeacon is an AI-powered enterprise labor market intelligence platform. It provides real-time insights into the global skill economy, labor demand, and competitive benchmarking for technology roles. 

The platform is split into two layers:
- Enterprise L1: A high-level dashboard featuring Hiring Trends, Skills Intelligence, and AI Vulnerability Indexes sourced continuously from market demand.
- Worker L2: An individualized dashboard allowing users to track their personal displacement risk and explore adjacent career pivots based on their exact tech stack.

## Architecture

The system utilizes a split-stack architecture:
- Frontend: React built with Vite, utilizing Recharts for data visualization, Tailwind CSS for styling, and Clerk for authentication.
- Backend: Java Spring Boot application exposing RESTful APIs for analytics, market intelligence, live syncing, and generic workers endpoints.
- Database: PostgreSQL storing normalized job listings, scraped skills data, and analytics aggregates.

## Local Development

### Prerequisites
- Node.js (v18 or higher)
- Java Development Kit 17
- Maven
- PostgreSQL (Listening on port 5432)

### Setting up the Database
1. Create a PostgreSQL database named `skillbeacon`.
2. Configure your credentials inside `backend/src/main/resources/application.properties`.

### Running the Backend
1. Navigate to the `backend` directory.
2. Run `mvn spring-boot:run` to start the Tomcat server on port 8080.

### Running the Frontend
1. Navigate to the project root directory.
2. Install dependencies by running `npm install`.
3. Create a `.env.local` file and add your `VITE_CLERK_PUBLISHABLE_KEY`.
4. Run `npm run dev` to start the Vite server on port 5173.

## Deployment Notes
See the complete Deployment Guide for strict step-by-step instructions on hoisting the Frontend to Vercel, the Backend to Render, and the Database to Supabase.
