# AI Code Review Platform - Phase 1

A production-grade AI-powered code review platform built with Next.js, TypeScript, MongoDB, and Google Gemini AI.

## 🚀 Features

- **Code Submission**: Submit code snippets in multiple programming languages
- **AI Analysis**: Automatic code analysis using Google Gemini AI
- **Comprehensive Feedback**:
  - Bug detection
  - Performance optimization suggestions
  - Security vulnerability checks
  - Best practices recommendations
  - Architecture improvements
- **Real-time Updates**: Live status updates while AI analyzes code
- **History**: View and revisit past code reviews
- **Modern UI**: Clean, responsive interface with TailwindCSS

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes (Node.js)
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini API

## 📁 Project Structure

```
ai-code-reviewer/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Endpoints
│   │   │   └── code/          # Code submission routes
│   │   ├── page.tsx           # Main page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── SubmissionForm.tsx
│   │   └── ReviewResults.tsx
│   ├── config/               # Environment config
│   ├── lib/                  # Utilities
│   │   ├── db.ts            # Database connection
│   │   └── gemini.ts        # AI integration
│   ├── models/              # Mongoose models
│   └── types/               # TypeScript types
├── .env.local               # Environment variables
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas URI
- Google Gemini API key

### Installation

1. **Navigate to project directory**
```bash
cd ai-code-reviewer
```

2. **Install dependencies** (already done)
```bash
npm install
```

3. **Configure environment variables**

Edit `.env.local` file:
```env
MONGODB_URI=mongodb://localhost:27017/ai-code-reviewer
GEMINI_API_KEY=your_actual_gemini_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get your Gemini API key:**
- Visit: https://makersuite.google.com/app/apikey
- Create a free API key

4. **Start MongoDB** (if running locally)
```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# Or run mongod manually
mongod --dbpath C:\data\db
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to http://localhost:3000

## 📡 API Endpoints

### POST /api/code
Submit code for review

**Request Body:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript",
  "filename": "example.js"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "code": "...",
    "status": "processing",
    ...
  }
}
```

### GET /api/code
Get all submissions (limited to 50 most recent)

### GET /api/code/:id
Get specific submission by ID

### DELETE /api/code/:id
Delete a submission

## 🔄 Data Flow

1. User submits code via form
2. Frontend calls `POST /api/code`
3. Backend creates MongoDB document with status "pending"
4. Status updated to "processing"
5. AI analyzes code asynchronously
6. Results saved to MongoDB
7. Status updated to "completed"
8. Frontend polls and displays results

## 🧪 Testing the Application

1. **Ensure MongoDB is running**
2. **Add your Gemini API key** to `.env.local`
3. **Start the dev server**: `npm run dev`
4. **Submit test code**:
   - Go to http://localhost:3000
   - Select language (e.g., JavaScript)
   - Paste code snippet
   - Click "Submit for Review"
5. **Wait for analysis** (5-15 seconds)
6. **View results** displayed on the right

## 🎨 UI Features

- Dark mode support
- Responsive design
- Real-time status updates
- Color-coded feedback categories
- Progress indicators
- Recent submissions list

## 📝 Supported Languages

- JavaScript
- TypeScript
- Python
- Java
- C++
- C#
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- Other

## 🔧 Development Commands

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env.local

**Gemini API Error:**
- Verify API key is correct
- Check API quota limits
- Ensure internet connection

**TypeScript Errors:**
- These are normal during development
- They resolve on build
- Run `npm run build` to verify

## 📊 What's Next?

Phase 1 is complete! The platform now supports:
✅ Code submission
✅ AI-powered analysis
✅ Storing reviews
✅ Viewing previous reviews
✅ Modern UI with TailwindCSS

Ready for Phase 2 enhancements when you are!

## 📄 License

MIT
