"""Check public Markdown contracts, offline HTML, and pinned file hashes."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def without_fences(text):
    return re.sub(r"^```[^\n]*\n.*?^```\s*$", "", text, flags=re.M | re.S)


def main():
    files = [ROOT / 'index.md', ROOT / 'README.md', ROOT / 'CHANGELOG.md']
    files += [p for folder in ['docs', 'examples'] for p in (ROOT / folder).rglob('*.md')
              if not p.name.startswith('改善建议书-')]
    errors = []
    for file in files:
        text = file.read_text(encoding='utf-8')
        for href in re.findall(r'\[[^\]]*\]\(([^\s)]+)\)', without_fences(text)):
            url = urlsplit(href)
            if url.scheme or not url.path:
                continue
            target = (file.parent / unquote(url.path)).resolve()
            if not target.is_relative_to(ROOT) or not target.exists():
                errors.append(f'{file.relative_to(ROOT)}: missing/unsafe path {href}')
        if re.search(r'C:[/\\]Users[/\\]|file://', text) and file.name != 'README.md':
            errors.append(f'{file.relative_to(ROOT)}: local path')
    md = (ROOT / 'index.md').read_text(encoding='utf-8')
    for sample in re.findall(r'^```json\n(.*?)^```', md, re.M | re.S):
        json.loads(sample)
    skill = (ROOT / 'examples/skills/weekly-report/SKILL.md').read_text(encoding='utf-8').strip()
    assert skill in md, 'Skill example and canonical text differ'
    for entry in json.loads((ROOT / 'vendor/manifest.json').read_text(encoding='utf-8')):
        assert hashlib.sha256((ROOT / entry['file']).read_bytes()).hexdigest() == entry['fileSha256'], entry['file']

    class Offline(HTMLParser):
        def __init__(self):
            super().__init__(); self.ids = set(); self.links = []; self.bad = []

        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            if tag == 'script' or any(key.startswith('on') for key in attrs):
                self.bad.append(tag)
            if 'id' in attrs:
                assert attrs['id'] not in self.ids, 'Duplicate offline ID'
                self.ids.add(attrs['id'])
            if tag == 'a' and attrs.get('href', '').startswith('#'):
                self.links.append(unquote(attrs['href'][1:]))
    offline = Offline()
    offline.feed((ROOT / 'handbook-offline.html').read_text(encoding='utf-8'))
    assert not offline.bad, 'Executable content in offline HTML'
    assert all(link in offline.ids for link in offline.links), 'Broken offline fragment'
    assert all(key in offline.ids for key in [*[f'ch{i}' for i in range(11)], 'appA', 'appB', *[f'a{i}' for i in range(1, 6)]]), 'Missing semantic anchors'
    subprocess.run(['node', str(ROOT / 'scripts/build-offline.cjs'), '--check'], check=True)
    if errors:
        raise AssertionError('\n'.join(errors))
    print(f'Passed: {len(files)} public Markdown files, JSON/Skill, vendor hashes and offline anchors/build.')


if __name__ == '__main__':
    main()
