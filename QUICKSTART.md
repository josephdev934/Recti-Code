# AI Code Review Platform - Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### Step 1: Get Your Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy your API key

### Step 2: Configure Environment

Open `.env.local` and add your API key:

```env
MONGODB_URI=mongodb://localhost:27017/ai-code-reviewer
GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Start MongoDB

**Windows:**
```powershell
# If MongoDB is installed as a service:
net start MongoDB

# Or run mongod manually:
mongod --dbpath C:\data\db
```

**Mac/Linux:**
```bash
brew services start mongodb-community
# or
sudo systemctl start mongod
```

**MongoDB Atlas (Cloud):**
- Use your connection string in `.env.local`
- Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### Step 4: Run the Application

```bash
npm run dev
```

### Step 5: Test It!

1. Open http://localhost:3000
2. Select "JavaScript" from language dropdown
3. Paste this test code:

```javascript
function calculateTotal(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) {
        total += items[i].price;
    }
    return total;
}
```

4. Click "Submit for Review"
5. Wait 5-15 seconds for AI analysis
6. See the results!

## ✅ Expected Behavior

- **Initial Status**: Shows "Analyzing..." or "Processing"
- **After Analysis**: Results appear with:
  - Overall score (0-10)
  - Bugs found
  - Performance issues
  - Security problems
  - Best practices
  - Architecture suggestions

## 🐛 Common Issues

### "Cannot connect to MongoDB"
- Make sure MongoDB is running
- Check the MONGODB_URI in `.env.local`
- Default: `mongodb://localhost:27017/ai-code-reviewer`

### "Gemini API error"
- Verify your API key is correct
- Check you have internet connection
- Ensure API key has available quota

### TypeScript errors in editor
- These are normal during development
- They resolve on build
- Ignore them and run the app

### Port 3000 already in use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

## 🎯 What You Can Do Now

✅ Submit code in 13+ programming languages  
✅ Get AI-powered code reviews  
✅ See bugs, performance issues, security problems  
✅ View best practices suggestions  
✅ Get architecture recommendations  
✅ Save and revisit past reviews  
✅ Track review history  

## 📊 Example Test Cases

### Test 1: JavaScript with Issues
```javascript
function unsafeFunction(userInput) {
    eval(userInput);
    document.body.innerHTML = userInput;
    localStorage.setItem('data', JSON.stringify({sensitive: 'password123'}));
}
```

### Test 2: Python Performance Issue
```python
def slow_function():
    result = []
    for i in range(1000000):
        result.append(i * 2)
    return result
```

### Test 3: Good Code
```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

function createUser(name: string, email: string): User {
    return {
        id: Date.now(),
        name,
        email
    };
}
```

## 🚀 Next Steps

Once Phase 1 is working perfectly, we can add:
- User authentication
- File upload support
- Code comparison
- Team collaboration
- Custom rules
- Integration with GitHub/GitLab
- And more!

---

**Need help?** Check the full README.md for detailed documentation.
