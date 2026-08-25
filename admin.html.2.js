


        // ===== Compact Admin Main Menu =====
        function showAdminSection(name){
            const map={
                dashboard:'adminSectionDashboard',
                users:'adminSectionUsers',
                withdrawals:'adminSectionWithdrawals',
                deleted:'adminSectionDeleted',
                command:'adminSectionCommand',
                questions:'adminSectionQuestions'
            };
            Object.keys(map).forEach(k=>{
                const el=document.getElementById(map[k]);
                if(el) el.classList.toggle('admin-section-hidden',k!==name);
            });
            document.querySelectorAll('.admin-main-menu button[data-admin-section]').forEach(b=>b.classList.toggle('active',b.dataset.adminSection===name));
            if(name==='users' && typeof loadUsers==='function') loadUsers();
            if(name==='withdrawals' && typeof loadWithdraws==='function') loadWithdraws();
            if(name==='deleted' && typeof loadDeletedUsers==='function') loadDeletedUsers();
            if(name==='command' && typeof ap2Refresh==='function') ap2Refresh();
            if(name==='questions' && typeof loadQuestions==='function') loadQuestions();
        }
        window.addEventListener('DOMContentLoaded',()=>showAdminSection('users'));

        const token = localStorage.getItem("adminToken");

        if (!token) {
            location.replace("admin-login.html");
        }

        // ==========================================
        // ADMIN TOKEN / SESSION HANDLER
        // If the JWT expires or becomes invalid,
        // do NOT show "Invalid Token" alerts from
        // every API call. Send admin back to login.
        // ==========================================
        let sessionExpiredHandled = false;
        const originalFetch = window.fetch.bind(window);

        window.fetch = async function (...args) {
            const response = await originalFetch(...args);

            // Only handle unauthorized API responses.
            if (response.status === 401 && !sessionExpiredHandled) {
                sessionExpiredHandled = true;

                localStorage.removeItem("adminToken");

                // Redirect immediately to admin login.
                location.replace("admin-login.html?session=expired");

                // Stop the current function before it can show
                // the backend "Invalid Token" alert.
                return new Promise(() => { });
            }

            return response;
        };

        let allUsers = [];

        //==========================
        // Dashboard
        //==========================

        async function loadDashboard() {
            try {
                const res = await fetch("/api/admin/dashboard?_=" + Date.now(), {
                    cache: "no-store",
                    headers: { Authorization: "Bearer " + token }
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || "Dashboard data load failed");

                const setValue = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = String(value ?? 0);
                };
                setValue("totalUsers", Number(data.totalUsers || 0));
                setValue("wallet", Number(data.totalWallet || 0).toFixed(2));
                setValue("earn", Number(data.totalEarn || 0).toFixed(2));
                setValue("totalQuestions", Number(data.totalQuestionsAnswered || 0));
                setValue("questionBankTotal", Number(data.questionBankTotal || 0));
                setValue("withdraw", Number(data.pendingWithdraw || 0));
            } catch (err) {
                console.error("Dashboard load error:", err);
            }
        }

        async function loadBookAdminSummary(){
            try{
                const res=await fetch("/api/admin/book-summary?_="+Date.now(),{cache:"no-store",headers:{Authorization:"Bearer "+token}});
                const d=await res.json(); if(!res.ok||!d.success) return;
                const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v;};
                set("bookStatPurchases",d.totalPurchases||0); set("bookStatPending",d.pending||0); set("bookStatVerified",d.verified||0); set("bookStatRevenue","₹"+Number(d.revenueVerified||0).toFixed(0));
            }catch(e){console.warn("Book summary",e)}
        }

        //==========================
        // Load Users
        //==========================

        async function loadUsers() {

            const res = await fetch("/api/admin/users?_=" + Date.now(), {
                cache: "no-store",
                headers: {

                    Authorization: "Bearer " + token

                }

            });

            const data = await res.json();

            if (!data.success) {

                alert(data.message);

                return;

            }

            allUsers = data.users || [];
            try {
                const br = await fetch("/api/book-purchases/admin/users?_=" + Date.now(), { cache:"no-store", headers:{ Authorization:"Bearer " + token } });
                const bd = await br.json();
                const bm = new Map((bd.users || []).map(x => [String(x.userId), x.purchase]));
                allUsers.forEach(u => { u.bookPurchase = bm.get(String(u._id)) || null; });
            } catch(e) { console.warn("Book access data load failed", e); }

            showUsers(allUsers);
            updateOnlineUsersCount();
            loadBookAdminSummary();

        }

        //==========================
        // last seen format
        //==========================
        function formatLastSeen(lastSeen) {

            if (!lastSeen) {
                return "<span style='color:#dc2626;font-weight:bold;'>🔴 Never</span>";
            }

            const diff = Date.now() - new Date(lastSeen).getTime();

            if (diff <= 7000) {
                return "<span style='color:#16a34a;font-weight:bold;'>🟢 Online</span>";
            }

            const date = new Date(lastSeen);

            const datePart = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });

            const timePart = date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });

            return `
        <span style="color:#dc2626;font-weight:bold;">
            🔴 ${datePart}<br>${timePart}
        </span>
    `;
        }
        //==========================
        // Show Users
        //==========================

        function showUsers(users) {
            // Show students with the highest wallet balance first.
            // Use a copy so filtering/searching does not mutate allUsers.
            users = [...(users || [])].sort((a, b) => {
                const walletA = Number(a?.wallet || 0);
                const walletB = Number(b?.wallet || 0);
                return walletB - walletA;
            });

            const container = document.getElementById("userCards");
            if (!container) return;
            if (!users.length) {
                container.innerHTML = '<div class="admin-user-empty">👥 No users found.</div>';
                return;
            }

            container.innerHTML = users.map(user => {
                const lastSeenMs = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
                const isOnline = lastSeenMs > 0 && (Date.now() - lastSeenMs) <= 7000;
                const spinRemaining = Math.max(0, 100 - Number(user.spinCycleQuestionsAnswered ?? user.dailyQuestionsAnswered ?? 0));
                const warnings = Number(user.warningCount || 0);
                const statusClass = isOnline ? 'is-online' : 'is-offline';
                return `
                <article class="admin-user-card ${statusClass}" data-user-id="${user._id}" onclick="focusUserCard('${user._id}')">
                    <div class="admin-user-card-head">
                        <div class="admin-user-identity">
                            <span class="admin-status-dot"></span>
                            <div>
                                <div class="admin-user-name">${user.name || 'Student'}</div>
                                <div class="admin-user-mobile">📱 ${user.mobile || '-'}</div>
                            </div>
                        </div>
                        <span class="admin-user-status">${isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>

                    <div class="admin-user-lastseen">${isOnline ? '🟢 Active now' : '🔴 ' + formatLastSeen(user.lastSeen)}</div>

                    <div class="admin-user-stats">
                        <div class="admin-stat"><span>Wallet</span><strong>₹${Number(user.wallet || 0).toFixed(2)}</strong></div>
                        <div class="admin-stat"><span>Today</span><strong>${Number(user.dailyQuestionsAnswered || 0)}</strong></div>
                        <div class="admin-stat"><span>Total</span><strong>${Number(user.totalQuestionsAnswered || 0)}</strong></div>
                        <div class="admin-stat"><span>Spin Left</span><strong>${spinRemaining}</strong></div>
                        <div class="admin-stat"><span>Warnings</span><strong class="${warnings >= 4 ? 'danger' : 'warning'}">⚠️ ${warnings}/4</strong></div>
                        <div class="admin-stat"><span>Total Earn</span><strong>₹${Number(user.totalEarn || 0).toFixed(2)}</strong></div>
                        <div class="admin-stat"><span>🎁 Bonus</span><strong>${user.bonus?.unlocked ? '🔓 UNLOCKED' : (Number(user.bonus?.progress || 0) + '/' + Number(user.bonus?.target || 0))}</strong></div>
                    </div>

                    <div class="admin-user-actions" onclick="event.stopPropagation()">
                        <button onclick="showStudentCredentials('${user._id}')" class="purple" title="Student ID & Password">🔐 ID & Password</button>
                        <button onclick="editWallet('${user._id}',${user.wallet || 0})" title="Edit Wallet">💰 Wallet</button>
                        <button onclick="editTotalEarn('${user._id}',${user.totalEarn || 0})" class="gold" title="Edit Total Earn">✏️ Earn</button>
                        <button onclick='sendNotification("${user._id}", ${JSON.stringify(user.name || "Student").replace(/'/g, "&#39;")})' class="blue" title="Send Notification">🔔 Notify</button>
                        <button onclick="showActivityStats('${user._id}')" class="purple" title="English Learning Activity">📚 Activity</button>
                        <button onclick="showBonusDetails('${user._id}')" class="gold" title="Mystery Bonus Details">🎁 Bonus</button>
                        <button onclick="deleteUser('${user._id}')" class="red" title="Delete User">⛔ Delete</button>
                        ${user.isBlocked ? `<button onclick="unblockUser('${user._id}')" class="green" title="Unblock User">🟢 Unblock</button>` : ''}
                        <div class="admin-book-actions">
                          <button class="admin-book-show" onclick="adminShowBook('${user._id}')">📖 Show Book</button>
                          <button class="admin-book-close" onclick="adminCloseBook('${user._id}')">📕 Close Book</button>
                          ${user.bookPurchase?.status==='student_confirmed' ? `<button class="admin-book-decline" onclick="adminDeclineBook('${user._id}')">🚫 Decline</button>` : ''}
                        </div>
                        <div class="admin-book-status ${user.bookPurchase?.status==='student_confirmed'?'admin-book-pending':user.bookPurchase?.status==='admin_verified'?'admin-book-verified':'admin-book-none'}">${user.bookPurchase ? (user.bookPurchase.status==='admin_verified' ? (user.bookPurchase.accessGranted ? '📖 BOOK ACCESS: ACTIVE' : '🔒 BOOK ACCESS: CLOSED') : (user.bookPurchase.status==='rejected' ? '🚫 PAYMENT REQUEST: DECLINED' : '⏳ PAYMENT: PENDING VERIFY')) : '📚 BOOK: NOT PURCHASED'}</div>
                    </div>
                </article>`;
            }).join('');
        }

        //==========================
        // Student ID & Password
        //==========================
        async function showStudentCredentials(id) {
            const user = allUsers.find(u => String(u._id) === String(id));
            if (!user) return;

            const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const modal = document.createElement('div');
            modal.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.68);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;';
            modal.innerHTML = `<div style="width:min(520px,100%);background:var(--surface,#fff);color:var(--text,#111);border-radius:20px;padding:22px;box-shadow:0 25px 80px rgba(0,0,0,.35)">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
                <div><h2 style="margin:0">🔐 Student Login Details</h2><div style="color:#64748b;margin-top:4px">Give these details to the student if they forget them.</div></div>
                <button type="button" onclick="this.closest('.admin-credential-modal').remove()" style="background:#ef4444!important;color:#fff!important;border:0;border-radius:10px;padding:8px 12px">✕</button>
              </div>
              <div id="adminCredentialBody" style="margin-top:18px">
                <div style="padding:18px;text-align:center;color:#64748b">Loading secure credentials...</div>
              </div>
            </div>`;
            modal.className='admin-credential-modal';
            document.body.appendChild(modal);

            const body = modal.querySelector('#adminCredentialBody');
            try {
                const res = await fetch('/api/admin/credentials/' + encodeURIComponent(id) + '?_=' + Date.now(), {
                    cache:'no-store', headers:{Authorization:'Bearer ' + token}
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Unable to load credentials');

                body.innerHTML = `<div style="display:grid;gap:12px">
                  <div style="padding:14px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff"><div style="font-size:12px;color:#64748b;font-weight:800">STUDENT ID / LOGIN ID</div><div style="font-size:22px;font-weight:900;margin-top:4px;word-break:break-all">${safe(data.studentId || data.loginId || user.mobile || '-')}</div></div>
                  <div style="padding:14px;border:1px solid #dcfce7;border-radius:14px;background:#f0fdf4"><div style="font-size:12px;color:#64748b;font-weight:800">PASSWORD</div><div style="font-size:22px;font-weight:900;margin-top:4px;word-break:break-all">${data.passwordAvailable ? safe(data.password) : '<span style="color:#dc2626;font-size:15px">Old password cannot be recovered.</span>'}</div></div>
                  ${data.passwordAvailable ? '<div style="font-size:12px;color:#64748b">This password is recovered from the encrypted Admin credential store. It is not stored as plain text in the database.</div>' : '<button type="button" class="btn-warning" onclick="resetStudentPassword(\'' + id + '\', this)">🔄 Generate New Password</button>'}
                </div>`;
            } catch (err) {
                body.innerHTML = `<div style="padding:14px;border-radius:12px;background:#fef2f2;color:#b91c1c">${safe(err.message)}</div>`;
            }
        }

        async function changeStudentPassword(id, button) {
            const password = prompt('Enter the new password for this student (minimum 4 characters):');
            if (password === null) return;
            if (password.trim().length < 4) { alert('Password must be at least 4 characters.'); return; }
            button.disabled = true;
            try {
                const res = await fetch('/api/admin/credentials/' + encodeURIComponent(id) + '/change', { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer ' + token}, body:JSON.stringify({password:password.trim()}) });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Password change failed');
                const body = button.closest('.admin-credential-modal').querySelector('#adminCredentialBody');
                const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
                body.innerHTML = `<div style="display:grid;gap:12px"><div style="padding:14px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff"><div style="font-size:12px;color:#64748b;font-weight:800">STUDENT ID / LOGIN ID</div><div style="font-size:22px;font-weight:900">${safe(data.studentId)}</div></div><div style="padding:14px;border:1px solid #dcfce7;border-radius:14px;background:#f0fdf4"><div style="font-size:12px;color:#64748b;font-weight:800">NEW PASSWORD</div><div style="font-size:24px;font-weight:900;letter-spacing:1px">${safe(data.password)}</div></div><div style="padding:12px;border-radius:12px;background:#fff7ed;color:#9a3412;font-weight:700">✅ Password changed. The old password is no longer valid.</div></div>`;
            } catch (err) { alert(err.message); button.disabled = false; }
        }

        async function resetStudentPassword(id, button) {
            if (!confirm('Generate a new password for this student? The old password will stop working.')) return;
            button.disabled = true;
            try {
                const res = await fetch('/api/admin/credentials/' + encodeURIComponent(id) + '/reset', {
                    method:'POST', headers:{Authorization:'Bearer ' + token}
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Password reset failed');
                const body = button.closest('.admin-credential-modal').querySelector('#adminCredentialBody');
                const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
                body.innerHTML = `<div style="display:grid;gap:12px">
                  <div style="padding:14px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff"><div style="font-size:12px;color:#64748b;font-weight:800">STUDENT ID / LOGIN ID</div><div style="font-size:22px;font-weight:900">${safe(data.studentId)}</div></div>
                  <div style="padding:14px;border:1px solid #dcfce7;border-radius:14px;background:#f0fdf4"><div style="font-size:12px;color:#64748b;font-weight:800">NEW PASSWORD</div><div style="font-size:24px;font-weight:900;letter-spacing:1px">${safe(data.password)}</div></div>
                  <div style="padding:12px;border-radius:12px;background:#fff7ed;color:#9a3412;font-weight:700">⚠️ The previous password is no longer valid. Give this new password to the student.</div>
                </div>`;
            } catch (err) {
                alert(err.message);
                button.disabled = false;
            }
        }

        //==========================
        // Mystery Bonus Details
        //==========================
        function showBonusDetails(id) {
            const user = allUsers.find(u => String(u._id) === String(id));
            if (!user) return;
            const b = user.bonus || {};
            const sourceLabel = b.source === 'quiz' ? '📚 Quiz' : b.source === 'learning' ? '🎮 Learning' : '—';
            const typeLabel = b.lastQuestionType || '—';
            const safe = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
            const modal=document.createElement('div');
            modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
            modal.innerHTML=`<div style="width:min(620px,100%);max-height:90vh;overflow:auto;background:var(--surface,#fff);color:var(--text,#111);border-radius:18px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.3)">
              <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h2 style="margin:0">🎁 Mystery Bonus</h2><button type="button" onclick="this.closest('div[style*=fixed]').remove()" style="border:0;background:#ef4444;color:#fff;border-radius:10px;padding:8px 12px;cursor:pointer">✕</button></div>
              <p><b>Student:</b> ${safe(user.name)} &nbsp; <b>Mobile:</b> ${safe(user.mobile)}</p>
              <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
                <div style="padding:12px;border-radius:12px;background:#eef2ff"><b>Progress</b><div style="font-size:22px;font-weight:900">${Number(b.progress||0)} / ${Number(b.target||0)}</div></div>
                <div style="padding:12px;border-radius:12px;background:#ecfdf5"><b>Status</b><div style="font-size:18px;font-weight:900">${b.claimed ? '💰 CLAIMED' : b.unlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}</div></div>
                <div style="padding:12px;border-radius:12px;background:#fef3c7"><b>Quiz Correct</b><div style="font-size:20px;font-weight:900">${Number(b.quizProgress||0)}</div></div>
                <div style="padding:12px;border-radius:12px;background:#fce7f3"><b>Learning Correct</b><div style="font-size:20px;font-weight:900">${Number(b.learningProgress||0)}</div></div>
              </div>
              <div style="margin-top:12px;padding:13px;border-radius:12px;background:#f8fafc"><b>Bonus Trigger Source:</b> ${sourceLabel}<br><b>Learning Type:</b> ${safe(typeLabel)}<br><b>Reward:</b> ₹${Number(b.reward||0).toFixed(2)}</div>
              <div style="margin-top:12px;padding:13px;border-radius:12px;background:#f8fafc"><b>Last Correct Answer That Advanced Bonus:</b><div style="margin-top:7px;line-height:1.5">${safe(b.lastQuestionText || 'No correct answer recorded yet.')}</div></div>
              <p style="margin:12px 0 0;color:#64748b;font-size:12px">Admin can see whether the hidden bonus progress came from Quiz or English Learning. The hidden target is never shown to the student.</p>
            </div>`;
            document.body.appendChild(modal);
        }

        //==========================
        // English Learning Activity Stats
        //==========================
        function showActivityStats(id) {
            const user = allUsers.find(u => String(u._id) === String(id));
            if (!user) return;
            const stats = user.activityStats || {};
            const names = {
                arrange:'🔀 Arrange Sentence', fill:'🧩 Fill in the Blank', correction:'🛠️ Fix the Sentence',
                translate:'🔄 Translate to English', word:'🔤 Word Builder', listening:'🎧 Listen & Type',
                speaking:'🎤 Speak & Earn', reading:'📖 Reading Challenge'
            };
            const keys = Object.keys(names);
            const rows = keys.map(k => {
                const count=Number((stats.counts||{})[k]||0), correct=Number((stats.correct||{})[k]||0), wrong=Number((stats.wrong||{})[k]||0);
                const earn=Number((stats.earn||{})[k]||0), deduct=Number((stats.deduct||{})[k]||0), tabs=Number((stats.tabChanges||{})[k]||0);
                return `<tr><td>${names[k]}</td><td>${count}</td><td style="color:#15803d;font-weight:700">${correct}</td><td style="color:#dc2626;font-weight:700">${wrong}</td><td><span style="display:inline-block;min-width:70px;text-align:center;padding:4px 8px;border-radius:8px;background:#dcfce7;color:#166534;font-weight:800">+₹${earn.toFixed(2)}</span></td><td><span style="display:inline-block;min-width:70px;text-align:center;padding:4px 8px;border-radius:8px;background:#fee2e2;color:#b91c1c;font-weight:800">-₹${deduct.toFixed(2)}</span></td><td>${tabs}</td></tr>`;
            }).join('');
            const modal=document.createElement('div');
            modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';
            modal.innerHTML=`<div style="background:#fff;width:min(1000px,96vw);max-height:90vh;overflow:auto;border-radius:18px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.25)">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px"><div><h2 class="activity-stats-modal-title" style="margin:0">📚 English Learning & Earning</h2><div class="activity-stats-student">👤 ${String(user.name||'Student')} &nbsp;•&nbsp; 📱 ${String(user.mobile||'')}</div></div><button id="closeActivityStats" style="font-size:20px">✕</button></div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px">
                  <div class="activity-stats-today" style="padding:12px;border-radius:12px"><b>📅 Today Activities</b><div style="font-size:22px">${keys.reduce((n,k)=>n+Number((stats.counts||{})[k]||0),0)}</div></div>
                  <div class="activity-stats-earn" style="padding:12px;border-radius:12px"><b>💚 Activity Earn</b><div style="font-size:22px;font-weight:900">+₹${keys.reduce((n,k)=>n+Number((stats.earn||{})[k]||0),0).toFixed(2)}</div></div>
                  <div class="activity-stats-deduct" style="padding:12px;border-radius:12px"><b>❤️ Activity Deduct</b><div style="font-size:22px;font-weight:900">-₹${keys.reduce((n,k)=>n+Number((stats.deduct||{})[k]||0),0).toFixed(2)}</div></div>
                </div>
                <div style="overflow:auto"><table class="activity-stats-table" style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:9px">Activity</th><th>Attempts</th><th>Correct</th><th>Wrong</th><th>Earn</th><th>Deduct</th><th>Tab Changes</th></tr></thead><tbody>${rows}</tbody></table></div>
            </div>`;
            document.body.appendChild(modal);
            modal.querySelector('#closeActivityStats').onclick=()=>modal.remove();
            modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
        }

        function isUserOnlineNow(user) {
            const t = user?.lastSeen ? new Date(user.lastSeen).getTime() : 0;
            return t > 0 && (Date.now() - t) <= 7000;
        }

        function updateOnlineUsersCount() {
            const count = allUsers.filter(isUserOnlineNow).length;
            const el = document.getElementById("onlineUsersCount");
            if (el) el.textContent = count;
            const ap2 = document.getElementById("ap2Online");
            if (ap2) ap2.textContent = count;
            renderOnlineUsersList();
            return count;
        }

        function renderOnlineUsersList() {
            const list = document.getElementById("onlineUsersList");
            if (!list) return;
            const onlineUsers = allUsers.filter(isUserOnlineNow).sort((a,b) => {
                const at = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
                const bt = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
                return bt - at;
            });
            if (!onlineUsers.length) {
                list.innerHTML = '<div class="users-online-empty">No student is online right now.</div>';
                return;
            }
            list.innerHTML = onlineUsers.map(user => `
                <button class="users-online-name-item" type="button" onclick="openOnlineStudent('${user._id}')">
                    <span class="dot">●</span>${escapeHtml(user.name || 'Student')}
                </button>
            `).join('');
        }

        function toggleOnlineUsersList() {
            renderOnlineUsersList();
        }

        function openOnlineStudent(id) {
            const list = document.getElementById("onlineUsersList");
            if (list) list.hidden = true;
            const usersSection = document.getElementById("adminSectionUsers");
            if (typeof showAdminSection === "function") showAdminSection("users");
            const search = document.getElementById("search");
            if (search) search.value = "";
            // Render all users so the selected student's actual card is available.
            showUsers(allUsers);
            setTimeout(() => focusUserCard(id), 100);
        }

        function showOnlineUsers() {
            const onlineUsers = allUsers.filter(isUserOnlineNow);
            const usersSection = document.getElementById("adminSectionUsers");
            if (typeof showAdminSection === "function") showAdminSection("users");
            showUsers(onlineUsers);
            const search = document.getElementById("search");
            if (search) search.value = "";
            setTimeout(() => usersSection?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
            updateOnlineUsersCount();
        }

        function focusUserCard(id) {
            if (typeof showAdminSection === "function") showAdminSection("users");
            const card = document.querySelector(`.admin-user-card[data-user-id="${CSS.escape(String(id))}"]`);
            if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "center" });
                card.style.outline = "4px solid #2563eb";
                setTimeout(() => card.style.outline = "", 1800);
            } else {
                const user = allUsers.find(u => String(u._id) === String(id));
                if (user) {
                    showUsers([user]);
                    setTimeout(() => document.querySelector(`.admin-user-card[data-user-id="${CSS.escape(String(id))}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
                }
            }
        }

        //==========================
        // Search
        //==========================

        function searchUser() {
            const value = document
                .getElementById("search")
                .value
                .trim()
                .toLowerCase();

            const filtered = allUsers.filter(user => {

                const name = String(user.name || "").toLowerCase();
                const mobile = String(user.mobile || "").toLowerCase();

                return name.includes(value) || mobile.includes(value);
            });

            showUsers(filtered);
        }
        //==========================
        // Send Push Notification
        //==========================
        async function checkPushConfiguration() {
            try {
                const res = await fetch("/api/admin/notification/status", {
                    headers: { Authorization: "Bearer " + token }
                });
                const data = await res.json();
                if (!res.ok || !data.configured) {
                    alert("❌ Admin notifications are not configured on the server.\n\nVercel Environment Variables માં VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY અને VAPID_SUBJECT add કરો, પછી redeploy કરો.");
                    return false;
                }
                return true;
            } catch (err) {
                console.error("Push config check error:", err);
                alert("❌ Notification server configuration check failed.");
                return false;
            }
        }

        async function sendNotification(userId, userName) {
            if (!(await checkPushConfiguration())) return;

            const title = prompt("Notification Title", "New Notification");
            if (title === null) return;

            const cleanTitle = title.trim();
            if (!cleanTitle) {
                alert("Notification title is required.");
                return;
            }

            const message = prompt("Notification Message for " + userName, "");
            if (message === null) return;

            const cleanMessage = message.trim();
            if (!cleanMessage) {
                alert("Notification message is required.");
                return;
            }

            if (!confirm(
                "Send this notification only to " + userName + "?\n\n" +
                cleanTitle + "\n" + cleanMessage
            )) return;

            try {
                const res = await fetch("/api/admin/notification/send/" + userId, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },
                    body: JSON.stringify({
                        title: cleanTitle,
                        message: cleanMessage,
                        url: "/earn.html"
                    })
                });

                const data = await res.json();

                if (data.success) {
                    alert(
                        "✅ Notification sent successfully.\n" +
                        "Devices reached: " + (data.devicesSent || 0)
                    );
                } else {
                    alert("❌ " + (data.message || "Notification failed"));
                }
            } catch (err) {
                console.error("Notification Error:", err);
                alert("❌ Server error while sending notification.");
            }
        }

        //==========================
        // Edit Wallet
        //==========================

        async function editWallet(id, currentWallet) {

            const amount = prompt("Enter New Wallet", currentWallet);

            if (amount == null) return;
            if (isNaN(amount)) {

                alert("Enter Valid Number");

                return;

            }

            await fetch("/api/admin/wallet/" + id, {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: "Bearer " + token

                },

                body: JSON.stringify({

                    wallet: Number(amount)

                })

            });

            loadUsers();

            loadDashboard();

        }

        //==========================
        // Edit Total Earn
        //==========================

        async function editTotalEarn(id, currentTotalEarn) {
            const amount = prompt("Enter New Total Earn", Number(currentTotalEarn || 0).toFixed(2));
            if (amount == null) return;

            const value = Number(amount);
            if (!Number.isFinite(value) || value < 0) {
                alert("Enter Valid Number");
                return;
            }

            const res = await fetch("/api/admin/total-earn/" + id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({ totalEarn: value })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Total Earn update failed");
                return;
            }

            await loadUsers();
            await loadDashboard();
        }

        //==========================
        // Question Bank
        //==========================

        let questionPage = 1;
        const questionLimit = 20;
        let questionTotalPages = 1;
        const questionCache = {};
        let repeatedMode = false;

        async function importQuestionsJson() {
            const ok = confirm(
                "questions.json ના નવા questions Question Bank માં add કરવા છે?\n\n" +
                "Existing/repeated questions automatically skip થશે."
            );
            if (!ok) return;

            try {
                const res = await fetch("/api/questions/admin/import-json", {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || "questions.json import failed");
                    return;
                }

                alert(
                    "✅ Import Complete!\n\n" +
                    "New Questions: " + Number(data.added || 0) + "\n" +
                    "Skipped: " + Number(data.skipped || 0) + "\n" +
                    "Total Question Bank: " + Number(data.total || 0)
                );

                questionPage = 1;
                await loadQuestions();
                await loadDashboard();
            } catch (err) {
                console.error("Import JSON Error:", err);
                alert("Server સાથે connect થવામાં error આવ્યો.");
            }
        }

        async function loadQuestions() {
            repeatedMode = false;
            document.getElementById("repeatInfo").innerText = "";
            const search = document.getElementById("questionSearch").value.trim();
            const res = await fetch(
                "/api/questions/admin?page=" + questionPage +
                "&limit=" + questionLimit +
                "&search=" + encodeURIComponent(search),
                { headers: { Authorization: "Bearer " + token } }
            );

            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Could not load questions");
                return;
            }

            questionTotalPages = Number(data.totalPages || 1);
            const startNumber = (questionPage - 1) * questionLimit;

            document.getElementById("questionInfo").innerText =
                `Showing ${data.questions.length ? startNumber + 1 : 0}-${startNumber + data.questions.length} of ${data.total} questions | Page ${questionPage}/${questionTotalPages}`;

            const html = (data.questions || []).map((question, index) => {
                questionCache[question._id] = question;
                const options = (question.options || []).map((option, i) =>
                    `<div style="${i === Number(question.correct) ? 'font-weight:800;text-decoration:underline;' : ''}">${i + 1}. ${escapeHtml(option)}</div>`
                ).join("");

                const optionCards = (question.options || []).map((option, i) =>
                    `<div class="admin-question-option ${i === Number(question.correct) ? 'correct' : ''}">${i === Number(question.correct) ? '✅ ' : ''}${i + 1}. ${escapeHtml(option)}</div>`
                ).join("");
                return `<article class="admin-question-card">
                    <div class="admin-question-number">Question #${startNumber + index + 1}</div>
                    <div class="admin-question-text">${escapeHtml(question.q)}</div>
                    <div class="admin-question-options">${optionCards}</div>
                    <div class="admin-question-meta">✅ Correct Answer: Option ${Number(question.correct) + 1}</div>
                    <div class="admin-question-actions">
                        <button onclick="openQuestionEditorById('${question._id}')" style="background:#22c55e;">✏️ Edit Question</button>
                        <button onclick="deleteQuestion('${question._id}')" style="background:#ef4444;">🗑️ Delete</button>
                    </div>
                </article>`;
            }).join("");

            document.getElementById("questionTable").innerHTML = html ||
                `<tr><td colspan="5">No questions found.</td></tr>`;
        }

        async function showRepeatedQuestions() {
            repeatedMode = true;
            questionPage = 1;
            const res = await fetch("/api/questions/admin/repeated", {
                headers: { Authorization: "Bearer " + token }
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Could not find repeated questions");
                return;
            }

            const groups = data.groups || [];
            document.getElementById("repeatInfo").innerText =
                groups.length
                    ? `🔁 ${groups.length} repeated question group(s) found • ${data.repeatedCount} total repeated entries`
                    : "✅ No repeated questions found.";

            const rows = [];
            groups.forEach((group, groupIndex) => {
                (group.questions || []).forEach((question, index) => {
                    questionCache[question._id] = question;
                    const options = (question.options || []).map((option, i) =>
                        `<div style="${i === Number(question.correct) ? 'font-weight:800;text-decoration:underline;' : ''}">${i + 1}. ${escapeHtml(option)}</div>`
                    ).join("");

                    const optionCards = (question.options || []).map((option, i) =>
                        `<div class="admin-question-option ${i === Number(question.correct) ? 'correct' : ''}">${i === Number(question.correct) ? '✅ ' : ''}${i + 1}. ${escapeHtml(option)}</div>`
                    ).join("");
                    rows.push(`<article class="admin-question-card">
                        <div class="admin-question-number">Repeated Group ${groupIndex + 1} • Copy ${index + 1}/${group.count}</div>
                        <div class="admin-question-text">${escapeHtml(question.q)}</div>
                        <div class="admin-question-options">${optionCards}</div>
                        <div class="admin-question-meta">✅ Correct Answer: Option ${Number(question.correct) + 1}</div>
                        <div class="admin-question-actions">
                            <button onclick="openQuestionEditorById('${question._id}')" style="background:#22c55e;">✏️ Edit Question</button>
                            <button onclick="deleteQuestion('${question._id}')" style="background:#ef4444;">🗑️ Delete</button>
                        </div>
                    </article>`);
                });
            });

            document.getElementById("questionInfo").innerText =
                `Showing repeated questions only: ${data.repeatedCount || 0} entries`;
            document.getElementById("questionTable").innerHTML = rows.join("") ||
                `<tr><td colspan="5">No repeated questions found.</td></tr>`;
        }

        async function removeRepeatedQuestions() {
            const checkRes = await fetch("/api/questions/admin/repeated", {
                headers: { Authorization: "Bearer " + token }
            });
            const checkData = await checkRes.json();

            if (!checkRes.ok || !checkData.success) {
                alert(checkData.message || "Could not check repeated questions");
                return;
            }

            if (!checkData.repeatedCount) {
                document.getElementById("repeatInfo").innerText = "✅ No repeated questions found.";
                alert("No repeated questions found.");
                return;
            }

            const ok = confirm(
                `Found ${checkData.repeatedCount} entries in ${checkData.duplicateGroups} repeated group(s).\n\n` +
                `Click OK to keep ONE copy of each question and move the extra repeated copies to the Recycle Bin.`
            );
            if (!ok) return;

            const res = await fetch("/api/questions/admin/repeated/remove", {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || "Could not remove repeated questions");
                return;
            }

            alert(`Done! ${data.deleted} repeated question(s) moved to Recycle Bin. One copy of each question was kept.`);
            document.getElementById("repeatInfo").innerText = "✅ Repeated questions removed; one copy kept for each question.";
            questionPage = 1;
            await loadQuestions();
            await loadDashboard();
        }

        async function permanentDeleteUser(id) {
            if (!confirm(
                "⚠️ Permanently delete this student?\n\n" +
                "This will remove the student from Recycle Bin and database permanently. This cannot be undone."
            )) return;

            try {
                const res = await fetch("/api/admin/permanent-delete-user/" + id, {
                    method: "DELETE",
                    headers: { Authorization: "Bearer " + token }
                });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    alert(data.message || "Permanent delete failed");
                    return;
                }
                alert("✅ Student permanently deleted.");
                await loadDeletedUsers();
                await loadUsers();
                await loadDashboard();
            } catch (err) {
                console.error("Permanent Delete Error:", err);
                alert("❌ " + err.message);
            }
        }

        function escapeHtml(value) {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function changeQuestionPage(direction) {
            const next = questionPage + direction;
            if (next < 1 || next > questionTotalPages) return;
            questionPage = next;
            loadQuestions();
        }

        function openQuestionEditorById(id) {
            openQuestionEditor(questionCache[id] || null);
        }

        function openQuestionEditor(question = null) {
            document.getElementById("questionModalTitle").innerText = question ? "Edit Question" : "Add Question";
            document.getElementById("editQuestionId").value = question?._id || "";
            document.getElementById("questionText").value = question?.q || "";

            for (let i = 0; i < 4; i++) {
                document.getElementById("option" + i).value = question?.options?.[i] || "";
            }

            const correct = Number(question?.correct ?? 0);
            document.querySelectorAll('input[name="correctOption"]').forEach(radio => {
                radio.checked = Number(radio.value) === correct;
            });

            document.getElementById("questionModal").classList.add("show");
        }

        function closeQuestionEditor(event) {
            if (event && event.target !== document.getElementById("questionModal")) return;
            document.getElementById("questionModal").classList.remove("show");
        }

        async function saveQuestion() {
            const id = document.getElementById("editQuestionId").value.trim();
            const q = document.getElementById("questionText").value.trim();
            const options = [0, 1, 2, 3]
                .map(i => document.getElementById("option" + i).value.trim())
                .filter(Boolean);
            const selected = document.querySelector('input[name="correctOption"]:checked');
            const correct = selected ? Number(selected.value) : 0;

            if (!q || options.length < 2) {
                alert("Question and at least 2 options are required.");
                return;
            }

            if (correct >= options.length) {
                alert("Please select a correct option that has text.");
                return;
            }

            const url = id ? "/api/questions/admin/" + id : "/api/questions/admin";
            const method = id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({ q, options, correct })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Question save failed");
                return;
            }

            document.getElementById("questionModal").classList.remove("show");
            await loadQuestions();
            await loadDashboard();
            alert(id ? "Question updated successfully." : "Question added successfully.");
        }

        async function deleteQuestion(id) {
            if (!confirm("Delete this question?")) return;

            const res = await fetch("/api/questions/admin/" + id, {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token }
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Question delete failed");
                return;
            }

            await loadQuestions();
            await loadDashboard();
        }

        async function loadQuestionRecycleBin() {
            const box = document.getElementById("questionRecycleBin");
            const table = document.getElementById("questionRecycleTable");
            const info = document.getElementById("questionRecycleInfo");
            if (!box || !table) return;

            box.style.display = "block";
            table.innerHTML = `<div class="admin-question-card">Loading...</div>`;

            try {
                const res = await fetch("/api/questions/admin/recycle-bin", {
                    headers: { Authorization: "Bearer " + token }
                });
                const data = await res.json();

                if (!res.ok || !data.success) {
                    table.innerHTML = `<div class="admin-question-card deleted">${escapeHtml(data.message || "Failed to load Question Recycle Bin")}</div>`;
                    return;
                }

                const questions = data.questions || [];
                info.innerText = `${questions.length} deleted question(s) in Recycle Bin`;

                table.innerHTML = questions.map((question, index) => {
                    const deletedAt = question.deletedAt
                        ? new Date(question.deletedAt).toLocaleString("en-IN")
                        : "-";
                    const optionCards = (question.options || []).map((option, i) =>
                        `<div class="admin-question-option ${i === Number(question.correct) ? 'correct' : ''}">${i === Number(question.correct) ? '✅ ' : ''}${i + 1}. ${escapeHtml(option)}</div>`
                    ).join("");
                    return `<article class="admin-question-card deleted">
                        <div class="admin-question-number">Deleted Question #${index + 1}</div>
                        <div class="admin-question-text">${escapeHtml(question.q)}</div>
                        <div class="admin-question-options">${optionCards}</div>
                        <div class="admin-question-meta">🗑️ Deleted: ${escapeHtml(deletedAt)}</div>
                        <div class="admin-question-actions">
                            <button onclick="restoreQuestion('${question._id}')" style="background:#16a34a;">♻️ Restore</button>
                            <button onclick="permanentDeleteQuestion('${question._id}')" style="background:#dc2626;">🗑️ Permanent Delete</button>
                        </div>
                    </article>`;
                }).join("") || `<tr><td colspan="4">Question Recycle Bin is empty.</td></tr>`;
            } catch (err) {
                console.error("Question Recycle Bin Error:", err);
                table.innerHTML = `<div class="admin-question-card deleted">Failed to load Question Recycle Bin</div>`;
            }
        }

        async function restoreQuestion(id) {
            if (!confirm("Restore this question to the Question Bank?")) return;
            const res = await fetch("/api/questions/admin/recycle-bin/" + id + "/restore", {
                method: "PUT",
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Question restore failed");
                return;
            }
            await loadQuestions();
            await loadQuestionRecycleBin();
            await loadDashboard();
            alert("✅ Question restored to Question Bank.");
        }

        async function permanentDeleteQuestion(id) {
            if (!confirm("⚠️ Permanently delete this question?\n\nThis cannot be undone.")) return;
            const res = await fetch("/api/questions/admin/recycle-bin/" + id + "/permanent", {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Permanent delete failed");
                return;
            }
            await loadQuestionRecycleBin();
            await loadDashboard();
            alert("✅ Question permanently deleted.");
        }

        async function permanentDeleteAllQuestions() {
            if (!confirm("⚠️ Permanently delete ALL questions currently in the Question Recycle Bin?\n\nThis cannot be undone.")) return;
            const res = await fetch("/api/questions/admin/recycle-bin", {
                method: "DELETE",
                headers: { Authorization: "Bearer " + token }
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.message || "Permanent delete all failed");
                return;
            }
            await loadQuestionRecycleBin();
            await loadDashboard();
            alert(`✅ ${Number(data.deleted || 0)} question(s) permanently deleted.`);
        }

        async function resetAllStudentQuestionProgress() {
            if (!confirm("⚠️ Reset question progress for ALL students?\n\nThis will allow every student to receive previously answered questions again.")) return;
            if (!confirm("Final confirmation: reset ALL students' answered-question history?")) return;
            try {
                const res = await fetch("/api/questions/admin/reset-student-progress", {
                    method: "PUT",
                    headers: { Authorization: "Bearer " + token }
                });
                const data = await res.json();
                if (!res.ok || !data.success) { alert(data.message || "Question reset failed"); return; }
                alert("✅ " + data.message);
            } catch (err) { alert("Question reset failed: " + err.message); }
        }

        //==========================
        // Book Access Controls
        //==========================
        async function adminShowBook(id){
            const u = allUsers.find(x => String(x._id) === String(id));
            if (!u) return;
            if (!confirm(`Verify payment and SHOW BOOK for ${u.name || 'this student'}?\n\nOnly do this after checking the ₹499 UPI transaction/UTR.`)) return;
            try{
                const res = await fetch(`/api/book-purchases/admin/${id}/show`, { method:"PUT", headers:{ Authorization:"Bearer " + token, "Content-Type":"application/json" } });
                const data = await res.json();
                if(!res.ok || !data.success){ alert(data.message || "Book access update failed"); return; }
                alert("✅ Payment verified. Book access is now ACTIVE for this student.");
                await loadUsers();
            }catch(e){ alert(e.message); }
        }
        async function adminDeclineBook(id){
            const u = allUsers.find(x => String(x._id) === String(id));
            if (!u) return;
            if (!confirm(`Decline the pending book payment request for ${u.name || 'this student'}?\n\nThe pending request will disappear from the student's dashboard.`)) return;
            try{
                const res = await fetch(`/api/book-purchases/admin/${id}/decline`, { method:"PUT", headers:{ Authorization:"Bearer " + token, "Content-Type":"application/json" } });
                const data = await res.json();
                if(!res.ok || !data.success){ alert(data.message || "Decline failed"); return; }
                alert("🚫 Payment request declined. The student will no longer see it as pending.");
                await loadUsers();
            }catch(e){ alert(e.message); }
        }
        async function adminCloseBook(id){
            const u = allUsers.find(x => String(x._id) === String(id));
            if (!u) return;
            if (!confirm(`Close book access for ${u.name || 'this student'}?`)) return;
            try{
                const res = await fetch(`/api/book-purchases/admin/${id}/close`, { method:"PUT", headers:{ Authorization:"Bearer " + token } });
                const data = await res.json();
                if(!res.ok || !data.success){ alert(data.message || "Book access close failed"); return; }
                alert("🔒 Book access closed.");
                await loadUsers();
            }catch(e){ alert(e.message); }
        }

        //==========================
        // Delete User
        //==========================

        async function deleteUser(id) {

            if (!confirm(
                "Move this user to Deleted Users?\n\n" +
                "The user's wallet, earnings, questions and all other data will be kept safe.\n" +
                "You can restore the user later."
            )) return;

            const res = await fetch("/api/admin/user/" + id, {
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + token
                }
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || "User delete failed");
                return;
            }

            alert("✅ User moved to Deleted Users. You can restore it anytime.");

            await loadUsers();
            await loadDeletedUsers();
            await loadDashboard();
        }

        //==========================
        // Deleted Users
        //==========================

        async function loadDeletedUsers() {

            const table = document.getElementById("deletedUserTable");
            if (!table) return;

            try {

                const res = await fetch("/api/admin/deleted-users", {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    table.innerHTML = `<tr><td colspan="6">${data.message || "Failed to load deleted users"}</td></tr>`;
                    return;
                }

                const users = data.users || [];

                if (!users.length) {
                    table.innerHTML = `<tr><td colspan="6">No Deleted Users</td></tr>`;
                    return;
                }

                table.innerHTML = users.map(user => {

                    const deletedDate = user.deletedAt
                        ? new Date(user.deletedAt).toLocaleString("en-IN")
                        : "-";

                    return `
                        <tr>
                            <td>${escapeHtml(user.name || "-")}</td>
                            <td>${escapeHtml(user.mobile || "-")}</td>
                            <td>${deletedDate}</td>
                            <td>₹${Number(user.wallet || 0).toFixed(2)}</td>
                            <td>₹${Number(user.totalEarn || 0).toFixed(2)}</td>
                            <td>
                                <button
                                    onclick="restoreUser('${user._id}')"
                                    style="background:linear-gradient(135deg,#16a34a,#15803d);">
                                    ♻️ Restore
                                </button>
                                <button
                                    onclick="permanentDeleteUser('${user._id}')"
                                    style="background:linear-gradient(135deg,#dc2626,#991b1b);">
                                    🗑️ Permanent Delete
                                </button>
                            </td>
                        </tr>
                    `;
                }).join("");

            } catch (err) {

                console.error("Deleted Users Error:", err);
                table.innerHTML = `<tr><td colspan="6">Failed to load deleted users</td></tr>`;

            }

        }

        async function restoreUser(id) {

            if (!confirm(
                "Restore this user?\n\n" +
                "The student will appear again in All Users and will be able to login."
            )) return;

            const res = await fetch("/api/admin/restore-user/" + id, {
                method: "PUT",
                headers: {
                    Authorization: "Bearer " + token
                }
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || "User restore failed");
                return;
            }

            alert("✅ User restored successfully.");

            await loadDeletedUsers();
            await loadUsers();
            await loadDashboard();
        }

        function escapeHtml(value) {
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        async function loadWithdraws() {

            const res = await fetch(

                "/api/admin/withdraws",

                {

                    headers: {

                        Authorization: "Bearer " + token

                    }

                }

            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                console.error("Withdraw Load Error:", data.message);
                document.getElementById("withdrawTable").innerHTML = `
                    <tr><td colspan="10">${data.message || "Failed to load withdraw requests"}</td></tr>
                `;
                return;
            }

            let html = "";

            const list = data.withdraws || [];

            if (list.length === 0) {
                document.getElementById("withdrawTable").innerHTML = `
                    <tr><td colspan="10">No Withdraw Requests Found</td></tr>
                `;
                return;
            }

            list.forEach(w => {

                html += `

<tr>

<td>${w.name}</td>

<td>${w.mobile}</td>

<td>₹${Number(w.amount || 0).toFixed(2)}</td>

<td>
    ${w.paymentMethod || "-"}
</td>

<td>

${w.paymentMethod === "UPI"
                        ? `
<b>UPI:</b><br>
${w.upiId || "-"}
`
                        : `
<b>Bank:</b> ${w.bankName || "-"}<br>

<b>Holder:</b> ${w.accountHolderName || "-"}<br>

<b>Account:</b> ${w.accountNumber || "-"}<br>

<b>IFSC:</b> ${w.ifscCode || "-"}
`
                    }

</td>

<td>
<span class="status-badge ${String(w.status || "").toLowerCase()}">${w.status}</span>
</td>   

<td>
    ${w.transactionId || "-"}
</td>

<td>
    ${w.date
                        ? new Date(w.date).toLocaleString()
                        : "-"
                    }
</td>

<td>
    ${w.paidAt
                        ? new Date(w.paidAt).toLocaleString()
                        : "-"
                    }
</td>

<td>

${w.status === "Pending" ? `
<button
    onclick="approveWithdraw('${w.userId}','${w.requestId}')"
    style="background:#2563eb;">
    Approve
</button>

<button
    onclick="rejectWithdraw('${w.userId}','${w.requestId}')"
    style="background:#ef4444;">
    Reject
</button>
` : ""}

${w.status === "Approved" ? `
<button
    onclick="markWithdrawPaid('${w.userId}','${w.requestId}')"
    style="background:#16a34a;">
    Mark Paid
</button>
` : ""}

<button
    onclick="deleteWithdraw('${w.userId}','${w.requestId}')"
    style="background:#6b7280;">
    Delete
</button>

</td>

</tr>

`;

            });

            document.getElementById("withdrawTable").innerHTML = html;

        }

        async function approveWithdraw(userId, requestId) {

            if (!confirm("Approve this withdraw request?")) return;

            const res = await fetch(
                "/api/admin/withdraw/approve/" + userId + "/" + requestId,
                {
                    method: "PUT",
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || "Approve failed");
                return;
            }

            await loadWithdraws();
            await loadDashboard();
        }

        async function rejectWithdraw(userId, requestId) {

            if (!confirm("Reject this withdraw request? Amount will be refunded to student wallet.")) return;

            const res = await fetch(
                "/api/admin/withdraw/reject/" + userId + "/" + requestId,
                {
                    method: "PUT",
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || "Reject failed");
                return;
            }

            await loadWithdraws();
            await loadDashboard();
        }

        //==========================
        // Force logout every student currently using the app
        //==========================

        async function loadUserLoginLockStatus() {
            try {
                const res = await fetch("/api/admin/user-login-lock-status", {
                    headers: { Authorization: "Bearer " + token }
                });
                const data = await res.json();
                if (!res.ok || !data.success) return;
                const btn = document.getElementById("logoutAllUsersBtn");
                if (!btn) return;

                if (data.userLoginLocked) {
                    btn.textContent = "🔓 Enable All Users";
                    btn.style.background = "#16a34a";
                    btn.onclick = enableAllUsers;
                } else {
                    btn.textContent = "🚪 Logout All Users";
                    btn.style.background = "#b91c1c";
                    btn.onclick = forceLogoutAllUsers;
                }
            } catch (err) {
                console.error("Login lock status error:", err);
            }
        }

        async function forceLogoutAllUsers() {
            const confirmed = confirm(
                "⚠️ Logout ALL students?\n\n" +
                "Every currently logged-in student will be signed out AND new student logins will stay disabled until you enable them again."
            );
            if (!confirmed) return;

            try {
                const res = await fetch("/api/admin/force-logout-all-users", {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json"
                    }
                });
                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || "Could not logout all users");
                }

                alert("✅ All student sessions logged out.\n\nStudent login is now OFF until you click Enable All Users.");
                await loadUsers();
                await loadUserLoginLockStatus();
            } catch (err) {
                console.error("Force Logout All Error:", err);
                alert("❌ Logout all failed: " + err.message);
            }
        }

        async function enableAllUsers() {
            if (!confirm("Enable student login again for all users?")) return;

            try {
                const res = await fetch("/api/admin/enable-all-users", {
                    method: "POST",
                    headers: { Authorization: "Bearer " + token }
                });
                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || "Could not enable users");
                }

                alert("✅ Student login is enabled again.");
                await loadUserLoginLockStatus();
            } catch (err) {
                console.error("Enable Users Error:", err);
                alert("❌ Enable users failed: " + err.message);
            }
        }

        async function sendNotificationToAll() {
            if (!(await checkPushConfiguration())) return;

            const title = prompt("Notification Title", "New Notification");
            if (title === null) return;
            const cleanTitle = title.trim();
            if (!cleanTitle) {
                alert("Notification title is required.");
                return;
            }

            const message = prompt("Notification Message for all users", "");
            if (message === null) return;
            const cleanMessage = message.trim();
            if (!cleanMessage) {
                alert("Notification message is required.");
                return;
            }

            if (!confirm(
                "Send this notification to ALL users who have enabled notifications?\n\n" +
                cleanTitle + "\n" + cleanMessage
            )) return;

            try {
                const res = await fetch("/api/admin/notification/send-all", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },
                    body: JSON.stringify({
                        title: cleanTitle,
                        message: cleanMessage,
                        url: "/earn.html"
                    })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    alert("❌ " + (data.message || "Notification failed"));
                    return;
                }

                alert(
                    "✅ Notification sent to all subscribed users.\n" +
                    "Devices reached: " + (data.devicesSent || 0)
                );
            } catch (err) {
                console.error("Send All Notification Error:", err);
                alert("❌ Server error while sending notification.");
            }
        }

        //==========================
        // Logout
        //==========================

        function logout() {

            if (!confirm("Are you sure you want to logout?")) return;

            localStorage.removeItem("adminToken");

            location.href = "admin-login.html";

        }

        //==========================
        // Mark Withdraw as Paid
        //==========================

        async function markWithdrawPaid(userId, requestId) {

            const transactionId = prompt(
                "Enter Payment Transaction ID:"
            );

            // Cancel clicked
            if (transactionId === null) {
                return;
            }

            // Empty Transaction ID
            if (!transactionId.trim()) {

                alert("Transaction ID is required.");

                return;
            }

            const confirmPayment = confirm(
                "Have you successfully paid the student?\n\n" +
                "Transaction ID: " + transactionId.trim()
            );

            if (!confirmPayment) {
                return;
            }

            try {

                const res = await fetch(
                    "/api/admin/withdraw/paid/" +
                    userId +
                    "/" +
                    requestId,
                    {
                        method: "PUT",

                        headers: {

                            "Content-Type": "application/json",

                            Authorization: "Bearer " + token

                        },

                        body: JSON.stringify({

                            transactionId: transactionId.trim()

                        })

                    }
                );

                const data = await res.json();

                if (!res.ok || !data.success) {

                    alert(
                        data.message ||
                        "Payment update failed"
                    );

                    return;
                }

                alert(
                    "Payment marked as Paid successfully!\n\n" +
                    "Transaction ID: " +
                    data.transactionId
                );

                await loadWithdraws();

                await loadDashboard();

            } catch (err) {

                console.error(
                    "Mark Paid Error:",
                    err
                );

                alert(
                    "Something went wrong while updating payment."
                );

            }

        }

        async function deleteWithdraw(userId, requestId) {

            if (!confirm("Delete this withdraw request?")) return;

            const res = await fetch(
                "/api/admin/withdraw/delete/" + userId + "/" + requestId,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || "Delete failed");
                return;
            }

            await loadWithdraws();
            await loadDashboard();
        }

        async function unblockUser(id) {

            if (!confirm("Unblock this student?")) return;

            const res = await fetch("/api/admin/unblock/" + id, {
                method: "PUT",
                headers: {
                    Authorization: "Bearer " + token
                }
            });

            const data = await res.json();

            alert(data.message);

            loadUsers();

        }
        //==========================
        // TRUE LIVE PRESENCE REFRESH
        //==========================
        // The normal All Users request can be heavy. Presence is refreshed from
        // the lightweight /api/admin/presence endpoint every second and ONLY
        // the status/name cells are repainted. Online is based exclusively on
        // lastSeen <= 7 seconds; a stale isOnline flag can never keep a user
        // incorrectly Online.
        let livePresenceBusy = false;

        function applyLivePresence(presenceUsers) {
            const byId = new Map(presenceUsers.map(u => [String(u.id), u]));
            const now = Number(window.__presenceServerTime || Date.now());
            const onlineCount = presenceUsers.filter(u => {
                const t = u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
                return t > 0 && (now - t) <= 7000;
            }).length;
            const onlineCounter = document.getElementById("ap2Online");
            if (onlineCounter) onlineCounter.textContent = onlineCount;
            const dashboardOnline = document.getElementById("onlineUsersCount");
            if (dashboardOnline) dashboardOnline.textContent = onlineCount;

            document.querySelectorAll("#userTable tr[data-user-id]").forEach(row => {
                const u = byId.get(String(row.dataset.userId));
                if (!u) return;

                const lastSeenMs = u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
                const isOnline = lastSeenMs > 0 && (now - lastSeenMs) <= 7000;
                row.classList.toggle("student-online-row", isOnline);
                row.classList.toggle("student-offline-row", !isOnline);

                const nameEl = row.querySelector("[data-presence-name]");
                if (nameEl) {
                    nameEl.style.background = isOnline ? "#dcfce7" : "#fee2e2";
                    nameEl.style.color = isOnline ? "#166534" : "#991b1b";
                    nameEl.style.borderColor = isOnline ? "#86efac" : "#fca5a5";
                    nameEl.setAttribute("title", isOnline ? "Student is Online" : "Student is Offline");
                }

                const dot = row.querySelector("[data-presence-dot]");
                if (dot) {
                    dot.style.background = isOnline ? "#22c55e" : "#ef4444";
                    dot.style.boxShadow = isOnline ? "0 0 0 3px #bbf7d0" : "0 0 0 3px #fecaca";
                }

                const statusEl = row.querySelector("[data-presence-status]");
                if (statusEl) {
                    statusEl.innerHTML = isOnline
                        ? "<span style='color:#16a34a;font-weight:900;'>🟢 Online</span>"
                        : formatLastSeen(u.lastSeen);
                }

                row.style.background = isOnline ? "#f0fdf4" : "#fef2f2";
            });
        }

        async function refreshLivePresence() {
            if (livePresenceBusy || document.hidden) return;
            livePresenceBusy = true;
            try {
                const r = await fetch("/api/admin/presence?_=" + Date.now(), {
                    method: "GET",
                    cache: "no-store",
                    headers: { Authorization: "Bearer " + token }
                });
                if (!r.ok) return;
                const d = await r.json();
                if (d.success) {
                    window.__presenceServerTime = Number(d.serverTime || Date.now());
                    const presence = d.users || [];
                    const presenceById = new Map(presence.map(u => [String(u.id || u._id), u]));
                    allUsers.forEach(u => {
                        const pu = presenceById.get(String(u._id));
                        if (pu) {
                            if (pu.lastSeen) u.lastSeen = pu.lastSeen;
                            if (typeof pu.isOnline !== "undefined") u.isOnline = pu.isOnline;
                        }
                    });
                    renderOnlineUsersList();
                    applyLivePresence(presence);
                    // Keep Command Center student list/counter in sync with the same
                    // lightweight presence source, instead of waiting for the 5-second
                    // full dashboard refresh.
                    if (window.ap2SyncPresence) window.ap2SyncPresence(d.users || []);
                }
            } catch (e) {
                console.warn("Live presence refresh failed:", e.message);
            } finally {
                livePresenceBusy = false;
            }
        }

        let livePresenceTimer = setInterval(refreshLivePresence, 1000);

        //==========================
        // Initial Load
        //==========================

        loadDashboard();
        loadUsers();
        refreshLivePresence();
        loadDeletedUsers();
        loadWithdraws();
        loadQuestions();


        //==========================
        // LIVE ADMIN REFRESH
        //==========================
        // Keep the complete admin command center close to real-time.
        // Presence already refreshes every 1 second; all other admin data is
        // refreshed in parallel every 1 second as well, so bonus/wallet/earnings,
        // students, withdrawals and dashboard counters appear without manually
        // refreshing the admin page.
        let adminDataRefreshBusy = false;
        let adminLiveTick = 0;
        async function refreshAdminDataLive() {
            if (adminDataRefreshBusy || document.hidden) return;
            adminDataRefreshBusy = true;
            const tick = ++adminLiveTick;
            try {
                await Promise.allSettled([
                    loadDashboard(),
                    loadUsers(),
                    loadWithdraws(),
                    (typeof ap2Refresh === "function" ? ap2Refresh() : Promise.resolve())
                ]);

                // Less-frequent/heavier sections are still kept live, but only
                // once every 3 ticks to avoid unnecessary MongoDB/API pressure.
                if (tick % 3 === 0) {
                    await Promise.allSettled([
                        loadDeletedUsers(),
                        loadQuestions()
                    ]);
                }
            } catch (err) {
                console.warn("Admin live data refresh error:", err.message);
            } finally {
                adminDataRefreshBusy = false;
            }
        }
        // 1 second live sync: any student-side change should reach the admin
        // command center almost immediately.
        setInterval(refreshAdminDataLive, 1000);

        async function permanentlyDeleteAllQuestions() {
            const firstConfirm = confirm(
                "🚨 DANGER — PERMANENT DATABASE PURGE!\\n\\n" +
                "This will permanently delete EVERY question from the MongoDB Question collection.\\n" +
                "Questions in the active bank AND Recycle Bin will both be removed.\\n" +
                "This cannot be undone or restored.\\n\\n" +
                "Continue?"
            );

            if (!firstConfirm) return;

            const secondConfirm = confirm(
                "FINAL CONFIRMATION\\n\\n" +
                "ALL questions will be permanently removed from the server database.\\n" +
                "The automatic questions.json seeding will NOT recreate them.\\n\\n" +
                "Click OK only if you really want to permanently purge everything."
            );

            if (!secondConfirm) return;

            const typed = prompt('Type DELETE ALL to confirm permanent deletion:');
            if (typed !== "DELETE ALL") {
                alert("Permanent deletion cancelled. Exact confirmation text was not entered.");
                return;
            }

            try {
                const res = await fetch("/api/questions/admin/permanent-all", {
                    method: "DELETE",
                    headers: { Authorization: "Bearer " + token }
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || "Could not permanently delete all questions");
                    return;
                }

                questionPage = 1;
                await loadQuestions();
                await loadQuestionRecycleBin();
                await loadDashboard();

                alert(
                    "✅ Permanent database purge complete.\\n\\n" +
                    data.deleted +
                    " question(s) were permanently deleted from MongoDB."
                );
            } catch (err) {
                console.error("Permanent Delete All Questions Error:", err);
                alert("❌ Error permanently deleting questions.\\n\\n" + err.message);
            }
        }

        async function deleteAllQuestions() {

            const firstConfirm = confirm(
                "⚠️ WARNING!\n\n" +
                "Are you sure you want to move ALL active questions to the Question Recycle Bin?\n\n" +
                "They can be restored or permanently deleted from the Recycle Bin."
            );

            if (!firstConfirm) return;

            const secondConfirm = confirm(
                "FINAL CONFIRMATION!\n\n" +
                "ALL active questions will be moved to the Question Recycle Bin.\n\n" +
                "Click OK to continue."
            );

            if (!secondConfirm) return;

            try {

                const res = await fetch("/api/questions/admin/all", {
                    method: "DELETE",
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    alert(data.message || "Could not delete all questions");
                    return;
                }

                alert(
                    "✅ Successfully deleted " +
                    data.deleted +
                    " question(s) to the Recycle Bin."
                );

                questionPage = 1;

                await loadQuestions();
                await loadDashboard();

            } catch (err) {

                console.error("Delete All Questions Error:", err);

                alert(
                    "❌ Error deleting questions.\n\n" +
                    err.message
                );

            }
        }

        document
            .getElementById("downloadBtn")
            .addEventListener("click", downloadQuestions);

        async function downloadQuestions() {
            try {
                const response = await fetch("/api/questions/download");

                const blob = await response.blob();

                const url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");

                a.href = url;
                a.download = "questions.json";

                document.body.appendChild(a);
                a.click();

                a.remove();

                window.URL.revokeObjectURL(url);
            } catch (err) {
                console.log(err);
                alert("Download Failed");
            }
        }
    