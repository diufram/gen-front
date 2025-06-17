export default function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    res.locals.username = req.session.username;
    return next(); // Usuario autenticado
  } else {
    res.locals.username = null;
    res.redirect('/index-singin');
  }
}
