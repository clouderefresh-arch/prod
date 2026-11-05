/**
 * Product. Студия снимает репортажные и рекламные рилс и собирает сайты.
 * Character. documentary, exact, physical
 * World. Первый экран — шоурил, дальше два раздела: кадр и страница.
 * Moments. Логотип в центре видео, рилсы рядом с горизонтальными роликами.
 * Signature. Двойная рама вокруг слова РАМА.
 */
export const STUDIO_NAME = "Рама"
export const STUDIO_CITY = "Москва"
export const STUDIO_MAIL = "hello@rama.studio"
export const STUDIO_PHONE = "+79520193841"
export const STUDIO_PHONE_LABEL = "+7 952 019-38-41"
export const STUDIO_TELEGRAM = "Suhr_LL"

export type Piece = {
  id: string
  title: string
  time: string
  text: string
  still: string
}

export const REELS: Piece[] = [
  {
    id: "open",
    title: "Открытие",
    time: "00:18",
    text: "Вертикальный репортаж первого часа: люди, свет, вывеска.",
    still: "open",
  },
  {
    id: "product",
    title: "Один предмет",
    time: "00:15",
    text: "Рекламный рилс. В кадре один предмет, без лишних планов.",
    still: "product",
  },
  {
    id: "hall",
    title: "Событие",
    time: "00:24",
    text: "Короткий репортаж из зала: гости, речь, общий шум.",
    still: "hall",
  },
  {
    id: "plant",
    title: "Цех",
    time: "00:22",
    text: "Руки и станок. Рабочий кадр, без постановочной улыбки.",
    still: "plant",
  },
]

export const WIDES: Piece[] = [
  {
    id: "table",
    title: "Предмет на столе",
    time: "00:09",
    text: "Широкий план для шапки сайта: предмет, стол, тихий свет.",
    still: "table",
  },
  {
    id: "room",
    title: "Зал целиком",
    time: "00:36",
    text: "Горизонтальный общий план события, для экрана и страницы.",
    still: "room",
  },
  {
    id: "line",
    title: "Линия цеха",
    time: "00:41",
    text: "Пространство и люди в одном кадре. Для презентации.",
    still: "line",
  },
]

export const SITES: Piece[] = [
  {
    id: "bakery",
    title: "Пекарня",
    time: "Одна страница",
    text: "Адрес, часы и кадр с открытия на первом экране.",
    still: "bakery",
  },
  {
    id: "shop",
    title: "Мастерская",
    time: "Витрина",
    text: "Список работ и ссылка, чтобы сразу написать.",
    still: "shop",
  },
  {
    id: "catalog",
    title: "Каталог",
    time: "Сетка",
    text: "Ролики и страницы в одной сетке, без лишних разделов.",
    still: "catalog",
  },
]
