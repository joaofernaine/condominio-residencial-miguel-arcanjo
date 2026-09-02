# -*- coding: utf-8 -*-
"""
Gera docs/security-audit/relatorio-auditoria-seguranca.pdf a partir dos
dados em findings_data.py.

Uso (dentro do venv isolado em docs/security-audit/.venv):
    docs/security-audit/.venv/Scripts/python docs/security-audit/generate_report.py

Regera o PDF do zero sempre que rodado. Não precisa de nenhuma instalação
global — as dependências (reportlab, matplotlib) vivem só no venv local.
"""
import datetime
import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
    KeepTogether,
    HRFlowable,
)

from findings_data import (
    FINDINGS,
    STRENGTHS,
    RECOMMENDATIONS,
    SEVERITY_COLORS,
    SEVERITY_LABELS,
    PROJECT_NAME,
    STACK_NOTE,
    CATEGORY_MAPPING_NOTE,
)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(HERE, "relatorio-auditoria-seguranca.pdf")
CHARTS_DIR = os.path.join(HERE, "_charts_tmp")
os.makedirs(CHARTS_DIR, exist_ok=True)

REPORT_TITLE = f"Relatório de Auditoria de Segurança — {PROJECT_NAME}"
TODAY = datetime.date.today().strftime("%d/%m/%Y")

NAVY = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#4b5563")
LIGHT_BG = colors.HexColor("#f3f4f6")


# ---------------------------------------------------------------------------
# Gráficos (matplotlib -> PNG temporário)
# ---------------------------------------------------------------------------
def build_severity_donut():
    order = ["critica", "alta", "media", "baixa", "informativa"]
    counts = {s: 0 for s in order}
    for f in FINDINGS:
        counts[f["severity"]] += 1
    labels = [SEVERITY_LABELS[s] for s in order if counts[s] > 0]
    sizes = [counts[s] for s in order if counts[s] > 0]
    colors_ = [SEVERITY_COLORS[s] for s in order if counts[s] > 0]

    fig, ax = plt.subplots(figsize=(4.6, 4.2), dpi=200)
    wedges, _texts, autotexts = ax.pie(
        sizes,
        colors=colors_,
        autopct=lambda pct: f"{round(pct * sum(sizes) / 100)}",
        pctdistance=0.78,
        startangle=90,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2),
        textprops=dict(color="white", fontsize=13, fontweight="bold"),
    )
    ax.set_title("Achados por severidade", fontsize=13, fontweight="bold", color="#111827", pad=14)
    ax.legend(
        wedges,
        labels,
        loc="upper center",
        bbox_to_anchor=(0.5, -0.02),
        ncol=2,
        frameon=False,
        fontsize=10,
    )
    ax.axis("equal")
    path = os.path.join(CHARTS_DIR, "donut_severidade.png")
    fig.savefig(path, bbox_inches="tight", transparent=True)
    plt.close(fig)
    return path


def build_category_bar():
    cat_labels = [
        "1. Banco sem\ntranca (RLS)",
        "2. Permissão\nno navegador",
        "3. IDOR",
        "4. Chaves\nexpostas",
        "5. Inputs sem\ntratamento (XSS)",
        "Adicional",
    ]
    cat_counts = [0, 0, 0, 0, 0, 0]
    for f in FINDINGS:
        cat = f["category"]
        if cat.startswith("1."):
            cat_counts[0] += 1
        if "3. IDOR" in cat or cat.startswith("3."):
            cat_counts[2] += 1
        if cat.startswith("2."):
            cat_counts[1] += 1
        if cat.startswith("4."):
            cat_counts[3] += 1
        if cat.startswith("5."):
            cat_counts[4] += 1
        if cat.startswith("Achado adicional"):
            cat_counts[5] += 1

    bar_color = "#0f172a"
    fig, ax = plt.subplots(figsize=(7.4, 3.6), dpi=200)
    bars = ax.bar(cat_labels, cat_counts, color=bar_color, width=0.55)
    for b, v in zip(bars, cat_counts):
        if v > 0:
            ax.text(b.get_x() + b.get_width() / 2, v + 0.05, str(v), ha="center", fontsize=11, fontweight="bold")
    ax.set_ylim(0, max(cat_counts) + 1.2)
    ax.set_title("Achados por categoria", fontsize=13, fontweight="bold", color="#111827", pad=12)
    ax.spines[["top", "right", "left"]].set_visible(False)
    ax.get_yaxis().set_visible(False)
    ax.tick_params(axis="x", labelsize=8.5)
    fig.tight_layout()
    path = os.path.join(CHARTS_DIR, "barras_categoria.png")
    fig.savefig(path, bbox_inches="tight", transparent=True)
    plt.close(fig)
    return path


