# Hosting and Deployment Guide

This guide provides step-by-step instructions to host the SkillBeacon application across Vercel (Frontend), Render (Backend), and Supabase (Database). Please avoid using emojis in commit messages or configurations per project rules.

## Step 1: Database Setup on Supabase

1. Navigate to Supabase (supabase.com) and create a new project.
2. Store the database password securely during creation.
3. Wait for the database to provision.
4. Go to the "SQL Editor" tab on the left sidebar.
5. Paste your local PostgreSQL schema (tables for Jobs, Users, etc.) and execute it to create the tables.
6. Go to "Project Settings" -> "Database". 
7. Scroll down to "Connection Parameters" and copy the "URI" or "JDBC Connection String". You will need this for the backend.

## Step 2: Backend Deployment on Render

1. Navigate to Render (render.com) and log in.
2. Click "New +" and select "Web Service".
3. Connect your GitHub account and select the `SkillBeacon` repository.
4. Define the following deployment configurations:
   - Name: `skillbeacon-backend`
   - Language: `Java`
   - Root Directory: `backend`
   - Build Command: `./mvnw clean package -DskipTests` (If the maven wrapper is missing, use `mvn clean package -DskipTests`)
   - Start Command: `java -jar target/*.jar`
5. Scroll down to "Environment Variables" and click "Add Environment Variable". Add the following:
   - `SPRING_DATASOURCE_URL`: The JDBC connection string from Supabase. (Ensure it starts with `jdbc:postgresql://`).
   - `SPRING_DATASOURCE_USERNAME`: `postgres` (or your Supabase DB username).
   - `SPRING_DATASOURCE_PASSWORD`: Your Supabase database password.
   - Any other API keys required by your Spring Boot application (e.g., Clerk Webhook Secrets).
6. Click "Create Web Service". Wait for the build and deployment process to finish.
7. Once deployed, copy the "onrender.com" URL provided at the top left of the dashboard.

## Step 3: Frontend Deployment on Vercel

1. Navigate to Vercel (vercel.com) and log in.
2. Click "Add New" -> "Project".
3. Import the `SkillBeacon` repository from your GitHub account.
4. Configure the project:
   - Project Name: `skillbeacon`
   - Framework Preset: `Vite`
   - Root Directory: `./` (Leave as default)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Expand the "Environment Variables" section and add:
   - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key.
   - `VITE_API_BASE_URL`: The Render Backend URL you copied in Step 2 (e.g., `https://skillbeacon-backend.onrender.com`).
6. Click "Deploy". 
7. Vercel will automatically build and publish your frontend.
8. (Note: You may need to go into your React codebase and update Axios or your API service files to use `import.meta.env.VITE_API_BASE_URL` instead of `localhost:8080`).

## Post-Deployment Checklist
- Ensure Clerk Dashboard has your new Vercel domains added to the allowed CORS origins.
- Update Backend CORS configuration (`WebMvcConfigurer`) to allow requests from the Vercel frontend URL.
