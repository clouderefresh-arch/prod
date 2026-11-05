/**
 * Product. Студия снимает репортажные и рекламные рилс и собирает сайты.
 * Character. documentary, exact, physical
 * World. Тёмный каталог работ: карточка, дата, метка.
 * Moments. Сетка роликов и страниц, фильтр по услуге и сфере.
 * Signature. Зелёная метка на чёрной карточке.
 */
export const STUDIO_NAME = "Рама"
export const STUDIO_CITY = "Москва"
export const STUDIO_MAIL = "hello@rama.studio"
export const SLATE = "01:14:08"

export const SERVICES = ["Репортаж", "Рекламный рилс", "Сайт"] as const
export const SPHERES = ["Еда", "Событие", "Предмет", "Услуги", "Производство"] as const

export type Service = (typeof SERVICES)[number]
export type Sphere = (typeof SPHERES)[number]

export type Work = {
  id: string
  title: string
  date: string
  time: string
  service: Service
  sphere: Sphere
  kind: "video" | "site"
}

export const WORKS: Work[] = [
  { id: "open", title: "Репортаж с открытия", date: "12/04/2026", time: "00:18", service: "Репортаж", sphere: "Еда", kind: "video" },
  { id: "product", title: "Рилс одного предмета", date: "03/03/2026", time: "00:15", service: "Рекламный рилс", sphere: "Предмет", kind: "video" },
  { id: "hall", title: "Съёмка события", date: "21/02/2026", time: "00:24", service: "Репортаж", sphere: "Событие", kind: "video" },
  { id: "table", title: "Предмет на столе", date: "09/01/2026", time: "00:09", service: "Рекламный рилс", sphere: "Предмет", kind: "video" },
  { id: "bakery", title: "Сайт пекарни", date: "12/04/2026", time: "Страница", service: "Сайт", sphere: "Еда", kind: "site" },
  { id: "shop", title: "Витрина мастерской", date: "28/11/2025", time: "Страница", service: "Сайт", sphere: "Услуги", kind: "site" },
  { id: "plant", title: "Репортаж из цеха", date: "04/11/2025", time: "00:22", service: "Репортаж", sphere: "Производство", kind: "video" },
  { id: "catalog", title: "Страница каталога", date: "16/10/2025", time: "Страница", service: "Сайт", sphere: "Услуги", kind: "site" },
]

export function worksLabel(count: number) {
  const n10 = count % 10
  const n100 = count % 100
  const word = n10 === 1 && n100 !== 11 ? "работа" : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? "работы" : "работ"
  return `${count} ${word} найдено`
}
