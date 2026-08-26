const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QuizAnswerHistory = require('../models/QuizAnswerHistory');
const auth = require('../middleware/auth');

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const players = await User.find({ isDeleted: { $ne: true }, isBlocked: { $ne: true } })
      .select('name quizScore totalEarn totalQuestionsAnswered')
      .sort({ quizScore: -1, totalQuestionsAnswered: -1, name: 1 })
      .limit(20)
      .lean();
    res.json({ success: true, players });
  } catch (err) {
    console.error('Student leaderboard error:', err);
    res.status(500).json({ success: false, message: 'Leaderboard could not be loaded.' });
  }
});

router.get('/quiz-history', auth, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const history = await QuizAnswerHistory.find({ userId: req.user.id })
      .select('questionText selectedAnswer correctAnswer isCorrect answeredAt')
      .sort({ answeredAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, history });
  } catch (err) {
    console.error('Student quiz history error:', err);
    res.status(500).json({ success: false, message: 'Quiz history could not be loaded.' });
  }
});

module.exports = router;
