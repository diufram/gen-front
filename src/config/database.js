import { Sequelize } from 'sequelize';
import 'dotenv/config'; // ✅ Carga variables de entorno en ESM

// Crear una instancia de Sequelize usando variables de entorno
const sequelize = new Sequelize(
  process.env.DATABASE_NAME,      // Nombre de la base de datos
  process.env.DATABASE_USER,      // Usuario de la base de datos
  process.env.DATABASE_PASSWORD,  // Contraseña de la base de datos
  {
    host: process.env.DATABASE_HOST,         // Host de la base de datos
    dialect: process.env.DATABASE_DIALECT,   // dialecto (por ej. 'postgres', 'mysql', etc.)
    logging: false,                          // Opcional: desactivar logging SQL
  }
);

export default sequelize;
