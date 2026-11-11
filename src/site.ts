/**
 * Product. Студия снимает репортажные и рекламные рилс и собирает сайты.
 * Character. documentary, exact, physical
 * World. Первый экран — шоурил, дальше два раздела: кадр и страница.
 * Moments. Логотип в центре видео, рилсы рядом с горизонтальными роликами.
 * Signature. Двойная рама вокруг слова РАМА.
 */
export const STUDIO_NAME = "Рама"
export const STUDIO_CITY = "Москва"
export const STUDIO_MAIL = "hello@studio-rama.ru"
export const STUDIO_PHONE = "+79520193841"
export const STUDIO_PHONE_LABEL = "+7 952 019-38-41"
export const STUDIO_TELEGRAM = "Suhr_LL"

export type Piece = {
  id: string
  title: string
  time: string
  text: string
  still: string
  video?: string
  poster?: string
}

export const REELS: Piece[] = [
  {
    id: "timati",
    title: "Тимати",
    time: "00:07",
    text: "",
    still: "open",
    video: "timati-reel.mp4",
    poster: "timati-reel.jpg",
  },
  {
    id: "danke",
    title: "Данке",
    time: "00:12",
    text: "",
    still: "product",
    video: "timati-danke.mp4",
    poster: "timati-danke.jpg",
  },
  {
    id: "fashion",
    title: "Фэшн",
    time: "00:16",
    text: "",
    still: "hall",
    video: "fashion-mgl.mp4",
    poster: "fashion-mgl.jpg",
  },
  {
    id: "dod",
    title: "DOD",
    time: "00:11",
    text: "",
    still: "plant",
    video: "dod.mp4",
    poster: "dod.jpg",
  },
]

export const WIDES: Piece[] = [
  {
    id: "gorizont-1",
    title: "Горизонт 1",
    time: "00:11",
    text: "",
    still: "table",
    video: "gorizont-1.mp4",
    poster: "gorizont-1.jpg",
  },
  {
    id: "gorizont-2",
    title: "Горизонт 2",
    time: "00:08",
    text: "",
    still: "room",
    video: "gorizont-2.mp4",
    poster: "gorizont-2.jpg",
  },
]

export const SITES: Piece[] = [
  {
    id: "ptk",
    title: "ПТК",
    time: "Сервис",
    text: "",
    still: "shop",
    poster: "site-ptk.jpg",
  },
  {
    id: "jurist",
    title: "Юрист",
    time: "Лендинг",
    text: "",
    still: "bakery",
    poster: "site-jurist.jpg",
  },
]
