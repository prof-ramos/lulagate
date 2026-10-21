"""Transform only embedded portrait pixels; source dataset and credits stay intact."""
import base64
import io
import json
import sys
from PIL import Image

data = json.load(sys.stdin)
for person in data['personagens']:
    portrait = person.get('retrato')
    if not portrait or not portrait.get('base64'):
        continue
    image = Image.open(io.BytesIO(base64.b64decode(portrait['base64'].split(',', 1)[1])))
    output = io.BytesIO()
    image.convert('L').save(output, format='WEBP', lossless=True)
    portrait['base64'] = 'data:image/webp;base64,' + base64.b64encode(output.getvalue()).decode()
json.dump(data, sys.stdout, ensure_ascii=False)
