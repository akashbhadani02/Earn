
document.addEventListener('click', function(e){
    const btn = e.target.closest('#activityContent .activity-option[data-activity-answer]');
    if (!btn) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    if (typeof window.submitActivity !== 'function') {
        console.error('submitActivity is not available');
        return;
    }

    if (btn.disabled) return;
    btn.disabled = true;

    const answer = decodeURIComponent(btn.getAttribute('data-activity-answer') || '');

    // Use the real server-backed submitActivity function.
    window.submitActivity(answer).finally(function(){
        // renderActivity() creates fresh buttons for the next question.
        // If the server rejects the answer, re-enable this button.
        if (document.body.contains(btn)) btn.disabled = false;
    });
}, true);
