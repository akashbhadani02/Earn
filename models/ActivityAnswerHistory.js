const mongoose = require('mongoose');

const activityAnswerHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  activityType: { type: String, required: true, index: true },
  questionId: { type: String, required: true },
  correct: { type: Boolean, required: true },
  reward: { type: Number, default: 0 },
  penalty: { type: Number, default: 0 },
  answer: { type: String, default: '' },
  answeredAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

activityAnswerHistorySchema.index({ userId: 1, activityType: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.models.ActivityAnswerHistory || mongoose.model('ActivityAnswerHistory', activityAnswerHistorySchema);
