// Número a letras en guaraníes (extraído de App.jsx, Fase 1).
// Función pura: mismo algoritmo, testeable sin React.

const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const decenas = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
const decenas2 = ['', '', 'veinti', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

const getDecenas = (n) => { if (n < 10) return unidades[n]; if (n < 20) return decenas[n - 10]; if (n === 20) return 'veinte'; if (n < 30) return decenas2[2] + (n % 10 === 0 ? '' : unidades[n % 10]); const u = n % 10; return decenas2[Math.floor(n / 10)] + (u > 0 ? ' y ' + unidades[u] : ''); };
const getCentenas = (n) => { if (n === 100) return 'cien'; const d = n % 100; return centenas[Math.floor(n / 100)] + (d > 0 ? ' ' + getDecenas(d) : ''); };
const getMiles = (n) => { if (n < 1000) return getCentenas(n); if (n === 1000) return 'mil'; const m = Math.floor(n / 1000); const c = n % 1000; return (m === 1 ? '' : getCentenas(m) + ' ') + 'mil' + (c > 0 ? ' ' + getCentenas(c) : ''); };
const getMillones = (n) => { if (n < 1000000) return getMiles(n); if (n === 1000000) return 'un millon'; const m = Math.floor(n / 1000000); const rest = n % 1000000; return (m === 1 ? 'un millon' : getMiles(m) + ' millones') + (rest > 0 ? ' ' + getMiles(rest) : ''); };
const getMilMillones = (n) => { if (n < 1000000000) return getMillones(n); const m = Math.floor(n / 1000000000); const rest = n % 1000000000; return (m === 1 ? 'mil millones' : getMiles(m) + ' mil millones') + (rest > 0 ? ' ' + getMillones(rest) : ''); };

export const numeroALetras = (num) => {
    if (num === 0) return 'cero';
    return getMilMillones(num).trim();
};
