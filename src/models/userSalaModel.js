import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './userModel.js';
import Sala from './salaModel.js';

const UserSala = sequelize.define(
  'UserSala',
  {
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
      primaryKey: true,
    },
    sala_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Sala,
        key: 'id',
      },
      onDelete: 'CASCADE',
      primaryKey: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'users_sala',
    timestamps: false,
  }
);

// Asociaciones
UserSala.belongsTo(Sala, { foreignKey: 'sala_id', as: 'sala' });

// Métodos personalizados

UserSala.addUserSala = async (user_id, sala_id) => {
  const salaCreadaPorUsuario = await Sala.findOne({
    where: { id: sala_id, user_create: user_id },
  });

  if (salaCreadaPorUsuario) return;

  const userSalaExistente = await UserSala.findOne({
    where: { user_id, sala_id },
  });

  if (userSalaExistente) {
    userSalaExistente.is_active = true;
    await userSalaExistente.save();
    return 'Relación activada';
  } else {
    return await UserSala.create({ user_id, sala_id });
  }
};

UserSala.getAllSalasCompartidas = async (user_id) => {
  const salasCompartidas = await UserSala.findAll({
    where: { user_id, is_active: true },
    include: [
      {
        model: Sala,
        as: 'sala',
        attributes: ['id', 'title', 'description'],
        include: [
          {
            model: User,
            as: 'creador',
            attributes: ['nombre'],
          },
        ],
      },
    ],
  });

  return salasCompartidas.map((userSala) => ({
    id: userSala.sala.id,
    title: userSala.sala.title,
    description: userSala.sala.description,
    creador: userSala.sala.creador.nombre,
  }));
};

UserSala.delSalaCompatida = async (user_id, sala_id) => {
  try {
    return await UserSala.update(
      { is_active: false },
      {
        where: { user_id, sala_id },
      }
    );
  } catch (error) {
    console.error('Error al actualizar sala compartida:', error);
    throw error;
  }
};

export default UserSala;
