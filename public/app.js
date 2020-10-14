// функция преобразования валюты
const toCurrency = price => {
  return new Intl.NumberFormat('ru-RU', {
    currency: 'rub',
    style: 'currency'
  }).format(price);
}

// функция преобразования даты
const toDate = date => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

// преобразование вида валюты на странице
document.querySelectorAll('.price').forEach(node => {
  node.textContent = toCurrency(node.textContent);
})

// преобразование вида даты на странице
document.querySelectorAll('.date').forEach(node => {
  node.textContent = toDate(node.textContent);
})

// удаление товара из корзины
const $card = document.querySelector('#card');

if ($card) {
  $card.addEventListener('click', event => {
    if (event.target.classList.contains('js-remove')) {
      const id = event.target.dataset.id; // переменная с id элемента, по которому кликнули
      const csrf = event.target.dataset.csrf;

      fetch('/card/remove' + id, { // идет обращение к адресу '/remove:id', который описан в routes
        method: 'delete',
        headers: {
          'X-XSRF-TOKEN': csrf
        }
      }).then(res => res.json()) // преобразует результат ответа в json
        .then(card => {
          if (card.courses.length) {
            const htmlUpd = card.courses.map(c => { // обновленная html разметка
              return `
                <tr>
                  <td>${c.title}</td>
                  <td>${c.count}</td>
                  <td>
                    <button class="btn btn-small js-remove" data-id="${c.id}">Удалить</button>
                  </td>
                </tr>
              `
            }).join(''); // приводим массив к строке
            $card.querySelector('tbody').innerHTML = htmlUpd; // заменяем содержимое страницы на полученный html
            $card.querySelector('.price').textContent = toCurrency(card.price); // обновляем цену
          } else {
            $card.innerHTML = '<p>Корзина пуста</p>'
          }
        })
    }
  })
}

M.Tabs.init(document.querySelectorAll('.tabs'));