export const SCENARIOS = {
  frustrated: {
    id: 'frustrated',
    name: 'Frustrated / Debugging',
    label: 'Frustrated',
    emoji: '😤',
    color: '#F59E0B', // Amber
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    glowClass: 'glow-border-amber',
    confidence: 87,
    taskContext: 'Programming • Python & PyTorch',
    taskDetails: 'Refactoring cross_attention_fusion.py (3.2 hrs active)',
    activeApp: 'VS Code - eda-core',
    valence: -0.62, // Unpleasant
    arousal: 0.74,  // High activation
    assistantMessage: "You seem frustrated with this syntax issue... would you like me to help break the problem into smaller steps or run a quick tensor shape diff check?",
    proactiveAction: "Offer automated tensor shape inspection & suggest a 5-min cognitive break",
    shortExplanation: "Detected brow lowerer (AU4) and lip corner depressor (AU15) combined with acoustic pitch spikes after 3 hours continuous coding with repeated runtime errors.",
    detailedExplanation: "Model identified sustained Brow Lowerer (AU4, 89% intensity) and Lip Corner Depressor (AU15, 76% intensity) across the 120-frame temporal window. Concurrently, the acoustic front-end detected fundamental frequency (F0) variance spikes (+42Hz) and high vocal shimmer. The Context Engine weighted 192 minutes of uninterrupted debugging without test completion, resolving multimodal conflict toward Frustrated (87% confidence).",
    
    modalities: {
      facial: {
        modality: 'Facial Vision Signal',
        architecture: 'Swin-Transformer FER + OpenFace 3D',
        confidence: 89,
        detectedUnits: ['AU4 (Brow Lowerer: 0.89)', 'AU15 (Lip Corner Depressor: 0.76)', 'AU7 (Lid Tightener: 0.65)'],
        metric: 'Gaze fixated on error stacktrace (94% dwell)',
        status: 'Active',
      },
      vocal: {
        modality: 'Acoustic Speech Signal',
        architecture: 'Wav2Vec2.0 + EmotiVoice Prosody',
        confidence: 82,
        detectedUnits: ['F0 Pitch: 246 Hz (+42Hz shift)', 'Jitter: 2.8% (Elevated)', 'Vocal Tension: High'],
        metric: 'Compressed utterance duration & sigh detected',
        status: 'Active',
      },
      fused: {
        modality: 'Cross-Attention Fused State',
        architecture: 'Context-Aware Multimodal Transformer',
        confidence: 87,
        detectedUnits: ['Attention Weight Vision: 48%', 'Attention Weight Audio: 32%', 'Attention Weight Context: 20%'],
        metric: 'Fusion latency: 12.4ms (Real-time)',
        status: 'Synchronized',
      }
    },

    emotionDistribution: [
      { name: 'Frustrated', percentage: 87, color: '#F59E0B' },
      { name: 'Stressed', percentage: 64, color: '#EF4444' },
      { name: 'Sad', percentage: 22, color: '#8B5CF6' },
      { name: 'Neutral', percentage: 12, color: '#06B6D4' },
      { name: 'Surprised', percentage: 8, color: '#EC4899' },
      { name: 'Calm', percentage: 5, color: '#38BDF8' },
      { name: 'Happy', percentage: 3, color: '#10B981' },
    ],

    contributingFactors: [
      { factor: 'Facial Expression (AU4 & AU15)', percentage: 38, desc: 'Prominent brow furrowing and lip compression' },
      { factor: 'Conversation Context (3h Debugging)', percentage: 28, desc: 'Long duration with 6 consecutive failing test runs' },
      { factor: 'Acoustic Prosody & Pitch Jitter', percentage: 22, desc: 'Elevated vocal strain and sharp tone transitions' },
      { factor: 'Previous Affective Trajectory', percentage: 12, desc: 'Transitioned from Focused/Calm -> Frustrated over 45m' },
    ]
  },

  calm: {
    id: 'calm',
    name: 'Calm / Deep Work Flow',
    label: 'Calm',
    emoji: '😌',
    color: '#38BDF8', // Cyan / Light Blue
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    glowClass: 'glow-border-cyan',
    confidence: 94,
    taskContext: 'Writing • Research Paper (LaTeX)',
    taskDetails: 'Drafting Section 4: Multimodal Attention Fusion',
    activeApp: 'Overleaf - IEEE HRI 2026',
    valence: 0.72,  // Pleasant
    arousal: -0.35, // Relaxed / Stable
    assistantMessage: "You're in a steady deep work flow state. I'll minimize interruptions and keep ambient desk lighting optimal.",
    proactiveAction: "Maintain silent background monitoring; suppress non-urgent notification alerts",
    shortExplanation: "Relaxed facial landmarks with optimal blink rate (14 bpm), steady vocal cadence, and smooth typing rhythm during paper drafting.",
    detailedExplanation: "Perception inputs show neutral Corrugator supercilii relaxation and open steady eye gaze. Prosody extraction displays smooth fundamental frequency curves with zero acoustic jitter anomalies. Contextual telemetry indicates steady LaTeX compilation every 8 minutes with continuous forward progress, resulting in a robust 94% Calm/Flow prediction.",

    modalities: {
      facial: {
        modality: 'Facial Vision Signal',
        architecture: 'Swin-Transformer FER + OpenFace 3D',
        confidence: 93,
        detectedUnits: ['AU0 (Neutral baseline: 0.92)', 'Blink Rate: 14/min (Optimal)', 'Head Pose: Stable (Yaw +1.2°)'],
        metric: 'Smooth continuous ocular saccades',
        status: 'Active',
      },
      vocal: {
        modality: 'Acoustic Speech Signal',
        architecture: 'Wav2Vec2.0 + EmotiVoice Prosody',
        confidence: 91,
        detectedUnits: ['F0 Pitch: 168 Hz (Stable)', 'Jitter: 0.4% (Minimal)', 'Energy: Moderate/Controlled'],
        metric: 'Calm, measured cadence and tone',
        status: 'Active',
      },
      fused: {
        modality: 'Cross-Attention Fused State',
        architecture: 'Context-Aware Multimodal Transformer',
        confidence: 94,
        detectedUnits: ['Attention Weight Vision: 42%', 'Attention Weight Audio: 36%', 'Attention Weight Context: 22%'],
        metric: 'Fusion latency: 9.8ms (Real-time)',
        status: 'Synchronized',
      }
    },

    emotionDistribution: [
      { name: 'Calm', percentage: 94, color: '#38BDF8' },
      { name: 'Neutral', percentage: 78, color: '#06B6D4' },
      { name: 'Happy', percentage: 45, color: '#10B981' },
      { name: 'Stressed', percentage: 8, color: '#EF4444' },
      { name: 'Frustrated', percentage: 6, color: '#F59E0B' },
      { name: 'Surprised', percentage: 4, color: '#EC4899' },
      { name: 'Sad', percentage: 2, color: '#8B5CF6' },
    ],

    contributingFactors: [
      { factor: 'Facial Relaxation & Gaze Stability', percentage: 40, desc: 'Zero tension in orbital muscles, steady focal distance' },
      { factor: 'Consistent Cognitive Cadence', percentage: 32, desc: 'Uniform keystroke cadence and steady page scrolling' },
      { factor: 'Vocal Harmonic Stability', percentage: 18, desc: 'Low spectral flux and stable harmonic-to-noise ratio' },
      { factor: 'Historical Baseline Consistency', percentage: 10, desc: 'Sustained calm state over past 40 minutes' },
    ]
  },

  happy: {
    id: 'happy',
    name: 'Happy / Milestone Reached',
    label: 'Happy',
    emoji: '😊',
    color: '#10B981', // Emerald
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    glowClass: 'glow-border-emerald',
    confidence: 91,
    taskContext: 'Evaluation • Benchmark Pipeline',
    taskDetails: 'Ablation study completed (F1-score: 0.948)',
    activeApp: 'JupyterLab - Evaluation.ipynb',
    valence: 0.88,  // Very pleasant
    arousal: 0.65,  // Energized
    assistantMessage: "Great job! Your fusion model benchmark converged with 94.8% accuracy. Would you like me to generate the ROC curve graphs for the paper?",
    proactiveAction: "Celebrate milestone achievement; offer automated figure and LaTeX table export",
    shortExplanation: "Genuine Duchenne smile (AU6 + AU12) detected alongside melodic rising vocal inflections following successful ablation experiment.",
    detailedExplanation: "Vision sensors registered simultaneous Zygomaticus Major (AU12, 0.94) and Orbicularis Oculi (AU6, 0.88) activation, indicative of genuine positive affect. Audio feature extraction captured upward intonation contours and increased spectral power. Context integration flagged the terminal output 'Validation Accuracy: 94.8% - Exceeded Baseline', solidifying 91% Happy.",

    modalities: {
      facial: {
        modality: 'Facial Vision Signal',
        architecture: 'Swin-Transformer FER + OpenFace 3D',
        confidence: 95,
        detectedUnits: ['AU12 (Lip Corner Puller: 0.94)', 'AU6 (Cheek Raiser: 0.88)', 'AU25 (Lips Part: 0.72)'],
        metric: 'Duchenne marker confidence: 0.96',
        status: 'Active',
      },
      vocal: {
        modality: 'Acoustic Speech Signal',
        architecture: 'Wav2Vec2.0 + EmotiVoice Prosody',
        confidence: 88,
        detectedUnits: ['F0 Pitch: 284 Hz (Dynamic rise)', 'Energy: +6.4 dB', 'Harmonic Ratio: 22 dB'],
        metric: 'Melodic upward pitch inflections',
        status: 'Active',
      },
      fused: {
        modality: 'Cross-Attention Fused State',
        architecture: 'Context-Aware Multimodal Transformer',
        confidence: 91,
        detectedUnits: ['Attention Weight Vision: 52%', 'Attention Weight Audio: 30%', 'Attention Weight Context: 18%'],
        metric: 'Fusion latency: 11.1ms (Real-time)',
        status: 'Synchronized',
      }
    },

    emotionDistribution: [
      { name: 'Happy', percentage: 91, color: '#10B981' },
      { name: 'Calm', percentage: 72, color: '#38BDF8' },
      { name: 'Surprised', percentage: 54, color: '#EC4899' },
      { name: 'Neutral', percentage: 25, color: '#06B6D4' },
      { name: 'Stressed', percentage: 4, color: '#EF4444' },
      { name: 'Frustrated', percentage: 2, color: '#F59E0B' },
      { name: 'Sad', percentage: 1, color: '#8B5CF6' },
    ],

    contributingFactors: [
      { factor: 'Duchenne Smile (AU6 + AU12)', percentage: 45, desc: 'Bilateral zygomatic cheek elevation and eye crinkle' },
      { factor: 'Task Success Context Signal', percentage: 25, desc: 'Model evaluation test script passed with new top metric' },
      { factor: 'Upward Vocal Energy & Pitch', percentage: 20, desc: 'Energetic acoustic peak with pleasant harmonic tone' },
      { factor: 'Interactive Conversational Positivity', percentage: 10, desc: 'Positive sentiment detected in recent spoken query' },
    ]
  },

  stressed: {
    id: 'stressed',
    name: 'Stressed / Submission Deadline',
    label: 'Stressed',
    emoji: '😰',
    color: '#EF4444', // Rose/Red
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    glowClass: 'glow-border-rose',
    confidence: 89,
    taskContext: 'Submission • Conference Portal',
    taskDetails: 'Final PDF submission window closes in 2 hours',
    activeApp: 'Firefox - CMT Submission System',
    valence: -0.78, // High unpleasant
    arousal: 0.89,  // Very high activation
    assistantMessage: "High stress indicators detected before the paper deadline. I have pre-checked the formatting guidelines and page limits for you.",
    proactiveAction: "Streamline secondary tasks; auto-verify PDF compliance checklist & citations",
    shortExplanation: "Rapid micro-saccades, elevated speaking rate (+35% wpm), and rapid window switching detected 120 minutes prior to paper deadline.",
    detailedExplanation: "Perception stream detected micro-tremors in head posture, elevated blink frequency (38 bpm), and lip tightening (AU23). Speech telemetry noted a 35% increase in word rate and sharp acoustic energy peaks. The Context Engine cross-referenced the active browser tab (CMT Submission Portal, countdown: 01:54:12), classifying the state as High Stress (89% confidence).",

    modalities: {
      facial: {
        modality: 'Facial Vision Signal',
        architecture: 'Swin-Transformer FER + OpenFace 3D',
        confidence: 86,
        detectedUnits: ['AU23 (Lip Tightener: 0.84)', 'AU1 (Inner Brow Raiser: 0.79)', 'Blink Rate: 38/min (High)'],
        metric: 'Frequent erratic ocular saccades across screens',
        status: 'Active',
      },
      vocal: {
        modality: 'Acoustic Speech Signal',
        architecture: 'Wav2Vec2.0 + EmotiVoice Prosody',
        confidence: 92,
        detectedUnits: ['Speech Rate: +35% WPM', 'High-frequency Spectral Slope', 'Voice Strain: 0.81'],
        metric: 'Short breath intervals, clipped consonants',
        status: 'Active',
      },
      fused: {
        modality: 'Cross-Attention Fused State',
        architecture: 'Context-Aware Multimodal Transformer',
        confidence: 89,
        detectedUnits: ['Attention Weight Context: 44%', 'Attention Weight Audio: 34%', 'Attention Weight Vision: 22%'],
        metric: 'Fusion latency: 13.2ms (Real-time)',
        status: 'Synchronized',
      }
    },

    emotionDistribution: [
      { name: 'Stressed', percentage: 89, color: '#EF4444' },
      { name: 'Frustrated', percentage: 71, color: '#F59E0B' },
      { name: 'Surprised', percentage: 28, color: '#EC4899' },
      { name: 'Neutral', percentage: 18, color: '#06B6D4' },
      { name: 'Sad', percentage: 15, color: '#8B5CF6' },
      { name: 'Calm', percentage: 6, color: '#38BDF8' },
      { name: 'Happy', percentage: 4, color: '#10B981' },
    ],

    contributingFactors: [
      { factor: 'Temporal Deadline Urgency Context', percentage: 38, desc: 'Paper portal timer < 2 hours with frequent re-compiles' },
      { factor: 'Rapid Speech Cadence & Breath Gaps', percentage: 28, desc: 'High acoustic acceleration and elevated F0 floor' },
      { factor: 'Facial Micro-Tension & High Blinks', percentage: 22, desc: 'Blink frequency over 2.5x baseline with lip pinching' },
      { factor: 'Erratic Window Switching Pattern', percentage: 12, desc: 'Rapid alt-tab switching between terminal, PDF, browser' },
    ]
  },

  neutral: {
    id: 'neutral',
    name: 'Neutral / Literature Reading',
    label: 'Neutral',
    emoji: '🧐',
    color: '#06B6D4', // Cyan
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    glowClass: 'glow-border-cyan',
    confidence: 84,
    taskContext: 'Reading • ArXiv Papers',
    taskDetails: 'Reviewing: Explainable Multimodal Affective Computing in HRI',
    activeApp: 'Acrobat Reader - arxiv_2508.01942.pdf',
    valence: 0.05,  // Neutral
    arousal: 0.10,  // Neutral / baseline
    assistantMessage: "Reviewing HRI papers. Let me know if you want a quick summary of the key findings or BibTeX citations extracted.",
    proactiveAction: "Offer smart PDF summarization & automatic reference extraction",
    shortExplanation: "Baseline facial expression without notable AU activation, moderate vocal pitch, and smooth scroll rate on academic document.",
    detailedExplanation: "Facial action units remain within ±0.08 standard deviation of participant baseline. Speech prosody shows standard conversational resonance with no affective inflection. The Context Engine notes smooth downward scrolling through a 14-page PDF document, assigning 84% Neutral probability.",

    modalities: {
      facial: {
        modality: 'Facial Vision Signal',
        architecture: 'Swin-Transformer FER + OpenFace 3D',
        confidence: 82,
        detectedUnits: ['AU0 (Baseline resting pose)', 'Gaze Vector: Center Screen', 'Blink Rate: 16/min (Normal)'],
        metric: 'Stable downward reading gaze pattern',
        status: 'Active',
      },
      vocal: {
        modality: 'Acoustic Speech Signal',
        architecture: 'Wav2Vec2.0 + EmotiVoice Prosody',
        confidence: 79,
        detectedUnits: ['F0 Pitch: 174 Hz (Mean)', 'Jitter: 0.7%', 'Intensity: 62 dB (Conversational)'],
        metric: 'Standard baseline acoustic profile',
        status: 'Active',
      },
      fused: {
        modality: 'Cross-Attention Fused State',
        architecture: 'Context-Aware Multimodal Transformer',
        confidence: 84,
        detectedUnits: ['Attention Weight Vision: 38%', 'Attention Weight Context: 36%', 'Attention Weight Audio: 26%'],
        metric: 'Fusion latency: 10.2ms (Real-time)',
        status: 'Synchronized',
      }
    },

    emotionDistribution: [
      { name: 'Neutral', percentage: 84, color: '#06B6D4' },
      { name: 'Calm', percentage: 68, color: '#38BDF8' },
      { name: 'Happy', percentage: 20, color: '#10B981' },
      { name: 'Surprised', percentage: 12, color: '#EC4899' },
      { name: 'Stressed', percentage: 9, color: '#EF4444' },
      { name: 'Frustrated', percentage: 8, color: '#F59E0B' },
      { name: 'Sad', percentage: 5, color: '#8B5CF6' },
    ],

    contributingFactors: [
      { factor: 'Baseline Resting Facial Features', percentage: 38, desc: 'Absence of significant Action Unit activations' },
      { factor: 'Continuous Academic Reading Context', percentage: 32, desc: 'Predictable vertical page scrolling cadence' },
      { factor: 'Uninflected Speech Spectrum', percentage: 20, desc: 'Moderate conversational amplitude and neutral pitch' },
      { factor: 'Steady Physiological Equilibrium', percentage: 10, desc: 'Consistent baseline heart-rate-variability estimate' },
    ]
  }
};

