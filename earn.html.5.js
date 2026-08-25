
const BOOK_UPI_ID = "baa836610@okaxis";
const BOOK_STATUS_API = "/api/book-purchases/status";
function authHeaders(){
  const t = localStorage.getItem("token") || localStorage.getItem("authToken");
  return t ? { Authorization: "Bearer " + t } : {};
}
function startBookPayment(){
  const upiUrl = "upi://pay?pa=" + encodeURIComponent(BOOK_UPI_ID)
    + "&pn=" + encodeURIComponent("Aducate Book")
    + "&tn=" + encodeURIComponent("Book Purchase - Rs 499")
    + "&am=499&cu=INR";
  document.getElementById("bookPurchaseStatus").textContent = "Google Pay માં ₹499 payment કરો. Payment થયા પછી પાછા આવીને ‘I Have Paid’ દબાવો.";
  document.getElementById("bookPaidBtn").style.display = "block";
  window.location.href = upiUrl;
}
function buyBook(){
  const modal = document.getElementById("bookPurchaseModal");
  if (modal) modal.classList.add("show");
  loadBookStatus();
}
function closeBookModal(){
  const modal = document.getElementById("bookPurchaseModal");
  if (modal) modal.classList.remove("show");
}
async function confirmBookPayment(){
  try{
    const res = await fetch("/api/book-purchases/confirm", { method:"POST", headers:{...authHeaders(), "Content-Type":"application/json"} });
    const data = await res.json();
    if(!res.ok || !data.success) throw new Error(data.message || "Payment confirmation failed");
    document.getElementById("bookPurchaseStatus").textContent = "⏳ Payment submitted. Admin verification pending. Book will appear after approval.";
    document.getElementById("bookPaidBtn").style.display = "none";
    closeBookModal();
    loadBookStatus();
  }catch(e){ alert(e.message || "Please login again."); }
}
async function loadBookStatus(){
  try{
    const res = await fetch(BOOK_STATUS_API + "?_=" + Date.now(), { headers: authHeaders(), cache:"no-store" });
    if(!res.ok) return;
    const data = await res.json();
    let host = document.getElementById("studentBookAccessBox");
    if(!host){
      const btn = document.querySelector(".btn-book");
      if(!btn) return;
      host = document.createElement("div"); host.id="studentBookAccessBox"; btn.parentElement.appendChild(host);
    }
    host.className = "student-book-access";
    host.innerHTML = data.canDownload ? `<div class="book-access-card active"><div class="book-access-icon">📖</div><div class="book-access-main"><div class="book-access-title">Book Access Active</div><div class="book-access-sub">Your book is ready to download.</div></div><button type="button" class="book-access-download" onclick="downloadBookSecure()">📥 Download Book</button></div>` : (data.purchase && data.purchase.status === 'admin_verified' ? `<div class="book-access-card closed"><div class="book-access-icon">🔒</div><div class="book-access-main"><div class="book-access-title">Book Access Closed</div><div class="book-access-sub">Admin has temporarily closed book access.</div></div><span class="book-access-pill">CLOSED</span></div>` : (data.purchase && data.purchase.status === 'rejected' ? `<div class="book-access-card declined"><div class="book-access-icon">🚫</div><div class="book-access-main"><div class="book-access-title">Payment Request Declined</div><div class="book-access-sub">You can submit a new payment confirmation.</div></div><span class="book-access-pill">DECLINED</span></div>` : (data.purchase && data.purchase.status === 'student_confirmed' ? `<div class="book-access-card pending"><div class="book-access-icon">⏳</div><div class="book-access-main"><div class="book-access-title">Verification Pending</div><div class="book-access-sub">Admin is checking your ₹499 payment.</div></div><span class="book-access-pill">PENDING</span></div>` : `<div class="book-access-empty"><span>📚</span><div><strong>Book Access</strong><small>Purchase the book to unlock access.</small></div></div>`)));
  }catch(e){ console.warn("Book status",e); }
}
async function downloadBookSecure(){
  try{
    const res = await fetch("/api/book-purchases/download?_=" + Date.now(), { headers: authHeaders(), cache:"no-store" });
    if(!res.ok){ const d=await res.json().catch(()=>({})); throw new Error(d.message || "Book access is not active"); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="book.pdf"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(e){ alert(e.message); }
}
window.buyBook=buyBook; window.closeBookModal=closeBookModal; window.startBookPayment=startBookPayment; window.confirmBookPayment=confirmBookPayment; window.downloadBookSecure=downloadBookSecure;
document.addEventListener("DOMContentLoaded", loadBookStatus);
setInterval(loadBookStatus, 8000);
