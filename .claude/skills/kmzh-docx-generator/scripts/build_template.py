"""Builds templates/kmzh.docx: the user's ҚМЖ with docxtemplater tags in place of the lesson content.
Usage: python3 -I build_template.py <source.docx> <out.docx>
"""
import sys, zipfile, copy
from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
def q(tag): return '{%s}%s' % (W, tag)

src, out = sys.argv[1], sys.argv[2]
zin = zipfile.ZipFile(src)
root = etree.fromstring(zin.read('word/document.xml'))
tables = root.findall('.//' + q('tbl'))
header, main = tables[0], tables[1]


def make_run(text, bold=False):
    r = etree.Element(q('r'))
    rpr = etree.SubElement(r, q('rPr'))
    if bold:
        etree.SubElement(rpr, q('b'))
    etree.SubElement(rpr, q('sz')).set(q('val'), '24')
    etree.SubElement(rpr, q('szCs')).set(q('val'), '24')
    etree.SubElement(rpr, q('lang')).set(q('val'), 'kk-KZ')
    t = etree.SubElement(r, q('t'))
    t.text = text
    t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
    return r


def fill_cell(tc, paragraphs):
    """paragraphs: list of paragraphs, each a list of (text, bold) runs."""
    old = tc.findall(q('p'))
    ppr = old[0].find(q('pPr'))
    for p in old:
        tc.remove(p)
    for runs in paragraphs:
        p = etree.SubElement(tc, q('p'))
        if ppr is not None:
            p.append(copy.deepcopy(ppr))
        for text, bold in runs:
            p.append(make_run(text, bold))


def cells(tr):
    return tr.findall(q('tc'))


# --- header table: column 1 of each row
hrows = header.findall(q('tr'))
for i, key in [(0, 'teacher_name'), (1, 'date'), (3, 'section'), (4, 'topic'),
               (5, 'learning_objective'), (6, 'lesson_goal')]:
    fill_cell(cells(hrows[i])[1], [[('{%s}' % key, False)]])
fill_cell(cells(hrows[2])[1], [[('{grade}', False),
                                 ('                 Қатысқандар саны:                  Қатыспағандар саны: ', False)]])

# --- main table: rows 1..8, columns 1..4 (column 0 = stage name and time, left as is)
rows = main.findall(q('tr'))
stages = ['org', 'start', 'new', 'task1', 'task2', 'task3', 'sen', 'end']
with_points = {'task2', 'task3', 'sen'}

for idx, s in enumerate(stages, start=1):
    tc = cells(rows[idx])
    # teacher: list of blocks {title (bold), sp, text}
    fill_cell(tc[1], [
        [('{#%s_teacher}' % s, False)],
        [('{title}', True), ('{sp}{text}', False)],
        [('{/%s_teacher}' % s, False)],
    ])
    # student
    student = [[('{%s_student}' % s, False)]]
    if s == 'task1':
        student.append([('Дескрипторлар: ', True), ('{task1_descriptors}', False)])
    if s in with_points:
        student += [
            [('{%s_points} балл:' % s, True)],
            [('{#%s_descriptors}' % s, False)],
            [('• {text} — {points};', False)],
            [('{/%s_descriptors}' % s, False)],
        ]
    fill_cell(tc[2], student)
    fill_cell(tc[3], [[('{%s_assessment}' % s, False)]])
    fill_cell(tc[4], [[('{%s_resources}' % s, False)]])

zout = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    data = zin.read(item.filename)
    if item.filename == 'word/document.xml':
        data = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    zout.writestr(item, data)
zout.close()
print('ok', out)
