const {Schema, model} = require('mongoose');

// создаем модель, поля id нет, т.к. mongoose добавляет его по умолчанию при создании модели
const courseSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  img: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// courseSchema.method('toClient', function() {
//   const course = this.toObject(); // получаем объект данного курса
//
//   course.id = course._id; // заменяем id на _id
//   delete course._id; // удаляем лишние поля _id
//
//   return course;
// })

module.exports = model('Course', courseSchema);