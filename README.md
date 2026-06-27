# Urban Twin AI
> An AI-powered Intelligent Digital Twin for Smarter Cities.  
> **Google Developer Groups AI Hackathon MVP**

---

## 🌐 Overview
**Urban Twin AI** is a next-generation Smart City operating system that creates a living, predictive digital representation of a city's core infrastructure. 

Unlike traditional, siloed public reporting databases which merely record complaints as static rows in a spreadsheet, Urban Twin AI dynamically processes citizen-generated submissions (e.g., potholes, drainage blockages, broken streetlights, water mains ruptures) to continually evaluate a real-time **City Health Index**.

---

## 🎯 Problem Statement
Municipal administrations suffer from:
1. **Backlog Overload**: Sorting hundreds of raw public complaints manually leads to severe response delays.
2. **Subjective Prioritization**: Standard forms fail to weigh public safety risks, environmental impact, or infrastructure urgency in a multi-faceted manner.
3. **Low Strategic Visibility**: Administrators cannot see how individual, active incidents degrade overall and category-specific urban health over time.

## 💡 The Solution
Urban Twin AI bridges the gap between citizens and public planners by acting as an **Intelligent Twin**:
- **AI Infrastructure Inspector**: Automatically analyzes submitted photos via **Gemini Vision** to diagnose dimensions of damage, risks, recommended department dispatches, and emergency urgencies.
- **Continuous City Health Engine**: Recalculates Road, Drainage, Waste, Streetlighting, and Water division metrics instantly on every report submission or resolution.
- **Digital Twin Timeline Replay**: Replays daily/weekly city evolution, demonstrating exactly how historical crises arose and how active repairs healed the municipal grid.
- **AI City Analyst Chat**: Synthesizes structured statistics and provides policy guidance directly to planners on tomorrow's maintenance schedules.

---

## 🏗️ Technical Architecture
The application is architected as a robust, **production-ready full-stack application**:

```
                              [ React Frontend SPA (Vite) ]
                                    /              \
                                   /                \  (AI Proxy Routes)
                             (Direct Sync)           \
                                 /                    \
              [ Firebase Firestore Cloud DB ]     [ Node/Express Backend Server ]
                     (Auth & Persistence)                     |
                                                              |  (@google/genai)
                                                              v
                                                    [ Google Gemini API ]
                                                   (gemini-2.5-flash Model)
```

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts.
- **Backend Proxy**: Express server with Vite middleware integration. Serves the SPA in production and proxies critical AI credentials.
- **Database**: Cloud Firebase Firestore & Authentication (Anonymous session login). Includes a **Local Database Fallback** system using `localStorage` to allow 100% stable sandbox demo capability with pre-loaded mock seeds out-of-the-box.
- **AI Core**: Google Gemini 2.5 Flash used for structured vision audits, intelligent conversational query assistance, and digital twin narration.

---

## 📂 Folder Structure
```
├── /assets                   # Static graphic elements
├── /server.ts                # Express entry point & proxy routes
├── /metadata.json            # Application metadata and frame permissions
├── /package.json             # NPM dependencies & production scripts
├── /tsconfig.json            # TypeScript compile configurations
├── /vite.config.ts           # Vite Bundling config with reverse-proxy bindings
└── /src                      # React Application Root
    ├── /components           # Scaffolding: Layout, responsive nav-frames
    ├── /context              # Theme contexts (High-tech Dark Mode)
    ├── /firebase             # Client Firebase config & hooks
    ├── /pages                # Consolidated main view screens:
    │   ├── LandingPage.tsx   # Marketing & feature walkthrough
    │   ├── DashboardPage.tsx # Live KPI widgets and workload charts
    │   ├── ReportIssuePage.tsx # Camera & file upload with Gemini Vision
    │   ├── MapViewPage.tsx   # Dual-mode (SVG Vector Grid & Google Maps) Map
    │   ├── CityTimelinePage.tsx # Scrubber controller with animated metrics
    │   ├── AIAnalystPage.tsx # Conversations with natural language helper
    │   ├── AIInsightsPage.tsx # Bento strategic advisories
    │   └── MunicipalReportPage.tsx # Clean printable briefing sheets
    └── /services
        ├── db.service.ts     # Health Engine & Firestore/Local db managers
        └── seed-data.ts      # Multi-category 7-day historical database seeds
```