# ---------------------------------------------------------------------------
# Canvas numerado (cabeçalho/rodapé em toda página)
# ---------------------------------------------------------------------------
class NumberedCanvas(pdf_canvas.Canvas):
    def __init__(self, *args, **kwargs):
        pdf_canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            pdf_canvas.Canvas.showPage(self)
        pdf_canvas.Canvas.save(self)

    def draw_header_footer(self, page_count):
        page_num = self._pageNumber
        if page_num == 1:
            return  # capa não leva cabeçalho/rodapé de relatório
        w, h = A4
        self.saveState()
        self.setStrokeColor(colors.HexColor("#e5e7eb"))
        self.setLineWidth(0.6)
        self.line(2 * cm, h - 1.4 * cm, w - 2 * cm, h - 1.4 * cm)
        self.setFont("Helvetica", 8.5)
        self.setFillColor(MUTED)
        self.drawString(2 * cm, h - 1.15 * cm, REPORT_TITLE)
        self.drawRightString(w - 2 * cm, h - 1.15 * cm, TODAY)
        self.line(2 * cm, 1.4 * cm, w - 2 * cm, 1.4 * cm)
        self.drawCentredString(w / 2, 1.0 * cm, f"Página {page_num} de {page_count}")
        self.restoreState()


# ---------------------------------------------------------------------------
# Estilos
# ---------------------------------------------------------------------------
styles = getSampleStyleSheet()
styles.add(ParagraphStyle("H1c", parent=styles["Heading1"], fontSize=22, leading=26, textColor=NAVY, spaceAfter=6))
styles.add(ParagraphStyle("H2c", parent=styles["Heading2"], fontSize=15, leading=19, textColor=NAVY, spaceBefore=16, spaceAfter=8))
styles.add(ParagraphStyle("H3c", parent=styles["Heading3"], fontSize=11.5, leading=15, textColor=NAVY, spaceBefore=10, spaceAfter=4))
styles.add(ParagraphStyle("Body", parent=styles["BodyText"], fontSize=9.6, leading=13.6, textColor=colors.HexColor("#1f2937")))
styles.add(ParagraphStyle("BodySmall", parent=styles["BodyText"], fontSize=8.6, leading=12.2, textColor=colors.HexColor("#374151")))
styles.add(ParagraphStyle("Muted", parent=styles["BodyText"], fontSize=9, leading=13, textColor=MUTED))
styles.add(ParagraphStyle("Mono", parent=styles["BodyText"], fontName="Courier", fontSize=8, leading=11, textColor=colors.HexColor("#111827")))
styles.add(ParagraphStyle("CoverTitle", parent=styles["Title"], fontSize=26, leading=32, textColor=colors.white, alignment=TA_LEFT))
styles.add(ParagraphStyle("CoverMeta", parent=styles["BodyText"], fontSize=11, leading=16, textColor=colors.HexColor("#cbd5e1"), alignment=TA_LEFT))
styles.add(ParagraphStyle("IssueBlock", parent=styles["BodyText"], fontName="Courier", fontSize=7.6, leading=10.6, textColor=colors.HexColor("#111827")))


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def sev_chip(sev):
    color = SEVERITY_COLORS.get(sev, "#6B7280")
    label = SEVERITY_LABELS.get(sev, sev)
    return f'<font color="white"><b> {label} </b></font>', color


