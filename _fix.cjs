const fs = require('fs');
const p = 'src/components/FC10Modal.jsx';
let c = fs.readFileSync(p, 'utf8');

const R = [
  ['className="px-8 py-6 border-b border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10 flex justify-between items-center gap-4"',
   'className="px-5 sm:px-6 py-4 border-b border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card shrink-0 z-10 flex items-center justify-between gap-4"'],
  ['<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white shrink-0">',
   '<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white">'],
  ['<i className="fa-solid fa-file-signature text-lg"></i>',
   '<i className="fa-solid fa-file-signature text-sm"></i>'],
  ['<h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">',
   '<h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white truncate">'],
  ['<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">',
   '<p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">'],
  ['className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400',
   'className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400'],
  ['<i className="fa-solid fa-xmark text-base"></i>',
   '<i className="fa-solid fa-xmark text-sm"></i>'],
  ['className="flex justify-end gap-3 px-8 py-6 border-t border-zinc-100 dark:border-darkbg-border bg-white dark:bg-darkbg-card shrink-0 z-10"',
   'className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card shrink-0 z-10"']
];

let n = 0;
for (const [a, b] of R) {
  if (c.includes(a)) { c = c.split(a).join(b); n++; }
  else console.log('FALLO: ' + a.slice(0, 55));
}

// Indicador de paso en el pie
const pie = 'className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-zinc-200/70 dark:border-white/10 bg-white dark:bg-darkbg-card shrink-0 z-10">';
if (c.includes(pie) && !c.includes('Paso {step} de 3')) {
  c = c.replace(pie, pie + '\n                        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 hidden sm:block">Paso {step} de 3</span>');
  n++;
  console.log('Indicador de paso agregado');
}

fs.writeFileSync(p, c, 'utf8');
console.log('Aplicados ' + n + '/' + (R.length + 1));
console.log('Caracteres corruptos: ' + (c.match(/\uFFFD/g) || []).length);