# FLL Unearthed Dinos Team Website

A full-stack website for the FIRST Lego League team "Unearthed Dinos" built with React, Vite, and Express.js.

## 🚀 Features
- Team information and member profiles
- Project timeline and outreach activities  
- Interactive chatbot for team information
- Responsive design with Tailwind CSS
- Full-stack architecture with API backend

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js
- **APIs**: OpenAI (chatbot), Google Custom Search (web search)
- **Deployment**: Vercel-ready configuration

## 🏃‍♂️ Local Development

### Prerequisites
- Node.js 18+ 
- npm

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```
3. Copy `.env.example` to `.env` and configure your API keys (optional for basic functionality)
4. Start development servers:
   ```bash
   npm run dev:all
   ```
5. Open http://localhost:5173 in your browser

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose the project directory
   - Configure environment variables if needed

4. **Set Environment Variables** (optional, for chatbot features):
   - Go to your Vercel dashboard
   - Navigate to your project → Settings → Environment Variables
   - Add: `GOOGLE_CSE_KEY`, `GOOGLE_CSE_CX`, `OPENAI_API_KEY`

### Alternative Deployment Options

#### Netlify
1. Build: `npm run build`
2. Deploy `dist` folder to Netlify
3. Configure serverless functions for API routes

#### Railway/Render
1. Connect your GitHub repository  
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Configure environment variables

## 📁 Project Structure
```
├── src/                 # React frontend source
│   ├── components/      # Reusable components
│   ├── pages/          # Route components  
│   └── data/           # Static data
├── server/             # Express.js backend
├── public/             # Static assets
├── dist/               # Build output
└── vercel.json         # Vercel deployment config
```

## 🔧 Configuration

### Environment Variables
- `GOOGLE_CSE_KEY`: Google Custom Search API key
- `GOOGLE_CSE_CX`: Google CSE search engine ID  
- `OPENAI_API_KEY`: OpenAI API key for chatbot
- `PORT`: Server port (auto-configured in production)

### API Endpoints
- `/api/answer`: Chatbot query endpoint

## 📝 Scripts
- `npm run dev`: Start frontend development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run dev:all`: Start both frontend and backend
- `npm run vercel-build`: Build for Vercel deployment
