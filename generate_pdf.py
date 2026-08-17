import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#71717a"))
        
        # Header (page > 1)
        if self._pageNumber > 1:
            self.drawString(40, 755, "EMOTIA • Emotion-Aware Intelligent Desk Assistant — Walkthrough & Architecture")
            self.setStrokeColor(colors.HexColor("#e4e4e7"))
            self.setLineWidth(0.5)
            self.line(40, 749, 572, 749)

        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 28, footer_text)
        self.drawString(40, 28, "HRI Research Project • Frontend Architecture & Evaluation Guide")
        self.setStrokeColor(colors.HexColor("#e4e4e7"))
        self.setLineWidth(0.5)
        self.line(40, 36, 572, 36)
        
        self.restoreState()

def generate_walkthrough_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#09090b'),
        spaceAfter=3,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#52525b'),
        spaceAfter=8,
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=colors.HexColor('#09090b'),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#18181b'),
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#27272a'),
        spaceAfter=3,
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#27272a'),
        leftIndent=10,
        spaceAfter=1.5,
    )

    badge_style = ParagraphStyle(
        'Badge',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1,
    )

    story = []

    # Title Banner
    story.append(Paragraph("EMOTIA • Walkthrough & Architecture", title_style))
    story.append(Paragraph("Emotion-Aware Intelligent Desk Assistant for Human-Robot Interaction Research<br/>Paper: <i>Context-Aware and Explainable Emotion Intelligence for a Personalized HRI Desk Assistant</i>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#09090b"), spaceBefore=0, spaceAfter=6))

    # Links Box Table
    links_data = [
        [
            Paragraph("<b>Live Static Site:</b> <font color='#2563eb'><u>https://a-sm20.github.io/EMOTIA/</u></font>", body_style),
            Paragraph("<b>GitHub Repository:</b> <font color='#2563eb'><u>https://github.com/A-SM20/EMOTIA</u></font>", body_style)
        ],
        [
            Paragraph("<b>Tech Stack:</b> React 19, Tailwind CSS, Recharts, Lucide Icons", body_style),
            Paragraph("<b>Local Dev Server:</b> http://localhost:5173/", body_style)
        ]
    ]
    t_links = Table(links_data, colWidths=[266, 266])
    t_links.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f4f4f5")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#e4e4e7")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e4e4e7")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_links)
    story.append(Spacer(1, 4))

    # Section 1: Executive Overview
    story.append(Paragraph("1. Executive Overview & Visual Identity", h1_style))
    story.append(Paragraph(
        "EMOTIA is an intelligent workstation assistant frontend developed to evaluate context-aware affective computing in desk-bound Human-Robot Interaction. It demonstrates how real-time facial feature tracking, speech prosody extraction, and developmental desktop context fuse via cross-attention into an explainable, proactive robotic desk companion.<br/>"
        "<b>Visual Identity:</b> Editorial, ultra-modern monochrome aesthetic (deep <code>#09090b</code> matte dark surface, clean <code>#121215</code> card surfaces, hairline <code>border-white/[0.08]</code> boundaries, and <b>Plus Jakarta Sans</b> typography).",
        body_style
    ))

    # Section 2: 5 Interactive Screens
    story.append(Paragraph("2. Application Screens & Key Features", h1_style))

    screens = [
        ("Screen 1: Dashboard (Home / Live Assistant)", [
            "<b>Dynamic Facial Perception HUD:</b> Real-time animated 68-point facial landmark wireframe with organic mood-driven movement (AU4 brow furrowing, relaxed breathing sways, smiling contours, and ocular saccades).",
            "<b>Current Affect State Card:</b> Live emotion label, confidence meter, Russell's 2D Circumplex Model telemetry (Valence & Arousal), and active task context (VS Code / PyTorch).",
            "<b>Proactive AI Assistant Card:</b> Contextual guidance bubble, Web Speech API (TTS) voice synthesis, and interactive prompt input bar with ambient microphone sensing.",
            "<b>System Status Matrix:</b> Real-time health status and latencies for 9 core submodules (Vision, Acoustic, Fusion, Context, Memory, LLM, Backend)."
        ]),
        ("Screen 2: Live Emotion (Multimodal Fusion Monitor)", [
            "<b>3 Parallel Signal Streams:</b> Side-by-side readouts for Facial Vision (Swin-FER), Acoustic Speech (Wav2Vec2), and Fused Prediction (Cross-Modal Attention Matrix) highlighting the multimodal fusion contribution.",
            "<b>Emotion Probability Spectrum & Rolling History:</b> Horizontal animated distribution bars across 7 discrete affective states and a live Recharts visualizer tracking historical intensity fluctuations."
        ]),
        ("Screen 3: Memory (Personalized Profile & Habits)", [
            "<b>Researcher Persona Card:</b> Dr. Alex Vance (Senior HRI Researcher), preferred interaction style, and domain ontology tags.",
            "<b>Longitudinal Trajectory & Learned Habits:</b> Hourly daily chart showing Calm vs. Focus vs. Stress distributions alongside prioritized behavioral rules with explicit research disclaimer."
        ]),
        ("Screen 4: Conversations (Transcript History)", [
            "<b>Chronological Dialog Stream:</b> 8 rich exchanges tagged with metadata chips (<i>'Detected: Frustrated • 87%'</i> and <i>'Context: Programming'</i>) with interactive prompt testing."
        ]),
        ("Screen 5: Insights (Transparent Explainability / XAI)", [
            "<b>Why Did the System Predict This?:</b> Feature attribution breakdown quantifying percentage weights (Facial AU, Acoustic Prosody, Context, Trajectory) alongside dynamic natural-language explanations.",
            "<b>System Architecture Strip:</b> 5-stage horizontal pipeline (User & Context → Multimodal Perception → Context & Memory → Decision/XAI → Assistant UI) tagged with module owner teams."
        ])
    ]

    for title, items in screens:
        story.append(Paragraph(title, h2_style))
        for item in items:
            story.append(Paragraph(f"• {item}", bullet_style))

    # Section 3: Faculty Demo Preset Scenarios Table
    story.append(Paragraph("3. Faculty & Evaluator Preset Scenarios", h1_style))
    story.append(Paragraph(
        "A 1-click segmented pill bar at the top of the interface synchronizes the entire application across 5 distinct HRI affective scenarios:",
        body_style
    ))

    scenario_table_data = [
        [
            Paragraph("<b>Scenario</b>", badge_style),
            Paragraph("<b>Affect & Conf.</b>", badge_style),
            Paragraph("<b>Desk Context</b>", badge_style),
            Paragraph("<b>Proactive Assistant Action</b>", badge_style)
        ],
        [
            Paragraph("<b>😤 Frustrated</b>", body_style),
            Paragraph("Frustrated (87%)<br/>Val: -0.62 | Aro: +0.74", body_style),
            Paragraph("VS Code • 3.2 hrs active<br/>Repeated syntax/tensor error", body_style),
            Paragraph("Offers step-by-step problem breakdown and automated tensor shape inspection.", body_style)
        ],
        [
            Paragraph("<b>😌 Calm</b>", body_style),
            Paragraph("Calm / Flow (94%)<br/>Val: +0.72 | Aro: -0.35", body_style),
            Paragraph("Overleaf • LaTeX<br/>Section 4: Attention Fusion", body_style),
            Paragraph("Maintains silent background monitoring; suppresses non-urgent notification alerts.", body_style)
        ],
        [
            Paragraph("<b>😊 Happy</b>", body_style),
            Paragraph("Happy (91%)<br/>Val: +0.88 | Aro: +0.65", body_style),
            Paragraph("JupyterLab • Benchmark<br/>Ablation score: 94.8% F1", body_style),
            Paragraph("Celebrates milestone; offers automated ROC curve and LaTeX table export.", body_style)
        ],
        [
            Paragraph("<b>😰 Stressed</b>", body_style),
            Paragraph("Stressed (89%)<br/>Val: -0.78 | Aro: +0.89", body_style),
            Paragraph("CMT Conference Portal<br/>Deadline in 2 hours", body_style),
            Paragraph("Streamlines secondary tasks; auto-checks PDF formatting and bibliography DOIs.", body_style)
        ],
        [
            Paragraph("<b>🧐 Neutral</b>", body_style),
            Paragraph("Neutral (84%)<br/>Val: +0.05 | Aro: +0.10", body_style),
            Paragraph("Acrobat Reader<br/>ArXiv HRI Research PDF", body_style),
            Paragraph("Offers smart paper summarization and citation reference extraction.", body_style)
        ]
    ]

    t_scen = Table(scenario_table_data, colWidths=[80, 105, 150, 197])
    t_scen.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#18181b")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#d4d4d8")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#fbfbfa")]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_scen)
    story.append(Spacer(1, 4))

    # Section 4: Architecture & CI/CD Deployment
    story.append(Paragraph("4. System Architecture & CI/CD Deployment", h1_style))
    story.append(Paragraph(
        "<b>Deployment Pipeline:</b> Deployed as a static SPA on GitHub Pages using an automated GitHub Actions workflow (<code>.github/workflows/deploy.yml</code>). Pushes to <code>main</code> trigger Vite production builds and publish updates in ~35 seconds.<br/>"
        "<b>State Architecture:</b> Centralized React Context (<code>EmotionContext</code>) synchronizing scenario state, speech synthesis engines, real-time animation loops, and rolling Recharts telemetry across all views.",
        body_style
    ))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {output_path}")

if __name__ == '__main__':
    out_file = os.path.abspath("EMOTIA_Walkthrough_and_Architecture.pdf")
    generate_walkthrough_pdf(out_file)
