
        // ==========================================
        // MOBILE PUSH NOTIFICATIONS
        // ==========================================
        function urlBase64ToUint8Array(base64String) {
            const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding)
                .replace(/-/g, "+")
                .replace(/_/g, "/");
            const rawData = window.atob(base64);
            return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
        }


        async function enableNotifications() {
            return setupNotifications(true);
        }

        async function setupNotifications(fromUserClick = false) {
            const button = document.getElementById("notificationBtn");
            const requiredButton = document.getElementById("requiredNotificationBtn");
            const status = document.getElementById("notificationRequiredStatus");
            const help = document.getElementById("notificationRequiredHelp");
            const token = localStorage.getItem("token");

            if (!token) {
                location.href = "login.html";
                return false;
            }

            if (
                !("Notification" in window) ||
                !("serviceWorker" in navigator) ||
                !("PushManager" in window)
            ) {
                status.innerText = "❌ આ browser Web Push support કરતું નથી.";
                return false;
            }

            if (!window.isSecureContext) {
                status.innerText = "❌ App Notifications માટે HTTPS જરૂરી છે.";
                return false;
            }

            try {
                if (button) {
                    button.disabled = true;
                    button.innerText = "⏳ Enabling...";
                }
                if (requiredButton) {
                    requiredButton.disabled = true;
                    requiredButton.innerText = "⏳ Enabling...";
                }
                if (status) status.innerText = "App Notification permission ચેક થઈ રહ્યું છે...";
                if (help) help.style.display = "none";

                let permission = Notification.permission;

                // Browser permission prompt must be triggered by a user gesture.
                if (permission !== "granted") {
                    if (permission === "denied") {
                        throw new Error("NOTIFICATION_BLOCKED");
                    }
                    permission = await Notification.requestPermission();
                }

                if (permission !== "granted") {
                    throw new Error("NOTIFICATION_NOT_ALLOWED");
                }

                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/"
                });
                await navigator.serviceWorker.ready;

                const keyResponse = await fetch("/api/notifications/vapid-public-key", {
                    headers: { Authorization: "Bearer " + token }
                });
                const keyData = await keyResponse.json();

                if (!keyResponse.ok || !keyData.success || !keyData.publicKey) {
                    throw new Error(keyData.message || "VAPID public key not available");
                }

                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
                    });
                }

                const saveResponse = await fetch("/api/notifications/subscribe", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },
                    body: JSON.stringify(subscription.toJSON())
                });

                const saveData = await saveResponse.json();

                if (!saveResponse.ok || !saveData.success) {
                    throw new Error(saveData.message || "Subscription save failed");
                }

                if (button) {
                    button.disabled = false;
                    button.innerText = "✅ App Notifications Enabled";
                    button.style.background = "linear-gradient(135deg,#16a34a,#059669)";
                }

                hideNotificationRequired();

                if (status) status.innerText = "✅ App Notifications Enabled";
                return true;

            } catch (error) {
                console.error("Notification setup error:", error);

                if (button) {
                    button.disabled = false;
                    button.innerText = "🔔 Enable App Notifications";
                }
                if (requiredButton) {
                    requiredButton.disabled = false;
                    requiredButton.innerText = "🔔 Enable App Notifications";
                }

                if (error.message === "NOTIFICATION_BLOCKED") {
                    if (status) status.innerText = "❌ Notifications browserમાં Block છે.";
                    if (help) help.style.display = "block";
                } else if (error.message === "NOTIFICATION_NOT_ALLOWED") {
                    if (status) status.innerText = "⚠️ Allow દબાવવું જરૂરી છે.";
                } else {
                    if (status) status.innerText = "❌ " + error.message;
                }

                return false;
            }
        }

        function showNotificationRequired() {
            const overlay = document.getElementById("notificationRequiredOverlay");
            const dashboard = document.getElementById("dashboard");
            const quiz = document.getElementById("quiz");
            if (overlay) overlay.style.display = "flex";
            if (dashboard) { dashboard.style.visibility = "hidden"; dashboard.setAttribute("aria-hidden", "true"); }
            if (quiz) { quiz.style.visibility = "hidden"; quiz.setAttribute("aria-hidden", "true"); }
            document.body.classList.add("notification-locked");
        }

        function hideNotificationRequired() {
            const overlay = document.getElementById("notificationRequiredOverlay");
            const dashboard = document.getElementById("dashboard");
            const quiz = document.getElementById("quiz");
            if (overlay) overlay.style.display = "none";
            if (dashboard) { dashboard.style.visibility = "visible"; dashboard.setAttribute("aria-hidden", "false"); }
            if (quiz) { quiz.style.visibility = "visible"; quiz.setAttribute("aria-hidden", "false"); }
            document.body.classList.remove("notification-locked");
        }

        async function enableRequiredNotifications() {
            const ok = await setupNotifications(true);
            if (ok) hideNotificationRequired();
        }

        async function checkNotificationStatus() {
            const button = document.getElementById("notificationBtn");

            if (
                !("Notification" in window) ||
                !("serviceWorker" in navigator) ||
                !("PushManager" in window)
            ) {
                showNotificationRequired();
                return false;
            }

            try {
                const registration = await navigator.serviceWorker.getRegistration("/");
                const subscription = registration
                    ? await registration.pushManager.getSubscription()
                    : null;

                if (subscription && Notification.permission === "granted") {
                    if (button) {
                        button.innerText = "✅ App Notifications Enabled";
                        button.style.background = "linear-gradient(135deg,#16a34a,#059669)";
                    }
                    hideNotificationRequired();
                    return true;
                }

                // If permission was granted but subscription is missing, repair it.
                if (Notification.permission === "granted") {
                    return await setupNotifications(false);
                }

                showNotificationRequired();
                return false;

            } catch (error) {
                console.log("Notification status check:", error);
                showNotificationRequired();
                return false;
            }
        }

        // Check first. The mandatory gate is hidden by default so it never
        // flashes on refresh when the student has already granted permission.
        // If permission/subscription is missing, checkNotificationStatus()
        // will show the gate and lock the dashboard.
        window.addEventListener("load", function () {
            checkNotificationStatus();
        });

        // =====================
        // SECURITY TRACKING
        // =====================
        function getSecurityDeviceId() {
            let id = localStorage.getItem("securityDeviceId");
            if (!id) {
                id = "dev-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2));
                localStorage.setItem("securityDeviceId", id);
            }
            return id;
        }

        async function recordSecurityEvent(type) {
            try {
                await fetch("/api/auth/security-event", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("token")
                    },
                    body: JSON.stringify({ type, deviceId: getSecurityDeviceId() })
                });
            } catch (e) {
                console.warn("Security event was not recorded:", e);
            }
        }

        // Register this browser/device once after login.
        if (localStorage.getItem("token")) recordSecurityEvent("device");

        // =====================
        // Anti Cheating
        // =====================
        let warningMode = false;
        let clickCount = 0;
        let spaceCount = 0;
        let questionStartTime = 0;
        let warningTimer = null;

        function startWarningMonitor() {

            warningMode = true;
            clickCount = 0;
            spaceCount = 0;

            clearTimeout(warningTimer);

            warningTimer = setTimeout(() => {
                warningMode = false;
            }, 5000);

        }

        document.addEventListener("click", () => {

            if (!warningMode) return;

            clickCount++;

            // Allow normal accidental clicks. Only 5 clicks inside the warning
            // window count as a violation.
            if (clickCount >= 5) {
                blockStudent("Too many mouse clicks");
            }

        });

        document.addEventListener("keydown", (e) => {

            if (!warningMode) return;

            if (e.code === "Space") {

                e.preventDefault();

                spaceCount++;

                if (spaceCount >= 5) {
                    blockStudent("Too many space presses");
                }

            }

        });

        let alreadyBlocked = false;
        let warningRequestRunning = false;

        async function blockStudent(reason) {

            // Prevent duplicate requests when multiple events fire together.
            if (warningRequestRunning || alreadyBlocked) return;

            warningRequestRunning = true;

            try {

                const response = await fetch("/api/auth/block-me", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + localStorage.getItem("token")
                    },
                    body: JSON.stringify({ reason })
                });

                const data = await response.json();

                warningRequestRunning = false;

                // 4th warning in the current cycle: account is blocked for 3 hours (or permanently on the 4th block).
                if (data.blocked) {

                    alreadyBlocked = true;
                    warningMode = false;

                    function formatBlockRemaining(ms) {
                        const totalSeconds = Math.floor(Math.max(0, Number(ms || 0)) / 1000);
                        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
                        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
                        const s = String(totalSeconds % 60).padStart(2, "0");
                        return h + ":" + m + ":" + s;
                    }

                    const blockMessage = data.permanentBlocked
                        ? ("🚫 Your account is permanently blocked.\n\n" +
                           "Reason: " + reason + "\n\n" +
                           "Only Admin can unblock your account.")
                        : ("🚫 Your account has been blocked for 3 hours.\n\n" +
                           "Reason: " + reason + "\n\n" +
                           "Remaining time: " + formatBlockRemaining(data.remainingMs) + "\n\n" +
                           "Your wallet has been reset to 0.\n" +
                           "You can login again after the timer reaches 00:00:00.");

                    alert(blockMessage);

                    localStorage.removeItem("token");
                    location.href = "login.html";
                    return;
                }

                // 1st, 2nd and 3rd violation: warning only; the 4th violation triggers a block.
                if (data.warning) {

                    warningMode = false;

                    let warningMessage;

                    if (data.warningCount === 1) {
                        warningMessage =
                            "⚠️ WARNING 1/4\n\n" +
                            "આ તમારી પહેલી ચેતવણી છે.\n" +
                            "મહેરબાની કરીને નિયમોનુ પાલન કરો .\n\n" +
                            "Reason: " + reason;
                    } else if (data.warningCount === 2) {
                        warningMessage =
                            "⚠️ WARNING 2/4\n\n" +
                            "આ તમારી બીજી ચેતવણી છે.\n" +
                            "હજુ એકવાર ચેતવણી આપીએ છીએ બ્લોક કરતાં પહેલા.\n\n" +
                            "Reason: " + reason;
                    } else {
                        warningMessage =
                            "⚠️ WARNING 3/4\n\n" +
                            "આ ત્રીજી ચેતવણી છે. હજુ એક ચેતવણી પછી 3 કલાકનો બ્લોક લાગશે.\n" +
                            "આગામી ચેતવણી મળતાં 3 કલાકનો બ્લોક લાગશે.\n\n" +
                            "Reason: " + reason;
                    }

                    alert(warningMessage);
                }

            } catch (e) {

                warningRequestRunning = false;
                console.error("Warning/Block Error:", e);

                alert("⚠️ Unable to process the warning right now. Please try again.");
            }

        }

        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "login.html";
        }

        // ===============================
        // LOGOUT WHEN STUDENT TAB IS CLOSED
        // Keep the session while moving between the Student pages, but clear the
        // student login when this browser tab/window is actually unloaded.
        // ===============================
        let keepStudentSessionOnUnload = false;

        function navigateStudentPage(url) {
            keepStudentSessionOnUnload = true;
            window.location.href = url;
        }

        // These are the only normal in-app navigations from this dashboard.
        // Mark them so pagehide does not treat navigation as closing the tab.
        document.addEventListener("click", function (event) {
            const btn = event.target.closest && event.target.closest("button");
            if (!btn) return;
            const text = (btn.getAttribute("aria-label") || btn.title || btn.textContent || "").toLowerCase();
            const onclick = btn.getAttribute("onclick") || "";
            if (onclick.includes("profile.html") || onclick.includes("admin.html")) {
                keepStudentSessionOnUnload = true;
            }
        }, true);

        window.addEventListener("pagehide", function () {
            if (keepStudentSessionOnUnload) return;
            try {
                localStorage.removeItem("token");
                localStorage.removeItem("studentToken");
                localStorage.removeItem("authToken");
                localStorage.removeItem("user");
                sessionStorage.removeItem("presenceTabId");
            } catch (e) {}
        });

        // ===============================
        // STUDENT ONLINE PRESENCE
        // Active tab = Online. Hidden tab = Offline.
        // Heartbeat about every 1 second; server timeout = 7 seconds.
        // ===============================

        let presenceTimer = null;
        let presenceInFlight = false;
        let presenceAbort = null;
        let lastHeartbeatAt = 0;
        // sessionStorage gives every browser tab its own stable presence id.
        const presenceId = sessionStorage.getItem("presenceTabId") || (
            (crypto.randomUUID ? crypto.randomUUID() : (Date.now() + "-" + Math.random()))
        );
        sessionStorage.setItem("presenceTabId", presenceId);

        async function sendPresenceHeartbeat() {
            if (!token || document.hidden || presenceInFlight) return;

            presenceInFlight = true;
            presenceAbort = new AbortController();
            // Allow normal Mongo/network/serverless latency. Keep the request alive
            // long enough so normal Vercel/Render cold starts do not cause
            // false Offline states.
            const timeout = setTimeout(() => presenceAbort.abort(), 5000);

            try {
                const res = await fetch("/api/auth/heartbeat", {
                    method: "POST",
                    headers: { "Authorization": "Bearer " + token, "X-Presence-Id": presenceId },
                    cache: "no-store",
                    signal: presenceAbort.signal
                });

                if (res.ok) {
                    lastHeartbeatAt = Date.now();
                }

                if (res.status === 401) {
                    const data = await res.json().catch(() => ({}));
                    stopPresence();
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    alert(data.message || "Your session was ended. Please login again.");
                    window.location.replace("login.html");
                    return;
                }
            } catch (error) {
                // A single missed heartbeat is okay. The next 1-second heartbeat retries.
            } finally {
                clearTimeout(timeout);
                presenceAbort = null;
                presenceInFlight = false;
            }
        }

        function stopPresence() {
            if (presenceTimer) {
                clearInterval(presenceTimer);
                presenceTimer = null;
            }
            if (presenceAbort) {
                try { presenceAbort.abort(); } catch (_) {}
                presenceAbort = null;
            }
        }

        function startPresence() {
            if (!token || document.hidden) return;
            stopPresence();
            sendPresenceHeartbeat();
            presenceTimer = setInterval(sendPresenceHeartbeat, 1000);
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                // Stop heartbeats. Do NOT force an immediate DB offline write here.
                // The server's 7-second lastSeen timeout is the single source of truth.
                stopPresence();
            } else {
                // Coming back to this tab: send heartbeat immediately.
                startPresence();
            }
        });

        window.addEventListener("pagehide", () => {
            // Do not mark offline immediately. The admin/server decides Offline
            // only after 7 seconds without a heartbeat. This prevents a real
            // active student from being shown Offline during tab/page changes.
            stopPresence();
        });

        // Initial state
        if (!document.hidden) startPresence();

        let wallet = 0;

        let totalEarn = 0;

        let quizReward = 0;

        let dailyReward = 0;

        let spinReward = 0;

        // Daily quiz progress: 100 answered questions are required for Spin.
        let dailyQuestionsAnswered = 0;
        let dailyQuestionsDate = "";
        let totalQuestionsAnswered = 0;

        let lastClaim = "";

        let lastSpin = "";

        // let spinCount = Number(localStorage.getItem("spinCount")) || 0;
        // let lastSpinDate = localStorage.getItem("lastSpinDate") || "";

        let quizData = [];
        let currentQuizQuestion = null;
        let lifelines = { fiftyFifty: true, audiencePoll: true, askExpert: true, skipQuestion: true };
        let lifelineBusy = false;

        async function syncLifelines(data) {
            if (data && data.lifelines) {
                lifelines = {
                    fiftyFifty: data.lifelines.fiftyFifty !== false,
                    audiencePoll: data.lifelines.audiencePoll !== false,
                    askExpert: data.lifelines.askExpert !== false,
                    skipQuestion: data.lifelines.skipQuestion !== false
                };
            }
            updateLifelineUI();
        }

        function updateLifelineUI() {
            const map = {
                fiftyFifty: 'lifeline5050',
                audiencePoll: 'lifelineAudience',
                askExpert: 'lifelineExpert',
                skipQuestion: 'lifelineSkip'
            };
            Object.keys(map).forEach(k => {
                const el = document.getElementById(map[k]);
                if (!el) return;
                const available = lifelines[k] !== false;
                el.disabled = !available || lifelineBusy;
                el.classList.toggle('used', !available);
            });
            const note = document.getElementById('lifelineCycleNote');
            if (note) note.textContent = `4 Lifelines • 500 questions પછી ફરી reset • Used: ${Object.values(lifelines).filter(v => !v).length}/4`;
        }

        function qIdForLifeline() {
            return currentQuizQuestion?._id || currentQuizQuestion?.id || null;
        }

        async function useLifeline(type) {
            if (lifelineBusy || !currentQuizQuestion || lifelines[type] === false) return;
            lifelineBusy = true;
            updateLifelineUI();
            try {
                const res = await fetch('/api/wallet/lifeline', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
                    },
                    body: JSON.stringify({ type, questionId: qIdForLifeline() })
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    alert(data.message || 'Lifeline use કરવામાં error આવ્યો.');
                    return;
                }
                await syncLifelines(data);
                const q = currentQuizQuestion;
                const buttons = Array.from(document.querySelectorAll('#options .option-btn'));

                if (type === 'fiftyFifty') {
                    const wrong = buttons.filter((_, i) => i !== Number(q.correct));
                    wrong.sort(() => Math.random() - 0.5).slice(0, 2).forEach(btn => {
                        btn.disabled = true;
                        btn.style.visibility = 'hidden';
                        btn.style.opacity = '0';
                        btn.dataset.lifelineHidden = '1';
                    });
                } else if (type === 'audiencePoll') {
                    const n = q.options.length;
                    const weights = q.options.map((_, i) => i === Number(q.correct) ? 55 + Math.floor(Math.random()*16) : 1 + Math.floor(Math.random()*15));
                    const total = weights.reduce((a,b)=>a+b,0);
                    const poll = document.createElement('div');
                    poll.className = 'kbc-poll';
                    poll.innerHTML = '<b>Audience Poll</b>' + weights.map((w,i)=>{
                        const pct = Math.max(1, Math.round(w/total*100));
                        return `<div class="kbc-poll-row"><span>${String.fromCharCode(65+i)}</span><div class="kbc-poll-bar"><div class="kbc-poll-fill" style="width:${pct}%"></div></div><span>${pct}%</span></div>`;
                    }).join('');
                    const old = document.querySelector('.kbc-poll'); if (old) old.remove();
                    document.getElementById('options').appendChild(poll);
                } else if (type === 'askExpert') {
                    const expert = document.createElement('div');
                    expert.className = 'kbc-poll';
                    expert.innerHTML = `<b>Expert says:</b> My strongest choice is <strong>Option ${String.fromCharCode(65 + Number(q.correct))}</strong>.`;
                    const old = document.querySelector('.kbc-poll'); if (old) old.remove();
                    document.getElementById('options').appendChild(expert);
                } else if (type === 'skipQuestion') {
                    quizData = quizData.filter(item => String(item?._id) !== String(q._id));
                    currentQuizQuestion = null;
                    const old = document.querySelector('.kbc-poll'); if (old) old.remove();
                    setTimeout(() => { if (!document.getElementById('quiz')?.classList.contains('hidden')) loadQuiz(); }, 120);
                }
            } catch (err) {
                console.error('Lifeline Error:', err);
                alert('Server સાથે connect થવામાં error આવ્યો.');
            } finally {
                lifelineBusy = false;
                updateLifelineUI();
            }
        }

        async function loadQuestionBank() {
            try {
                const currentToken = localStorage.getItem("token") || "";
                if (!currentToken) {
                    window.location.replace("login.html");
                    return [];
                }

                // Do not download the complete 100k+ question bank in the browser.
                // Fetch a small random batch so Start Quiz renders immediately.
                let list = [];
                try {
                    const res = await fetch("/api/questions/random?count=20", {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            "Authorization": "Bearer " + currentToken,
                            "Accept": "application/json"
                        }
                    });
                    const data = await res.json().catch(() => null);
                    if (res.ok && data && data.success) {
                        if (data.completed) {
                            quizData = [];
                            const qEl = document.getElementById("question");
                            const optEl = document.getElementById("options");
                            if (qEl) qEl.innerText = "🎉 બધા questions પૂરા થઈ ગયા છે!";
                            if (optEl) optEl.innerHTML = '<div style="padding:14px;text-align:center;color:#16a34a;font-weight:800;">આ student માટે Question Bankના બધા questions complete થઈ ગયા છે. Repeat question નહીં આવે.</div>';
                            return [];
                        }
                        if (Array.isArray(data.questions)) list = data.questions;
                    }
                } catch (apiErr) {
                    console.warn("Random question API unavailable.", apiErr);
                }

                quizData = list.filter(q => {
                    const correct = Number(q?.correct);
                    return q && typeof q.q === "string" && q.q.trim() &&
                        Array.isArray(q.options) && q.options.length >= 2 &&
                        Number.isInteger(correct) && correct >= 0 && correct < q.options.length;
                }).map(q => ({
                    _id: q._id,
                    q: String(q.q).trim(),
                    options: q.options.map(String),
                    correct: Number(q.correct)
                }));

                if (!quizData.length) throw new Error("Question bank is empty or invalid.");
                console.log("Quiz question bank loaded:", quizData.length);
                return quizData;
            } catch (err) {
                console.error("Question Bank Error:", err);
                quizData = [];
                const qEl = document.getElementById("question");
                const optEl = document.getElementById("options");
                if (qEl) qEl.innerText = "⚠️ Question load failed";
                if (optEl) optEl.innerHTML =
                    '<button type="button" class="btn" onclick="quizData=[];loadQuiz()">↻ Retry Questions</button>';
                return [];
            }
        }

        async function loadWallet(retry = 0) {

            // Always load the wallet from MongoDB using the current login token.
            // Do not depend on the cached localStorage user object for balance.
            const currentToken = localStorage.getItem("token");
            if (!currentToken) {
                window.location.replace("login.html");
                return false;
            }

            try {
                const res = await fetch("/api/wallet", {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        "Authorization": "Bearer " + currentToken,
                        "Accept": "application/json"
                    }
                });

                if (res.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.replace("login.html");
                    return false;
                }

                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || "Wallet could not be loaded");
                }

                wallet = Number(data.wallet || 0);
                lastClaim = data.lastClaim || "";
                lastSpin = data.lastSpin || "";
                totalEarn = Number(data.totalEarn || 0);
                quizReward = Number(data.quizScore || 0);
                dailyReward = Number(data.dailyReward || 0);
                spinReward = Number(data.spinReward || 0);
                dailyQuestionsAnswered = Number(data.dailyQuestionsAnswered || 0);
                spinCycleQuestionsAnswered = Number(data.spinCycleQuestionsAnswered ?? data.dailyQuestionsAnswered ?? 0);
                totalQuestionsAnswered = Number(data.totalQuestionsAnswered || 0);
                dailyQuestionsDate = data.dailyQuestionsDate || "";
                await syncLifelines(data);

                // Update every wallet display immediately.
                const walletEl = document.getElementById("wallet");
                if (walletEl) walletEl.textContent = wallet.toFixed(2);

                const quizWallet = document.getElementById("quizWallet");
                if (quizWallet) quizWallet.textContent = wallet.toFixed(2);

                checkWithdrawStatus();
                updateQuestionProgress();
                return true;

            } catch (err) {
                console.error("Wallet Load Error:", err);

                // A newly deployed Vercel function can take a moment to respond.
                // Retry a couple of times instead of leaving the student at ₹0.00.
                if (retry < 2) {
                    await new Promise(resolve => setTimeout(resolve, 700 * (retry + 1)));
                    return loadWallet(retry + 1);
                }
                return false;
            }
        }

        function applyWalletData(data) {
            wallet = Number(data.wallet || 0);
            totalEarn = Number(data.totalEarn || 0);
            quizReward = Number(data.quizScore || 0);
            dailyReward = Number(data.dailyReward || 0);
            spinReward = Number(data.spinReward || 0);
            dailyQuestionsAnswered = Number(data.dailyQuestionsAnswered || 0);
            spinCycleQuestionsAnswered = Number(data.spinCycleQuestionsAnswered ?? data.dailyQuestionsAnswered ?? 0);
            totalQuestionsAnswered = Number(data.totalQuestionsAnswered || 0);
            dailyQuestionsDate = data.dailyQuestionsDate || "";
            lastClaim = data.lastClaim || "";
            lastSpin = data.lastSpin || "";
            syncLifelines(data);

            document.getElementById("wallet").innerText = wallet.toFixed(2);

            // Quiz Wallet પણ Update કરો
            const quizWallet = document.getElementById("quizWallet");
            if (quizWallet) {
                quizWallet.innerText = wallet.toFixed(2);
            }

            document.querySelectorAll("#activityWalletBalance").forEach(el => {
                el.innerText = "₹" + wallet.toFixed(2);
            });

            checkWithdrawStatus();
            updateQuestionProgress();
        }

        async function claimDailyReward() {
            try {
                const res = await fetch("/api/wallet/daily-reward", {
                    method: "POST",
                    headers: { Authorization: "Bearer " + token }
                });

                const data = await res.json();

                if (!data.success) {
                    alert(data.message || "Daily Reward failed");
                    return;
                }

                applyWalletData(data);
                alert("🎁 Daily Reward મળ્યું! +₹" + Number(data.reward).toFixed(2));
            } catch (err) {
                console.error("Daily Reward Error:", err);
                alert("Server સાથે connect થવામાં error આવ્યો.");
            }
        }

        async function updateWallet(correct, questionId) {
            try {
                const res = await fetch("/api/wallet/quiz", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },
                    body: JSON.stringify({ correct: Boolean(correct), questionId, selectedIndex: window.__quizSelectedIndex ?? null, selectedAnswer: window.__quizSelectedAnswer ?? "" })
                });

                const data = await res.json();

                if (!data.success) {
                    if (data.repeated || res.status === 409 || /already answered|cannot be repeated|repeat/i.test(String(data.message || ""))) {
                        // Do not show the technical duplicate message to students.
                        return false;
                    }
                    alert(data.message || "Quiz reward failed");
                    return false;
                }

                applyWalletData(data);
                return true;
            } catch (err) {
                console.error("Quiz Reward Error:", err);
                alert("Server સાથે connect થવામાં error આવ્યો.");
                return false;
            }
        }


        // ===== Student Game Progress (local, lightweight, no quiz API changes) =====
        const GAME_KEY = 'aducate_game_progress_v1';
        function getGameProgress(){
            const today=new Date().toISOString().slice(0,10);
            let g={xp:0,level:1,streak:0,best:0,total:0,today:0,missionDate:today,missionClaimed:false};
            try{g={...g,...JSON.parse(localStorage.getItem(GAME_KEY)||'{}')}}catch(e){}
            if(g.missionDate!==today){g.today=0;g.missionDate=today;g.missionClaimed=false;}
            return g;
        }
        function saveGameProgress(g){localStorage.setItem(GAME_KEY,JSON.stringify(g));renderGameProgress(g)}
        function showGameToast(text,gold=false){const el=document.getElementById('gameToast');if(!el)return;el.textContent=text;el.className='game-toast'+(gold?' gold':'');void el.offsetWidth;el.classList.add('show')}
        function renderGameProgress(g=getGameProgress()){
            const level=Math.max(1,Math.floor(g.xp/100)+1), within=g.xp%100;
            g.level=level;
            const ids={gameLevel:`Level ${level}`,gameStreak:`${g.streak} 🔥`,gameToday:`${Math.min(20,g.today)}/20`,gameBest:String(g.best)};
            Object.entries(ids).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=v});
            const fill=document.getElementById('xpFill');if(fill)fill.style.width=within+'%';
            const xp=document.getElementById('xpText');if(xp)xp.textContent=`${within} / 100 XP • ${Math.max(0,100-within)} XP to next level`;
            document.querySelectorAll('.achievement[data-ach]').forEach(e=>e.classList.toggle('unlocked',g.total>=Number(e.dataset.ach)));
        }
        function gameCorrect(){
            const old=getGameProgress(), oldLevel=old.level;
            old.streak++;old.best=Math.max(old.best,old.streak);old.total++;old.today++;
            let gain=10 + Math.min(20,old.streak*2);
            if(old.streak>0 && old.streak%5===0)gain+=15;
            if(old.today===20 && !old.missionClaimed){gain+=25;old.missionClaimed=true;showGameToast('🎯 Daily Mission Complete! +25 XP',true)}
            old.xp+=gain;const newLevel=Math.floor(old.xp/100)+1;old.level=newLevel;saveGameProgress(old);
            if(newLevel>oldLevel){const el=document.getElementById('gameLevel');if(el){el.classList.remove('level-pop');void el.offsetWidth;el.classList.add('level-pop')}showGameToast(`🎉 LEVEL UP! You are Level ${newLevel}`,true)}
            else if(old.streak%5===0)showGameToast(`🔥 ${old.streak} STREAK! +${gain} XP`);
            else showGameToast(`✨ +${gain} XP`);
        }
        function gameWrong(){const g=getGameProgress();g.streak=0;saveGameProgress(g);showGameToast('💪 Keep going! Streak reset')}
        renderGameProgress();

        // ===== Adventure / Engagement Upgrade =====
        const ADVENTURE_KEY='aducate_adventure_v1';
        function adventureState(){
            const now=new Date(), start=new Date(now);
            const day=(now.getDay()+6)%7; start.setDate(now.getDate()-day);
            const week=start.toISOString().slice(0,10);
            let a={week,weekly:0,weeklyClaimed:false,chestClaimed:false,lucky:false,luckyDate:'',themes:1,activeTheme:1};
            try{a={...a,...JSON.parse(localStorage.getItem(ADVENTURE_KEY)||'{}')}}catch(e){}
            if(a.week!==week){a.week=week;a.weekly=0;a.weeklyClaimed=false;}
            const today=now.toISOString().slice(0,10); if(a.luckyDate!==today){a.lucky=false;a.luckyDate=today;}
            return a;
        }
        function saveAdventure(a){localStorage.setItem(ADVENTURE_KEY,JSON.stringify(a));renderAdventure(a)}
        function renderAdventure(a=adventureState()){
            const fill=document.getElementById('weeklyChallengeFill'); if(fill)fill.style.width=Math.min(100,a.weekly/75*100)+'%';
            const tx=document.getElementById('weeklyChallengeText'); if(tx)tx.textContent=Math.min(75,a.weekly)+' / 75 correct';
            const cs=document.getElementById('chestStatus'); if(cs)cs.textContent=a.chestClaimed?'Opened ✓':(getGameProgress().total>=10?'Ready to open!':'Unlocks at 10 Q');
            const ts=document.getElementById('themeStatus'); if(ts)ts.textContent=a.themes+' unlocked';
        }
        function openMysteryChest(){
            const a=adventureState(), g=getGameProgress();
            if(a.chestClaimed){showGameToast('🧰 Chest already opened — keep playing!');return;}
            if(g.total<10){showGameToast(`🔒 Answer ${10-g.total} more questions to unlock the chest.`);return;}
            const reward=[15,20,25,40][Math.floor(Math.random()*4)];
            g.xp+=reward; saveGameProgress(g); a.chestClaimed=true; saveAdventure(a);
            const t=document.getElementById('chestTitle'),p=document.getElementById('chestText'),m=document.getElementById('chestPop');
            if(t)t.textContent='🎉 You found a reward!'; if(p)p.textContent=`+${reward} XP added to your Quiz Journey. Keep going for the next unlock!`;
            if(m){m.classList.add('show');m.setAttribute('aria-hidden','false');}
        }
        function closeMysteryChest(){const m=document.getElementById('chestPop');if(m){m.classList.remove('show');m.setAttribute('aria-hidden','true')}}
        function startLuckyChallenge(){
            const a=adventureState();
            if(a.lucky){showGameToast('🍀 Lucky Round already used today!');return;}
            a.lucky=true;saveAdventure(a);
            showGameToast('🍀 LUCKY ROUND! Next 3 correct answers earn extra XP.',true);
            try{sessionStorage.setItem('aducateLuckyRound','3')}catch(e){}
            showScreen('quiz');
        }
        function showThemePicker(){
            const a=adventureState();
            if(a.themes<2 && getGameProgress().total>=50){a.themes=2;saveAdventure(a);showGameToast('🎨 New theme unlocked! Tap Themes again to activate it.',true);return;}
            if(a.themes<2){showGameToast(`🔒 Reach 50 answered questions to unlock a new theme.`);return;}
            a.activeTheme=a.activeTheme===2?1:2; saveAdventure(a);
            document.body.classList.toggle('adventure-theme',a.activeTheme===2);
            showGameToast(a.activeTheme===2?'🎨 Adventure Theme ON':'🎨 Classic Theme ON',true);
        }
        function applyAdventureTheme(){const a=adventureState();document.body.classList.toggle('adventure-theme',a.activeTheme===2);}
        const __oldGameCorrect=window.gameCorrect;
        // Wrap the existing correct-answer handler without changing quiz/server logic.
        window.gameCorrect=function(){
            const before=getGameProgress();
            __oldGameCorrect();
            const a=adventureState(); a.weekly++;
            let lucky=0; try{lucky=Number(sessionStorage.getItem('aducateLuckyRound')||0)}catch(e){}
            if(lucky>0){const g=getGameProgress();g.xp+=10;saveGameProgress(g);lucky--;try{sessionStorage.setItem('aducateLuckyRound',String(lucky))}catch(e){};showGameToast(`🍀 Lucky bonus +10 XP (${lucky} left)`,true)}
            if(a.weekly>=75 && !a.weeklyClaimed){a.weeklyClaimed=true;const g=getGameProgress();g.xp+=50;saveGameProgress(g);showGameToast('🏁 Weekly Challenge Complete! +50 XP',true)}
            saveAdventure(a);
        };
        renderAdventure(); applyAdventureTheme();

        function updateQuestionProgress() {
            // Today's total answer count never resets after Spin.
            const todayCount = Number(dailyQuestionsAnswered || 0);
            const count = Math.min(100, Number(spinCycleQuestionsAnswered || 0));

            // Lifelines use a separate 500-question lifetime cycle.
            // The number shown above the question is the NEXT question's
            // position inside the current 500-question lifeline cycle.
            const totalAnswered = Math.max(0, Number(totalQuestionsAnswered || 0));
            const cycleQuestionNumber = (totalAnswered % 500) + 1;
            const cycleLabel = document.getElementById("questionCycleLabel");
            if (cycleLabel) {
                cycleLabel.textContent = `Q COUNT • ${cycleQuestionNumber} / 500`;
            }
            const remaining = 100 - count;

            const remainBox = document.getElementById("remainingQuestions");

            if (remainBox) {
                remainBox.innerText = remaining;
            }
            const progress = document.getElementById("questionProgress");
            const spinBtn = document.getElementById("spinBtn");

            if (progress) {
                progress.innerText = `Today's Questions: ${todayCount}` + (todayCount >= 100 ? ` | Spin Cycle: ${count} / 100` : ` / 100`);
            }

            if (spinBtn) {
                const unlocked = count >= 100;

                spinBtn.disabled = !unlocked;

                if (unlocked) {
                    spinBtn.innerText = "🎡 Spin Wheel — UNLOCKED";
                    spinBtn.style.opacity = "1";
                    spinBtn.style.cursor = "pointer";
                } else {
                    spinBtn.innerText =
                        `🔒 Spin Wheel — ${100 - count} Questions Left`;
                    spinBtn.style.opacity = "0.65";
                    spinBtn.style.cursor = "not-allowed";
                }
            }
        }

        function checkWithdrawStatus() {
            document.getElementById("withdrawBtn").disabled = (wallet < 1000);
            updateQuestionProgress();
        }

        // Screen navigation with browser/mobile back support
        let currentScreen = 'dashboard';
        let navigatingBack = false;

        function setScreenVisibility(id) {
            ['dashboard', 'quiz', 'activities', 'activityPlay'].forEach(screenId => {
                const el = document.getElementById(screenId);
                if (!el) return;
                const active = screenId === id;
                el.classList.toggle('hidden', !active);
                el.style.display = active ? '' : 'none';
                el.style.visibility = active ? 'visible' : 'hidden';
                el.setAttribute('aria-hidden', active ? 'false' : 'true');
            });
        }

        function enterQuizFullscreen() {
            const el = document.getElementById("quiz");
            if (!el) return;
            document.body.classList.add("kbc-fullscreen-active");
            if (document.fullscreenElement) return;
            try {
                const request = el.requestFullscreen || el.webkitRequestFullscreen;
                if (request) {
                    const result = request.call(el);
                    if (result && typeof result.catch === "function") result.catch(() => {});
                }
            } catch (_) {}
        }

        function exitQuizFullscreen() {
            document.body.classList.remove("kbc-fullscreen-active");
            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    const result = document.exitFullscreen();
                    if (result && typeof result.catch === "function") result.catch(() => {});
                }
            } catch (_) {}
        }

        document.addEventListener("fullscreenchange", () => {
            if (!document.fullscreenElement && currentScreen === "quiz") {
                document.body.classList.add("kbc-fullscreen-active");
            }
        });

        function showScreen(id, pushHistory = true) {
            if (!document.getElementById(id) && id !== 'activityPlay') {
                return;
            }

            if (pushHistory && !navigatingBack && currentScreen !== id) {
                history.pushState({ appScreen: id }, '', '#'+id);
            }

            currentScreen = id;
            setScreenVisibility(id);
            if (id === 'quiz') enterQuizFullscreen();
            else exitQuizFullscreen();

            if (id === 'quiz') {
                const qw = document.getElementById("quizWallet");
                if (qw) qw.innerText = wallet.toFixed(2);
                loadQuiz();
            }

            if (id === 'activities') {
                if (typeof renderActivities === 'function') renderActivities();
                updateActivityWallet();
            }

            if (id === 'activityPlay') {
                if (typeof renderCurrentActivity === 'function') renderCurrentActivity();
                updateActivityWallet();
            }
        }

        function updateActivityWallet() {
            const amount = Number(typeof wallet !== 'undefined' ? wallet : 0);
            document.querySelectorAll('#activityWalletBalance').forEach(el => {
                el.textContent = '₹' + amount.toFixed(2);
            });
        }

        // Browser/mobile system Back button
        window.addEventListener('popstate', function () {
            navigatingBack = true;
            const hash = (location.hash || '#dashboard').replace('#', '');
            const target = hash || 'dashboard';

            // Activity play -> activity list -> dashboard
            if (target === 'dashboard' || target === 'activities' || target === 'quiz') {
                showScreen(target, false);
            } else {
                history.replaceState({ appScreen: 'dashboard' }, '', '#dashboard');
                showScreen('dashboard', false);
            }

            navigatingBack = false;
        });

        // Start with dashboard without creating an extra history entry.
        window.addEventListener('DOMContentLoaded', function () {
            const initial = (location.hash || '#dashboard').replace('#', '');
            showScreen(
                ['dashboard','quiz','activities','activityPlay'].includes(initial) ? initial : 'dashboard',
                false
            );
        });

        // ==========================================
        // RELOAD QUESTION WHEN STUDENT CHANGES TAB
        // ==========================================
        let tabWasChanged = false;
        let tabChangedScreen = null;

        document.addEventListener("visibilitychange", async () => {
            if (document.hidden) {
                const quizOpen = !document.getElementById("quiz")?.classList.contains("hidden");
                const activityOpen = !document.getElementById("activityPlay")?.classList.contains("hidden");
                if (quizOpen || activityOpen) {
                    tabWasChanged = true;
                    tabChangedScreen = activityOpen ? "activity" : "quiz";
                    recordSecurityEvent("tab_change");
                    if (activityOpen && typeof activityType !== "undefined" && activityType) {
                        fetch("/api/activities/"+encodeURIComponent(activityType)+"/tab-change", {
                            method:"POST", headers:{Authorization:"Bearer "+localStorage.getItem("token")}
                        }).catch(()=>{});
                    }
                }
                return;
            }

            if (!tabWasChanged) return;
            tabWasChanged = false;

            if (tabChangedScreen === "quiz" && !document.getElementById("quiz")?.classList.contains("hidden")) {
                document.getElementById("question").innerText = "Loading new question...";
                document.getElementById("options").innerHTML = "";
                await loadQuiz();
            }

            if (tabChangedScreen === "activity" && !document.getElementById("activityPlay")?.classList.contains("hidden")) {
                const oldId = activityQuestions?.[activityIndex]?.id;
                const res = await fetch("/api/activities/"+encodeURIComponent(activityType), {
                    headers:{Authorization:"Bearer "+localStorage.getItem("token")}
                }).catch(()=>null);
                if (res && res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.questions) && data.questions.length) {
                        activityQuestions = data.questions;
                        const candidates = activityQuestions.filter(q => q.id !== oldId);
                        activityIndex = Math.floor(Math.random() * (candidates.length ? candidates.length : activityQuestions.length));
                        if (candidates.length) {
                            const selected = candidates[activityIndex];
                            const realIndex = activityQuestions.findIndex(q => q.id === selected.id);
                            activityIndex = realIndex >= 0 ? realIndex : 0;
                        }
                        arrangeWords=[];
                        renderActivity();
                        updateActivityWallet();
                    }
                }
            }
            tabChangedScreen = null;
        });


        async function spinWheel() {
            try {
                const res = await fetch("/api/wallet/spin", {
                    method: "POST",
                    headers: { Authorization: "Bearer " + token }
                });

                const data = await res.json();

                if (!data.success) {
                    alert(data.message || "Spin failed");
                    applyWalletData(data);
                    return;
                }

                applyWalletData(data);

                alert(
                    "Congratulations! 🎉\n\n" +
                    "Spin પર તમને ₹" + Number(data.prize).toFixed(2) + " મળ્યા!\n\n" +
                    "Spin #" + Number(data.spinCount || 0) + " complete.\n" +
                    "હવે ફરી 100 પ્રશ્નો પૂરા કરો અને ફરી Spin કરો."
                );
            } catch (err) {
                console.error("Spin Error:", err);
                alert("Server સાથે connect થવામાં error આવ્યો.");
            }
        }

        async function submitWithdraw() {

            const paymentMethod = document.getElementById("paymentMethod").value;

            const upiId = document.getElementById("upiId").value;

            const bankName = document.getElementById("bankName").value;

            const accountHolderName =
                document.getElementById("accountHolderName").value;

            const accountNumber =
                document.getElementById("accountNumber").value;

            const ifscCode =
                document.getElementById("ifscCode").value;

            try {

                const res = await fetch("/api/wallet/withdraw", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },

                    body: JSON.stringify({

                        amount: wallet,

                        paymentMethod,

                        upiId,

                        bankName,

                        accountHolderName,

                        accountNumber,

                        ifscCode

                    })

                });

                const data = await res.json();

                if (data.success) {

                    closeWithdrawPopup();

                    applyWalletData(data);

                    alert("Withdraw Request Submitted");

                } else {

                    alert(data.message);

                }

            } catch (err) {

                console.log(err);

            }

        }

        let quizLoading = false;
        let quizQuestionRequest = 0;

        async function loadQuiz() {
            if (quizLoading) return;
            quizLoading = true;
            const requestId = ++quizQuestionRequest;

            const questionEl = document.getElementById("question");
            const optDiv = document.getElementById("options");

            if (questionEl) questionEl.innerText = "⏳ Loading question...";
            if (optDiv) optDiv.innerHTML = '<div style="padding:14px;text-align:center;color:#64748b;font-weight:700;">Please wait...</div>';

            try {
                if (!quizData.length) {
                    await loadQuestionBank();
                }

                if (!quizData.length) {
                    if (questionEl) questionEl.innerText = "⚠️ No questions available.";
                    if (optDiv) optDiv.innerHTML = "";
                    return;
                }

                // Prevent an old async request from replacing a newer question.
                if (requestId !== quizQuestionRequest) return;

                const q = quizData[Math.floor(Math.random() * quizData.length)];
                if (!q || !Array.isArray(q.options) || q.options.length < 2) {
                    throw new Error("Invalid question received.");
                }

                currentQuizQuestion = q;
                updateQuestionProgress();
                const oldPoll = document.querySelector('.kbc-poll');
                if (oldPoll) oldPoll.remove();
                updateLifelineUI();

                if (questionEl) questionEl.innerText = String(q.q);
                questionStartTime = Date.now();
                optDiv.innerHTML = "";

                q.options.forEach((o, i) => {
                    const b = document.createElement("button");
                    b.className = "option-btn";
                    b.type = "button";
                    b.innerText = String(o);
                    b.setAttribute("data-option", String.fromCharCode(65 + i));
                    b.onclick = async () => {
                        if (b.disabled) return;

                        optDiv.querySelectorAll("button").forEach(btn => {
                            btn.disabled = true;
                        });

                        const timeTaken = (Date.now() - questionStartTime) / 1000;

                        if (timeTaken < 1.5) {
                            await recordSecurityEvent("fast_answer");
                            await blockStudent("વાંચી ને જવાબ આપવાનો છે ઓછા સમય માં જવાબ આપ્યો છે.");
                            return;
                        }

                        const isCorrect = i === Number(q.correct);
                        window.__quizSelectedIndex = i;
                        window.__quizSelectedAnswer = String(q.options[i] ?? "");
                        const saved = await updateWallet(isCorrect, q._id);
                        window.__quizSelectedIndex = null;
                        window.__quizSelectedAnswer = "";

                        if (!saved) {
                            // A duplicate answer is never shown as an error to the student.
                            // Remove the question from the local batch and immediately move on.
                            quizData = quizData.filter(item => String(item?._id) !== String(q._id));
                            if (!quizData.length) {
                                await loadQuestionBank();
                            }
                            if (quizData.length) {
                                setTimeout(() => {
                                    if (!document.getElementById("quiz")?.classList.contains("hidden")) loadQuiz();
                                }, 50);
                            }
                            return;
                        }

                        // IMPORTANT: remove the answered question from the in-memory batch
                        // immediately. Otherwise random selection can show the same question
                        // again before the next API request.
                        quizData = quizData.filter(item => String(item?._id) !== String(q._id));

                        const buttons = optDiv.querySelectorAll(".option-btn");
                        buttons.forEach(btn => btn.disabled = true);

                        buttons.forEach((btn, index) => {
                            if (index === Number(q.correct)) {
                                btn.style.background = "#22c55e";
                                btn.style.color = "#fff";
                                btn.style.border = "3px solid #16a34a";
                                btn.innerHTML = "✅ " + q.options[index];
                            }

                            if (index === i && !isCorrect) {
                                btn.style.background = "#ef4444";
                                btn.style.color = "#fff";
                                btn.style.border = "3px solid #dc2626";
                                btn.innerHTML = "❌ " + q.options[index];
                            }
                        });

                        startWarningMonitor();
                        if (isCorrect) gameCorrect(); else gameWrong();

                        setTimeout(() => {
                            if (!document.getElementById("quiz")?.classList.contains("hidden")) {
                                loadQuiz();
                            }
                        }, 1500);
                    };
                    optDiv.appendChild(b);
                });
            } catch (err) {
                console.error("Quiz Render Error:", err);
                if (questionEl) questionEl.innerText = "⚠️ Question display error";
                if (optDiv) {
                    optDiv.innerHTML =
                        '<div style="padding:14px;text-align:center;color:#dc2626;font-weight:700;">' +
                        (err.message || "Question could not be displayed.") +
                        '</div>' +
                        '<button type="button" class="btn" onclick="quizData=[];loadQuiz()">↻ Retry</button>';
                }
            } finally {
                quizLoading = false;
            }
        }


        // ==========================================
        // INTERACTIVE ENGLISH EARNING ACTIVITIES
        // ==========================================
        let activityType='', activityQuestions=[], activityIndex=0, activityData=null, arrangeWords=[];
        function showActivityScreen(id){
            ['dashboard','quiz','activities','activityPlay'].forEach(x=>{const e=document.getElementById(x);if(e){e.classList.toggle('hidden',x!==id);e.style.visibility=x===id?'visible':'hidden';e.setAttribute('aria-hidden',x===id?'false':'true');}});
        }
        async function openActivity(type){
            // Open the activity screen immediately. Do not wait for the API.
            activityType = type;
            activityQuestions = [];
            activityIndex = 0;
            arrangeWords = [];

            const titles = {
                arrange:'🔀 Arrange Sentence',
                fill:'🧩 Fill in the Blank',
                correction:'🛠️ Fix the Sentence',
                translate:'🔄 Translate to English',
                word:'🔤 Word Builder',
                listening:'🎧 Listen & Type',
                speaking:'🎤 Speak & Earn',
                reading:'📖 Reading Challenge'
            };
            const rewards = {
                arrange:10, fill:10, correction:15, translate:15,
                word:5, listening:15, speaking:20, reading:15
            };

            const nameEl=document.getElementById('activityName');
            const metaEl=document.getElementById('activityMeta');
            const box=document.getElementById('activityContent');
            const fb=document.getElementById('activityFeedback');

            if(nameEl) nameEl.textContent=titles[type] || 'English Activity';
            if(metaEl) metaEl.textContent='💰 Earn up to '+(rewards[type]||10)+' points';
            if(box) box.innerHTML='<div class="activity-question">⏳ Loading questions...</div>';
            if(fb) fb.textContent='';

            // Use the normal navigation so mobile/browser Back works.
            showScreen('activityPlay');

            try{
                const token=localStorage.getItem('token') || localStorage.getItem('studentToken') || '';
                const res=await fetch('/api/activities/'+encodeURIComponent(type),{
                    method:'GET',
                    headers: token ? {Authorization:'Bearer '+token} : {}
                });

                let data={};
                try { data=await res.json(); } catch(e){}

                if(!res.ok || !data.success){
                    throw new Error(data.message || ('Unable to load '+type+' activity'));
                }

                activityQuestions=Array.isArray(data.questions)?data.questions:[];
                activityData=data;

                if(!activityQuestions.length){
                    throw new Error('આ activity માટે હાલ questions ઉપલબ્ધ નથી.');
                }

                activityIndex=Math.floor(Math.random()*activityQuestions.length);
                arrangeWords=[];

                if(nameEl) nameEl.textContent=data.title || titles[type];
                if(metaEl) metaEl.textContent='💰 +'+Number(data.reward*100).toFixed(0)+' points • Today limit '+data.dailyLimit;
                renderActivity();
                updateActivityWallet();
            }catch(e){
                console.error('Activity load error:',e);
                if(box){
                    box.innerHTML=
                        '<div class="activity-question">⚠️ Questions load થઈ શક્યા નથી.</div>'+
                        '<p style="text-align:center;color:#64748b">'+
                        'Please login again and try this activity.</p>'+
                        '<button class="activity-action" type="button" onclick="openActivity('+JSON.stringify(type)+')">↻ Try Again</button>';
                }
                if(fb) fb.textContent=e.message || 'Activity load failed';
            }
        }
        function nextActivityQuestion(){ if(!activityQuestions.length)return; activityIndex=(activityIndex+1)%activityQuestions.length; arrangeWords=[]; renderActivity(); }
        function renderActivity(){
            const q=activityQuestions[activityIndex], box=document.getElementById('activityContent'), fb=document.getElementById('activityFeedback'); fb.textContent='';
            if(activityType==='arrange'){
                const words=q.prompt.split('/').map(x=>x.trim()).sort(()=>Math.random()-.5); arrangeWords=[];
                box.innerHTML='<div class="activity-question">Arrange these words:</div><div class="word-bank" id="wordBank"></div><div class="answer-box" id="arranged">Tap words in the correct order</div><button class="activity-action" onclick="submitArrange()">✅ Check Sentence</button><button class="activity-action" style="background:#64748b" onclick="renderActivity()">↻ Reset</button>';
                const wb=document.getElementById('wordBank'); words.forEach((w,i)=>{const b=document.createElement('button');b.className='word-chip';b.textContent=w;b.onclick=()=>{arrangeWords.push(w);b.disabled=true;document.getElementById('arranged').textContent=arrangeWords.join(' ')};wb.appendChild(b)});
            } else if(activityType==='fill'){
                box.innerHTML='<div class="activity-question">'+q.prompt+'</div>'+q.options.map((o,i)=>`<button type="button" class="activity-option" data-activity-answer="${encodeURIComponent(o)}">${o}</button>`).join('');
            } else if(activityType==='correction'||activityType==='translate'||activityType==='word'){
                box.innerHTML='<div class="activity-question">'+q.prompt+'</div><input id="activityAnswer" class="activity-input" placeholder="Type your answer here" autocomplete="off"><button class="activity-action" onclick="submitTypedActivity()">💰 Submit & Earn</button>';
            } else if(activityType==='listening'){
                box.innerHTML='<div class="activity-question">🎧 Listen carefully and type the sentence</div><button class="activity-action" onclick="speakCurrent()">🔊 Play Audio</button><input id="activityAnswer" class="activity-input" placeholder="Type what you hear" autocomplete="off"><button class="activity-action" onclick="submitTypedActivity()">💰 Submit & Earn</button>';
            } else if(activityType==='speaking'){
                box.innerHTML='<div class="activity-question">🎤 '+q.prompt+'</div><button class="activity-action" onclick="startSpeaking()">🎙️ Start Speaking</button><div class="mic-status" id="micStatus">Microphone permission may be required.</div><button class="activity-action" onclick="submitSpeaking()">💰 Submit & Earn</button>';
            } else if(activityType==='reading'){
                box.innerHTML='<div class="passage">'+q.passage+'</div><div class="activity-question">'+q.prompt+'</div>'+q.options.map((o,i)=>`<button type="button" class="activity-option" data-activity-answer="${encodeURIComponent(o)}">${o}</button>`).join('');
            }
        }
        function setFeedback(ok,msg){const e=document.getElementById('activityFeedback');e.textContent=msg;e.style.color=ok?'#16a34a':'#dc2626';}
        async function submitArrange(){submitActivity(arrangeWords.join(' '));}
        async function submitTypedActivity(){const e=document.getElementById('activityAnswer');if(!e||!e.value.trim()){setFeedback(false,'Answer લખો.');return}submitActivity(e.value.trim());}
        async function submitActivity(answer){
            const q=activityQuestions[activityIndex];
            try{
                const res=await fetch('/api/activities/'+activityType+'/submit',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem('token')},body:JSON.stringify({questionId:q.id,answer})});
                const data=await res.json(); if(!data.success){setFeedback(false,data.message||'Try again');return}
                applyWalletData(data);
                if(data.correct){setFeedback(true,'🎉 Correct! +'+(data.reward*100).toFixed(0)+' points earned. Wallet: ₹'+Number(data.wallet).toFixed(2));}
                else{setFeedback(false,'❌ Wrong. Correct answer: '+(data.correctAnswer||'Try again'));}
                setTimeout(()=>nextActivityQuestion(),1200);
            }catch(e){setFeedback(false,'Network error. Please try again.');}
        }
        let spokenText='';
        function startSpeaking(){
            const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
            if(!SR){document.getElementById('micStatus').textContent='Speech recognition is not supported in this browser. Try Chrome.';return;}
            const r=new SR();r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;
            document.getElementById('micStatus').textContent='🎙️ Listening... speak now';
            r.onresult=e=>{spokenText=e.results[0][0].transcript||'';document.getElementById('micStatus').textContent='You said: '+spokenText};
            r.onerror=e=>document.getElementById('micStatus').textContent='Microphone error: '+e.error;
            r.onend=()=>{if(!spokenText)document.getElementById('micStatus').textContent='No speech detected. Try again.'};r.start();
        }
        function submitSpeaking(){if(!spokenText){setFeedback(false,'પહેલા Englishમાં બોલો.');return}submitActivity(spokenText);spokenText='';}
        function speakCurrent(){const q=activityQuestions[activityIndex];const u=new SpeechSynthesisUtterance(q.answer);u.lang='en-US';u.rate=.82;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);}
        loadQuestionBank();
        // Wallet is fetched from the server; do not overwrite it with the initial 0.
        loadWallet();
        // Disable right click
        document.addEventListener("contextmenu", e => e.preventDefault());

        // Disable text selection
        document.addEventListener("selectstart", e => e.preventDefault());

        // Disable copy, cut and paste
        ["copy", "cut", "paste"].forEach(event => {
            document.addEventListener(event, e => e.preventDefault());
        });

        // Disable common shortcut keys
        document.addEventListener("keydown", function (e) {
            // Ctrl+Shift+Alt+Z unlocks the developer-tools guard for this tab.
            // After unlock, browser DevTools shortcuts work normally.
            if (document.documentElement.dataset.devUnlocked === "1") return;

            if (
                e.ctrlKey &&
                ["c", "u", "s", "a", "p"].includes(e.key.toLowerCase())
            ){
                e.preventDefault();
            }

            // Disable F12
            if (e.key === "F12") e.preventDefault();

            // Disable Ctrl+Shift+I / J / C
            if (
                e.ctrlKey &&
                e.shiftKey &&
                ["I", "J", "C"].includes(e.key.toUpperCase())
            ) {
                e.preventDefault();
            }
        });

        // Open Withdraw Popup
        function openWithdrawPopup() {

            document.getElementById("withdrawPopup").style.display = "flex";

            document.getElementById("withdrawAmountText").innerText =
                "Withdraw Amount : ₹" + wallet;

            changePaymentMethod();
        }

        // Close Popup
        function closeWithdrawPopup() {
            document.getElementById("withdrawPopup").style.display = "none";
        }

        // Show / Hide Payment Fields
        function changePaymentMethod() {

            const method = document.getElementById("paymentMethod").value;

            document.getElementById("upiSection").style.display =
                method === "UPI" ? "block" : "none";

            document.getElementById("bankSection").style.display =
                method === "Bank" ? "block" : "none";
        }
        // Refresh the authoritative wallet once the page UI is ready.
        loadWallet();

        async function claimBonus() {
    try {
        const token = localStorage.getItem("studentToken") || localStorage.getItem("token");

        // Guest click: do nothing. Never show “Please login first.” for the bonus button.
        if (!token) return;

        const response = await fetch("/api/bonus/claim", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        // Read the response only once. The previous code tried to read
        // response.clone() after response.json(), which throws when the
        // server returns a normal 400/401 error and caused the misleading
        // "Something went wrong" message.
        const contentType = response.headers.get("content-type") || "";
        let data = {};
        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { message: text || "Server returned an unexpected response." };
        }

        if (!response.ok || data.success === false) {
            // Keep the real server message visible instead of falling into
            // the generic catch block.
            if (data.forceLogout) {
                localStorage.removeItem("studentToken");
                localStorage.removeItem("token");
            }

            alert(data.message || "🎁 Bonus is not unlocked yet.");
            return;
        }

        if (typeof applyWalletData === "function") {
            applyWalletData(data);
        } else if (data.wallet != null) {
            const walletEl = document.getElementById("wallet");
            if (walletEl) walletEl.textContent = "₹" + Number(data.wallet).toFixed(2);
        }

        // Immediately update the bonus button so it cannot be claimed twice.
        const bonusBtn = document.getElementById("bonusBtn");
        if (bonusBtn) {
            bonusBtn.disabled = true;
            bonusBtn.textContent = "✅ Bonus Claimed";
        }

        alert(
            "🎉 Mystery Bonus Claimed!\n\n" +
            "🎁 Reward: ₹" + Number(data.reward || 0).toFixed(2) + "\n" +
            "📌 Bonus Source: " + (data.source === "quiz" ? "Quiz" : "Learning") + "\n\n" +
            "💰 Reward તમારા Wallet માં add થઈ ગયો છે."
        );

    } catch (error) {
        console.error("Bonus Error:", error);
        alert(
            "❌ Bonus claim failed.\n\n" +
            (error && error.message ? error.message : "Please try again later.")
        );
    }
}
        async function loadBonusStatus(){
            const token = localStorage.getItem("studentToken") || localStorage.getItem("token");
            if(!token) return;
            try{
                const r=await fetch("/api/bonus/status",{headers:{Authorization:"Bearer "+token},cache:"no-store"});
                if(!r.ok)return;
                const d=await r.json(); const b=d.bonus||{};
                const btn=document.getElementById("bonusBtn");
                if(btn){
                    btn.textContent=b.unlocked ? "🎉 Claim Mystery Bonus" : "🎁 Mystery Bonus";
                    btn.disabled=!!b.claimed;
                    btn.title=b.unlocked?"Mystery Bonus unlocked!":"Keep answering correctly in Quiz or Learning.";
                }
            }catch(e){}
        }
        loadBonusStatus();

        function toggleTheme() {
            document.body.classList.toggle("dark");

            const btn = document.getElementById("themeBtn");

            if (document.body.classList.contains("dark")) {
                btn.innerHTML = "☀️";
            } else {
                btn.innerHTML = "🌙";
            }
        }

    