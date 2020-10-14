const { Router } = require('express');
const { validationResult } = require('express-validator');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const { courseValidators } = require('../utils/validators');
const router = Router();

router.get('/', auth, (req, res) => {
  res.status(200)
  res.render('add', {
    title: 'Добавить курс',
    isAdd: true
  });
})

// метод отправки данных
router.post('/', auth, courseValidators, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('add', {
      title: 'Добавить курс',
      isAdd: true,
      error: errors.array()[0].msg,
      data: {                  // передаем ранее введенные данные, чтобы при ошибке поля формы не стирались
        title: req.body.title,
        price: req.body.price,
        img: req.body.img
      }
    })
  }

  const course = new Course({
    title: req.body.title,
    price: req.body.price,
    img: req.body.img,
    userId: req.user
  });

  try {
    await course.save() // добавление введенных данных в БД
    res.redirect('./courses') // после успешного добавления редирект на страницу с курсами
  } catch (e) {
    console.log(e);
  }
})

module.exports = router;