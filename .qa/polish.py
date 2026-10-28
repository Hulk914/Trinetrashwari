from pathlib import Path

path = Path('style.css')
css = path.read_text(encoding='utf-8-sig')
# Improve small-screen readability while keeping the restrained design.
css = css.replace('.release-description{max-width:530px;margin:16px auto 0;color:var(--muted);font-size:12px;', '.release-description{max-width:530px;margin:16px auto 0;color:var(--muted);font-size:13px;')
css = css.replace('.release-description{font-size:11px;line-height:1.9;', '.release-description{font-size:13px;line-height:1.9;')
css = css.replace('.release-description{font-size:12px}', '.release-description{font-size:13px}')
css = css.replace('.platform-name{font-size:12px;', '.platform-name{font-size:13px;')
css = css.replace('.platform-name{font-size:11px}', '.platform-name{font-size:13px}')
css = css.replace('.platform-action{font-size:8px;', '.platform-action{font-size:10px;')
css = css.replace('.platform-card--jiosaavn .platform-action{font-size:7px}', '.platform-card--jiosaavn .platform-action{font-size:9px}')
css = css.replace('.platform-card--jiosaavn .platform-action{font-size:8px}', '.platform-card--jiosaavn .platform-action{font-size:9px}')
css = css.replace('.credits-grid{display:grid;grid-template-columns:1fr;gap:30px;', '.credits-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px 18px;')
css = css.replace('.production{border-top:', '.performed,.production{grid-column:1/-1}.production{border-top:',1)
css = css.replace('.production{border-top:0;', '.performed,.production{grid-column:auto}.production{border-top:0;',1)
css = css.replace('font-size:8px;font-weight:600;letter-spacing:.17em;', 'font-size:9px;font-weight:600;letter-spacing:.17em;')
css = css.replace('.credit-group h3{font-size:7px;', '.credit-group h3{font-size:9px;')
css = css.replace('.credit-group p,.credit-group li,.credit-group dd{font-size:11px}', '.credit-group p,.credit-group li,.credit-group dd{font-size:12px}')

# Format the CSS into readable, consistently indented rules. Handle comments,
# quoted strings, and parenthesized values without changing their contents.
lines = []
buf = ''
indent = 0
depth = 0
quote = None
index = 0
def flush():
    global buf
    if buf.strip():
        lines.append('  ' * indent + buf.strip())
    buf = ''
while index < len(css):
    char = css[index]
    if not quote and css[index:index+2] == '/*':
        flush()
        end = css.index('*/', index) + 2
        lines.append('\n' + '  ' * indent + css[index:end])
        index = end
        continue
    if char in ('"', "'") and (index == 0 or css[index-1] != '\\'):
        if quote == char: quote = None
        elif quote is None: quote = char
    if quote:
        buf += char
    elif char == '(':
        depth += 1
        buf += char
    elif char == ')':
        depth -= 1
        buf += char
    elif depth == 0 and char == '{':
        buf = buf.strip() + ' {'
        flush()
        indent += 1
    elif depth == 0 and char == '}':
        flush()
        indent -= 1
        lines.append('  ' * indent + '}')
        if indent == 0: lines.append('')
    elif depth == 0 and char == ';':
        buf += ';'
        flush()
    elif depth == 0 and char == ':':
        buf += ': '
    elif char in '\n\r':
        if buf and not buf.endswith(' '): buf += ' '
    else:
        buf += char
    index += 1
flush()
path.write_text('\n'.join(lines).strip() + '\n', encoding='utf-8')
