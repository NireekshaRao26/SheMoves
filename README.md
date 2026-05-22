# Intelligent Document Assistant (OCR & Roadmap)

An AI-powered platform designed to streamline documentation updates for Indian government identifiers (Aadhaar, PAN). This project leverages OCR to extract user data, generates personalized document update roadmaps using Google Gemini, and provides automated form-filling capabilities.

## 🚀 Key Features

- **Automated OCR Extraction**: 
  - Extracts text from Aadhaar and PAN cards.
  - Image preprocessing using `Sharp` (grayscale, normalization, resizing) for high accuracy.
  - Uses `Tesseract.js` for on-device/server-side text recognition.
- **AI-Powered Roadmap Generation**:
  - Dynamically generates a step-by-step guide for document updates (e.g., address change, name change).
  - Integrates **Google Gemini 1.5 Flash** for personalized advice.
  - Includes a robust **Local Fallback Engine** to ensure functionality even without internet/API access.
- **Form Automation**:
  - Features a browser automation service using `Puppeteer`.
  - Automatically populates forms with extracted user data to minimize manual entry.
- **Comprehensive User Dashboard**:
  - Secure JWT-based authentication.
  - Track document history and generated roadmaps.
  - Interactive questionnaire to determine life-event impact on documents.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **State/Routing**: React Router, Axios

### Backend
- **Server**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **AI/ML**: Google Generative AI (Gemini), Tesseract.js
- **Image Processing**: Sharp
- **Automation**: Puppeteer

---

## 📂 Project Structure

```text
├── backend/            # Express server, MongoDB models, OCR & AI services
├── frontend/           # React client application (Vite + Tailwind)
├── automation/         # Puppeteer-based browser automation service
└── data/               # (Internal) Roadmap rule definitions
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Google Gemini API Key

### 2. Quick Start (Backend + Automation)
If you have `concurrently` installed (included in backend dev dependencies), you can start both services from the backend folder:
```bash
cd backend
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Automation Service (Optional)
```bash
cd automation
npm install
node server.js
```

---

## 📋 Usage Flow

1. **Sign Up/Login**: Create a secure account.
2. **Upload Document**: Upload a clear image of your Aadhaar or PAN card.
3. **Extraction**: The system processes the image and extracts your current details.
4. **Questionnaire**: Answer a few questions about your relocation or name change needs.
5. **Get Roadmap**: Receive a detailed, AI-generated plan with official portal links.
6. **Auto-Fill**: Use the automation service to see how your data can be piped into official-style forms automatically.

---

## 🔐 Security & Privacy
- Documents are processed server-side; temporary processing files are deleted immediately after OCR.
- Passwords are hashed using `bcrypt`.
- Protected routes ensure user data privacy.

---


