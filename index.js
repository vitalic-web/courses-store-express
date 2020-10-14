const express = require('express');
const path = require('path');
const csrf = require('csurf'); // защита юзера, генерация уникальных токенов, мидлвэр проверяет наличие токена при каждом запросе
const flash = require('connect-flash'); // место для хранения сообщений во время сессии, обычно показ ошибок при редиректе
const mongoose = require('mongoose');
const helmet = require('helmet'); // хэдеры для запросов, так же небольшая защита от атак
const compression = require('compression'); // сжатие статических файлов в приложении
const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);
const homeRoutes = require('./routes/home');
const addRoutes = require('./routes/add');
const coursesRoutes = require('./routes/courses');
const cardRoutes = require('./routes/card');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const varMiddleware = require('./middleware/variables');
const userMiddleware = require('./middleware/user');
const errorHandler = require('./middleware/error');
const fileMiddleware = require('./middleware/file');
const keys = require('./keys');

const app = express();
const PORT = process.env.PORT || 3000;

const hbs = exphbs.create({ // создание express-handlebars
  defaultLayout: 'main',
  extname: 'hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars), // добавил зависимость для доступа к данным через mongoose
  helpers: require('./utils/hbs-helpers')
})

const store = new MongoStore({
  collection: 'sessions',
  uri: keys.MONGODB_URI
})

app.engine('hbs', hbs.engine); // регистрируется движок express-handlebars и передается его значение
app.set('view engine', 'hbs'); // запуск/использование движка express-handlebars
app.set('views', 'views'); // указание папки, в которой будут храниться страницы

app.use(express.static(path.join(__dirname, 'public'))); // при подгрузке файлов с путем / нод ищет их в папке public
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.urlencoded({ extended: true }));
app.use(session({ // запуск сессии
  secret: keys.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store // сокращенно от store: store
}));
app.use(fileMiddleware.single('avatar')); // для загрузки одного файла, аргумент - поле, в которое загружается файл
app.use(csrf()); // добавить перед каждым пост-запросом инпут с данной переменной
app.use(flash());
app.use(helmet({
  contentSecurityPolicy: false // нужен параметр, т.к. начинает блокировать картинки и materialize
}));
app.use(compression());
app.use(varMiddleware);
app.use(userMiddleware);

app.use('/', homeRoutes);
app.use('/add', addRoutes);
app.use('/courses', coursesRoutes);
app.use('/card', cardRoutes);
app.use('/orders', ordersRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

app.use(errorHandler); // обработка ошибки 404

async function start() {
  try {
    await mongoose.connect(keys.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    })
  } catch (e) {
    console.log(e);
  }
}

start();