# ---------------------------------------------------------------------------
# Conteúdo
# ---------------------------------------------------------------------------
def cover_page(story):
    story.append(Spacer(1, 0))


def build_cover_flowables():
    # Capa é desenhada manualmente via canvas (fundo escuro full-bleed) —
    # ver on_first_page().
    return []


def section_summary(story):
    story.append(Paragraph("Resumo executivo", styles["H1c"]))
    counts = {}
    for f in FINDINGS:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1
    order = ["critica", "alta", "media", "baixa", "informativa"]
    total = len(FINDINGS)
    resumo_txt = (
        f"Foram identificados <b>{total} achados</b> ao longo das 5 categorias solicitadas "
        f"mais 1 achado adicional fora do escopo pedido (registrado à parte por transparência). "
        f"Distribuição por severidade: "
        + ", ".join(
            f'<font color="{SEVERITY_COLORS[s]}"><b>{counts.get(s, 0)} {SEVERITY_LABELS[s].lower()}</b></font>'
            for s in order
            if counts.get(s, 0) > 0
        )
        + f". Além disso, <font color=\"{SEVERITY_COLORS['ponto_forte']}\"><b>{len(STRENGTHS)} pontos fortes</b></font> "
        "foram verificados e confirmados como corretos, evidenciando a cobertura real desta auditoria."
    )
    story.append(Paragraph(resumo_txt, styles["Body"]))
    story.append(Spacer(1, 10))

    donut_path = build_severity_donut()
    bar_path = build_category_bar()
    chart_table = Table(
        [[Image(donut_path, width=7.6 * cm, height=6.9 * cm), Image(bar_path, width=9.6 * cm, height=4.7 * cm)]],
        colWidths=[7.8 * cm, 9.8 * cm],
    )
    chart_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(chart_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("Nota metodológica — mapeamento das categorias para a stack detectada", styles["H3c"]))
    story.append(Paragraph(STACK_NOTE, styles["BodySmall"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(CATEGORY_MAPPING_NOTE, styles["BodySmall"]))


def section_strengths_weaknesses(story):
    story.append(PageBreak())
    story.append(Paragraph("Pontos fortes", styles["H1c"]))
    story.append(Paragraph(
        "O que foi verificado diretamente no código e está protegido corretamente — "
        "evidência de que esta auditoria cobriu o código real, não apenas listou riscos hipotéticos.",
        styles["Muted"],
    ))
    story.append(Spacer(1, 6))
    for s in STRENGTHS:
        row = Table(
            [[Paragraph(f"✓ {esc(s['title'])}", ParagraphStyle("sTitle", parent=styles["Body"], textColor=colors.HexColor("#065f46"), fontName="Helvetica-Bold"))],
             [Paragraph(esc(s["evidence"]), styles["BodySmall"])]],
            colWidths=[17 * cm],
        )
        row.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ecfdf5")),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#a7f3d0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, 0), 6),
            ("BOTTOMPADDING", (0, -1), (-1, -1), 7),
            ("TOPPADDING", (0, 1), (-1, 1), 1),
        ]))
        story.append(KeepTogether([row, Spacer(1, 6)]))

    story.append(PageBreak())
    story.append(Paragraph("Pontos fracos — riscos centrais", styles["H1c"]))
    story.append(Paragraph(
        "Síntese dos achados de maior severidade (detalhamento completo, arquivo por arquivo e "
        "linha por linha, na próxima seção).",
        styles["Muted"],
    ))
    story.append(Spacer(1, 6))
    ordered = sorted(FINDINGS, key=lambda f: ["critica", "alta", "media", "baixa", "informativa"].index(f["severity"]))
    for f in ordered:
        chip_html, chip_color = sev_chip(f["severity"])
        header = Table(
            [[Paragraph(chip_html, ParagraphStyle("chip", parent=styles["Body"], fontSize=8)),
              Paragraph(f"<b>{esc(f['id'])} — {esc(f['title'])}</b>", styles["Body"])]],
            colWidths=[2.6 * cm, 14.4 * cm],
        )
        header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor(chip_color)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (0, 0), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (1, 0), (1, 0), 8),
        ]))
        caption = Paragraph(f"<i>{esc(f['category'])}</i> · {esc(f['file'])}", styles["BodySmall"])
        story.append(KeepTogether([header, Spacer(1, 3), caption]))
        story.append(Spacer(1, 8))


