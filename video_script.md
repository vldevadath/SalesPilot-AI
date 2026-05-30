# 🎬 SalesPilot AI — Hackathon Video Script (5 Minutes)

> **Total Duration:** 4 min 50 sec  
> **Format:** Narration (what you say) + Screen Action (what you show)  
> **Tip:** Practice reading each section aloud and time yourself before recording.

---

## SECTION 1 — THE HOOK + PROBLEM (0:00 - 0:45)

### 🎙️ What You Say:

> "What if I told you that sales reps spend **75 minutes manually researching** every single company before sending a cold email?
>
> They Google the company, scroll through LinkedIn, read news articles, check Glassdoor reviews, figure out what tech the company uses, and only then — write a personalized email.
>
> **75 minutes. Per company. Per lead.**
>
> If a sales team needs to reach out to 50 companies a day, that's physically impossible. The data is out there — scattered across hundreds of websites — but gathering it manually is painfully slow.
>
> Existing tools like ZoomInfo and Apollo charge **$15,000 to $50,000 a year**, and they rely on **stale, pre-crawled databases** — data that's 3 to 6 months old. By the time a rep reaches out, the funding announcement is old news, the hiring surge is over, and the opportunity is gone.
>
> That's the problem we solve."

### 🖥️ Screen Action:
- Show a split screen: on the left, a person manually Googling companies, LinkedIn tabs, news tabs (show the pain visually)
- Or show text animations of: "75 min per company" → "50 companies/day = impossible"

---

## SECTION 2 — THE SOLUTION (0:45 - 1:30)

### 🎙️ What You Say:

> "Introducing **SalesPilot AI** — an autonomous AI-powered sales intelligence platform that turns 75 minutes of manual research into **under 2 minutes**.
>
> You type a company name — say, 'Stripe' — and SalesPilot deploys **8 autonomous AI agents** that work in parallel. They scrape the live internet in real-time through **Bright Data**, analyze everything with **Groq Llama 3** and **Google Gemini**, and deliver a complete intelligence dossier with:
>
> - A full company profile scraped from their website
> - Hiring signals showing growth intent
> - Latest funding news and investor activity
> - Their full tech stack with gap analysis
> - Customer pain points from reviews
> - Competitive landscape
> - A **buying intent score from 0 to 100**
> - And **4 personalized outreach emails** ready to send
>
> All in under 2 minutes. Let me show you."

