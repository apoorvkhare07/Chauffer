"""Render the homepage finale as a silent 1080x1920 MP4.
Requires Pillow, numpy, ffmpeg; PNG icons are rasterized from exports/instagram/source SVGs.
"""
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np, math, subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'exports/instagram'; assets=root/'tmp/instagram-render'
W,H,FPS,SECONDS=1080,1920,30,8
blue=(41,80,184); ink=(20,40,87)
y,x=np.mgrid[0:H,0:W];r=np.sqrt(((x-W/2)/(W*.9))**2+(y/(H*1.07))**2)
stops=[0,.28,.62,1];cols=np.array([[244,247,255],[220,231,255],[142,169,227],[41,80,184]])
bg=Image.fromarray(np.stack([np.interp(r,stops,cols[:,i]) for i in range(3)],axis=2).astype('uint8')).convert('RGBA')
def font(size,weight=600):
 f=ImageFont.truetype(str(root/'public/fonts/inter-variable.woff2'),size)
 try:f.set_variation_by_axes([32,weight])
 except Exception:pass
 return f
heading=font(85,650);brandfont=font(44,650)
def center_text(img,text,yy,f,color):
 d=ImageDraw.Draw(img);box=d.textbbox((0,0),text,font=f);d.text(((W-(box[2]-box[0]))/2-box[0],yy),text,font=f,fill=color)
def ease(z):z=max(0,min(1,z));return 1-(1-z)**3
names=['bag','card','hanger','tryon','tags','heart'];tiles=[]
for i,name in enumerate(names):
 tile=Image.new('RGBA',(180,180));d=ImageDraw.Draw(tile);d.rounded_rectangle((5,5,175,175),radius=49,fill=blue if i%2 else 'white',outline=(204,216,245),width=2)
 icon=Image.open(assets/(name+('-white' if i%2 else '')+'.png')).resize((88,88),Image.Resampling.LANCZOS);tile.alpha_composite(icon,(46,46));tiles.append(tile)
core=Image.open(assets/'core.png').resize((200,200),Image.Resampling.LANCZOS)
logo=Image.open(assets/'logo.png').resize((70,70),Image.Resampling.LANCZOS)
cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'chauffer-conversation-reel.mp4')]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for frame in range(FPS*SECONDS):
 t=frame/FPS;im=bg.copy();lift=ease(t/2.1);cy=830-155*lift;cx=W/2
 for i,tile in enumerate(tiles):
  spread=ease((t-.25-i*.65)/.75);a=-math.pi/2+i*math.pi/3+t*math.pi/24
  radius=290*spread;scale=.2+.8*spread;sz=round(180*scale);part=tile.resize((sz,sz),Image.Resampling.LANCZOS)
  part.putalpha(part.getchannel('A').point(lambda v:int(v*spread)))
  im.alpha_composite(part,(round(cx+math.cos(a)*radius-sz/2),round(cy+math.sin(a)*radius-sz/2)))
 rotated=core.rotate(-t*22.5,resample=Image.Resampling.BICUBIC,expand=True);im.alpha_composite(rotated,(round(cx-rotated.width/2),round(cy-rotated.height/2)))
 text=Image.new('RGBA',(W,H));alpha=ease((t-.5)/1.3);offset=round(-30*(1-alpha))
 for line,yy,c in [('Your next favourite',1090,ink),('starts with',1197,ink),('a conversation.',1304,blue)]:center_text(text,line,yy+offset,heading,c)
 text.putalpha(text.getchannel('A').point(lambda v:int(v*alpha)));im.alpha_composite(text)
 # Small brand signature, inside the safe area of the vertical composition.
 d=ImageDraw.Draw(im);label='chauffer.';width=d.textlength(label,font=brandfont);left=round((W-width-86)/2)
 im.alpha_composite(logo,(left,1580));d.text((left+86,1590),label,font=brandfont,fill='white')
 if frame==120:im.convert('RGB').save(out/'chauffer-conversation-cover.jpg',quality=96)
 p.stdin.write(im.convert('RGB').tobytes())
p.stdin.close()
if p.wait()!=0:raise RuntimeError('Video encoding failed')
print(out/'chauffer-conversation-reel.mp4')
