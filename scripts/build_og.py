"""Generate the project's own social card, entirely offline."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(1200,630),'#f3f5f7');d=ImageDraw.Draw(im)
def font(size): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size)
points=[(830,290),(1000,180),(1080,350),(920,470),(730,430),(720,160)]
for x,y in points[1:]:d.line((830,290,x,y),fill='#a5b1bf',width=4)
for (x,y),color in zip(points,['#6551a3','#994500','#006d8f','#24704e','#626c77','#626c77']):d.ellipse((x-25,y-25,x+25,y+25),fill=color)
d.text((70,95),'Lula Gate',font=font(80),fill='#252d36')
d.text((75,225),'Relações, contexto',font=font(36),fill='#252d36');d.text((75,275),'e fontes públicas',font=font(36),fill='#252d36')
d.text((75,490),'Uma conexão não indica culpa.',font=font(28),fill='#435f7d')
d.text((75,550),'Mapa documental interativo',font=font(22),fill='#586575')
im.save(root/'app/public/og.png',optimize=True)