### 🖥️ Screen Action:
- Show the SalesPilot AI homepage (http://localhost:3000)
- Type "Stripe" into the search bar
- Click "Start Research"
- Show the agents working in real-time (the pipeline/progress)

---

## SECTION 3 — LIVE DEMO (1:30 - 2:45)

### 🎙️ What You Say:

> "Here's SalesPilot in action. I'll type in 'Notion' and hit Start Research.
>
> Watch — you can see each agent activating in real time. The Research Agent is scraping Notion's homepage through Bright Data's Web Unlocker. The Hiring Agent is searching Google via Bright Data's SERP API for their open positions. The News Agent is scanning Google News for funding and press events.
>
> All 6 research agents run **in parallel** — not one after another, but simultaneously.
>
> Now the research phase is complete, and the sequential analysis begins. The Intent Scoring Agent weighs all the signals — funding, hiring velocity, tech gaps, pain points — and calculates a buying probability score.
>
> And here's the result — a complete **Intelligence Dossier**:
>
> - Company profile with leadership, business model, and key facts
> - They're hiring 30+ people across engineering and sales — that's a strong growth signal
> - Recent Series C funding — they have budget
> - They use Slack but have pain points around workflow automation — that's our opportunity
> - **Buying Intent Score: 82 out of 100** — this is a hot lead
> - And here are 4 personalized emails, each using a different approach — pain point hook, ROI focus, news hook, and direct approach
>
> The **Compare** feature lets you research multiple companies and see them side-by-side to prioritize your outreach."

### 🖥️ Screen Action:
- Show the full research pipeline working in real-time
- Scroll through the intelligence dossier results
- Highlight the intent score
- Show the email drafts
- Briefly show the compare page if time allows

---

## SECTION 4 — ARCHITECTURE & TECHNOLOGIES (2:45 - 3:25)

### 🎙️ What You Say:

> "Let me walk you through the architecture.
>
> The **frontend** is built with Next.js 16 and Tailwind CSS, with Framer Motion for animations. It connects to the backend via REST API and Server-Sent Events for real-time streaming.
>
> The **backend** runs on FastAPI with Python. It orchestrates 8 AI agents using LangChain and LangGraph. The LLM layer uses lightning-fast **Groq Llama 3** as the primary engine for massive speed, with **Google Gemini 2.5 Flash** as a fallback for reliability.
>
> Now, the core of our product — **Bright Data integration**. We use three Bright Data products:
>
> **First, the SERP API** — it powers 5 of our 8 agents. Every time an agent needs to search Google for hiring data, news, tech stack info, pain points, or competitor intelligence, it goes through Bright Data's SERP API with residential proxies, bypassing CAPTCHAs and blocks to get clean, structured results.
>
> **Second, the Web Unlocker** — our Research Agent uses this to scrape target company websites directly, bypassing Cloudflare and bot detection to extract real content from their homepage.
>
> **Third, the Data Collection API** — we use Bright Data's pre-built LinkedIn Company Profile dataset to safely extract structured LinkedIn data without risking account bans.
>
> All data is **live from the internet** — not a stale database. If a company raised funding 2 hours ago, SalesPilot knows."

### 🖥️ Screen Action:
- Show the architecture diagram from your README (the ASCII art or a clean version)
- Highlight each Bright Data product as you mention it
- Optionally show a snippet of `brightdata.py` code showing the API calls

---

## SECTION 5 — BUSINESS & MARKET (3:25 - 4:15)

### 🎙️ What You Say:

> "Let's talk about the market opportunity.
>
> The **sales intelligence market** is valued at **$3.4 billion** in 2024, growing at 10% annually. Our Total Addressable Market — the TAM — is **$5.7 billion by 2028**.
>
> Our Serviceable Addressable Market — SAM — focuses on **SMBs and startups** who can't afford $15,000-a-year tools like ZoomInfo. That's a **$1.2 billion segment** that's massively underserved.
>
> **Competitor analysis:**
>
> - **ZoomInfo** — $15K/year, stale database, no AI analysis. We're real-time and AI-powered.
> - **Apollo.io** — $5K/year, requires manual workflows. We're fully autonomous.
> - **Clay.com** — $500/month, workflow builder but no autonomous agents. We're one-click.
> - **6sense** — $50K/year, enterprise only. We're accessible to everyone.
>
> **Our Unique Selling Proposition:** SalesPilot is the **only tool** that combines live web scraping through Bright Data with autonomous AI agents. We don't use stale databases — every data point is scraped from the internet in real-time.
>
> **Monetization strategy:**
>
> - **Freemium tier** — 5 company researches per month, free
> - **Pro tier** — $49/month for unlimited research + premium data exports
> - **Team tier** — $199/month for team collaboration + API access + bulk research
> - **Enterprise** — Custom pricing with dedicated support, SSO, and custom agents
>
> We also have a **usage-based revenue model** — heavy users pay per additional research beyond their plan limits."

### 🖥️ Screen Action:
- Show a slide or text overlay with:
  - TAM: $5.7B by 2028
  - SAM: $1.2B (SMB segment)
  - Competitor comparison table
  - Pricing tiers

---

## SECTION 6 — FUTURE PLANS (4:15 - 4:40)

### 🎙️ What You Say:

> "Looking ahead, here's our roadmap:
>
> **Short-term** — We'll add continuous signal monitoring, where SalesPilot automatically watches your target companies and alerts you when buying signals appear — like new funding, hiring surges, or negative news about competitors.
>
> **Medium-term** — Multi-channel outreach with AI-generated LinkedIn messages, Twitter DMs, and phone call scripts. Plus a Chrome extension that gives you instant intelligence on any company you visit.
>
> **Long-term** — We envision SalesPilot as a **fully autonomous SDR** — it identifies leads, researches them, scores intent, generates personalized outreach, sends it, tracks responses, and follows up. A sales team of AI agents working 24/7.
>
> The impact is massive — small sales teams can compete with enterprise-level outreach, companies can 10x their pipeline, and reps can focus on what they do best — building relationships."

### 🖥️ Screen Action:
- Show a roadmap graphic or bullet points on screen
- Or keep showing the product while narrating

---

## SECTION 7 — TEAM & CLOSE (4:40 - 4:50)

### 🎙️ What You Say:

> "I'm **[Your Name]**, a **[your role — e.g., Computer Science student / Full-stack developer]** passionate about building AI-powered tools that solve real business problems.
>
> *(If you have teammates, introduce them:)*
> *My teammate **[Name]** handles **[their role]**.*
>
> SalesPilot AI — turning 75 minutes of research into 2 minutes of intelligence. Powered by **Bright Data**, **Groq**, and **Google Gemini**.
>
> Thank you!"

### 🖥️ Screen Action:
- Show your face / team photo (webcam or picture)
- End with the SalesPilot AI homepage on screen
- Optional: show your GitHub repo link

---

## 📋 Quick Reference — Timing Summary

| Section | Topic | Duration | Cumulative |
|---------|-------|----------|------------|
| 1 | Problem (The Hook) | 45 sec | 0:45 |
| 2 | Solution (What is SalesPilot) | 45 sec | 1:30 |
| 3 | Live Demo (Screen Recording) | 75 sec | 2:45 |
| 4 | Architecture + Bright Data | 40 sec | 3:25 |
| 5 | Business + Market + Monetization | 50 sec | 4:15 |
| 6 | Future Plans | 25 sec | 4:40 |
| 7 | Team + Closing | 10 sec | 4:50 |

---

## 🎥 Recording Tips

1. **Use OBS Studio** (free) or **Loom** for screen + voice recording
2. **Record the demo first** (Section 3) — make sure the app is working smoothly
3. **Speak slowly and clearly** — practice the script 2-3 times before recording
4. **Have the app pre-loaded** — don't waste time on loading screens
5. **Pre-run one research** so you can show results instantly if the live demo takes too long
6. **Add subtle background music** — try free tracks from YouTube Audio Library
7. **Keep energy high** — judges watch dozens of videos, yours needs to grab attention

---

## 📝 Fill In Before Recording

- [ ] Your name: ____________
- [ ] Your role/title: ____________
- [ ] Teammate names (if any): ____________
- [ ] GitHub repo URL: https://github.com/24525Bilal/SalesPilot-AI
- [ ] Demo company to research: ____________ (pick one that gives impressive results)
