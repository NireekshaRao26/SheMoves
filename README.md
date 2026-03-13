# RelocateHer

RelocateHer is a full-stack web application designed to help women manage document updates when relocating to a new city or after marriage. It provides a customized relocation roadmap, document storage with OCR data extraction, and a demonstration of form auto-filling via Puppeteer.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, Axios
- **Backend**: Node.js, Express, MongoDB, Tesseract.js (OCR), JWT Auth
- **Automation**: Puppeteer, Express

## Project Structure
- `/frontend`: The React application
- `/backend`: The Express API and MongoDB models
- `/automation`: The Puppeteer script and dummy form server

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running locally on port 27017

### 1. Database Setup
Ensure MongoDB is running locally: `mongodb://127.0.0.1:27017`. The app will automatically create a database named `relocateher`.

### 2. Backend Setup
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### 3. Automation Setup
```bash
cd automation
npm install
npm start
# Server runs on http://localhost:5001
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

## Features Demo
1. **Signup/Login**: Create an account or log in.
2. **Smart Questionnaire**: Fill out the assessment to generate your personalized document update roadmap.
3. **Upload Document**: Upload an ID (like Aadhaar/PAN) to see Tesseract.js OCR extract the text automatically.
4. **Dashboard**: View your extracted documents, check off your roadmap tasks, and click **Auto-Fill** to see Puppeteer open a browser and automatically fill your details into a demo form!
