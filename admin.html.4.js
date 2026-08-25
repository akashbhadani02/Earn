
        (function () {
            let D = { users: [], withdrawals: [], stats: {} };
            const token = () => localStorage.getItem("adminToken") || "";
            async function api(url, opt = {}) {
                opt.headers = Object.assign({ "Content-Type": "application/json", "Authorization": "Bearer " + token() }, opt.headers || {});
                const r = await fetch("/api/admin" + url, opt), d = await r.json().catch(() => ({}));
                if (!r.ok || !d.success) throw new Error(d.message || "API error");
                return d;
            }
            const esc = x => String(x ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
            const name = u => u.name || u.username || u.student_id || u.id || "Unknown", uid = u => String(u._id || u.id || u.student_id || "");
            const q = u => u.dailyQuestionsDate === new Date().toISOString().slice(0, 10) ? Number(u.dailyQuestionsAnswered || 0) : 0;
            const spinQ = u => u.dailyQuestionsDate === new Date().toISOString().slice(0, 10) ? Number(u.spinCycleQuestionsAnswered ?? u.dailyQuestionsAnswered ?? 0) : 0;
            const money = x => "₹" + Number(x || 0).toFixed(2);

            window.ap2SyncPresence = (presenceUsers) => {
                const byId = new Map((presenceUsers || []).map(u => [String(u.id), u]));
                let online = 0;
                D.users = (D.users || []).map(u => {
                    const p = byId.get(String(u._id || u.id || u.student_id || ""));
                    if (!p) return u;
                    const isOnline = !!p.isOnline;
                    if (isOnline) online++;
                    return { ...u, lastSeen: p.lastSeen || u.lastSeen || null, isOnline };
                });
                const onlineEl = document.getElementById("ap2Online");
                if (onlineEl) onlineEl.textContent = online;
                if (document.getElementById("ap2StudentRows")) ap2RenderStudents();
            };

            window.ap2Refresh = async () => {
                try {
                    D = await api("/pro/dashboard");
                    ap2Render();
                } catch (e) {
                    console.error("Command Center:", e);
                    const msg = esc(e.message || "Unable to load Command Center data.");
                    ["ap2StudentRows","ap2WithdrawRows","ap2WalletRows","ap2SecurityRows","ap2RecycleRows"]
                        .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = `<tr><td colspan="10" style="color:#fca5a5">⚠️ ${msg}</td></tr>`; });
                }
            };
            function ap2Render() {
                const s = D.stats || {}, map = { ap2Students: s.students, ap2Online: s.online, ap2Blocked: s.blocked, ap2Q: s.questionsToday, ap2Wallet: money(s.wallet), ap2Earn: money(s.totalEarn), ap2Warnings: s.warnings, ap2Spin: s.spinEligible };
                Object.keys(map).forEach(k => { let e = document.getElementById(k); if (e) e.textContent = map[k] ?? 0 });
                ap2RenderStudents(); ap2RenderWithdrawals(); ap2RenderWallet(); ap2RenderSecurity(); ap2RenderRecycle();
            }
            window.ap2RenderStudents = () => {
                const term = (document.getElementById("ap2Search").value || "").toLowerCase();
                const list = D.users.filter(u => (name(u) + " " + uid(u) + " " + (u.mobile || "")).toLowerCase().includes(term));
                document.getElementById("ap2StudentRows").innerHTML = list.map(u => `<tr class="${u.isBlocked ? 'ap2-presence-offline' : ((u.lastSeen && Date.now() - new Date(u.lastSeen).getTime() <= 7000) ? 'ap2-presence-online' : 'ap2-presence-offline')}"><td><b>${esc(name(u))}</b><br><span class="ap2-muted">${esc(uid(u))}</span><br>${esc(u.mobile || "")}</td><td>${u.isBlocked ? '<span class="ap2-badge ap2-blue">Blocked</span>' : (u.lastSeen && Date.now() - new Date(u.lastSeen).getTime() <= 7000) ? '<span class="ap2-badge ap2-green">Online</span>' : '<span class="ap2-badge ap2-red">Offline</span>'}</td><td>${q(u)} Today<br>Spin: ${spinQ(u)}/100<br>Total: ${Number(u.totalQuestionsAnswered || 0)}</td><td>${money(u.wallet)}</td><td>${money(u.totalEarn)}</td><td>${Number(u.warningCount || 0)}</td><td>${spinQ(u) >= 100 ? '<span class="ap2-badge ap2-green">Eligible</span>' : 'Locked'}</td><td><div class="ap2-student-actions"><button class="ap2-btn ap2-action ap2-profile" onclick="ap2Details('${esc(uid(u))}')" title="Student Profile">👤 Profile</button><button class="ap2-btn ap2-action ap2-edit" onclick="editTotalEarn('${esc(uid(u))}',${Number(u.totalEarn || 0)})" title="Edit Total Earn">✏️ Edit Earn</button><button class="ap2-btn ap2-action ap2-block" onclick="ap2Block('${esc(uid(u))}',${!u.isBlocked})" title="Block / Unblock">${u.isBlocked ? '🟢 Unblock' : '🚫 Block'}</button><button class="ap2-btn ap2-action ap2-warning" onclick="ap2Warn('${esc(uid(u))}')" title="Warnings">⚠️ Warning</button><button class="ap2-btn ap2-action ap2-lifeline" onclick="ap2LifelineUser('${esc(uid(u))}')" title="Lifeline History">🛟 Lifeline</button><button class="ap2-btn ap2-action ap2-answered" onclick="ap2AnsweredQuestions('${esc(uid(u))}')" title="Answered Questions">📚 Answered</button><button class="ap2-btn ap2-action ap2-reset" onclick="ap2ResetLifelines('${esc(uid(u))}')" title="Reset all lifelines">🔄 Reset Life</button></div></td></tr>`).join("") || '<tr><td colspan="8">No students found.</td></tr>';
            };
            window.ap2Details = async id => {
                try {
                    let d=await api("/pro/user/"+encodeURIComponent(id)), u=d.user;
                    const warnings=(u.warningHistory||[]).slice().reverse();
                    const warningCards=warnings.map((x,i)=>`<article class="student-data-card profile-card"><span class="card-label">Warning ${i+1} • ${esc(x.time||'-')}</span><div class="card-question">${esc(x.reason||'No reason recorded')}</div></article>`).join('') || '<div class="student-empty">⚠️ No warning history found.</div>';
                    document.getElementById("ap2Title").textContent="👤 Profile — "+name(u);
                    document.getElementById("ap2Body").innerHTML=`<div class="student-view-shell">
                        <div class="student-view-header profile"><div>👤 Student Profile<small>Basic account, earning and activity information.</small></div><span>${u.isBlocked?'Blocked':'Active'}</span></div>
                        <div class="student-summary-grid profile-summary">
                            <div class="student-summary-item"><div class="label">Student ID</div><div class="value">${esc(uid(u))}</div></div>
                            <div class="student-summary-item"><div class="label">Mobile</div><div class="value">${esc(u.mobile||'-')}</div></div>
                            <div class="student-summary-item"><div class="label">Wallet</div><div class="value">${money(u.wallet)}</div></div>
                            <div class="student-summary-item"><div class="label">Total Earn</div><div class="value">${money(u.totalEarn)}</div></div>
                            <div class="student-summary-item"><div class="label">Today Questions</div><div class="value">${q(u)}</div></div>
                            <div class="student-summary-item"><div class="label">Spin Progress</div><div class="value">${spinQ(u)}/100</div></div>
                            <div class="student-summary-item"><div class="label">Total Questions</div><div class="value">${u.totalQuestionsAnswered||0}</div></div>
                            <div class="student-summary-item"><div class="label">Warnings</div><div class="value">${u.warningCount||0}</div></div>
                            <div class="student-summary-item"><div class="label">Last Seen</div><div class="value">${esc(u.lastSeen||'-')}</div></div>
                        </div>
                        <div class="student-section-title">Admin Actions</div>
                        <div class="ap2-flex" style="margin:0 0 12px"><button class="ap2-btn" onclick="ap2Wallet('${esc(uid(u))}')">💰 Wallet</button><button class="ap2-btn" onclick="ap2Warn('${esc(uid(u))}')">⚠️ Warning</button><button class="ap2-btn" onclick="ap2ResetQ('${esc(uid(u))}')">🔄 Reset Q</button><button class="ap2-btn" onclick="ap2ResetSpin('${esc(uid(u))}')">🎡 Reset Spin</button><button class="ap2-btn" style="background:#0ea5e9;border-color:#0ea5e9" onclick="ap2ResetLifelines('${esc(uid(u))}')">🛟 Reset Lifelines</button></div>
                        <div class="student-section-title">Warning History</div>
                        <div class="student-data-cards">${warningCards}</div>
                    </div>`;
                    document.getElementById("ap2Modal").classList.add("show"); document.getElementById("ap2Modal").setAttribute("aria-hidden","false");
                } catch (e) { alert(e.message) }
            };

            // Student detail modal close handler
            window.ap2Close = () => {
                const modal = document.getElementById("ap2Modal");
                if (!modal) return;
                modal.classList.remove("show");
                modal.setAttribute("aria-hidden", "true");
                // Clear old content so the next student always opens fresh.
                const body = document.getElementById("ap2Body");
                if (body) body.innerHTML = "";
            };

            // Close on backdrop click / Escape as a convenience.
            document.addEventListener("click", (event) => {
                const modal = document.getElementById("ap2Modal");
                if (modal && event.target === modal) window.ap2Close();
            });
            document.addEventListener("keydown", (event) => {
                if (event.key === "Escape") {
                    const modal = document.getElementById("ap2Modal");
                    if (modal && modal.classList.contains("show")) window.ap2Close();
                }
            });

            window.ap2Warn = async id => { let reason = prompt("Warning reason:", "Please follow the rules."); if (reason === null) return; try { let r = await api("/pro/warning/" + encodeURIComponent(id), { method: "POST", body: JSON.stringify({ reason }) }); alert(r.message); await ap2Refresh() } catch (e) { alert(e.message) } };
            window.ap2Wallet = async id => { let amount = prompt("Wallet adjustment (+ add / - remove):", "1"); if (amount === null) return; let reason = prompt("Reason:", "Admin adjustment"); if (reason === null) return; try { await api("/pro/wallet/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify({ amount: Number(amount), reason }) }); await ap2Refresh(); alert("Wallet updated") } catch (e) { alert(e.message) } };
            window.ap2ResetQ = async id => { try { await api("/pro/reset-questions/" + encodeURIComponent(id), { method: "PUT" }); await ap2Refresh() } catch (e) { alert(e.message) } };
            window.ap2ResetSpin = async id => { try { await api("/pro/reset-spin/" + encodeURIComponent(id), { method: "PUT" }); await ap2Refresh() } catch (e) { alert(e.message) } };
            let ap2BlockedTimer = null;
            let ap2BlockedUsers = [];

            function ap2FormatRemaining(ms) {
                ms = Math.max(0, Number(ms || 0));
                const totalSeconds = Math.floor(ms / 1000);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const sec = totalSeconds % 60;
                return `${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(sec).padStart(2,"0")}s`;
            }

            function ap2RenderBlockedTime() {
                const body = document.getElementById("ap2BlockedTimeBody");
                if (!body) return;

                const now = Date.now();
                const active = ap2BlockedUsers
                    .map(u => ({ ...u, remainingMs: Math.max(0, Number(u.blockUntilMs || 0) - now) }))
                    .filter(u => u.remainingMs > 0);

                if (!active.length) {
                    body.innerHTML = '<div style="padding:35px 20px;text-align:center;color:#94a3b8;font-weight:800;">No blocked student found</div>';
                    return;
                }

                body.innerHTML = active.map(u => `
                    <div class="blocked-time-card">
                        <div class="student-name">🚫 ${esc(u.name || "Unknown")}</div>
                        <div class="student-meta">ID: ${esc(u.id || "-")} &nbsp; | &nbsp; Mobile: ${esc(u.mobile || "-")}</div>
                        <div class="remaining">⏱ Remaining: ${ap2FormatRemaining(u.remainingMs)}</div>
                    </div>
                `).join("");
            }

            window.ap2ShowBlockedTime = async () => {
                const modal = document.getElementById("ap2BlockedTimeModal");
                const body = document.getElementById("ap2BlockedTimeBody");
                if (!modal || !body) return;

                modal.classList.add("show");
                body.innerHTML = '<div style="padding:35px 20px;text-align:center;color:#94a3b8;font-weight:800;">Loading blocked students...</div>';

                try {
                    const d = await api("/pro/blocked-students");
                    ap2BlockedUsers = Array.isArray(d.users) ? d.users : [];
                    ap2RenderBlockedTime();

                    clearInterval(ap2BlockedTimer);
                    ap2BlockedTimer = setInterval(ap2RenderBlockedTime, 1000);
                } catch (e) {
                    body.innerHTML = `<div style="padding:35px 20px;text-align:center;color:#fca5a5;font-weight:800;">⚠️ ${esc(e.message || "Failed to load blocked students.")}</div>`;
                }
            };

            window.ap2CloseBlockedTime = () => {
                const modal = document.getElementById("ap2BlockedTimeModal");
                if (modal) { modal.classList.remove("show"); modal.setAttribute("aria-hidden","true"); }
                clearInterval(ap2BlockedTimer);
                ap2BlockedTimer = null;
            };

            window.ap2Tab = t => {
                const root = document.querySelector(".adminProV2");
                if (!root) return;
                root.querySelectorAll(".ap2-pane").forEach(x => x.classList.remove("active"));
                const pane = document.getElementById("ap2-" + t);
                if (pane) pane.classList.add("active");
                root.querySelectorAll(".ap2-tabs .ap2-btn").forEach(b => {
                    const match = (b.getAttribute("onclick") || "").match(/ap2Tab\(['"]([^'"]+)['"]\)/);
                    b.classList.toggle("active", !!match && match[1] === t);
                });
                if (t === "reports" && typeof ap2LoadReports === "function") ap2LoadReports();
                if (t === "lifelines" && typeof ap2LoadLifelines === "function") ap2LoadLifelines();
            };
            window.ap2ResetLifelines = async id => {
                if (!confirm("આ student ની બધી 4 lifelines reset કરવી છે?")) return;
                try { const d = await api("/pro/reset-lifelines/" + encodeURIComponent(id), { method:"PUT" }); alert("✅ " + d.message); await ap2Refresh(); } catch(e) { alert(e.message); }
            };
            window.ap2ResetAllLifelines = async () => {
                if (!confirm("બધા active students ની બધી lifelines reset કરવી છે?")) return;
                if (!confirm("આ action બધા students માટે લાગુ પડશે. Continue?")) return;
                try { const d = await api("/pro/reset-lifelines-all", { method:"PUT" }); alert("✅ " + d.message); await ap2Refresh(); } catch(e) { alert(e.message); }
            };
            function ap2RenderAnsweredQuestions(d, titlePrefix) {
                const u=d.user||{}, rows=d.history||[];
                const cards=rows.map((x,i)=>{
                    const selected=x.selectedAnswer ? esc(x.selectedAnswer) : 'Not recorded';
                    const correct=esc(x.correctAnswer||'-');
                    const legacy=x.isCorrect===null||x.isCorrect===undefined;
                    const result=legacy?'Legacy':(x.isCorrect?'Correct':'Wrong');
                    const cls=legacy?'legacy':(x.isCorrect?'correct':'wrong');
                    const badge=legacy?'result-legacy':(x.isCorrect?'result-correct':'result-wrong');
                    return `<article class="student-data-card answered-q-card ${cls}">
                        <span class="card-label">Question ${i+1} • ${x.answeredAt?esc(new Date(x.answeredAt).toLocaleString()):'Earlier record'}</span>
                        <div class="card-row"><b>Question ID</b><span>${esc(x.questionId||'-')}</span></div>
                        <div class="card-question">${esc(x.questionText||'-')}</div>
                        <div class="card-row"><b>Student Answer</b><span>${selected}</span></div>
                        <div class="card-row"><b>Correct Answer</b><span>${correct}</span></div>
                        <div style="margin-top:8px"><span class="result-badge ${badge}">${result==='Correct'?'✓ ':result==='Wrong'?'✕ ':''}${result}</span></div>
                    </article>`;
                }).join('') || '<div class="student-empty">📚 No answered question history found.</div>';
                document.getElementById("ap2Title").textContent=titlePrefix+" — "+name(u);
                document.getElementById("ap2Body").innerHTML=`<div class="student-view-shell">
                    <div class="student-view-header answered"><div>📚 Answered Questions<small>Only this student's submitted question history is shown here.</small></div><span>${Number(d.total||rows.length)} Records</span></div>
                    <div class="student-summary-grid answered-summary">
                        <div class="student-summary-item"><div class="label">Student</div><div class="value">${esc(u.name||'-')}</div></div>
                        <div class="student-summary-item"><div class="label">Mobile</div><div class="value">${esc(u.mobile||'-')}</div></div>
                        <div class="student-summary-item"><div class="label">Total Questions</div><div class="value">${Number(u.totalQuestionsAnswered||0)}</div></div>
                        <div class="student-summary-item"><div class="label">Records Shown</div><div class="value">${Number(d.total||rows.length)}</div></div>
                    </div>
                    <div class="student-section-title">Question-wise Answer Details</div>
                    <div class="ap2-flex" style="margin:0 0 10px"><button class="ap2-btn" style="background:#16a34a;border-color:#16a34a" onclick="ap2ExportAnsweredQuestions('${esc(uid(u))}')">📤 Export Questions CSV</button></div>
                    <div class="student-data-cards">${cards}</div>
                </div>`;
                document.getElementById("ap2Modal").classList.add("show"); document.getElementById("ap2Modal").setAttribute("aria-hidden","false");
            }

            window.ap2AnsweredQuestions = async id => {
                try { const d=await api("/pro/questions/user/"+encodeURIComponent(id)); ap2RenderAnsweredQuestions(d,"📚 Answered Questions"); }
                catch(e){ alert(e.message); }
            };

            window.ap2ExportAnsweredQuestions = async id => {
                try {
                    const d=await api("/pro/questions/user/"+encodeURIComponent(id));
                    const rows=d.history||[];
                    const headers=["Date/Time","Question ID","Question","Student Answer","Correct Answer","Result","Total Questions"];
                    const csv=[headers,...rows.map(x=>[x.answeredAt?new Date(x.answeredAt).toISOString():"",x.questionId||"",x.questionText||"",x.selectedAnswer||"",x.correctAnswer||"",x.isCorrect===null||x.isCorrect===undefined?"Legacy":(x.isCorrect?"Correct":"Wrong"),x.totalQuestionsAnswered||""])].map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(',')).join('\n');
                    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='answered-questions-'+(d.user?.name||'student').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.csv';a.click();URL.revokeObjectURL(a.href);
                } catch(e){alert(e.message);}
            };

            window.ap2LifelineUser = async id => {
                try {
                    const d=await api("/pro/lifelines/user/"+encodeURIComponent(id)); const u=d.user||{}, c=d.counts||{};
                    const label={fiftyFifty:"50:50",audiencePoll:"Audience Poll",askExpert:"Ask Expert",skipQuestion:"Skip Question"};
                    const cards=(d.usage||[]).map((x,i)=>`<article class="student-data-card lifeline-card">
                        <span class="card-label">Usage ${i+1} • ${esc(new Date(x.usedAt).toLocaleString())}</span>
                        <div style="margin-bottom:7px"><span class="lifeline-type-badge">🛟 ${esc(label[x.type]||x.type)}</span></div>
                        <div class="card-row"><b>Question ID</b><span>${esc(x.questionId||'-')}</span></div>
                        <div class="card-question">${esc(x.questionText||'-')}</div>
                        <div class="card-row"><b>500 Cycle</b><span>${Number(x.cycle||0)}</span></div>
                        <div class="card-row"><b>Questions at Use</b><span>${Number(x.totalQuestionsAnsweredAtUse||0)}</span></div>
                        ${x.resetByAdmin?'<div style="margin-top:8px"><span class="ap2-badge ap2-blue">ADMIN RESET</span></div>':''}
                    </article>`).join('') || '<div class="student-empty">🛟 No lifeline usage found for this student.</div>';
                    document.getElementById("ap2Title").textContent="🛟 Lifeline History — "+name(u);
                    document.getElementById("ap2Body").innerHTML=`<div class="student-view-shell">
                        <div class="student-view-header lifeline"><div>🛟 Lifeline History<small>Every lifeline use is shown separately with its question and time.</small></div><span>${(d.usage||[]).length} Uses</span></div>
                        <div class="student-summary-grid lifeline-summary">
                            <div class="student-summary-item"><div class="label">Student</div><div class="value">${esc(u.name||'-')}</div></div>
                            <div class="student-summary-item"><div class="label">Mobile</div><div class="value">${esc(u.mobile||'-')}</div></div>
                            <div class="student-summary-item"><div class="label">50:50 Used</div><div class="value">${c.fiftyFifty||0}</div></div>
                            <div class="student-summary-item"><div class="label">Audience Used</div><div class="value">${c.audiencePoll||0}</div></div>
                            <div class="student-summary-item"><div class="label">Expert Used</div><div class="value">${c.askExpert||0}</div></div>
                            <div class="student-summary-item"><div class="label">Skip Used</div><div class="value">${c.skipQuestion||0}</div></div>
                            <div class="student-summary-item"><div class="label">Available Lifelines</div><div class="value">${Object.values(u.lifelines||{}).filter(Boolean).length}/4</div></div>
                            <div class="student-summary-item"><div class="label">Total Questions</div><div class="value">${Number(u.totalQuestionsAnswered||0)}</div></div>
                        </div>
                        <div class="student-section-title">Lifeline-wise Usage Details</div>
                        <div class="ap2-flex" style="margin:0 0 10px"><button class="ap2-btn" style="background:#0891b2;border-color:#0891b2" onclick="ap2ResetLifelines('${esc(uid(u))}')">🔄 Reset Lifelines</button></div>
                        <div class="student-data-cards">${cards}</div>
                    </div>`;
                    document.getElementById("ap2Modal").classList.add("show"); document.getElementById("ap2Modal").setAttribute("aria-hidden","false");
                } catch(e){alert(e.message);}
            };

            window.ap2LoadLifelines = async () => {
                try {
                    const search=(document.getElementById("ap2LifelineSearch")?.value||"").trim();
                    const d=await api("/pro/lifelines?limit=200"+(search?"&q="+encodeURIComponent(search):""));
                    const rows=d.items||[];
                    const counts={fiftyFifty:0,audiencePoll:0,askExpert:0,skipQuestion:0};
                    rows.forEach(x=>{if(counts[x.type]!==undefined)counts[x.type]++;});
                    ["fiftyFifty","audiencePoll","askExpert","skipQuestion"].forEach(k=>{const el=document.getElementById({fiftyFifty:"ap2L50",audiencePoll:"ap2LAudience",askExpert:"ap2LExpert",skipQuestion:"ap2LSkip"}[k]);if(el)el.textContent=counts[k]||0;});
                    const label={fiftyFifty:"50:50",audiencePoll:"Audience Poll",askExpert:"Ask Expert",skipQuestion:"Skip"};
                    const body=document.getElementById("ap2LifelineRows");
                    if(body)body.innerHTML=rows.filter(x=>!x.resetByAdmin).map(x=>`<tr><td>${esc(new Date(x.usedAt).toLocaleString())}</td><td><b>${esc(x.userName||'-')}</b><br>${esc(x.userId||'-')}</td><td>${esc(x.userMobile||'-')}</td><td>${esc(label[x.type]||x.type)}</td><td>${esc(x.questionId||'-')}</td><td class="ap2-question-cell">${esc(x.questionText||'-')}</td><td>${Number(x.cycle||0)}</td><td>${Number(x.totalQuestionsAnsweredAtUse||0)}</td></tr>`).join('')||'<tr><td colspan="8">No lifeline usage found.</td></tr>';
                } catch(e) { const el=document.getElementById("ap2LifelineRows"); if(el)el.innerHTML=`<tr><td colspan="8" style="color:#fca5a5">⚠️ ${esc(e.message)}</td></tr>`; }
            };
            window.ap2ExportLifelines = async () => {
                try {
                    const d=await api("/pro/lifelines?limit=200"); const rows=d.items||[]; const headers=["Date/Time","Student","Mobile","Lifeline","Question ID","Question","Cycle","Total Questions"];
                    const label={fiftyFifty:"50:50",audiencePoll:"Audience Poll",askExpert:"Ask Expert",skipQuestion:"Skip"};
                    const csv=[headers,...rows.filter(x=>!x.resetByAdmin).map(x=>[new Date(x.usedAt).toISOString(),x.userName,x.userMobile,label[x.type]||x.type,x.questionId||"",x.questionText||"",x.cycle||0,x.totalQuestionsAnsweredAtUse||0])].map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(',')).join('\n');
                    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lifeline-usage-report.csv';a.click();URL.revokeObjectURL(a.href);
                } catch(e){alert(e.message);}
            };

            function ap2RenderWithdrawals() { document.getElementById("ap2WithdrawRows").innerHTML = D.withdrawals.map(w => `<tr><td>${esc(w.student)}</td><td>${esc(w.mobile)}</td><td>${money(w.amount)}</td><td>${esc(w.status)}</td><td>${esc(w.transactionId || "-")}</td><td>${esc(w.date || "-")}</td></tr>`).join("") || '<tr><td colspan="6">No withdrawals.</td></tr>' }
            function ap2RenderWallet() { let a = []; D.users.forEach(u => (u.walletTransactions || []).forEach(t => a.push({ student: name(u), ...t }))); a.sort((x, y) => new Date(y.time) - new Date(x.time)); document.getElementById("ap2WalletRows").innerHTML = a.map(t => `<tr><td>${esc(t.time)}</td><td>${esc(t.student)}</td><td>${esc(t.type)}</td><td>${money(t.amount)}</td><td>${esc(t.reason)}</td></tr>`).join("") || '<tr><td colspan="5">No transactions.</td></tr>' }
            function ap2SecurityRisk(u) {
                const f = Number(u.fastAnswers || 0), t = Number(u.tabChanges || 0), d = Array.isArray(u.deviceIds) ? u.deviceIds.length : Number(u.deviceCount || 0);
                const logins = Array.isArray(u.loginHistory) ? u.loginHistory.length : 0;
                const warns = Number(u.warningCount || 0);
                const score = (f >= 10 ? 3 : f >= 5 ? 2 : f > 0 ? 1 : 0)
                    + (t >= 10 ? 3 : t >= 5 ? 2 : t > 0 ? 1 : 0)
                    + (d >= 3 ? 3 : d >= 2 ? 2 : d > 0 ? 1 : 0)
                    + (warns >= 3 ? 3 : warns >= 1 ? 1 : 0)
                    + (logins >= 20 ? 2 : logins >= 10 ? 1 : 0);
                return score >= 6 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW";
            }
            function ap2SecurityTime(x) { return x ? new Date(x).toLocaleString() : "-"; }
            function ap2SecurityAgent(x) {
                const a = String(x || "");
                if (!a) return "-";
                if (/Android/i.test(a)) return "📱 Android";
                if (/iPhone|iPad/i.test(a)) return "📱 iPhone/iPad";
                if (/Windows/i.test(a)) return "💻 Windows";
                if (/Macintosh/i.test(a)) return "💻 macOS";
                return "🌐 Browser";
            }
            window.ap2SecurityDetails = id => {
                const tbody=document.getElementById("ap2SecurityRows");
                if(!tbody) return;
                const old=tbody.querySelector(`tr.ap2-security-detail-row[data-security-detail="${CSS.escape(String(id))}"]`);
                if(old){ old.remove(); return; }
                const u=D.users.find(x=>uid(x)===String(id));
                if(!u) return;
                const history=Array.isArray(u.loginHistory)?u.loginHistory.slice().reverse():[];
                const warnings=Array.isArray(u.warningHistory)?u.warningHistory.slice().reverse():[];
                const activity=Array.isArray(u.adminActivity)?u.adminActivity.slice().reverse():[];
                const risk=ap2SecurityRisk(u);
                const row=tbody.querySelector(`tr[data-security-user="${CSS.escape(String(id))}"]`);
                if(!row) return;
                const detail=document.createElement('tr');
                detail.className='ap2-security-detail-row';
                detail.dataset.securityDetail=String(id);
                detail.innerHTML=`<td colspan="9">
                    <div class="ap2-flex" style="justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="margin:0">🔐 Security Details — ${esc(name(u))}</h3><button class="ap2-btn" onclick="ap2SecurityDetails('${esc(uid(u))}')">✖ Close</button></div>
                    <div class="ap2-security-detail">
                      <div class="ap2-detail-card"><h4>Overview</h4><div class="ap2-kv"><div><b>Student ID</b><span>${esc(uid(u))}</span></div><div><b>Mobile</b><span>${esc(u.mobile||'-')}</span></div><div><b>Risk</b><span><span class="ap2-badge ${risk==='HIGH'?'security-risk-high':risk==='MEDIUM'?'security-risk-medium':'security-risk-low'}">${risk}</span></span></div><div><b>Warnings</b><span>${Number(u.warningCount||0)}</span></div><div><b>Fast Answers</b><span>${Number(u.fastAnswers||0)}</span></div><div><b>Tab Changes</b><span>${Number(u.tabChanges||0)}</span></div><div><b>Devices</b><span>${Array.isArray(u.deviceIds)?u.deviceIds.length:Number(u.deviceCount||0)}</span></div><div><b>Last Seen</b><span>${esc(ap2SecurityTime(u.lastSeen))}</span></div><div><b>Blocked</b><span>${u.isBlocked?'Yes — '+esc(u.blockReason||''):'No'}</span></div></div></div>
                      <div class="ap2-detail-card"><h4>🔑 Login History (${history.length})</h4><div class="ap2-tablewrap"><table class="ap2-table"><tr><th>Time</th><th>IP</th><th>Device</th></tr>${history.slice(0,20).map(x=>`<tr><td>${esc(ap2SecurityTime(x.time))}</td><td>${esc(x.ip||'-')}</td><td>${esc(ap2SecurityAgent(x.userAgent))}</td></tr>`).join('')||'<tr><td colspan="3">No login history recorded.</td></tr>'}</table></div></div>
                      <div class="ap2-detail-card"><h4>⚠️ Warnings (${warnings.length})</h4><div class="ap2-tablewrap"><table class="ap2-table"><tr><th>Time</th><th>Reason</th></tr>${warnings.slice(0,20).map(x=>`<tr><td>${esc(ap2SecurityTime(x.time))}</td><td>${esc(x.reason||'-')}</td></tr>`).join('')||'<tr><td colspan="2">No warnings.</td></tr>'}</table></div></div>
                    </div>
                    <div class="ap2-detail-card" style="margin-top:14px"><h4>🛡️ Admin Security Activity (${activity.length})</h4><div class="ap2-tablewrap"><table class="ap2-table"><tr><th>Time</th><th>Action</th><th>Details</th></tr>${activity.slice(0,20).map(x=>`<tr><td>${esc(ap2SecurityTime(x.time))}</td><td>${esc(x.action||'-')}</td><td>${esc(x.details||'-')}</td></tr>`).join('')||'<tr><td colspan="3">No admin security activity.</td></tr>'}</table></div></div>
                </td>`;
                row.insertAdjacentElement('afterend',detail);
            };
            function ap2RenderSecurity() {
                const rows = D.users.map(u => {
                    const f=Number(u.fastAnswers||0), t=Number(u.tabChanges||0), d=Array.isArray(u.deviceIds)?u.deviceIds.length:Number(u.deviceCount||0);
                    const l=Array.isArray(u.loginHistory)?u.loginHistory.length:0, w=Number(u.warningCount||0), r=ap2SecurityRisk(u);
                    return `<tr data-security-user="${esc(uid(u))}">
                        <td><b>${esc(name(u))}</b><br><span class="ap2-muted">${esc(uid(u))}</span></td>
                        <td>${f}</td><td>${t}</td><td>${d}</td><td>${l}</td><td>${w}</td>
                        <td>${esc(u.lastSeen ? ap2SecurityTime(u.lastSeen) : "Offline")}</td>
                        <td><span class="ap2-badge ${r==="HIGH"?"security-risk-high":r==="MEDIUM"?"security-risk-medium":"security-risk-low"}">${r}</span></td>
                        <td><button class="ap2-btn security-details-btn" onclick="ap2SecurityDetails('${esc(uid(u))}')">🔍 Details</button></td>
                    </tr>`;
                }).join("");
                document.getElementById("ap2SecurityRows").innerHTML = rows || '<tr><td colspan="9">No security data.</td></tr>';
            }
            async function ap2RenderRecycle() { try { let d = await api("/pro/recycle-bin"); document.getElementById("ap2RecycleRows").innerHTML = d.users.map(u => `<tr><td>${esc(name(u))}<br>${esc(uid(u))}</td><td>${esc(u.deletedAt || "-")}</td><td>${esc(u.deletedReason || "-")}</td><td><button class="ap2-btn" onclick="ap2Restore('${esc(uid(u))}')">♻️ Restore</button></td><td><button class="ap2-btn" style="background:#dc2626;color:#fff" onclick="ap2PermanentDelete('${esc(uid(u))}')">🗑️ Permanent Delete</button></td></tr>`).join("") || '<tr><td colspan="5">Recycle Bin empty.</td></tr>' } catch (e) { console.error(e) } }
            window.ap2Restore = async id => { try { await api("/pro/restore/" + encodeURIComponent(id), { method: "PUT" }); await ap2Refresh(); alert("Student restored") } catch (e) { alert(e.message) } };
            window.ap2PermanentDelete = async id => {
                if (!confirm("⚠️ Permanently delete this student?\n\nThis action cannot be undone and all student data will be removed permanently.")) return;
                try {
                    await api("/pro/permanent-delete/" + encodeURIComponent(id), { method: "DELETE" });
                    await ap2Refresh();
                    alert("✅ Student permanently deleted");
                } catch (e) { alert(e.message) }
            };
            window.ap2LoadReports = async () => {
                const el = document.getElementById("ap2ReportRows");
                if (!el) return;
                el.innerHTML = '<tr><td colspan="9">Loading report...</td></tr>';
                try {
                    const d = await api("/pro/reports");
                    const rows = Array.isArray(d.report) ? d.report : [];
                    el.innerHTML = rows.map(x => `<tr>
                        <td><b>${esc(x.name || "-")}</b><br><span class="ap2-muted">${esc(x.id || "")}</span></td>
                        <td>${esc(x.mobile || "-")}</td>
                        <td>${money(x.wallet)}</td>
                        <td>${money(x.totalEarn)}</td>
                        <td>${Number(x.todayQuestions || 0)}</td>
                        <td>${Number(x.totalQuestions || 0)}</td>
                        <td>${Number(x.warnings || 0)}</td>
                        <td>${x.blocked ? '<span class="ap2-badge ap2-red">Blocked</span>' : '<span class="ap2-badge ap2-green">Active</span>'}</td>
                        <td>${esc(x.lastSeen ? new Date(x.lastSeen).toLocaleString() : "Offline")}</td>
                    </tr>`).join("") || '<tr><td colspan="9">No students found.</td></tr>';
                } catch (e) {
                    el.innerHTML = `<tr><td colspan="9" style="color:#fca5a5">⚠️ ${esc(e.message || "Failed to load report.")}</td></tr>`;
                }
            };
            window.ap2Export = async () => { try { let d = await api("/pro/reports"), rows = [["Name", "ID", "Mobile", "Wallet", "Total Earn", "Today Questions", "Total Questions", "Warnings", "Blocked", "Last Seen"], ...d.report.map(x => [x.name, x.id, x.mobile, x.wallet, x.totalEarn, x.todayQuestions, x.totalQuestions, x.warnings, x.blocked ? "Yes" : "No", x.lastSeen])]; let csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n"), a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "admin-report.csv"; a.click() } catch (e) { alert(e.message) } };
            window.addEventListener("load", () => {
                ap2Tab("students");
                // The main admin refresh queue owns the live Command Center refresh.
                // Do one initial load here; no second polling loop.
                ap2Refresh();
            });
        })();
    
        window.addEventListener("load", () => {
            loadUserLoginLockStatus();
        });
