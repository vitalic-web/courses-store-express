const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => {
  res.status(200)
  res.render('index', { // папку и расширение файла указали в index.js
    title: 'Главная страница',
    isHome: true
  })
})

module.exports = router;