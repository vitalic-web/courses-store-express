const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  name: String,
  password: {
    type: String,
    required: true
  },
  avatarUrl: String,
  resetToken: String,
  resetTokenExp: Date,
  cart: {
    items: [
      {
        count: {
          type: Number,
          required: true,
          default: 1
        },
        courseId: {
          type: Schema.Types.ObjectId,
          ref: 'Course',
          required: true
        }
      }
    ]
  }
})

// метод добавления курсов в корзину
userSchema.methods.addToCart = function(course) {
  const items = [...this.cart.items]; // создаем копию массива
  const idx = items.findIndex(c => { // ищем индекс текущего курса
    return c.courseId.toString() === course._id.toString()  // toString() для сравнения с строками, т.к. у courseId тип Schema.Types.ObjectId
  })

  if (idx >= 0) { // если курс не найдется, то idx = -1
    items[idx].count += 1;
  } else {
    items.push({
      courseId: course._id,
      count: 1
    })
  }

  this.cart = {items}; // деструктуризация {items: items}
  return this.save(); // записывает данные в базу
}

userSchema.methods.removeFromCart = function(id) {
  let items = [...this.cart.items];
  const idx = items.findIndex(c => c.courseId.toString() === id.toString());

  if (items[idx].count === 1) {
    items = items.filter(c => c.courseId.toString() !== id.toString()); // удаление из масссива курса
  } else {
    items[idx].count--;
  }

  this.cart = {items};
  return this.save();
}

userSchema.methods.clearCart = function() {
  this.cart = {items: []};
  return this.save();
}

module.exports = model('User', userSchema);