export const INITIAL_CONVERSATIONS = [
  {
    id: 1,
    sender: 'user',
    text: "Can you explain why the cross-attention layer keeps throwing a tensor dimension mismatch error?",
    time: '14:22:10',
    emotionTag: { label: 'Frustrated', confidence: 87, color: '#F59E0B' },
    modality: 'Voice + Screen Context',
  },
  {
    id: 2,
    sender: 'assistant',
    text: "I noticed your frustration when debugging the PyTorch shapes. The visual transformer outputs [batch, 196, 768] while the audio branch outputs [batch, 128, 512]. You need a projection linear layer before the dot-product attention: `self.proj_audio = nn.Linear(512, 768)`. Would you like me to generate the fix snippet?",
    time: '14:22:14',
    contextTag: { task: 'Programming (PyTorch)', emotionState: 'Frustrated', proactive: true },
    recommendation: "Provided tensor dimension alignment snippet",
  },
  {
    id: 3,
    sender: 'user',
    text: "That worked! The training run finally started without crashing.",
    time: '14:35:40',
    emotionTag: { label: 'Happy', confidence: 91, color: '#10B981' },
    modality: 'Voice Input',
  },
  {
    id: 4,
    sender: 'assistant',
    text: "Excellent! I'm monitoring the epoch losses. Epoch 1/50 completed with validation loss dropping to 0.42. I'll silently log the checkpoints so you can focus on drafting the methodology section.",
    time: '14:35:45',
    contextTag: { task: 'Training Monitoring', emotionState: 'Happy', proactive: false },
    recommendation: "Switched to background logging mode to preserve flow",
  },
  {
    id: 5,
    sender: 'user',
    text: "Can you verify if our discussion section meets the IEEE HRI 8-page formatting limit?",
    time: '15:10:15',
    emotionTag: { label: 'Stressed', confidence: 89, color: '#EF4444' },
    modality: 'Text Query',
  },
  {
    id: 6,
    sender: 'assistant',
    text: "I scanned your Overleaf document. The paper is currently at 7.85 pages, well within the 8-page main body limit. I have also pre-checked references [12] and [19] which had missing DOI numbers and updated the .bib entries.",
    time: '15:10:20',
    contextTag: { task: 'Paper Verification', emotionState: 'Stressed', proactive: true },
    recommendation: "Validated page constraint & patched bibliography DOIs",
  },
  {
    id: 7,
    sender: 'user',
    text: "Summarize the primary takeaways of the multimodal explainability paper on my screen.",
    time: '15:42:00',
    emotionTag: { label: 'Neutral', confidence: 84, color: '#06B6D4' },
    modality: 'Voice Query',
  },
  {
    id: 8,
    sender: 'assistant',
    text: "The paper demonstrates that attributing emotion predictions to distinct Action Units (AU) and acoustic pitch vectors increases user trust by 34% compared to black-box confidence scores. I've highlighted the 3 key equations in your PDF viewer.",
    time: '15:42:06',
    contextTag: { task: 'Literature Analysis', emotionState: 'Neutral', proactive: true },
    recommendation: "Extracted key empirical findings and annotated PDF",
  }
];

