# Earn Add-ons – Usage Guide

## Student

### 1. Daily Streak + XP
Complete a successful English activity. The app records one daily streak per calendar day and adds XP. The streak increases on consecutive days.

### 2. Daily Challenge
The challenge target is 10 successful activities per day. Progress is updated automatically after a correct activity. Once 10/10 is reached, open Add-ons and press Claim. The reward can be claimed once per day.

### 3. Referral
Every student receives a unique referral code. Copy the code and share it with a new student. The new student logs in, opens Add-ons, enters the code and presses Apply Referral Code. A student can apply a referral only once and cannot use their own code. Both accounts receive the configured ₹2 referral bonus.

### 4. Coupon
Admin creates an active coupon. Student enters it under Coupon and presses Redeem Coupon. Coupons are single-use globally: after a successful redemption, the coupon is automatically deleted, so Admin only sees coupons that are still available. If the wallet/database update fails, the coupon is restored.

### 5. Achievements / Level
Successful activities add XP. Badges unlock from activity count, streak and total earning. Level is calculated from XP.

### 6. Leaderboard
The top 10 active students are shown by total earning.

### 7. Support Ticket
Student selects a category, writes a subject and problem, then sends the ticket. Admin can reply and resolve it. Student can reopen Add-ons and view the reply/status.

## Admin

Open **🚀 Add-ons Admin**.

### Coupon Management
Enter a code such as `WELCOME10`, enter a reward, and press **Add / Update**. Only active unused coupons are listed. Admin can disable or manually delete an unused coupon. A coupon redeemed by a student disappears automatically.

### Support Tickets
Admin can read the student message, reply + resolve, or permanently delete a ticket.

### Referral & Challenge Management
Admin can see each student's referral code, referral count, referrer, streak, level, XP and daily challenge progress. Admin can mark a challenge complete or reset it.

### Analytics
The dashboard shows active students, total earning, referrals, open tickets and available coupons.

## Important

Run the project through the Node server, not by double-clicking an HTML file:

```bash
npm install
npm start
```

Then open the local address printed by the server (normally `http://localhost:5000`). MongoDB must be configured in `.env`.
