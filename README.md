# 🎓 FUTA Survival

A 2D endless runner built for the AWS Student Builder Group Webinar at the Federal University of Technology, Akure (FUTA). Navigate the Nigerian university journey from 100L to 500L, jumping over exams and sliding under project corrections.

## 🛠️ Tech Stack
- **Frontend:** Phaser 3, Vite, Vanilla TypeScript, HTML/CSS
- **Backend:** AWS Amplify Gen 2
- **Database:** Amazon DynamoDB
- **API:** Amazon API Gateway (HTTP API) + AWS Lambda
- **Real-time Leaderboard:** AWS AppSync Events (WebSockets)
- **CI/CD:** AWS Amplify Hosting (connected to GitHub)

## ✨ Core Features
- **5 Unique Levels:** Progress from 100L (Freshers) to 500L (FYB), with dynamic background colors and speed scaling.
- **Endless Mode:** Survive 500L to enter "Alumni Endless Mode" with extreme speed and a 10x score multiplier.
- **Cumulative Average Scoring:** The leaderboard doesn't just show your best run; it calculates your average score across all your attempts.
- **Carryover Penalties:** Crashing in higher levels deducts heavy points from your run (e.g., -800 points in 500L).
- **Unique Identifiers:** Players are tracked by Name, Department, and the last 4 digits of their Matric Number (e.g., `OLUFEMI (CSC) #0907`).
- **Real-time Updates:** The Top 20 leaderboard updates instantly across all devices using AWS WebSockets.
- **Mobile Ready:** Responsive DOM overlays and tap-to-jump/slide mechanics.

## 🚀 Quick Start (Run Locally)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/futa-survival.git
   cd futa-survival
   ```

2. **Install dependencies:**
   *(Note: We use `--legacy-peer-deps` to prevent AWS Amplify dependency conflicts)*
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Deploy the Backend (requires AWS CLI configured):**
   ```bash
   npx ampx sandbox
   ```
   *(Wait for it to finish and generate the `amplify_outputs.json` file)*

4. **Create your `.env.local` file:**
   Run this script to automatically extract the AWS endpoints and keys into your environment:
   ```bash
   node -e '
   const o = require("./amplify_outputs.json");
   const api = o.custom?.API?.futa?.endpoint ?? "";
   const ev = o.custom?.events ?? {};
   const out = [
     "VITE_API_URL=" + api.replace(/\/$/, ""),
     "VITE_EVENTS_ENDPOINT=wss://" + (ev.realtimeEndpoint ?? "") + "/event/realtime",
     "VITE_EVENTS_CHANNEL=" + (ev.channel ?? ""),
     "VITE_EVENTS_API_KEY=" + (ev.apiKey ?? ""),
   ].join("\n");
   require("fs").writeFileSync(".env.local", out + "\n");
   console.log(out);
   '
   ```

5. **Start the Frontend:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 🎮 How to Play
- **Jump:** `Spacebar`, `Up Arrow`, or tap the top half of the screen.
- **Jump:** `Down Arrow`, `S`, or tap the bottom half of the screen.
- **Pause:** `Escape` (ESC) key.

## ☁️ Deployment
This project uses **AWS Amplify Hosting** for continuous deployment. 
Every push to the `main` branch triggers a new build and deploy. To deploy your own version, connect this GitHub repository to the AWS Amplify Console and add the four `VITE_` environment variables to the build settings.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
