import mongoose from 'mongoose';

const codeSubmissionSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'anonymous'
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'python', 'java', 'typescript', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'other']
  },
  filename: {
    type: String,
    default: 'snippet'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  aiResponse: {
    type: Object,
    default: null
  }
}, {
  timestamps: true
});

codeSubmissionSchema.index({ createdAt: -1 });
codeSubmissionSchema.index({ status: 1 });

export const CodeSubmission = mongoose.models.CodeSubmission || 
  mongoose.model('CodeSubmission', codeSubmissionSchema);
