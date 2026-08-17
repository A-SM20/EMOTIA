# EMOTIA • Emotion-Aware Intelligent Desk Assistant

[![Deploy to GitHub Pages](https://github.com/A-SM20/EMOTIA/actions/workflows/deploy.yml/badge.svg)](https://github.com/A-SM20/EMOTIA/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev/)

> **Frontend for Human-Robot Interaction (HRI) Research:**  
> *"Context-Aware and Explainable Emotion Intelligence for a Personalized HRI Desk Assistant"*

---

## 🌟 Overview

**EMOTIA** is a dark, futuristic workstation control center frontend designed to simulate and evaluate proactive, emotion-aware desk assistant interactions. It incorporates real-time multimodal emotion fusion, Russell's 2D circumplex model telemetry, transparent explainability (XAI) feature attribution, and longitudinal episodic memory.

---

## 🚀 Live Demo & Screens

- **Dashboard (Home / Live Assistant):** Futuristic Camera HUD with 68-point facial landmark mesh, Action Unit (AU) telemetry, real-time confidence bar, proactive AI speech bubble with Web Speech TTS, and a 9-subsystem health matrix.
- **Live Emotion (Emotion Monitor):** 3 parallel modality stream readouts (*Facial Vision Signal*, *Acoustic Speech Signal*, *Cross-Attention Fused State*), discrete emotion probability distribution, and a live rolling intensity area chart (Recharts).
- **Memory (Personalized Profile & Habits):** Researcher persona card, longitudinal affective trajectory chart (hourly calm/focus/stress patterns), and adaptive interaction preferences with explicit research disclaimer.
- **Conversations (Transcript History):** Chronological dialog log with rich metadata tags (`Detected: Frustrated • 87%`, `Context: Programming`), replayable audio, and interactive query testing.
- **Insights (Explainability / XAI):** Transparent feature attribution breakdown (`AU4/AU15`, `Acoustic Prosody`, `Task Context`, `Historical State`), dynamically generated natural-language explanations, and an end-to-end 5-stage HRI system architecture pipeline.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS + Custom futuristic scanline & glow utilities
- **Charts & Telemetry:** Recharts
- **Icons:** Lucide React
- **Voice Synthesis:** Web Speech API (Browser TTS)

---

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/A-SM20/EMOTIA.git
   cd EMOTIA
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🌐 GitHub Pages Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`). 
To enable GitHub Pages:
1. Go to your repository settings on GitHub: **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Any push to the `main` branch will automatically build and publish the site.

---

## 📄 License

MIT License. Designed for HRI Research and Academic Demonstration.
