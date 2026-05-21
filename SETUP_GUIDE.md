# 🚀 Next.js AI Code Review Platform - Setup & Run

## ✅ Project Status: READY

This is a **pure Next.js** application with NO Express/Node.js backend server.

---

## 📦 Current Structure

```
ai-code-reviewer/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Serverless)
│   │   └── code/
│   │       ├── route.ts   # POST, GET /api/code
│   │       └── [id]/
│   │           └── route.ts  # GET, DELETE /api/code/:id
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── SubmissionForm.tsx
│   └── ReviewResults.tsx
├── lib/
│   ├── db.ts             # MongoDB connection
│   └── gemini.ts         # AI integration
├── models/
│   └── CodeSubmission.ts # Mongoose schema
├── config/
│   └── index.ts          # Environment config
├── types/
│   └── index.ts          # TypeScript interfaces
├── .env.local            # Environment variables
├── package.json
└── tsconfig.json
```

---

## ⚡ Quick Start (3 Steps)

### Step 1: Update `.env.local`

Open `ai-code-reviewer/.env.local` and add your Gemini API key:

```env
MONGODB_URI=mongodb://localhost:27017/ai-code-reviewer
GEMINI_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get API Key**: https://makersuite.google.com/app/apikey

### Step 2: Start MongoDB

Make sure MongoDB is running:

```bash
# Windows (if installed as service)
net start MongoDB

# Or manually
mongod --dbpath C:\data\db
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🧪 Test the Application

1. **Navigate to** http://localhost:3000
2. **Select** JavaScript from language dropdown
3. **Paste** this test code:

```javascript
function add(a, b) {
    return a + b;
}
```

4. **Click** "Submit for Review"
5. **Wait** 5-15 seconds for AI analysis
6. **View** results on the right side

---

## 🔧 Troubleshooting

### ❌ "Cannot connect to MongoDB"

**Solution:**
- Start MongoDB: `net start MongoDB`
- Check URI in `.env.local`

### ❌ "Gemini API error"

**Solution:**
- Verify API key in `.env.local`
- Check internet connection
- Ensure API quota available

### ❌ Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill it (replace PID)
taskkill /PID <PID> /F
```

### ❌ TypeScript errors in editor

**Normal during development!** They resolve on build.

Run `npm run build` to verify everything compiles correctly.

---

## 📊 Architecture Overview

### How It Works (Next.js Serverless)

```
Frontend (React)
    ↓
API Route (/api/code)  ← Serverless Function
    ↓
MongoDB                ← Database
    ↓
Gemini AI              ← External API
```

**No separate Express server needed!** Next.js API routes handle everything.

---

## 🎯 What's Working

✅ Next.js 16 with App Router  
✅ TypeScript configuration  
✅ TailwindCSS 4 styling  
✅ MongoDB connection (Mongoose)  
✅ Google Gemini AI integration  
✅ API routes for CRUD operations  
✅ Real-time polling (3s intervals)  
✅ Dark mode support  
✅ Responsive design  

---

## 📝 Next Steps

Once this is running perfectly, you can proceed to Phase 2 for advanced features like:
- User authentication
- File uploads
- GitHub integration
- Team collaboration

---

**Ready to test?** Just update your API key and run `npm run dev`! 🚀
