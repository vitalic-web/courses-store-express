const { body } = require('express-validator');
const User = require('../models/user');

exports.registerValidators = [
  body('email')
    .isEmail().withMessage('Введите корректный email')
    .custom(async (value, { req }) => {
      try {
        const user = await User.findOne({ email: value }); // проверка на email
        if (user) {
          return Promise.reject('Такой email уже используется');
        }
      } catch (e) {
        console.log(e);
      }
    })
    .normalizeEmail(), // санитайзер, который приводит емейл к нормальному виду
  body('password', 'Пароль должен быть минимум 6 символов')
    .isLength({ min: 6, max: 56 })
    .isAlphanumeric()
    .trim(), // санитайзер, который удаляет лишние пробелы
  body('confirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Пароли должны совпадать')
      }
      return true;
    })
    .trim(),
  body('name')
    .isLength({ min: 3 }).withMessage('Имя должно быть минимум 3 символа')
    .trim()
]

exports.courseValidators = [
  body('title').isLength({ min: 3 }).withMessage('Минимальная длина названия 3 символа').trim(),
  body('price').isNumeric().withMessage('Введите корректную цену'),
  body('img', 'Введите корректный url изображения').isURL()
]