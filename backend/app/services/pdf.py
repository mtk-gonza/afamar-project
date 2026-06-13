import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_budget_pdf(
    budget_data: dict,
    client_data: dict,
    company: dict | None = None,
    terms: dict | None = None,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle("Title2", parent=styles["Title"], fontSize=18, spaceAfter=4)
    normal = styles["Normal"]
    small = ParagraphStyle("Small", parent=normal, fontSize=8, textColor=colors.grey)

    company_name = (company or {}).get("company_name") or "AFAMAR"
    company_addr = (company or {}).get("company_address") or ""
    company_phone = (company or {}).get("company_phone") or ""
    company_email = (company or {}).get("company_email") or ""

    header_lines = [f"<b>{company_name}</b>"]
    if company_addr:
        header_lines.append(company_addr)
    if company_phone:
        header_lines.append(f"Tel: {company_phone}")
    if company_email:
        header_lines.append(company_email)
    elements.append(Paragraph("<br/>".join(header_lines), small))
    elements.append(Spacer(1, 0.3 * cm))

    elements.append(Paragraph(f"Presupuesto N°: {budget_data['number']}", title_style))
    elements.append(HRFlowable(width="100%", color=colors.grey, thickness=0.5))
    elements.append(Spacer(1, 0.4 * cm))

    elements.append(Paragraph(f"<b>Cliente:</b> {client_data['name']}", normal))
    if client_data.get("phone"):
        elements.append(Paragraph(f"<b>Teléfono:</b> {client_data['phone']}", normal))
    if client_data.get("email"):
        elements.append(Paragraph(f"<b>Email:</b> {client_data['email']}", normal))
    if client_data.get("address"):
        elements.append(Paragraph(f"<b>Dirección:</b> {client_data['address']}", normal))
    elements.append(Spacer(1, 0.4 * cm))

    items = budget_data.get("items", [])
    if items:
        items_header = [["#", "Descripción", "Cant.", "P/U", "Total"]]
        items_rows = []
        for i, item in enumerate(items, 1):
            items_rows.append([
                str(i),
                item.get("description", ""),
                str(item.get("quantity", 1)),
                f"$ {item.get('unit_price', 0):.2f}",
                f"$ {item.get('total', 0):.2f}",
            ])
        items_table = Table(items_header + items_rows, colWidths=[1.5 * cm, 9 * cm, 2 * cm, 3 * cm, 3 * cm])
        items_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.9, 0.9, 0.9)),
            ("ALIGN", (2, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 0.4 * cm))
    else:
        spec_data = [
            ["Material", budget_data.get("material", "")],
            ["Color", budget_data.get("color", "")],
            ["Espesor", budget_data.get("thickness", "")],
            ["Terminación", budget_data.get("finish", "")],
            ["Frente", budget_data.get("front", "")],
            ["Bacha", budget_data.get("bacha", "")],
            ["Anafe", budget_data.get("anafe", "")],
            ["Perforaciones", budget_data.get("perforations", "")],
        ]
        spec_data = [[k, v] for k, v in spec_data if v]
        if spec_data:
            spec_table = Table(spec_data, colWidths=[4 * cm, 10 * cm])
            spec_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (0, -1), colors.Color(0.9, 0.9, 0.9)),
            ]))
            elements.append(spec_table)
            elements.append(Spacer(1, 0.4 * cm))

    totals_data = [
        ["Subtotal", f"$ {budget_data.get('subtotal', 0):.2f}"],
    ]
    if budget_data.get("shipping", 0) > 0:
        totals_data.append(["Envío", f"$ {budget_data['shipping']:.2f}"])
    totals_data.append(["Total", f"$ {budget_data.get('total', 0):.2f}"])
    totals_table = Table(totals_data, colWidths=[4 * cm, 4 * cm])
    totals_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 12),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("BACKGROUND", (0, -1), (-1, -1), colors.Color(0.8, 0.8, 0.8)),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 0.3 * cm))

    if budget_data.get("payment_method"):
        elements.append(Paragraph(f"<b>Forma de pago:</b> {budget_data['payment_method']}", normal))
    if budget_data.get("validity_days"):
        elements.append(Paragraph(f"<b>Validez:</b> {budget_data['validity_days']} días", normal))
    if budget_data.get("estimated_delivery"):
        elements.append(Paragraph(f"<b>Plazo de entrega:</b> {budget_data['estimated_delivery']}", normal))

    if budget_data.get("notes"):
        elements.append(Spacer(1, 0.3 * cm))
        elements.append(Paragraph(f"<b>Observaciones:</b><br/>{budget_data['notes']}", normal))

    footer_texts = []
    if terms:
        for key, label in [("budget_terms", "Términos"), ("delivery_terms", "Entrega"), ("warranty_text", "Garantía")]:
            val = terms.get(key)
            if val:
                footer_texts.append(f"<b>{label}:</b> {val}")
    if footer_texts:
        elements.append(Spacer(1, 0.5 * cm))
        elements.append(HRFlowable(width="100%", color=colors.grey, thickness=0.5))
        for t in footer_texts:
            elements.append(Paragraph(t, small))
        elements.append(Spacer(1, 0.2 * cm))

    pdf_footer = (company or {}).get("pdf_footer") or ""
    if pdf_footer:
        elements.append(Paragraph(pdf_footer, small))

    doc.build(elements)
    return buffer.getvalue()
