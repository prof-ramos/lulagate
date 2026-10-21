"""Generate the project's own social card, entirely offline."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root=Path(__file__).resolve().parents[1]
im=Image.new('RGB',(1200,630),'#f3f5f7');d=ImageDraw.Draw(im)
def font(size): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size)
points=[(900,200),(1020,110),(1080,265),(795,270),(770,160),(890,85)]
for x,y in points[1:]:d.line((900,200,x,y),fill='#a5b1bf',width=4)
for (x,y),color in zip(points,['#6551a3','#994500','#006d8f','#24704e','#626c77','#626c77']):d.ellipse((x-25,y-25,x+25,y+25),fill=color)
d.text((60,65),'LulaGate',font=font(66),fill='#252d36')
for i,line in enumerate(['Mapa de casos, decisões e','conexões citados na imprensa']):
    d.text((65,165+i*44),line,font=font(30),fill='#252d36')
lines=['Lula não tem condenação vigente.', 'Uma conexão não indica culpa.', 'Absolvição, arquivamento e anulação', 'significam que não há condenação.', 'Pessoas marcadas como “sem informação”', 'em geral não são investigadas.']
d.rectangle((40,315,1160,610),fill='#f3f5f7')
for i,line in enumerate(lines):
    d.text((65,330+i*42),line,font=font(27),fill='#435f7d')
im.save(root/'app/public/og.png',optimize=True)
