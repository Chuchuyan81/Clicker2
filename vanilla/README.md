# Asteroid Logistics — Vanilla JS

Версия на чистом HTML + CSS + JavaScript без Canvas, React и сборщиков.

## Запуск

**Через Vite** (если проект уже на Vite):
```
npm run dev
```
Откройте: http://localhost:5173/vanilla/

**Через статический сервер** (без сборщиков):
```
npx serve .
```
Откройте: http://localhost:3000/vanilla/

## Структура

- `game.js` — AssetLoader, Base, Drone, Asteroid, игровой цикл
- `styles.css` — стили
- `index.html` — разметка

Ассеты: `/assets/base/`, `/assets/drones/`, `/assets/environment/`

При отсутствии PNG-файлов используются CSS-заглушки.
