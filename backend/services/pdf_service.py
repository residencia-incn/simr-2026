from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.units import cm
from io import BytesIO
from datetime import datetime
import locale

# Intentar configurar locale para español, fallback a default si no existe
try:
    locale.setlocale(locale.LC_TIME, 'es_PE.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')
    except:
        pass

# --- CONFIGURACIÓN DE ESTILO ACADÉMICO ---
def get_academic_styles():
    styles = getSampleStyleSheet()
    
    # Título Principal
    styles.add(ParagraphStyle(
        name='MainTitle',
        parent=styles['Heading1'],
        fontName='Times-Bold',
        fontSize=16,
        leading=20,
        alignment=TA_CENTER,
        spaceAfter=10,
        textColor=colors.black
    ))
    
    # Subtítulos de Sección (I. ASISTENCIA, etc.)
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontName='Times-Bold',
        fontSize=11,
        leading=14,
        spaceBefore=12,
        spaceAfter=6,
        borderPadding=2,
        borderWidth=0,
        borderBottomWidth=1, # Línea elegante abajo
        borderColor=colors.black,
        alignment=TA_LEFT,
        textTransform='uppercase'
    ))
    
    # Texto Normal
    styles.add(ParagraphStyle(
        name='AcademicBody',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=10,
        leading=13,
        alignment=TA_JUSTIFY
    ))
    
    # Texto Pequeño (Metadata, Hash)
    styles.add(ParagraphStyle(
        name='SmallText',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8,
        leading=10,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#444444")
    ))

    # Firmas
    styles.add(ParagraphStyle(
        name='SignatureName',
        parent=styles['Normal'],
        fontName='Times-Bold',
        fontSize=9,
        leading=11,
        alignment=TA_CENTER
    ))
    
    # Estilo para celdas de tabla (alineado a la izquierda)
    styles.add(ParagraphStyle(
        name='CellText',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8,
        leading=10,
        alignment=TA_LEFT
    ))
    
    # Estilo para celdas de tabla (centrado)
    styles.add(ParagraphStyle(
        name='CellTextCenter',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=8,
        leading=10,
        alignment=TA_CENTER
    ))

    return styles

