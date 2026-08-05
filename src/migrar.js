const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg'); //[cite: 5]

// Conexión a tu nueva base de datos PostgreSQL[cite: 5]
const pgPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'patrimonio_unp',
    password: 'Maui21052021',
    port: 5432,
});

// Conexión a tu antigua base de datos SQLite[cite: 4]
const sqliteDb = new sqlite3.Database('./patrimonio.sqlite');

const tablas = ['bens', 'fc10', 'fc11', 'fc04', 'estructuras', 'auditoria']; //[cite: 5]

const querySQLite = (query) => {
    return new Promise((resolve, reject) => {
        sqliteDb.all(query, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

async function ejecutarMigracion() {
    try {
        console.log('Iniciando migración...');

        // 1. Migrar Usuarios[cite: 4, 5]
        const usuarios = await querySQLite('SELECT * FROM usuarios');
        for (const user of usuarios) {
            await pgPool.query(
                `INSERT INTO usuarios (username, password, nombre, cargo) 
                 VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
                [user.username, user.password, user.nombre, user.cargo]
            );
        }
        console.log(`✅ ${usuarios.length} usuarios migrados.`);

        // 2. Migrar registros de las otras tablas[cite: 5]
        for (const tabla of tablas) {
            try {
                const registros = await querySQLite(`SELECT * FROM ${tabla}`);
                for (const reg of registros) {
                    await pgPool.query(
                        `INSERT INTO ${tabla} (id, data) VALUES ($1, $2) 
                         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
                        [reg.id, reg.data]
                    );
                }
                console.log(`✅ ${registros.length} registros migrados a la tabla ${tabla}.`);
            } catch (err) {
                console.log(`⚠️ Tabla ${tabla} vacía o no encontrada en SQLite.`);
            }
        }

        console.log('🎉 Migración finalizada.');
    } catch (error) {
        console.error('❌ Error fatal:', error);
    } finally {
        sqliteDb.close();
        pgPool.end();
    }
}

ejecutarMigracion();