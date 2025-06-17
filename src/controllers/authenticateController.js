import User from '../models/userModel.js';

export async function indexSingin(req, res) {
  res.render('singin', {
    title: 'Iniciar Sesión',
    layout: 'layouts/singin',
    message: '',
    showErrorModal: false,
  });
}

export async function indexSingup(req, res) {
  res.render('singup', {
    title: 'Regístrate',
    layout: 'layouts/singup',
  });
}

export async function singin(req, res) {
  try {
    const { email, password } = req.body;

    const { user } = await User.authenticateUser(email, password);

    if (!user) {
      throw new Error('Usuario no encontrado o contraseña incorrecta');
    }

    req.session.userId = user.id;
    req.session.username = user.nombre;

    req.session.save((err) => {
      if (err) {
        console.error('Error al guardar la sesión:', err);
        return res.render('singin', {
          showErrorModal: true,
          message: 'Error al guardar la sesión',
          email: req.body.email,
          layout: 'layouts/singin',
        });
      }
      res.redirect('/index-sala');
    });
  } catch (error) {
    console.log('Error detectado:', error.message);
    res.render('singin', {
      showErrorModal: true,
      message: error.message,
      email: req.body.email,
      layout: 'layouts/singin',
    });
  }
}

export async function singup(req, res) {
  try {
    const { name, email, password } = req.body;

    const newUser = await User.createUser(name, email, password);

    if (newUser) {
      req.session.userId = newUser.id;
      req.session.username = newUser.name;

      req.session.save((err) => {
        if (err) {
          console.error('Error al guardar la sesión:', err);
          return res.render('singup', {
            showErrorModal: true,
            message: 'Error al guardar la sesión',
            email: req.body.email,
            layout: 'layouts/singup',
          });
        }

        res.redirect('/index-sala');
      });
    }
  } catch (error) {
    console.error('Error en el registro:', error);
    res.render('singup', {
      showErrorModal: true,
      message: error.message,
      email: req.body.email,
      layout: 'layouts/singup',
    });
  }
}

export async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar la sesión:', err);
      return res.status(500).send('Error al cerrar la sesión');
    }
    res.clearCookie('connect.sid');
    res.redirect('/index-singin');
  });
}
