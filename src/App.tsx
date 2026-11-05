import { FormEvent, useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import { FramePair } from "./frame/FramePair"
import { SLATE, STUDIO_CITY, STUDIO_MAIL, STUDIO_NAME } from "./site"

const LINKS = [
  { href: "#shoot", label: "Съёмка" },
  { href: "#sites", label: "Сайты" },
  { href: "#order", label: "Порядок" },
]

export function App() {
  const [open, setOpen] = useState(false)
  const [letter, setLetter] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (menuRef.current) menuRef.current.inert = !open
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const task = String(data.get("task") ?? "").trim()
    const subject = encodeURIComponent(name ? `${STUDIO_NAME}, ${name}` : STUDIO_NAME)
    const body = encodeURIComponent(`${name}\n\n${task}`)
    setLetter(true)
    window.location.href = `mailto:${STUDIO_MAIL}?subject=${subject}&body=${body}`
  }

  return (
    <div className="page" id="top">
      <header className="nav-bar">
        <div className="wrap nav">
          <a className="logo" href="#top">
            {STUDIO_NAME}
          </a>
          <span className="slate">
            <span className="tally" aria-hidden="true" />
            <span className="slate-code">{SLATE}</span>
          </span>
          <nav className="nav-links" aria-label="Разделы">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <a className="btn btn-nav" href="#contact">
            Написать
          </a>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
            <span className="sr-only">{open ? "Закрыть меню" : "Меню"}</span>
          </button>
        </div>
        <div id="site-menu" ref={menuRef} className="menu" data-open={open || undefined} aria-hidden={open ? undefined : true}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <span className="slate menu-slate">
            <span className="tally" aria-hidden="true" />
            <span className="slate-code">{SLATE}</span>
          </span>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1>
                Снимаем рилс
                <br />и собираем сайты
              </h1>
              <p className="lede">
                Репортажная и рекламная съёмка вертикального кадра. Конструкция сайтов, на которых этот кадр остаётся.
              </p>
              <div className="hero-actions">
                <a className="btn" href="#contact">
                  Написать
                </a>
                <a className="text-link" href="#order">
                  Порядок работы
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <FramePair />
            </div>
          </div>
        </section>

        <section className="sheet" id="order" aria-labelledby="order-title">
          <div className="wrap">
            <h2 id="order-title">Порядок</h2>
            <ol>
              <li id="shoot">
                <span className="idx">01</span>
                <div>
                  <h3>Съёмка</h3>
                  <p>
                    Репортаж с места и рекламный рилс. Событие, цех, человек за работой, один предмет или одна сцена. На
                    выходе вертикальный ролик.
                  </p>
                </div>
              </li>
              <li id="sites">
                <span className="idx">02</span>
                <div>
                  <h3>Сайты</h3>
                  <p>Конструкция страницы: каркас, текст, шрифт, вёрстка. На выходе сайт, который открывается.</p>
                </div>
              </li>
              <li>
                <span className="idx">03</span>
                <div>
                  <h3>Вместе</h3>
                  <p>Кадр и страница про одно и то же. На первом экране рилс и сайт одного открытия.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div className="wrap contact-grid">
            <div>
              <h2 id="contact-title">Написать</h2>
              <p className="contact-lead">Коротко, что снимаем и какая страница нужна.</p>
              <p className="contact-mail">
                <a href={`mailto:${STUDIO_MAIL}`}>{STUDIO_MAIL}</a>
              </p>
            </div>
            <form className="form" onSubmit={onSubmit}>
              <label className="field">
                <span>Имя</span>
                <input name="name" type="text" autoComplete="name" required maxLength={80} />
              </label>
              <label className="field">
                <span>О задаче</span>
                <textarea name="task" required maxLength={2000} rows={5} />
              </label>
              <button className="btn" type="submit">
                Отправить
              </button>
              {letter ? (
                <p className="form-note" role="status">
                  Открываем письмо в почте. Если окно не появилось, адрес выше.
                </p>
              ) : null}
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-row">
          <span>
            {STUDIO_NAME}, {STUDIO_CITY}
          </span>
          <span className="slate">
            <span className="tally" aria-hidden="true" />
            <span className="slate-code">{SLATE}</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
