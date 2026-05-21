# System Architecture - AI Code Review Platform

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Next.js Frontend (React)              │   │
│  │  - TypeScript                                   │   │
│  │  - TailwindCSS                                  │   │
│  │  - Client Components                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Next.js API Routes (Serverless)         │   │
│  │  - /api/code (POST, GET)                        │   │
│  │  - /api/code/[id] (GET, DELETE)                 │   │
│  └─────────────────────────────────────────────────┘   │
│                           │                             │
│  ┌───────────────┐       │       ┌───────────────┐     │
│  │  Controllers  │◄──────┴──────►│   Services    │     │
│  │  (Routes)     │               │  (Business)   │     │
│  └───────────────┘               └───────────────┘     │
└─────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│      DATA LAYER         │   │     EXTERNAL APIs       │
│  ┌───────────────────┐  │   │  ┌──────────────────┐  │
│  │   MongoDB Atlas   │  │   │  │  Google Gemini   │  │
│  │   or Local        │  │   │  │      AI API      │  │
│  │                   │  │   │  │                  │  │
│  │  Collections:     │  │   │  │  Endpoints:      │  │
│  │  - codeSubmissions│  │   │  │  - generateContent│ │
│  │  - reviews        │  │   │  │                  │  │
│  └───────────────────┘  │   │  └──────────────────┘  │
└─────────────────────────┘   └─────────────────────────┘
```

---

## 📦 Layer-by-Layer Breakdown

### 1. **Client Layer (Frontend)**

**Technology**: Next.js 16 + React 19 + TypeScript

**Components**:
- `SubmissionForm.tsx` - Handles code input
- `ReviewResults.tsx` - Displays AI feedback
- `page.tsx` - Main application page

**Features**:
- Client-side rendering with hydration
- Real-time polling (3s intervals)
- State management (React hooks)
- Form validation
- Responsive UI

**Data Flow**:
```
User Input → Form Validation → API Call → State Update → UI Re-render
```

---

### 2. **Application Layer (Backend)**

**Technology**: Next.js API Routes (Serverless Node.js)

#### A. **API Routes (Controllers)**

**File**: `app/api/code/route.ts`

**Responsibilities**:
- Handle HTTP requests
- Input validation
- Response formatting
- Error handling

**Endpoints**:
```typescript
POST   /api/code          // Submit code for review
GET    /api/code          // Get all submissions
GET    /api/code/:id      // Get specific submission
DELETE /api/code/:id      // Delete submission
```

#### B. **Service Layer (Business Logic)**

**Files**:
- `lib/gemini.ts` - AI integration
- `lib/db.ts` - Database connection

**Responsibilities**:
- AI prompt engineering
- API call orchestration
- Background processing
- Connection management

**AI Analysis Flow**:
```
Receive Code → Create Prompt → Call Gemini API → 
Parse Response → Validate JSON → Return Results
```

---

### 3. **Data Layer**

**Technology**: MongoDB + Mongoose

#### **Schema Design**

**Collection**: `codesubmissions`

```typescript
{
  _id: ObjectId,
  userId: String (default: 'anonymous'),
  code: String (required),
  language: String (enum: 13 languages),
  filename: String (default: 'snippet'),
  status: String (enum: pending|processing|completed|failed),
  aiResponse: {
    bugs: String[],
    performanceIssues: String[],
    securityProblems: String[],
    bestPractices: String[],
    architectureSuggestions: String[],
    overallScore: Number (0-10),
    summary: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `createdAt: -1` - For sorting by date
- `status: 1` - For filtering by status

---

### 4. **External APIs**

**Google Gemini AI**

**Model**: `gemini-pro`

**Request**:
```javascript
{
  model: "gemini-pro",
  prompt: "Analyze this code for bugs, performance, security..."
}
```

**Response**:
```json
{
  "bugs": ["..."],
  "performanceIssues": ["..."],
  "securityProblems": ["..."],
  "bestPractices": ["..."],
  "architectureSuggestions": ["..."],
  "overallScore": 8,
  "summary": "..."
}
```

---

## 🔄 Complete Request Flow

### **Scenario: User Submits Code**

```
┌─────┐
│ 1   │ User enters code in form
└─┬───┘
  │
  ▼
┌─────┐
│ 2   │ Frontend validates input
└─┬───┘
  │
  ▼
┌─────┐
│ 3   │ POST /api/code with {code, language}
└─┬───┘
  │
  ▼
┌─────┐
│ 4   │ API route receives request
└─┬───┘
  │
  ▼
┌─────┐
│ 5   │ Connect to MongoDB (connection pooling)
└─┬───┘
  │
  ▼
┌─────┐
│ 6   │ Create submission document (status: "pending")
└─┬───┘
  │
  ▼
┌─────┐
│ 7   │ Update status to "processing"
└─┬───┘
  │
  ▼
┌─────┐
│ 8   │ Return response to client immediately
└─┬───┘
  │
  ├──────────────────────────────────────┐
  │                                      │
  ▼                                      ▼
┌─────┐                              ┌─────┐
│ 9a  │ Client polls every 3s        │ 9b  │ Async: Call Gemini API
└─┬───┘                              └─┬───┘
  │                                    │
  ▼                                    ▼
┌─────┐                              ┌─────┐
│ 10a │ Check submission status      │ 10b │ AI analyzes code
└─┬───┘                              └─┬───┘
  │                                    │
  ▼                                    ▼
┌─────┐                              ┌─────┐
│ 11a │ If "processing", continue    │ 11b │ Parse AI response
└─┬───┘                              └─┬───┘
  │                                    │
  ▼                                    ▼
┌─────┐                              ┌─────┐
│ 12a │ If "completed", fetch data   │ 12b │ Save aiResponse to DB
└─┬───┘                              └─┬───┘
  │                                    │
  ▼                                    ▼
┌─────┐                              ┌─────┐
│ 13a │ Display results              │ 13b │ Update status to "completed"
└─────┘                              └─────┘
```

---

## 🔐 Security Architecture

### **Environment Variables**
```env
MONGODB_URI          # Database connection
GEMINI_API_KEY       # AI API authentication
NEXT_PUBLIC_APP_URL  # App URL for CORS
```

### **Data Validation**
- Input sanitization
- Type checking (TypeScript)
- Enum validation
- Required field validation

### **Error Handling**
```typescript
try {
  // Business logic
} catch (error) {
  console.error(error);
  return NextResponse.json({
    success: false,
    error: 'Meaningful message'
  }, { status: 500 });
}
```

---

## ⚡ Performance Optimizations

### **Database**
- Connection pooling (cached connections)
- Indexed queries
- Query limits (50 results)
- Projection (select only needed fields)

### **API**
- Asynchronous AI calls (non-blocking)
- Immediate response after DB save
- Background processing

### **Frontend**
- Client-side caching
- Polling with intervals (not continuous)
- Conditional re-renders
- Lazy loading components

---

## 🎯 Scalability Considerations

### **Current Architecture (Monolith)**
- Single Next.js application
- All-in-one deployment
- Simple scaling (vertical)

### **Future Microservices**
```
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
  ┌────┴────┬──────────┬────────────┐
  ▼         ▼          ▼            ▼
┌─────┐  ┌─────┐  ┌────────┐  ┌────────┐
│ Auth│  │ Code│  │ Review │  │  File  │
│Svc  │  │ Svc │  │  Svc   │  │  Svc   │
└─────┘  └─────┘  └────────┘  └────────┘
```

---

## 📊 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 | Full-stack React framework |
| Language | TypeScript | Type safety |
| Styling | TailwindCSS 4 | Utility-first CSS |
| Backend | Next.js API Routes | Serverless functions |
| Database | MongoDB | NoSQL database |
| ODM | Mongoose | Schema modeling |
| AI | Google Gemini | Code analysis |
| State | React Hooks | Client state |
| Build | Turbopack | Fast compilation |

---

## 🏛️ Architectural Patterns

### **1. MVC Pattern**
```
Model (Mongoose Schemas)
  ↓
View (React Components)
  ↓
Controller (API Routes)
```

### **2. Service Layer Pattern**
```
Routes → Services → Data Access
```

### **3. Repository Pattern**
```
Models encapsulate database operations
```

### **4. Dependency Injection**
```
Database connection injected via lib/db.ts
```

---

## 📈 Monitoring & Logging

### **Console Logging**
```typescript
console.log(`AI review completed for submission ${submissionId}`);
console.error(`Error submitting code:`, error);
```

### **Error Tracking**
- Try-catch blocks
- Meaningful error messages
- Status codes
- Stack traces in development

---

## 🔄 State Management

### **Client State**
```typescript
const [currentSubmission, setCurrentSubmission] = useState(null);
const [submissions, setSubmissions] = useState([]);
const [selectedSubmission, setSelectedSubmission] = useState(null);
```

### **Server State**
- MongoDB documents
- Cached database connections
- AI API responses

---

This architecture is **production-ready**, **scalable**, and follows **industry best practices**.
