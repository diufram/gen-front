import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './userModel.js'; // Asegúrate de que también esté exportado como `default`

const Sala = sequelize.define(
  'Sala',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    diagram: {
      type: DataTypes.JSON,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    user_create: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'salas',
    timestamps: false,
  }
);

// Relación
Sala.belongsTo(User, { as: 'creador', foreignKey: 'user_create' });

/* Métodos estáticos */

// Obtener una sala por ID
Sala.getSala = async function (sala_id) {
  return await this.findAll({
    where: {
      id: sala_id,
      is_active: true,
    },
  });
};

// Editar sala
Sala.editSala = async function (title, description, id) {
  const result = await this.update({ title, description }, { where: { id } });
  return result[0] > 0
    ? 'Sala actualizada exitosamente'
    : 'No se encontró la sala';
};

// Eliminar sala (lógico)
Sala.delSala = async function (sala_id) {
  const result = await Sala.update(
    { is_active: false },
    { where: { id: sala_id } }
  );
  return result[0] > 0
    ? 'Sala desactivada exitosamente'
    : 'No se encontró la sala';
};

// Crear nueva sala
Sala.createSala = async function (title, description, user_create) {
  const sala = await this.create({ title, description, user_create });
  return sala.id;
};

// Obtener todas las salas de un usuario
Sala.getAllSalasUser = async function (user_id) {
  return await this.findAll({
    where: {
      user_create: user_id,
      is_active: true,
    },
  });
};

// Obtener el diagrama de una sala
Sala.getDiagrama = async function (sala_id) {
  const sala = await this.findOne({
    where: { id: sala_id },
    attributes: ['diagram'],
  });
  return sala ? sala.diagram : null;
};

// Guardar un diagrama
Sala.saveDiagrama = async function (sala_id, diagrama) {
  const sala = await this.findOne({ where: { id: sala_id } });
  if (sala) {
    sala.diagram = diagrama;
    await sala.save();
    return sala;
  }
  return null;
};

// ✅ Exportación ESM
export default Sala;
