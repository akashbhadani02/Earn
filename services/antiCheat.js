const BLOCK_DURATION_MS = 12 * 60 * 60 * 1000;

/**
 * Security progression:
 *  1st-3rd violations => warning only (wallet unchanged)
 *  4th-6th violations => temporary block #1-#3 (wallet reset to 0, timer shown)
 *  7th+ / block #4 => permanent block (wallet reset to 0, no timer, admin-only unblock)
 *
 * The three temporary block timers are the ONLY timers. After block #3,
 * the next block is permanent and has no countdown.
 */
async function registerViolation(user, reason) {
  const now = new Date();
  const cleanReason = String(reason || 'Anti-cheating violation').slice(0, 500);
  user.warningCount = Number(user.warningCount || 0);
  user.blockCount = Number(user.blockCount || 0);
  user.warningHistory = Array.isArray(user.warningHistory) ? user.warningHistory : [];
  user.warningHistory.push({ time: now, reason: cleanReason });
  if (user.warningHistory.length > 200) user.warningHistory = user.warningHistory.slice(-200);

  // First three violations are warnings only.
  if (user.warningCount < 3) {
    user.warningCount += 1;
    await user.save();
    return {
      warning: true,
      blocked: false,
      permanentBlocked: false,
      warningCount: user.warningCount,
      blockCount: user.blockCount,
      remainingMs: 0,
      message: `Warning ${user.warningCount}/3. Three warnings are given before the first block.`
    };
  }

  // Violations after the three warnings create temporary blocks #1-#3.
  user.blockCount += 1;
  user.wallet = 0;
  user.isOnline = false;
  user.activeQuizQuestionId = null;
  user.activeQuizStartedAt = null;
  user.quizInvalidated = true;
  user.blockReason = cleanReason;

  if (user.blockCount >= 4) {
    user.permanentBlocked = true;
    user.isBlocked = true;
    user.blockUntil = null;
    user.blockReason = `Permanent block after ${user.blockCount} anti-cheating blocks: ${cleanReason}`;
    await user.save();
    return {
      warning: false,
      blocked: true,
      permanentBlocked: true,
      warningCount: user.warningCount,
      blockCount: user.blockCount,
      remainingMs: null,
      message: 'Permanent block. Only Admin can unblock this account.'
    };
  }

  user.isBlocked = true;
  user.blockUntil = new Date(Date.now() + BLOCK_DURATION_MS);
  user.blockReason = `Temporary block #${user.blockCount}: ${cleanReason}`;
  await user.save();
  return {
    warning: false,
    blocked: true,
    permanentBlocked: false,
    warningCount: user.warningCount,
    blockCount: user.blockCount,
    blockUntil: user.blockUntil.toISOString(),
    remainingMs: BLOCK_DURATION_MS,
    message: `Temporary block #${user.blockCount}. Timer ${user.blockCount}/3.`
  };
}

module.exports = { BLOCK_DURATION_MS, registerViolation };
