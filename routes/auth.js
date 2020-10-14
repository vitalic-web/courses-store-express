const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const User = require('../models/user');
const keys = require('../keys');
const reqEmail = require('../emails/registration');
const resetEmail = require('../emails/reset');
const { registerValidators } = require('../utils/validators');
const router = Router();

const transporter = nodemailer.createTransport(sendgrid({
  auth: { api_key: keys.SENDGRID_API_KEY }
}));

router.get('/login', async (req, res) => {
  res.render('auth/login', {
    title: 'Авторизация',
    isLogin: true,
    loginError: req.flash('loginError'),
    registerError: req.flash('registerError')
  })
})

router.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login#login');
  });
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const candidate = await User.findOne({ email });

    if (candidate) {
      const areSame = await bcrypt.compare(password, candidate.password);

      if (areSame) {
        req.session.user = candidate;
        req.session.isAuthenticated = true;
        req.session.save(err => {
          if (err) {
            throw err;
          }
          res.redirect('/');
        })
      } else {
        req.flash('loginError', 'Неверный пароль');
        res.redirect('/auth/login#login');
      }
    } else {
      req.flash('loginError', 'Такого пользователя не существует');
      res.redirect('/auth/login#login');
    }
  } catch (e) {
    console.log(e);
  }
})

// регистрация пользователя
router.post('/register', registerValidators, async (req, res) => { // добавляем функцию-валидатор
  try {
    const { email, password, name } = req.body; // достаем данные из полей регистрации
    const errors = validationResult(req);

    if (!errors.isEmpty()) { // если true, то нет ошибок
      req.flash('registerError', errors.array()[0].msg); // приводим ошибки к массиву и забираем из [0] сообщение в св-ве msg
      return res.status(422).redirect('/auth/login#register');
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email, name, password: hashPassword, cart: { items: [] }
    });
    await user.save();

    await transporter.sendMail(reqEmail(email));
    res.redirect('/auth/login#login');
  } catch (e) {
    console.log(e);
  }
})

// сброс пароля
router.get('/reset', (req, res) => {
  res.render('auth/reset', {
    title: 'Забыли пароль?',
    error: req.flash('error')
  })
})

// проверка юзера при восстановлении пароля
router.get('/password/:token', async (req, res) => {
  if (!req.params.token) {
    return res.redirect('/auth/login')
  }

  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExp: { $gt: Date.now() } // gt это greater then, т.е. больше текущей даты (если меньше, то токен устарел)
    })

    if (!user) {
      return res.redirect('/auth/login')
    } else {
      res.render('auth/password', {
        title: 'Восстановить доступ',
        error: req.flash('error'),
        userId: user._id.toString(),
        token: req.params.token
      })
    }
  } catch (e) {
    console.log(e);
  }
})

// отправка данных для восстановления пароля
router.post('/reset', (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        req.flash('error', 'Что-то пошло не так, повторите попытку позже');
        return res.redirect('/auth/reset');
      }

      const token = buffer.toString('hex'); // результат приводим к строке в формате hex
      const candidate = await User.findOne({ email: req.body.email }); // ищем в базе совпадение по емейл

      if (candidate) {
        candidate.resetToken = token;
        candidate.resetTokenExp = Date.now() + 60 * 60 * 1000; // задаем время жизни токена 1 час
        await candidate.save(); // сохраняем данные в базу
        await transporter.sendMail(resetEmail(candidate.email, token)); // отправляем письмо
        res.redirect('/auth/login');
      } else {
        req.flash('error', 'Такого email нет')
        res.redirect('/auth/reset');
      }
    })
  } catch (e) {
    console.log(e);
  }
})

// создание нового пароля
router.post('/password', async (req, res) => {
  try {
    const user = await User.findOne({ // проверка данных юзера (csrf проверять не нужно, он проверяется автоматически)
      _id: req.body.userId, // проверка id
      resetToken: req.body.token, // проверка токена
      resetTokenExp: { $gt: Date.now() } // проверка действия токена
    })

    if (user) {
      user.password = await bcrypt.hash(req.body.password, 10); // шифруем новый введенный пароль
      user.resetToken = undefined; // удаляем данные временного токена для восстановления пароля
      user.resetTokenExp = undefined;
      await user.save(); // созраняем новые данные
      res.redirect('/auth/login'); // редирект на страницу логина
    } else {
      req.flash('loginError', 'Время жизни токена истекло');
      res.redirect('/auth/login');
    }
  } catch (e) {
    console.log(e);
  }
})

module.exports = router;