def generate_meeting_minutes_pdf(meeting, attendees, agreements, tasks, polls, next_meeting=None) -> BytesIO:
    buffer = BytesIO()
    
    # Márgenes más compactos (2cm es estándar académico, 1.5cm para compactar)
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=1.5*cm, leftMargin=1.5*cm, 
        topMargin=1.5*cm, bottomMargin=2*cm
    )
    
    elements = []
    styles = get_academic_styles()

    # ==========================================
    # 1. ENCABEZADO COMPACTO (Tabla sin bordes)
    # ==========================================
    elements.append(Paragraph(f"ACTA DE REUNIÓN N° {meeting.id:04d}", styles['MainTitle']))
    elements.append(Paragraph(f"{meeting.title}", styles['Title']))
    elements.append(Spacer(1, 0.5*cm))

    # Datos Generales en 2 columnas para ahorrar espacio vertical
    try:
        fmt_date = meeting.scheduled_start.strftime("%d de %B de %Y").upper()
    except:
        fmt_date = meeting.scheduled_start.strftime("%Y-%m-%d")
        
    fmt_start = meeting.real_start_time.strftime("%H:%M") if meeting.real_start_time else "--:--"
    fmt_end = meeting.real_end_time.strftime("%H:%M") if meeting.real_end_time else "--:--"
    
    status_val = meeting.status.value if hasattr(meeting.status, 'value') else str(meeting.status)
    
    header_data = [
        [Paragraph(f"<b>FECHA:</b> {fmt_date}", styles['AcademicBody']), 
         Paragraph(f"<b>HORA INICIO:</b> {fmt_start}", styles['AcademicBody'])],
        [Paragraph(f"<b>ESTADO:</b> {status_val}", styles['AcademicBody']), 
         Paragraph(f"<b>HORA FIN:</b> {fmt_end}", styles['AcademicBody'])]
    ]
    
    t_header = Table(header_data, colWidths=[9*cm, 9*cm])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (0,1), (-1,1), 0.5, colors.black), # Línea final del header
        ('BOTTOMPADDING', (0,1), (-1,1), 8),
    ]))
    elements.append(t_header)
    
    # ==========================================
    # 2. ASISTENCIA (Tabla compacta)
    # ==========================================
    elements.append(Paragraph("I. CONTROL DE ASISTENCIA", styles['SectionHeader']))
    
    # Headers más pequeños y compactos
    att_data = [[
        Paragraph("<b>PARTICIPANTE</b>", styles['SmallText']),
        Paragraph("<b>HORA</b>", styles['SmallText']),
        Paragraph("<b>ESTADO</b>", styles['SmallText'])
    ]]
    
    present_count = 0
    for att in attendees:
        check_in = att.check_in_time.strftime("%H:%M") if att.check_in_time else "-"
        status_val = att.status.value if hasattr(att.status, 'value') else str(att.status)
        
        status_color = "black"
        if status_val == "FALTA": status_color = "red"
        elif status_val == "TARDANZA": status_color = "orange"
        
        status_para = Paragraph(f"<font color='{status_color}'>{status_val}</font>", styles['CellTextCenter'])
        
        # User details correction: firstName, lastName
        full_name = "Usuario Desconocido"
        role = "N/A"
        
        if att.user:
            fn = att.user.firstName or ""
            ln = att.user.lastName or ""
            full_name = f"{ln}, {fn}".strip() or att.user.name or "Sin Nombre"
            role = att.user.eventRole or "Participante"
            
        att_data.append([
            Paragraph(full_name, styles['CellText']),
            Paragraph(check_in, styles['CellTextCenter']),
            status_para
        ])
        if status_val in ["PRESENTE", "TARDANZA", "ASIISTIÓ"]: present_count += 1

    t_att = Table(att_data, colWidths=[12*cm, 2.5*cm, 3.5*cm])
    t_att.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
        ('FONTNAME', (0,0), (-1,0), 'Times-Bold'),
        ('ALIGN', (2,0), (-1,-1), 'CENTER'), # Centrar Hora y Estado
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F9FAFB")]), # Zebra striping muy sutil
    ]))
    elements.append(t_att)
    elements.append(Paragraph(f"<i>Quórum: {present_count} asistentes presentes.</i>", styles['SmallText']))
    
    # ==========================================
    # 3. ACUERDOS (Recursivo con sangría)
    # ==========================================
    if agreements:
        elements.append(Paragraph("II. ACUERDOS Y DELIBERACIONES", styles['SectionHeader']))
        
        def process_agreements_recursive(agreement_list, level=0):
            rows = []
            for i, ag in enumerate(agreement_list, 1):
                # Indentación visual usando Padding
                indent = level * 0.5 * cm
                
                # Numeración: 1. / 1.1. / 1.1.1. (Opcional, aquí uso viñetas simples para ahorrar lógica compleja)
                bullet = "•" if level > 0 else f"{i}."
                
                content = f"<b>{bullet}</b> {ag.content}"
                para = Paragraph(content, styles['AcademicBody'])
                
                # Tabla invisible para manejar la sangría
                t_row = Table([[para]], colWidths=[18*cm - indent])
                t_row.setStyle(TableStyle([
                    ('LEFTPADDING', (0,0), (-1,-1), indent),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ]))
                rows.append(t_row)
                
                if ag.sub_agreements:
                    rows.extend(process_agreements_recursive(ag.sub_agreements, level + 1))
            return rows

        root_agreements = [a for a in agreements if a.parent_id is None]
        agreement_tables = process_agreements_recursive(root_agreements)
        for t in agreement_tables:
            elements.append(t)
    
    # ==========================================
    # 4. TAREAS ASIGNADAS (Tabla minimalista)
    # ==========================================
    # ==========================================
    # 3.5. AGENDA SIGUIENTE REUNIÓN (Nuevo requerimiento)
    # ==========================================
    if meeting.next_meeting_agenda:
        elements.append(Paragraph("III. AGENDA DE LA SIGUIENTE REUNIÓN", styles['SectionHeader']))
        
        # [NEW] Render Next Meeting Info
        if next_meeting:
            try:
                fmt_nm_date = next_meeting.scheduled_start.strftime("%A, %d de %B de %Y")
                fmt_nm_time = next_meeting.scheduled_start.strftime("%H:%M")
                
                # Create a visual box using a Table
                data_box = [[
                    Paragraph(f"<b>PRÓXIMA REUNIÓN PROGRAMADA:</b>", styles['SmallText']),
                ], [
                    Paragraph(f"📅 {fmt_nm_date}", styles['AcademicBody'])
                ], [
                    Paragraph(f"⏰ {fmt_nm_time} p.m.", styles['AcademicBody']) 
                ]]
                
                t_box = Table(data_box, colWidths=[15*cm])
                t_box.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.aliceblue), # Light Blue
                    ('BOX', (0,0), (-1,-1), 0.5, colors.lightgrey),
                    ('LEFTPADDING', (0,0), (-1,-1), 0.3*cm),
                    ('TOPPADDING', (0,0), (-1,-1), 0.2*cm),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 0.2*cm),
                    ('BORDERLEFT', (0,0), (-1,-1), 3, colors.HexColor("#0ea5e9")), # Blue accent border
                ]))
                elements.append(t_box)
                elements.append(Spacer(1, 0.4*cm))
            except Exception as e:
                print(f"Error rendering next meeting info in PDF: {e}")

        agenda_items = meeting.next_meeting_agenda
        if isinstance(agenda_items, list):
            for idx, item in enumerate(agenda_items, 1):
                # Manejar si es string simple o objeto
                text = item
                if isinstance(item, dict):
                    text = item.get('content', item.get('title', item.get('text', 'Punto de agenda sin nombre')))
                
                # Renderizar punto
                elements.append(Paragraph(f"{idx}. {text}", styles['BodyText']))
                
                # Renderizar sub-puntos si existen (si es dict)
                if isinstance(item, dict) and 'children' in item and item['children']:
                    for sub_idx, sub in enumerate(item['children'], 1):
                        sub_text = sub
                        if isinstance(sub, dict):
                            sub_text = sub.get('content', sub.get('title', 'Sub-punto'))
                        
                        # Indentación
                        t_sub = Table([[Paragraph(f"• {sub_text}", styles['BodyText'])]], colWidths=[15*cm])
                        t_sub.setStyle(TableStyle([('LEFTPADDING', (0,0), (-1,-1), 1*cm)]))
                        elements.append(t_sub)
            
            elements.append(Spacer(1, 0.5*cm))

    # ==========================================
    # 4. TAREAS ASIGNADAS (Tabla minimalista) -> Ahora es IV o III+1
    # ==========================================
    # Lógica de numeración dinámica o fija:
    # Solicitud específica del usuario: "antes de las Tareas asignadas".
    # Ajustamos la numeración de Tareas a IV para mantener orden lógico, 
    # asumiendo que Agenda entra como III.
    
    if tasks:
        elements.append(Paragraph("IV. ASIGNACIÓN DE TAREAS", styles['SectionHeader']))
        task_data = [[
            Paragraph("<b>DESCRIPCIÓN</b>", styles['SmallText']),
            Paragraph("<b>RESPONSABLE</b>", styles['SmallText']),
            Paragraph("<b>PLAZO</b>", styles['SmallText']),
            Paragraph("<b>PRIORIDAD</b>", styles['SmallText'])
        ]]
        
        for task in tasks:
            deadline = task.deadline.strftime("%d/%m") if task.deadline else "-"
            
            assignee_name = "Sin Asignar"
            if task.assignee:
                 fn = task.assignee.firstName or ""
                 ln = task.assignee.lastName or ""
                 assignee_name = f"{fn} {ln}".strip() or task.assignee.name
                 
            priority_val = task.priority.value if hasattr(task.priority, 'value') else str(task.priority)

            task_data.append([
                Paragraph(task.description or task.title, styles['CellText']),
                Paragraph(assignee_name, styles['CellText']),
                Paragraph(deadline, styles['CellTextCenter']),
                Paragraph(priority_val, styles['CellTextCenter'])
            ])
            
        t_tasks = Table(task_data, colWidths=[9*cm, 5*cm, 2*cm, 2*cm])
        t_tasks.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (2,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(t_tasks)

    # ==========================================
    # 5. ENCUESTAS (Opcional, compacto)
    # ==========================================
        if polls:
            elements.append(Paragraph("V. RESULTADOS DE VOTACIONES", styles['SectionHeader']))
            for poll in polls:
                # Título de la pregunta negrita y con espacio
                elements.append(Paragraph(f"<b>{poll.title}</b>", styles['BodyText']))
                
                # Calcular total para porcentajes
                total_votes = 0
                for opt in poll.options:
                    total_votes += len(opt.votes)
                
                # Datos para la tabla de esta encuesta
                poll_data = [[
                    Paragraph("<b>OPCIÓN</b>", styles['SmallText']),
                    Paragraph("<b>VOTOS</b>", styles['SmallText']),
                    Paragraph("<b>%</b>", styles['SmallText'])
                ]]
                
                for opt in poll.options:
                    count = len(opt.votes)
                    pct = int((count/total_votes)*100) if total_votes > 0 else 0
                    
                    poll_data.append([
                        Paragraph(opt.text, styles['CellText']),
                        Paragraph(str(count), styles['CellTextCenter']),
                        Paragraph(f"{pct}%", styles['CellTextCenter'])
                    ])
                
                # Crear tabla visualmente ligera
                t_poll = Table(poll_data, colWidths=[10*cm, 3*cm, 3*cm])
                t_poll.setStyle(TableStyle([
                    ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
                    ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
                    ('ALIGN', (1,0), (-1,-1), 'CENTER'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('LEFT', (0,0), (0,-1), 0), # Alinear texto opción izquierda
                ]))
                
                # Indentar la tabla un poco
                t_wrapper = Table([[t_poll]], colWidths=[16*cm], style=[('LEFTPADDING', (0,0), (-1,-1), 0.5*cm)])
                elements.append(t_wrapper)
                elements.append(Spacer(1, 0.3*cm))

    elements.append(Spacer(1, 1.5*cm))

    # ==========================================
    # 6. FIRMAS (Grilla de 3 columnas) - CLAVE PARA EL DISEÑO
    # ==========================================
    elements.append(KeepTogether([
        Paragraph("CONSTANCIA DE CONFORMIDAD Y FIRMA DIGITAL", styles['SectionHeader']),
        Paragraph("Los siguientes participantes han validado este acta mediante firma criptográfica:", styles['SmallText']),
        Spacer(1, 0.5*cm)
    ]))

    # Preparar celdas de firma
    signature_cells = []
    for att in attendees:
        # Resolver nombre
        full_name = "Usuario"
        if att.user:
            fn = att.user.firstName or ""
            ln = att.user.lastName or ""
            full_name = f"{fn} {ln}".strip() or att.user.name or "Usuario"
            
        if att.signed_at and att.signature_hash:
            # Hash truncado para que no ocupe 5 líneas
            h = att.signature_hash
            short_hash = h[:15] + "..." + h[-8:] if h and len(h) > 25 else (h or "N/A")
            
            sig_content = [
                Paragraph(full_name, styles['SignatureName']),
                Paragraph("__________________________", styles['SignatureName']), # Línea de firma visual
                Paragraph(f"Firmado: {att.signed_at.strftime('%d/%m %H:%M')}", styles['SmallText']),
                Paragraph(f"Hash: {short_hash}", styles['SmallText']),
                Paragraph(f"ID: {att.user_id}", styles['SmallText'])
            ]
            signature_cells.append(sig_content)
        else:
            # Espacio para firma manual o indicación de falta
            sig_content = [
                Paragraph(full_name, styles['SignatureName']),
                Paragraph("__________________________", styles['SignatureName']),
                Paragraph("[PENDIENTE / SIN FIRMA]", styles['SmallText']),
                Spacer(1, 0.5*cm)
            ]
            signature_cells.append(sig_content)

    # Agrupar en filas de 3
    rows = []
    for i in range(0, len(signature_cells), 3):
        row = signature_cells[i:i+3]
        # Rellenar con celdas vacías si la última fila tiene menos de 3
        while len(row) < 3:
            row.append([])
        rows.append(row)

    # Crear la tabla de firmas
    if rows:
        t_sigs = Table(rows, colWidths=[6*cm, 6*cm, 6*cm])
        t_sigs.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 15), # Espacio entre filas de firmas
        ]))
        elements.append(t_sigs)

    # Footer de página (Número de página)
    def add_page_number(canvas, doc):
        page_num = canvas.getPageNumber()
        text = "Página %s | Generado por SIMR 2026" % page_num
        canvas.setFont("Times-Roman", 8)
        canvas.drawRightString(20*cm, 1*cm, text) # Alineado a la derecha

    # Construir PDF
    doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    return buffer
