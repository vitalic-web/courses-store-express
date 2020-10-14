const { Router } = require('express');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const router = Router();

// метод для выгрузки нужных данных
function mapCartItems(cart) {
  return cart.items.map(c => ({
    ...c.courseId._doc,
    id: c.courseId.id,
    count: c.count
  }));
}

// функция расчета цены
function computePrice(courses) {
  return courses.reduce((total, course) => {
    return total += course.price * course.count; // считаем общую сумму курсов
  }, 0)
}

// добавление курса в корзину
router.post('/add', auth, async (req, res) => {
  const course = await Course.findById(req.body.id); // получаем курс по id
  await req.user.addToCart(course);
  res.redirect('/card'); // редирект на страницу корзины
})

// удаление курса из корзины
router.delete('/remove:id', auth, async (req, res) => {
  await req.user.removeFromCart(req.params.id) // params потому что id хранится в адресной строке

  const user = await req.user
    .populate('cart.items.courseId') // указывваем путь до курса в модели user
    .execPopulate();

  const courses = mapCartItems(user.cart);
  const cart = {
    courses, price: computePrice(courses)
  }

  res.status(200).json(cart); // возврат данных без удаленной карты для использования методом fetch (см. app.js)
                              // если не использовать .json(card), то ничего не вернется при запросе (fetch) на роут /remove:id
})

// страница корзины
router.get('/', auth, async (req, res) => {
  const user = await req.user
    .populate('cart.items.courseId') // указывваем путь до курса в модели user
    .execPopulate();

  const courses = mapCartItems(user.cart);

  res.render('card', {
    title: 'Корзина',
    isCard: true,
    courses: courses, // передаем данные чтобы использовать в card.hbs
    price: computePrice(courses)
  })

})

module.exports = router;