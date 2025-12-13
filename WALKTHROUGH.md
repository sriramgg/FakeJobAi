# ✅ Verification Guide: New Features

Here is how to test and verify the "Next Level" features recently added to FakeJobAI.

## 1. 🚨 Verify "Report Scam" Page
This page allow users to report frauds manually.
1. Open the file `d:/Ai/frontend/report.html` in your browser.
2. You should see a **Red-themed Glassmorphism** page.
3. Fill in the form (URL, Details) and click **Submit Report**.
4. You should see a "Success" message (Backend must be running).

## 2. 🧩 Verify Chrome Extension
This allows you to scan jobs directly on LinkedIn/Indeed.
1. Open **Google Chrome**.
2. Go to `chrome://extensions`.
3. Toggle **Developer Mode** (top right switch).
4. Click **Load Unpacked** (top left).
5. Select the folder: `d:/Ai/extension`.
6. Pin the "FakeJobAI" icon to your toolbar.
7. **Test it**: Open any job page (or even a random page) and click the Extension Icon. It will scan the URL against your local backend.

## 3. ✨ Verify Visual Highlighting
The dashboard now highlights suspicious words in yellow.
1. Open `dashboard.html`.
2. Click **Manual Analysis**.
3. Enter a suspicious description, for example:
   > "We are looking for immediate start, work from home, huge income, no experience needed, telegram interview."
4. Click **Analyze**.
5. In the pop-up, you should see:
   - **Key Influencers**: List of words.
   - **Context Analysis**: The description text with words like `immediate`, `huge income`, `telegram` **highlighted in yellow**.

## 4. 👍 Verify Feedback Loop
1. In the same result pop-up from step 3.
2. Look at the bottom for "Is this result accurate?".
3. Click the **Thumbs Up** or **Thumbs Down** button.
4. You should see an alert: "Thanks for your feedback!".
5. This saves the feedback to your backend database for future training.

---
**Troubleshooting**:
- Ensure your backend is running: `uvicorn app:app --reload`.
- If Extension fails, ensure server is at `http://127.0.0.1:8000`.
