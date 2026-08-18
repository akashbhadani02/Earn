const BLOCK_DURATION_MS = 12 * 60 * 60 * 1000;

function getBlockRemainingMs(user, nowMs = Date.now()) {
  let untilMs = user.blockUntil ? new Date(user.blockUntil).getTime() : 0;
  if ((!untilMs || Number.isNaN(untilMs)) && !user.permanentBlocked && Number(user.blockCount || 0) < 4) {
    const started = user.updatedAt ? new Date(user.updatedAt).getTime() : nowMs;
    untilMs = started + 12 * 60 * 60 * 1000;
  }
  return { untilMs, remainingMs: untilMs && !Number.isNaN(untilMs) ? Math.max(0, untilMs - nowMs) : 0 };
}

async function registerViolation(user, reason) {
  const cleanReason = String(reason || "Cheating Detected").slice(0, 500);
  if (Number(user.blockCount || 0) >= 4 && !user.isBlocked) {
    user.isBlocked=true; user.permanentBlocked=true; user.blockUntil=null; user.warningCount=0;
    user.wallet=0; user.isOnline=false; user.blockReason=cleanReason + " — Permanent block";
    user.sessionVersion=Number(user.sessionVersion||0)+1;
    await user.save();
    return {blocked:true,permanentBlocked:true,warning:false,warningCount:0,blockCount:Number(user.blockCount||4),wallet:0,message:"Permanent block — Admin must unblock this student."};
  }
  if (user.isBlocked) {
    if (user.permanentBlocked || Number(user.blockCount || 0) >= 4 || !user.blockUntil) {
      return { blocked:true, permanentBlocked:true, warning:false, warningCount:Number(user.warningCount||0), blockCount:Number(user.blockCount||4), wallet:0 };
    }
    const t = getBlockRemainingMs(user);
    if (t.remainingMs > 0) return { blocked:true, permanentBlocked:false, warning:false, warningCount:Number(user.warningCount||0), blockCount:Number(user.blockCount||0), remainingMs:t.remainingMs, blockUntil:new Date(t.untilMs).toISOString(), wallet:Number(user.wallet||0) };
    user.isBlocked=false; user.blockUntil=null; user.blockReason=""; user.warningCount=0;
  }

  user.warningCount = Number(user.warningCount || 0) + 1;
  user.blockReason = cleanReason;
  user.warningHistory = Array.isArray(user.warningHistory) ? user.warningHistory : [];
  user.warningHistory.push({time:new Date(), reason:cleanReason});
  if (user.warningHistory.length > 200) user.warningHistory = user.warningHistory.slice(-200);

  if (user.warningCount <= 3) {
    await user.save();
    return { blocked:false, permanentBlocked:false, warning:true, warningCount:user.warningCount, remainingWarnings:3-user.warningCount, blockCount:Number(user.blockCount||0), wallet:Number(user.wallet||0) };
  }

  user.blockCount = Number(user.blockCount || 0) + 1;
  user.warningCount = 0;
  user.wallet = 0;
  user.isOnline = false;
  user.activeQuizQuestionId = null;
  user.activeQuizStartedAt = null;
  user.activeActivityType = "";
  user.activeActivityQuestionId = null;
  user.activeActivityStartedAt = null;
  user.activeActivityToken = "";
  user.sessionVersion = Number(user.sessionVersion || 0) + 1;

  if (user.blockCount >= 4) {
    user.isBlocked = true;
    user.permanentBlocked = true;
    user.blockUntil = null;
    user.blockReason = cleanReason + " — Permanent block";
    await user.save();
    return {blocked:true, permanentBlocked:true, warning:false, warningCount:0, blockCount:user.blockCount, wallet:0, message:"Permanent block — Admin must unblock this student."};
  }

  user.isBlocked = true;
  user.permanentBlocked = false;
  user.blockUntil = new Date(Date.now() + BLOCK_DURATION_MS);
  await user.save();
  return {blocked:true, permanentBlocked:false, warning:false, warningCount:0, blockCount:user.blockCount, blockUntil:user.blockUntil.toISOString(), remainingMs:BLOCK_DURATION_MS, wallet:0};
}

module.exports = { BLOCK_DURATION_MS, getBlockRemainingMs, registerViolation };
