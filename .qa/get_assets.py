"""One-time asset preparation only; not needed to run or publish the website."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
(ASSETS / 'icons').mkdir(parents=True, exist_ok=True)
(ASSETS / 'fonts').mkdir(parents=True, exist_ok=True)
shutil.copyfile(ROOT.parent / 'album art.JPG', ASSETS / 'trinetrashwari-cover.jpg')

def fetch(url):
    request = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urlopen(request, timeout=40) as response:
        return response.read()

def icon(name, color):
    url = f'https://raw.githubusercontent.com/simple-icons/simple-icons/13.21.0/icons/{name}.svg'
    data = fetch(url).decode('utf-8')
    if '<svg' not in data:
        raise ValueError(f'Not an SVG: {name}')
    data = data.replace('<svg ', f'<svg fill="{color}" ', 1)
    (ASSETS / 'icons' / f'{name}.svg').write_text(data, encoding='utf-8')
    print(f'Icon: {name}', flush=True)

def download_file(url, output):
    content = fetch(url)
    (ASSETS / output).write_bytes(content)
    print(f'{output}: {len(content):,} bytes', flush=True)

def font(family, filename):
    css = fetch(f'https://fonts.googleapis.com/css2?family={family}:wght@400;500;600;700&display=swap').decode('utf-8')
    # Request a modern browser if Google returns TTF for the basic user agent.
    if '.woff2' not in css:
        request = Request(f'https://fonts.googleapis.com/css2?family={family}:wght@400..700&display=swap', headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'})
        with urlopen(request, timeout=40) as response:
            css = response.read().decode('utf-8')
    urls = re.findall(r'url\((https://[^)]+\.woff2)\)', css)
    if not urls:
        raise ValueError(f'No WOFF2 found for {family}')
    # Google's Latin subset is the final block, following extended subsets.
    download_file(urls[-1], f'fonts/{filename}')

jobs = [
    (icon, ('spotify', '#1ED760')),
    (icon, ('youtube', '#FF0000')),
    (icon, ('youtubemusic', '#FF0000')),
    (icon, ('applemusic', '#FA586A')),
    (icon, ('amazonmusic', '#25D1DA')),
    (download_file, ('https://www.jiosaavn.com/corporate/_i/brand-guide/jiosaavn-logo-inline.png', 'icons/jiosaavn.png')),
    (download_file, ('https://i.ytimg.com/vi/L5fivEQxBL4/maxresdefault.jpg', 'trinetrashwari-video-source.jpg')),
    (font, ('Cinzel', 'cinzel-latin.woff2')),
    (font, ('Manrope', 'manrope-latin.woff2')),
    (download_file, ('https://raw.githubusercontent.com/google/fonts/main/ofl/cinzel/OFL.txt', 'fonts/Cinzel-OFL.txt')),
    (download_file, ('https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt', 'fonts/Manrope-OFL.txt')),
    (download_file, ('https://raw.githubusercontent.com/simple-icons/simple-icons/13.21.0/LICENSE.md', 'icons/Simple-Icons-LICENSE.md')),
]
with ThreadPoolExecutor(max_workers=6) as pool:
    futures = [pool.submit(function, *args) for function, args in jobs]
    for future in futures:
        future.result()