def section_findings_table(story):
    story.append(PageBreak())
    story.append(Paragraph("Achados detalhados", styles["H1c"]))
    story.append(Paragraph(
        "Cada achado está listado com severidade, localização exata (arquivo:linha) e descrição. "
        "O texto completo (por quê é explorável, condições de exploração) está na seção anterior e "
        "nas issues do GitHub ao final deste relatório.",
        styles["Muted"],
    ))
    story.append(Spacer(1, 8))

    data = [[
        Paragraph("<b>Sev.</b>", styles["BodySmall"]),
        Paragraph("<b>ID</b>", styles["BodySmall"]),
        Paragraph("<b>Arquivo:linha</b>", styles["BodySmall"]),
        Paragraph("<b>Descrição</b>", styles["BodySmall"]),
    ]]
    ordered = sorted(FINDINGS, key=lambda f: ["critica", "alta", "media", "baixa", "informativa"].index(f["severity"]))
    row_colors = []
    for f in ordered:
        chip_html, chip_color = sev_chip(f["severity"])
        data.append([
            Paragraph(chip_html, ParagraphStyle("chip2", parent=styles["BodySmall"], fontSize=7.4, alignment=TA_CENTER)),
            Paragraph(esc(f["id"]), styles["BodySmall"]),
            Paragraph(f"{esc(f['file'])}<br/><font color='#6b7280'>:{esc(f['line'])}</font>", styles["Mono"]),
            Paragraph(esc(f["title"]), styles["BodySmall"]),
        ])
        row_colors.append(chip_color)

    t = Table(data, colWidths=[2.0 * cm, 1.2 * cm, 5.3 * cm, 8.5 * cm], repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
    ]
    for i, c in enumerate(row_colors, start=1):
        style_cmds.append(("BACKGROUND", (0, i), (0, i), colors.HexColor(c)))
    t.setStyle(TableStyle(style_cmds))
    story.append(t)


def section_findings_deep_dive(story):
    story.append(PageBreak())
    story.append(Paragraph("Achados — detalhamento completo por categoria", styles["H1c"]))
    ordered = sorted(FINDINGS, key=lambda f: ["critica", "alta", "media", "baixa", "informativa"].index(f["severity"]))
    for f in ordered:
        chip_html, chip_color = sev_chip(f["severity"])
        block = []
        header = Table(
            [[Paragraph(chip_html, ParagraphStyle("chip3", parent=styles["Body"], fontSize=8)),
              Paragraph(f"<b>{esc(f['id'])} — {esc(f['title'])}</b>", styles["H3c"])]],
            colWidths=[2.6 * cm, 14.4 * cm],
        )
        header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), colors.HexColor(chip_color)),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ]))
        block.append(header)
        block.append(Spacer(1, 4))
        block.append(Paragraph(f"<b>Categoria:</b> {esc(f['category'])}", styles["BodySmall"]))
        block.append(Paragraph(f"<b>Local:</b> {esc(f['file'])} — linha(s) {esc(f['line'])}", styles["Mono"]))
        block.append(Spacer(1, 4))
        block.append(Paragraph(f"<b>O que foi encontrado:</b> {esc(f['description'])}", styles["Body"]))
        block.append(Spacer(1, 3))
        block.append(Paragraph(f"<b>Por que é explorável / impacto:</b> {esc(f['why'])}", styles["Body"]))
        block.append(Spacer(1, 3))
        block.append(Paragraph(f"<b>Condições de exploração:</b> {esc(f['exploit_conditions'])}", styles["Body"]))
        story.append(KeepTogether(block))
        story.append(Spacer(1, 4))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
        story.append(Spacer(1, 10))


