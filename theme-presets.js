const EXPERIENCE_THEMES = Object.freeze({
  'birthday-plum': {name:'Birthday Plum',category:'romantic',colors:['#120f24','#6d365f','#ff8fb8','#b9a7ff'],tokens:{bg1:'#120f24',bg2:'#321f52',bg3:'#6d365f',primary:'#ff8fb8',primarySoft:'#ffb6cf',secondary:'#b9a7ff',accent:'#ffd88a',mint:'#92e6c5',text:'#fff8fc',muted:'#d8cfe5',name1:'#62f6dc',name2:'#fff36d',name3:'#ff82c8'}},
  'rose-romance': {name:'Rose Romance',category:'romantic',colors:['#1d0c18','#702a50','#ff648f','#ffc1d4'],tokens:{bg1:'#1d0c18',bg2:'#48203a',bg3:'#702a50',primary:'#ff648f',primarySoft:'#ffc1d4',secondary:'#d99ac8',accent:'#ffd38d',mint:'#a8e6cf',text:'#fff8fb',muted:'#e4cad6',name1:'#ffd1df',name2:'#ff879f',name3:'#ffe3a8'}},
  'cherry-blossom': {name:'Cherry Blossom',category:'romantic',colors:['#24131f','#9a526c','#ffabc5','#ffe5d2'],tokens:{bg1:'#24131f',bg2:'#593143',bg3:'#9a526c',primary:'#ffabc5',primarySoft:'#ffe0e9',secondary:'#e9bad5',accent:'#ffe5b5',mint:'#bce8d4',text:'#fffaf7',muted:'#ead4dc',name1:'#fff1d9',name2:'#ffc1d4',name3:'#ff8fb2'}},
  'lavender-dream': {name:'Lavender Dream',category:'pastel',colors:['#17152c','#6b5fa0','#c4b5ff','#9edcff'],tokens:{bg1:'#17152c',bg2:'#39345f',bg3:'#6b5fa0',primary:'#c4b5ff',primarySoft:'#e2dcff',secondary:'#9edcff',accent:'#ffe6a3',mint:'#a7ead6',text:'#fbfaff',muted:'#d8d3ec',name1:'#a7e8ff',name2:'#fff1a8',name3:'#d9baff'}},
  'mint-candy': {name:'Mint Candy',category:'pastel',colors:['#102420','#276c67','#78e5c4','#ff9fc3'],tokens:{bg1:'#102420',bg2:'#184b49',bg3:'#276c67',primary:'#78e5c4',primarySoft:'#bdf6e5',secondary:'#ff9fc3',accent:'#ffe58f',mint:'#78e5c4',text:'#f7fffc',muted:'#c9e1db',name1:'#91f4d7',name2:'#fff29d',name3:'#ffafd0'}},
  'peach-cream': {name:'Peach Cream',category:'pastel',colors:['#281716','#8b4d48','#ffad8f','#ffd6b8'],tokens:{bg1:'#281716',bg2:'#56302e',bg3:'#8b4d48',primary:'#ffad8f',primarySoft:'#ffd6c7',secondary:'#f4b5c9',accent:'#ffe2a8',mint:'#b9e7ce',text:'#fffaf5',muted:'#ead7cf',name1:'#fff0c7',name2:'#ffca9e',name3:'#ff96a7'}},
  'midnight-galaxy': {name:'Midnight Galaxy',category:'night',colors:['#070b24','#241b70','#7657ff','#38d9ff'],tokens:{bg1:'#070b24',bg2:'#15134a',bg3:'#34247b',primary:'#7657ff',primarySoft:'#b8aaff',secondary:'#38d9ff',accent:'#ffd95e',mint:'#5ff0cf',text:'#f8f9ff',muted:'#c4c9e8',name1:'#43e8ff',name2:'#d8ff6a',name3:'#ff6fd8'}},
  'emerald-night': {name:'Emerald Night',category:'night',colors:['#071b19','#0d594a','#20b486','#e4bd5a'],tokens:{bg1:'#071b19',bg2:'#0a3932',bg3:'#0d594a',primary:'#20b486',primarySoft:'#8ce2c4',secondary:'#65cdbb',accent:'#e4bd5a',mint:'#6ce0bd',text:'#f5fffb',muted:'#c0dcd3',name1:'#77efca',name2:'#ffe38a',name3:'#9fd9ba'}},
  'royal-gold': {name:'Royal Gold',category:'night',colors:['#0d0b0c','#3c2a24','#d9a62e','#fff0a6'],tokens:{bg1:'#0d0b0c',bg2:'#241a18',bg3:'#3c2a24',primary:'#d9a62e',primarySoft:'#f5d878',secondary:'#b58d58',accent:'#fff0a6',mint:'#9cc8a9',text:'#fffaf0',muted:'#d8cdbb',name1:'#fff5bf',name2:'#e8bb48',name3:'#fff1d0'}},
  'ocean-blue': {name:'Ocean Blue',category:'bright',colors:['#071c35','#095b86','#22b8d6','#86e8ff'],tokens:{bg1:'#071c35',bg2:'#083e63',bg3:'#095b86',primary:'#22b8d6',primarySoft:'#86e8ff',secondary:'#58a6ff',accent:'#ffe079',mint:'#62e4c6',text:'#f4fcff',muted:'#c5dce8',name1:'#59efff',name2:'#fff584',name3:'#74aaff'}},
  'lemon-pop': {name:'Lemon Pop',category:'bright',colors:['#28220b','#7c6410','#ffe14f','#ff8c42'],tokens:{bg1:'#28220b',bg2:'#55430d',bg3:'#7c6410',primary:'#ffe14f',primarySoft:'#fff0a0',secondary:'#ff8c42',accent:'#fff6a5',mint:'#8de0a7',text:'#fffdf2',muted:'#e7ddba',name1:'#fff66e',name2:'#ffbb48',name3:'#ff7c62'}},
  'rainbow-celebration': {name:'Rainbow Celebration',category:'bright',colors:['#15132e','#4e3782','#ff5fa2','#51d9d0'],tokens:{bg1:'#15132e',bg2:'#30265f',bg3:'#4e3782',primary:'#ff5fa2',primarySoft:'#ffaad0',secondary:'#51d9d0',accent:'#ffe45e',mint:'#65e6ad',text:'#fffaff',muted:'#d9d2ea',name1:'#5de8dd',name2:'#ffe65d',name3:'#ff65aa'}},
  'sunset-party': {name:'Sunset Party',category:'warm',colors:['#29112a','#87345e','#ff7657','#e98cff'],tokens:{bg1:'#29112a',bg2:'#5c254d',bg3:'#87345e',primary:'#ff7657',primarySoft:'#ffb18f',secondary:'#e98cff',accent:'#ffd56d',mint:'#87e1c1',text:'#fff8fa',muted:'#e3ccd9',name1:'#ffd06b',name2:'#ff835f',name3:'#eb8cff'}},
  'red-velvet': {name:'Red Velvet',category:'warm',colors:['#21090e','#6f1725','#cf3851','#f3c2a8'],tokens:{bg1:'#21090e',bg2:'#47101a',bg3:'#6f1725',primary:'#cf3851',primarySoft:'#f38a9c',secondary:'#c17c86',accent:'#f3c2a8',mint:'#a7cfb2',text:'#fff8f5',muted:'#dfc9c6',name1:'#ffe0c8',name2:'#ef7184',name3:'#ffc7a8'}},
  'chocolate-cake': {name:'Chocolate Cake',category:'warm',colors:['#1c100d','#5e372b','#b86d43','#f2bd82'],tokens:{bg1:'#1c100d',bg2:'#3c241d',bg3:'#5e372b',primary:'#b86d43',primarySoft:'#e0a27b',secondary:'#c99376',accent:'#f2bd82',mint:'#a9ccb0',text:'#fff9f2',muted:'#dccac0',name1:'#f7d19e',name2:'#d89566',name3:'#f2b89d'}}
});