export const SYSTEM_SUBMODULES = [
  { id: 'camera', name: 'Camera Stream', category: 'Perception', status: 'Active', latency: '12ms', color: '#10B981' },
  { id: 'microphone', name: 'Microphone Array', category: 'Perception', status: 'Active', latency: '8ms', color: '#10B981' },
  { id: 'face_model', name: 'Face Model (Swin-FER)', category: 'Perception', status: 'Ready', latency: '18ms', color: '#10B981' },
  { id: 'speech_model', name: 'Speech Model (Wav2Vec2)', category: 'Perception', status: 'Ready', latency: '15ms', color: '#10B981' },
  { id: 'fusion', name: 'Emotion Fusion (X-Attention)', category: 'Reasoning', status: 'Fused', latency: '11ms', color: '#22D3EE' },
  { id: 'context', name: 'Context Engine', category: 'Reasoning', status: 'Connected', latency: '5ms', color: '#22D3EE' },
  { id: 'memory', name: 'Personalized Memory', category: 'Reasoning', status: 'Ready', latency: '7ms', color: '#22D3EE' },
  { id: 'llm', name: 'Proactive LLM Agent', category: 'Interaction', status: 'Active', latency: '120ms', color: '#3B82F6' },
  { id: 'backend', name: 'HRI Core Backend', category: 'System', status: 'Connected', latency: '4ms', color: '#10B981' },
];

