const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QuizAnswerHistory = require('../models/QuizAnswerHistory');
const auth = require('../middleware/auth');

// Student-only engagement data used by the dashboard UI.
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const players = await User.find({ isDeleted: { $ne: true }, isBlocked: { $ne: true } })
      .select('name totalQuestionsAnswered quizScore totalEarn')
      .sort({ totalQuestionsAnswered: -1, quizScore: -1, totalEarn: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, players });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, message: 'Leaderboard unavailable' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const history = await QuizAnswerHistory.find({ userId: req.user.id })
      .select('questionText isCorrect answeredAt')
      .sort({ answeredAt: -1 })
      .limit(30)
      .lean();
    res.json({ success: true, history });
  } catch (err) {
    console.error('Quiz history error:', err);
    res.status(500).json({ success: false, message: 'History unavailable' });
  }
});

module.exports = router;