const EXPERIENCE_THEME_CATEGORIES=Object.freeze({all:'ทั้งหมด',romantic:'Romantic',pastel:'Pastel',night:'Night',bright:'Bright',warm:'Warm'});

function getExperienceTheme(themeId){return EXPERIENCE_THEMES[themeId]||EXPERIENCE_THEMES['birthday-plum'];}
function applyExperienceTheme(themeId,root=document.documentElement){
  const theme=getExperienceTheme(themeId),style=root.style,t=theme.tokens;
  const variables={bg1:t.bg1,bg2:t.bg2,bg3:t.bg3,pink:t.primary,pink2:t.primarySoft,lav:t.secondary,gold:t.accent,mint:t.mint,text:t.text,muted:t.muted,'name-1':t.name1,'name-2':t.name2,'name-3':t.name3,'button-1':t.primarySoft,'button-2':t.secondary,'theme-glow-1':t.secondary,'theme-glow-2':t.primary};
  Object.entries(variables).forEach(([key,value])=>style.setProperty(`--${key}`,value));
  root.dataset.experienceTheme=themeId in EXPERIENCE_THEMES?themeId:'birthday-plum';
  return theme;
}

window.EXPERIENCE_THEMES=EXPERIENCE_THEMES;
window.EXPERIENCE_THEME_CATEGORIES=EXPERIENCE_THEME_CATEGORIES;
window.getExperienceTheme=getExperienceTheme;
window.applyExperienceTheme=applyExperienceTheme;
