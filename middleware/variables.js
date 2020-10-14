// добавляем данные, которые будут возвращаться в каждом ответе в шаблон
module.exports = function(req, res, next) {
  res.locals.isAuth = req.session.isAuthenticated;
  res.locals.csrf = req.csrfToken();
  next();
}