def section_recommendations(story):
    story.append(PageBreak())
    story.append(Paragraph("Recomendações priorizadas", styles["H1c"]))
    for prio, items in RECOMMENDATIONS.items():
        story.append(Paragraph(prio, styles["H2c"]))
        for it in items:
            story.append(Paragraph(f"• {esc(it)}", styles["Body"]))
            story.append(Spacer(1, 3))


def build_github_issue_md(f, idx):
    sev_label = SEVERITY_LABELS.get(f["severity"], f["severity"])
    body = f"""## Problema

{f['description']}

**Por que é explorável:** {f['why']}

## Evidência

`{f['file']}` — linha(s) {f['line']}

## Impacto

{f['why']}

## Condições de exploração

{f['exploit_conditions']}

## Sugestão de correção

Ver seção "Recomendações priorizadas" do relatório de auditoria ({f['id']}).

## Critérios de aceite

- [ ] Causa raiz do achado {f['id']} corrigida no código/infra (não apenas mitigada na UI)
- [ ] Teste manual ou automatizado comprovando que o cenário descrito em "Condições de exploração" não é mais possível
- [ ] Revisão de código aprovada por outra pessoa (ou outra sessão) confirmando a correção
- [ ] Achado marcado como resolvido no test-plan/documentação de segurança do projeto
"""
    title = f"[Segurança] {f['title']}"
    labels = f"security, severidade:{f['severity']}"
    header = f"**Título:** {title}\n**Labels sugeridas:** {labels}\n\n"
    return header + body


def section_github_issues(story):
    story.append(PageBreak())
    story.append(Paragraph("Issues para o GitHub", styles["H1c"]))
    story.append(Paragraph(
        "Texto completo em Markdown, pronto para copiar e colar como issue no GitHub. "
        "Achados triviais relacionados ao mesmo tema (credenciais expostas) foram agrupados numa "
        "única issue para não gerar spam.",
        styles["Muted"],
    ))
    story.append(Spacer(1, 8))

    groups = [
        ("F1", [f for f in FINDINGS if f["id"] == "F1"]),
        ("F2", [f for f in FINDINGS if f["id"] == "F2"]),
        ("F3", [f for f in FINDINGS if f["id"] == "F3"]),
        ("F4", [f for f in FINDINGS if f["id"] == "F4"]),
        ("F5", [f for f in FINDINGS if f["id"] == "F5"]),
        ("F6+F7 (credenciais expostas)", [f for f in FINDINGS if f["id"] in ("F6", "F7")]),
        ("F8", [f for f in FINDINGS if f["id"] == "F8"]),
        ("F9", [f for f in FINDINGS if f["id"] == "F9"]),
    ]

    n = 0
    for _, findings_in_group in groups:
        if not findings_in_group:
            continue
        n += 1
        primary = findings_in_group[0]
        if len(findings_in_group) > 1:
            title = "[Segurança] Credenciais expostas em texto claro no repositório (.env versionado + senha de QA nos docs)"
            sev = "media"
            merged_body_parts = []
            for f in findings_in_group:
                merged_body_parts.append(
                    f"### {f['id']} — {f['title']}\n\n{f['description']}\n\n"
                    f"**Por quê:** {f['why']}\n\n**Evidência:** `{f['file']}` (linha(s) {f['line']})\n\n"
                    f"**Condições de exploração:** {f['exploit_conditions']}\n"
                )
            labels = f"security, severidade:{sev}"
            body = f"**Título:** {title}\n**Labels sugeridas:** {labels}\n\n" + "\n---\n".join(merged_body_parts) + (
                "\n## Sugestão de correção\n\nVer P1 do relatório de auditoria (remover .env do git, "
                "trocar credenciais de QA documentadas em texto claro).\n\n## Critérios de aceite\n\n"
                "- [ ] `.env` removido do índice do git (`git rm --cached .env`) e `.env.example` adicionado\n"
                "- [ ] Senha da conta de síndica de QA trocada\n"
                "- [ ] Documentação de teste passa a referenciar um cofre de senhas, não texto claro\n"
                "- [ ] Hook/CI que impede novo commit de arquivo `.env*`\n"
            )
        else:
            body = build_github_issue_md(primary, n)

        story.append(Paragraph(f"--- ISSUE {n} ---", styles["Mono"]))
        for line in body.split("\n"):
            safe = esc(line) if line.strip() else "&nbsp;"
            story.append(Paragraph(safe, styles["IssueBlock"]))
        story.append(Paragraph(f"--- FIM ISSUE {n} ---", styles["Mono"]))
        story.append(Spacer(1, 12))


