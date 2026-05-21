# 🧪 Testing Your AI Code Review Platform

## ✅ Backend is Now Connected!

Your submission form now uses the **real API** with:
- ✅ MongoDB database
- ✅ Google Gemini AI
- ✅ Live code analysis

---

## 🚀 How to Test (Step-by-Step)

### Step 1: Make Sure MongoDB is Running

```bash
# Windows - Check if MongoDB service is running
net start MongoDB

# If not installed as service, start manually:
mongod --dbpath C:\data\db
```

### Step 2: Verify Your API Key

Check that your `.env.local` has the correct Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
MONGODB_URI=mongodb://localhost:27017/ai-code-reviewer
```

Get API key: https://makersuite.google.com/app/apikey

### Step 3: Submit Test Code

1. **Open** http://localhost:3000 in your browser
2. **Select** a language (e.g., JavaScript)
3. **Paste** one of these test examples:

#### Test Case 1: Simple Function (Should Score High)
```javascript
function add(a, b) {
    return a + b;
}
```

#### Test Case 2: Security Issues (Will Detect Problems)
```javascript
function unsafeFunction(userInput) {
    eval(userInput);
    document.body.innerHTML = userInput;
    localStorage.setItem('password', 'secret123');
}
```

#### Test Case 3: Performance Issue
```python
def slow_function():
    result = []
    for i in range(1000000):
        result.append(i * 2)
    return result
```

4. **Click** "Submit for Review"
5. **Wait** 5-15 seconds while AI analyzes
6. **View** results on the right side!

---

## 📊 What You'll See

### During Analysis:
- 🔄 Spinning loader
- "AI is analyzing your code..." message
- Takes 5-15 seconds typically

### After Analysis Completes:
When successful, you'll see:

✅ **Overall Score** (0-10) with progress bar  
🐛 **Bugs Found** (if any)  
⚡ **Performance Issues** (if any)  
🔒 **Security Problems** (if any)  
📋 **Best Practices** suggestions  
🏗️ **Architecture** recommendations  

### If Analysis Fails:
❌ Red error message  
- Check MongoDB is running  
- Verify API key is correct  
- Check internet connection  

---

## 🔍 Troubleshooting

### Error: "Failed to submit code"

**Cause**: MongoDB not running or API key invalid

**Solution**:
```bash
# Start MongoDB
net start MongoDB

# Or check if it's running:
mongo --version
```

### Error: "Gemini API error"

**Cause**: Invalid API key or no internet

**Solution**:
1. Check `.env.local` has correct API key
2. Restart the dev server after changing `.env.local`
3. Verify internet connection

### Stuck on "Analyzing..." forever

**Cause**: AI request failed silently

**Solution**:
1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Verify both MongoDB and API key are correct

---

## 🎯 Expected Results Examples

### Example 1: Good Code
**Input**:
```typescript
const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
];

const getUserById = (id: number) => {
    return users.find(user => user.id === id);
};
```

**Expected Output**:
- Score: 8-10/10
- Few or no issues
- Positive feedback

### Example 2: Problematic Code
**Input**:
```javascript
function processData(data) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].value > 10) {
            result.push(data[i].value * 2);
        }
    }
    return result;
}
```

**Expected Output**:
- Score: 5-7/10
- Suggestions: Use `let/const`, modern array methods
- Best practices: Use filter/map instead of for loop

---

## 📝 How It Works

1. **You submit code** → Frontend sends to `/api/code`
2. **Backend saves to MongoDB** → Status: "processing"
3. **AI analyzes code** → Google Gemini API
4. **Results saved** → MongoDB updated with AI response
5. **Frontend polls** → Checks every 3 seconds
6. **Results displayed** → When status changes to "completed"

---

## 🎉 Success Indicators

✅ Form accepts your code without errors  
✅ Shows "AI is analyzing..." message  
✅ Results appear after 5-15 seconds  
✅ Score and feedback are displayed  
✅ Can submit multiple times  
✅ Previous submissions still visible  

---

## 💡 Tips

1. **Start simple** - Test with basic code first
2. **Watch the console** - Browser DevTools show what's happening
3. **Be patient** - AI takes 5-15 seconds to analyze
4. **Try different languages** - JavaScript, Python, Java, etc.
5. **Save interesting results** - They're stored in MongoDB!

---

## 🔄 Clearing Data

Want to start fresh? Clear MongoDB:

```javascript
// In MongoDB shell:
use ai-code-reviewer
db.codesubmissions.deleteMany({})
```

---

**Ready to test?** Open http://localhost:3000 and submit your first code! 🚀
