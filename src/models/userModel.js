import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: false,
});

// ✅ Métodos estáticos

User.createUser = async function (nombre, correo, password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const user = await this.create({ nombre, correo, password: hashedPassword });
  return user.dataValues;
};

User.getAllUsers = async function () {
  return await this.findAll({
    attributes: ['id', 'nombre', 'correo'],
  });
};

User.authenticateUser = async (correo, password) => {
  const user = await User.findOne({ where: { correo } });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Contraseña incorrecta');
  }

  return {
    user: {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
    }
  };
};

// ✅ Exportación ESM
export default User;