# ---------------------------------------------------------------------------
# Capa (desenhada direto no canvas da 1a página)
# ---------------------------------------------------------------------------
def draw_cover(canvas_obj, doc):
    if canvas_obj.getPageNumber() != 1:
        return
    w, h = A4
    canvas_obj.saveState()
    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, 0, w, h, fill=1, stroke=0)

    canvas_obj.setFillColor(colors.HexColor("#D97706"))
    canvas_obj.rect(0, h - 0.5 * cm, w, 0.5 * cm, fill=1, stroke=0)

    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica-Bold", 13)
    canvas_obj.drawString(2.4 * cm, h - 3.2 * cm, "RELATÓRIO DE AUDITORIA DE SEGURANÇA")

    title_font_size = 25
    canvas_obj.setFont("Helvetica-Bold", title_font_size)
    max_width = w - 4.8 * cm
    words = PROJECT_NAME.split(" ")
    title_lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdf_canvas.Canvas.stringWidth(canvas_obj, candidate, "Helvetica-Bold", title_font_size) <= max_width:
            current = candidate
        else:
            if current:
                title_lines.append(current)
            current = word
    if current:
        title_lines.append(current)

    y = h - 5.2 * cm
    for line in title_lines:
        canvas_obj.drawString(2.4 * cm, y, line)
        y -= 1.05 * cm

    canvas_obj.setStrokeColor(colors.HexColor("#334155"))
    canvas_obj.setLineWidth(1)
    canvas_obj.line(2.4 * cm, y - 0.2 * cm, w - 2.4 * cm, y - 0.2 * cm)

    canvas_obj.setFont("Helvetica", 11)
    canvas_obj.setFillColor(colors.HexColor("#cbd5e1"))
    meta_y = y - 1.2 * cm
    meta_lines = [
        f"Data da auditoria: {TODAY}",
        "Escopo: código-fonte completo do repositório (frontend TanStack Start/React, camada de",
        "dados Supabase, Edge Functions, migrations, configuração de build/deploy e documentação",
        "interna versionada).",
        "",
        "Categorias avaliadas: (1) isolamento de dados/tenant (RLS), (2) permissões definidas só no",
        "cliente, (3) IDOR, (4) chaves e credenciais expostas, (5) inputs sem tratamento (XSS).",
    ]
    for line in meta_lines:
        canvas_obj.drawString(2.4 * cm, meta_y, line)
        meta_y -= 0.62 * cm

    canvas_obj.setFont("Helvetica-Oblique", 9)
    canvas_obj.setFillColor(colors.HexColor("#94a3b8"))
    canvas_obj.drawString(2.4 * cm, 2.0 * cm, "Nota metodológica completa (mapeamento categoria → stack detectada) na página seguinte.")
    canvas_obj.restoreState()


def on_page(canvas_obj, doc):
    draw_cover(canvas_obj, doc)


def main():
    doc = SimpleDocTemplate(
        OUT_PDF,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=REPORT_TITLE,
        author="Auditoria de Segurança (Claude Code)",
    )

    story = []
    story.append(PageBreak())  # página 1 fica em branco no fluxo; capa é desenhada via canvas
    section_summary(story)
    section_strengths_weaknesses(story)
    section_findings_table(story)
    section_findings_deep_dive(story)
    section_recommendations(story)
    section_github_issues(story)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page, canvasmaker=NumberedCanvas)
    print(f"OK: {OUT_PDF}")


if __name__ == "__main__":
    main()