export const TEAM_ARCHITECTURE_MODULES = [
  {
    step: '1. User Input & Desk Context',
    owner: 'Participant & Desk Setup',
    description: 'Real-time webcam video (60 FPS), binaural microphone array, desktop telemetry (active IDE, editor, task duration).',
    color: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-cyan-500/40',
  },
  {
    step: '2. Multimodal Perception',
    owner: 'Perception Team (Vision & Audio)',
    description: 'Swin-Transformer FER extracting 18 Facial Action Units (OpenFace 3D) + Wav2Vec2 prosodic acoustic feature extractor.',
    color: 'from-cyan-500/20 to-emerald-500/20',
    border: 'border-emerald-500/40',
  },
  {
    step: '3. Context & Memory Engine',
    owner: 'Reasoning & Context Team',
    description: 'Cross-Attention Multimodal Fusion, Dynamic Task State Tracker, Episodic & Personalized Interaction Memory bank.',
    color: 'from-emerald-500/20 to-indigo-500/20',
    border: 'border-indigo-500/40',
  },
  {
    step: '4. Decision & Explainability (XAI)',
    owner: 'XAI & Decision Team',
    description: 'Feature attribution module computing Shapley/AU weightings and generating human-interpretable natural language rationale.',
    color: 'from-indigo-500/20 to-purple-500/20',
    border: 'border-purple-500/40',
  },
  {
    step: '5. Proactive Desk Assistant UI',
    owner: 'HRI Frontend & Interaction Team',
    description: 'EMOTIA Workstation Dashboard, synthetic speech dialog, real-time emotion telemetry, adaptive recommendations.',
    color: 'from-purple-500/20 to-blue-500/20',
    border: 'border-blue-500/40',
  }
];

export const LEARNED_PREFERENCES_MOCK = [
  { id: 1, title: "Prefers Technical & Concrete Explanations", desc: "When debugging code, prefers code diffs and tensor shape inspects over generic high-level advice.", category: "Communication Style" },
  { id: 2, title: "Deep Work Flow Protection", desc: "Prefers silent background monitoring during writing sessions in LaTeX/Overleaf, suppressing minor notifications.", category: "Proactivity" },
  { id: 3, title: "Frequent Evening Interactions", desc: "Most intensive research coding sessions occur between 18:00 - 23:30; assistant automatically dims interface glare.", category: "Temporal Pattern" },
  { id: 4, title: "Concise Guidance under High Stress", desc: "During pre-deadline windows, prefers bullet points with immediate actionable fixes rather than multi-paragraph reasoning.", category: "Affective Strategy" },
  { id: 5, title: "Primary Research Interest Tags", desc: "Frequently works on Multimodal Affective Computing, Robot-Assisted Learning, and Neuro-Symbolic XAI.", category: "Domain Knowledge" },
];
