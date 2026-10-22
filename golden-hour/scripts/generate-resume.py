"""Create the downloadable resume from the same data used by the portfolio."""
import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether

sys.stdin.reconfigure(encoding='utf-8')
data = json.load(sys.stdin)
destination = Path(__file__).resolve().parents[1] / 'dist' / 'assets' / 'kirti-resume.pdf'
ink = colors.HexColor('#30312F')
muted = colors.HexColor('#5D6059')
accent = colors.HexColor('#7C5957')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='NameCustom', fontName='Times-Roman', fontSize=34, leading=39, textColor=ink, spaceAfter=6))
styles.add(ParagraphStyle(name='RoleCustom', fontName='Helvetica', fontSize=10, leading=15, textColor=accent, spaceAfter=20))
styles.add(ParagraphStyle(name='BodyCustom', fontName='Helvetica', fontSize=9.4, leading=14.6, textColor=muted, spaceAfter=9))
styles.add(ParagraphStyle(name='SectionCustom', fontName='Helvetica-Bold', fontSize=8, leading=12, textColor=accent, spaceBefore=20, spaceAfter=14))
styles.add(ParagraphStyle(name='CompanyCustom', fontName='Times-Roman', fontSize=19, leading=24, textColor=ink, spaceBefore=10, spaceAfter=5))
styles.add(ParagraphStyle(name='JobCustom', fontName='Helvetica-Bold', fontSize=9, leading=14, textColor=ink, spaceAfter=4))
styles.add(ParagraphStyle(name='DatesCustom', fontName='Helvetica', fontSize=8, leading=12, textColor=muted, spaceAfter=10))
styles.add(ParagraphStyle(name='BulletCustom', fontName='Helvetica', fontSize=9, leading=14, textColor=muted, leftIndent=10, firstLineIndent=-8, spaceAfter=6))
styles.add(ParagraphStyle(name='SkillCustom', fontName='Helvetica', fontSize=9.4, leading=15.5, textColor=muted, spaceAfter=17))

def clean(text):
    return escape(str(text).replace('\u2014', '-').replace('\u2013', '-').replace('\u2019', "'").replace('\u2018', "'").replace('\u00b7', '|'))

def para(text, style='BodyCustom'):
    return Paragraph(clean(text), styles[style])

def add_job(story, job):
    story.append(KeepTogether([
        para(job['company'] + ' | ' + job['client'], 'CompanyCustom'),
        para(job['role'], 'JobCustom'),
        para(job['dates'], 'DatesCustom'),
    ]))
    for detail in job['details']:
        story.append(para('- ' + detail, 'BulletCustom'))
    story.append(Spacer(1, 8))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#E2DDD5'))
    canvas.line(22*mm, 19*mm, A4[0]-22*mm, 19*mm)
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(muted)
    canvas.drawString(22*mm, 14*mm, f"{data['profile']['fullName'] or data['profile']['name']} | Senior Software Engineer")
    canvas.drawRightString(A4[0]-22*mm, 14*mm, str(doc.page))
    canvas.restoreState()

doc = SimpleDocTemplate(str(destination), pagesize=A4, rightMargin=22*mm, leftMargin=22*mm, topMargin=20*mm, bottomMargin=26*mm, title=f"{data['profile']['fullName'] or data['profile']['name']} - Resume", author=data['profile']['fullName'] or data['profile']['name'])
story = [para(data['profile']['fullName'] or data['profile']['name'], 'NameCustom'), para('Senior Software Engineer | React.js Developer', 'RoleCustom')]
if data['profile']['email'] and not data['profile'].get('contactIsDemo', False):
    story.append(para(data['profile']['email']))
story.append(para(data['professionalSummary']))
story.append(para('PROFESSIONAL EXPERIENCE', 'SectionCustom'))
add_job(story, data['experience'][0])
add_job(story, data['experience'][1])
story.append(PageBreak())
story.append(para('PROFESSIONAL EXPERIENCE / CONTINUED', 'SectionCustom'))
add_job(story, data['experience'][2])
story.append(para('SKILLS & TOOLKIT', 'SectionCustom'))
for group in data['skillGroups']:
    story.append(Paragraph(f"<b>{clean(group['title'])}</b><br/>{clean(' | '.join(group['skills']))}", styles['SkillCustom']))
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f'Created {destination}')
