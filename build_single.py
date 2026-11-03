#!/usr/bin/env python3
"""Makes ONE self-contained file (contact-book-single.html) from contact-book.html + css/ + js/.
Run:  python build_single.py      (only needed if you want a single file; the folder version works as-is)"""
import re, os
here = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(here, 'contact-book.html'), encoding='utf8').read()
def css(m):
    return '<style>\n' + open(os.path.join(here, m.group(1)), encoding='utf8').read() + '\n</style>'
def js(m):
    src = open(os.path.join(here, m.group(1)), encoding='utf8').read()
    assert '</script' not in src.lower(), m.group(1)
    return '<script>\n' + src + '\n</script>'
html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', css, html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', js, html)
open(os.path.join(here, 'contact-book-single.html'), 'w', encoding='utf8').write(html)
print('written contact-book-single.html', len(html), 'bytes')