---

## 🛠️ Installation & Setup

### 1. Prerequisite Packages
Verify that Node.js (v18+) is active. Clone this project and install dependencies:
```bash
npm install
```

### 2. Environment Configurations
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Google Gemini Key (Kept secure server-side, never leaked to the browser)
GEMINI_API_KEY="AIzaSyYourActualKeyHere..."

# Google Maps Javascript SDK Key (Optional, fallback vector map active if empty)
VITE_GOOGLE_MAPS_API_KEY="AIzaSyYourMapsKey..."

# Firebase Client Configuration (Optional, fallback Local Database active if empty)
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_APP_ID="1:xxxx"
```

---

## 🚀 Running Locally

Launch the Express + Vite full-stack developer server:
```bash
npm run dev
```
The server will boot and bind to `http://localhost:3000`. Open this in your browser. 

---

## 🧪 Detailed Feature Walkthrough

### 1. AI Image Analysis Engine (Gemini Vision)
In the **Report Issue** tab:
1. Drag and drop any image (or select from our built-in **Pothole, Flood, or Garbage** testing sample buttons).
2. The server-side Gemini Vision models instantly audit the picture under this JSON schema:
   ```json
   {
     "issueType": "pothole | flooding | illegal_dumping | ...",
     "severity": "low | medium | high | critical",
     "description": "text summary",
     "publicSafetyRisk": "threat metrics to cars or walkers",
     "environmentalImpact": "contaminants analysis",
     "recommendedAction": "engineering resolution guidance",
     "estimatedRepairUrgency": "24 hours | 7 days | ...",
     "priorityScore": 84,
     "suggestedDepartment": "roads department | drainage department | ..."
   }
   ```
3. Forms are automatically pre-populated with precise parameters in front of your eyes!

### 2. City Health Engine
The system uses a mathematical impact-deduction model to calculate active category health percentages. Base health is set at **95%**. Each active (unresolved) incident subtracts points based on its severity:
- `Low` severity: `-3%`
- `Medium` severity: `-7%`
- `High` severity: `-12%`
- `Critical` severity: `-20%`

*Example*: If two critical sewer floods are reported, **Drainage Health** drops from $95\%$ to $55\%$. Once a worker clicks **Resolve**, the $40\%$ penalty is completely alleviated, restoring Drainage Health back to $95\%$ instantly.

### 3. Digital Twin Timeline Replay
Click **Play** on the timeline controller:
- The playback engine sweeps from **Day 1 to Day 7**.
- Observe map markers appearing, pulsing, changing status, and disappearing in real-time.
- Health KPIs animate their values dynamically, synchronized with a vertical reference scrubber on the Recharts graph.
- **Digital Twin Narration**: Gemini creates human-grade daily reports detailing exactly how localized events shifted municipal parameters.

---

## ☁️ Deployment Guides

### Deploy to Google Cloud Run (Docker Containers)
Our full-stack setup is immediately optimized for single-container Dockerization.
Create a basic `Dockerfile` in the root:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
Build and deploy:
```bash
gcloud run deploy urban-twin-ai --source . --port 3000 --allow-unauthenticated --region us-central1
```

### Deploy to Firebase Hosting & Cloud Functions
If you wish to host the static assets on Firebase Hosting and route `/api/*` requests through Cloud Functions:
1. Initialize Firebase:
   ```bash
   firebase init
   ```
2. Set public folder to `dist`.
3. In `firebase.json`, configure rewrites:
   ```json
   {
     "hosting": {
       "public": "dist",
       "rewrites": [
         {
           "source": "/api/**",
           "function": "api"
         },
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

---

## 🏆 GDG Hackathon Showcase Value
- **No Cold Start limits**: Local storage integration ensures judges see a beautifully populated active city even without cloud configuration.
- **Multimodal AI Integration**: Implements both Vision and Chat interactions within unified server-side proxy boundaries.
- **Print Friendly**: Accessible Municipal Report layout automatically formats into crisp black-and-white printheets.
- **Dynamic UX**: Interactive vector maps feel futuristic, fluid, and customized compared to default out-of-the-box satellite frames.
