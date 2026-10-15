"""Export portable, outlined Inter 600 wordmarks. Requires fonttools and brotli."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
font=instantiateVariableFont(TTFont('public/fonts/inter-variable.woff2'),{'wght':600,'opsz':14})
glyphs=font.getGlyphSet(); cmap=font.getBestCmap(); scale=25/font['head'].unitsPerEm
x=48; paths=[]
for char in 'chauffer.':
 name=cmap[ord(char)]; pen=SVGPathPen(glyphs); glyphs[name].draw(pen)
 paths.append(f'<path fill="{"#2950B8" if char=="." else "#242a38"}" transform="translate({x:.3f} 31) scale({scale} {-scale})" d="{pen.getCommands()}"/>')
 x+=glyphs[name].width*scale-1.375
for animated in (False,True):
 icon=Path('public/brand/chauffer-icon'+('-animated' if animated else '')+'.svg').read_text()
 inner=icon[icon.index('>')+1:icon.rindex('</svg>')]
 Path('public/brand/chauffer-logo'+('-animated' if animated else '')+'.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {x+5:.3f} 44" fill="none" role="img" aria-label="chauffer.">{inner}{"".join(paths)}</svg>')
