const multer = require('multer'); // миддлвер для работы с файлами

const storage = multer.diskStorage({
  destination(req, file, cb) { // куда сохранять загружаемый файл
    cb(null, 'images') // первый параметр ошибка, второй - путь для файла
  },
  filename(req, file, cb) { // как назвать загружаемый файл
    cb(null, new Date().toISOString().replace(/:/gi,'-') + '-' + file.originalname) // убрать из имени двоеточие
  }
});

const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']; // mime-types загружаемых файлов

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

module.exports = multer({
  storage,     // деструктуризация storage: storage
  fileFilter   // деструктуризация fileFilter: fileFilter
})