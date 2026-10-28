from urllib.request import urlopen
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO

url = 'https://www.jiosaavn.com/corporate/_assets/JioSaavn-Logo-Kit.zip'
data = urlopen(url, timeout=40).read()
Path('.qa/jiosaavn-kit.zip').write_bytes(data)
with ZipFile(BytesIO(data)) as archive:
    print('\n'.join(archive.namelist()))
