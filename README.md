# amo

Набор интеграций AMO

Лежат на сервере 94.228.113.92 в в папке /var/www/html

База данных находится на том же сервере

Исходники от виджета подсказок лежат в папке /dadata/src

Перед сборкой виджета необходимо поменять пути в файлах manifest.json и script.js, нужные места находятся поиском по слову foobar

amo-integration-1 - когда менеджер в АМО что-то делает, эта интеграция добавляет что-то в ленту АМО

amo_all_2_db - Все сущности АМО в одну базу

amo_all_2_db_events - Загрузка только events, потому что это таблица самая большая, на неё отдельные лимиты

amo_widget_affiliates - аффилированные компании. Для развёртывания на другой компании, скорее всего потребуется помощь Дмитрия. Возможно, устанавливается через AMO API.

dadata - автоподсказка

## Интегратор AMOKIT

лежит в папке /amokit

для установки на сайт разместите его у корневую папку сайта и перенаправьте отправку всех форм сайта на адрес https://ваш_сайт/amokit/send.php,

также нужно проследить чтобы на каждой странице сайта подключался файл /amokit/utm_cookie.min.js

это делается прописыванием тега 

```html
<script src="https://ваш_сайт/amokit/utm_cookie.min.js"></script>
```
в подвале или шапке сайта
