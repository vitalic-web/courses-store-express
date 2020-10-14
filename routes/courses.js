const { Router } = require('express');
const { validationResult } = require('express-validator');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const {courseValidators} = require('../utils/validators')
const router = Router();

function isOwner(course, req) {
  return course.userId.toString() === req.user._id.toString();
}

// выгрузка добавленных курсов на сраницу
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('userId', 'email name') // выбор параметров в привязанном юзере
      .select('price title img'); // выбор параметров для отображения

    res.status(200)
    res.render('courses', {
      title: 'Курсы',
      isCourses: true,
      userId: req.user ? req.user._id.toString() : null,
      courses
    });
  } catch (e) {
    console.log(e);
  }
})

// редактировать курс
router.get('/:id/edit', auth, async (req, res) => {
  if (!req.query.allow) {
    return res.redirect('/');
  }

  try {
    const course = await Course.findById(req.params.id); // поиск по id в БД

    if (!isOwner(course, req)) { // защита от возможности редактирования курса
      return res.redirect('/courses')
    }

    res.render('course-edit', {
      title: `Редактировать ${course.title}`,
      course
    })
  } catch (e) {
    console.log(e);
  }
})

// обработка отправки отредактированного курса
router.post('/edit', auth, courseValidators, async (req, res) => {
  const errors = validationResult(req);
  const { id } = req.body; // забираем id

  if (!errors.isEmpty()) {
    return res.status(422).redirect(`/courses/${id}/edit?allow=true`)
  }

  try {
    delete req.body.id; // удаляем id чтобы использовать объект без id во втором параметре findByIdAndUpdate

    const course = await Course.findById(id);

    if (!isOwner(course, req)) { // защита от сохранения редактирования
      return res.redirect('/courses');
    }
    Object.assign(course, req.body) // копирует в course свойства req.body
    await course.save();
    res.redirect('/courses');
  } catch (e) {
    console.log(e);
  }
})

// удаление курса
router.post('/remove', auth, async (req, res) => {
  try {
    await Course.deleteOne({
      _id: req.body.id,
      userId: req.user._id
    })
    res.redirect('/courses');
  } catch (e) {
    console.log(e);
  }
})

// открыть курс
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id); // :id хранится в req.params.id

    res.status(200)
    res.render('course', {
      layout: 'empty',
      title: `Курс ${course.title}`,
      course
    });
  } catch (e) {
    console.log(e);
  }
})

module.exports = router;