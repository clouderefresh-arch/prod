import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import { SERVICES, SPHERES, STUDIO_CITY, STUDIO_MAIL, STUDIO_NAME, WORKS, worksLabel, type Service, type Sphere, type Work } from "./site"

const LINKS = [
  { href: "#works", label: "Портфолио" },
  { href: "#order", label: "Порядок" },
]

export function App() {
  const [open, setOpen] = useState(false)
  const [letter, setLetter] = useState(false)
  const [query, setQuery] = useState("")
  const [service, setService] = useState<Service | "">("")
  const [sphere, setSphere] = useState<Sphere | "">("")
  const menuRef = useRef<HTMLDivElement>(null)
  const taskRef = useRef<HTMLTextAreaElement>(null)

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

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return WORKS.filter((work) => {
      if (service && work.service !== service) return false
      if (sphere && work.sphere !== sphere) return false
      if (!q) return true
      return `${work.title} ${work.service} ${work.sphere}`.toLowerCase().includes(q)
    })
  }, [query, service, sphere])

  function choose(work: Work) {
    if (taskRef.current) taskRef.current.value = `Интересует формат: ${work.title}`
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })
    taskRef.current?.focus()
  }

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
          <nav className="nav-links" aria-label="Разделы">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <a className="nav-mail" href={`mailto:${STUDIO_MAIL}`}>
            {STUDIO_MAIL}
          </a>
          <a className="btn btn-nav" href="#contact">
            Оставить заявку
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
          <a href="#contact" onClick={() => setOpen(false)}>
            Оставить заявку
          </a>
        </div>
      </header>

      <main>
        <section className="works" id="works" aria-labelledby="works-title">
          <div className="wrap">
            <h1 id="works-title">Работы</h1>
            <p className="lede">Репортажные и рекламные рилс, и сайты, на которых этот кадр остаётся.</p>
            <label className="search">
              <SearchIcon />
              <input
                type="search"
                placeholder="Поиск"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Поиск"
              />
            </label>
            <p className="works-count" aria-live="polite">
              {worksLabel(shown.length)}
            </p>
            <div className="filters">
              <div>
                <p className="filters-label">По услугам</p>
                <div className="filters-line" role="group" aria-label="По услугам">
                  {SERVICES.map((name, index) => (
                    <span key={name}>
                      {index > 0 ? <span className="slash">/</span> : null}
                      <button type="button" aria-pressed={service === name} onClick={() => setService(service === name ? "" : name)}>
                        {name}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="filters-label">По сферам</p>
                <div className="filters-line" role="group" aria-label="По сферам">
                  {SPHERES.map((name, index) => (
                    <span key={name}>
                      {index > 0 ? <span className="slash">/</span> : null}
                      <button type="button" aria-pressed={sphere === name} onClick={() => setSphere(sphere === name ? "" : name)}>
                        {name}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="works-grid">
              {shown.map((work) => (
                <a
                  key={work.id}
                  className="work"
                  href="#contact"
                  onClick={(event) => {
                    event.preventDefault()
                    choose(work)
                  }}
                >
                  <span className={`still still-${work.id}`} aria-hidden="true" />
                  <span className="work-shade" aria-hidden="true" />
                  <span className="work-date">{work.date}</span>
                  <span className="work-bottom">
                    <span>
                      <span className="work-name">{work.title}</span>
                      <span className="work-time">{work.time}</span>
                    </span>
                    <span className="work-tags">
                      <span className="work-tag">{work.service}</span>
                      <span className="work-tag">{work.sphere}</span>
                    </span>
                  </span>
                  <span className="work-hover" aria-hidden="true">
                    <span className="work-hover-name">{work.title}</span>
                    <span className="work-hover-time">{work.time}</span>
                    <span className="work-more">Подробнее</span>
                  </span>
                </a>
              ))}
            </div>
            {shown.length === 0 ? <p className="works-empty">Ничего не нашлось. Снимите фильтр или измените запрос.</p> : null}
          </div>
        </section>

        <section className="sheet" id="order" aria-labelledby="order-title">
          <div className="wrap">
            <h2 id="order-title">Порядок</h2>
            <ol>
              <li>
                <span className="idx">01</span>
                <div>
                  <h3>Съёмка</h3>
                  <p>Репортаж с места и рекламный рилс. На выходе вертикальный ролик.</p>
                </div>
              </li>
              <li>
                <span className="idx">02</span>
                <div>
                  <h3>Сайт</h3>
                  <p>Каркас, текст и вёрстка страницы, на которой остаётся этот кадр.</p>
                </div>
              </li>
              <li>
                <span className="idx">03</span>
                <div>
                  <h3>Вместе</h3>
                  <p>Ролик и страница про одно и то же. Сначала кадр, потом место, где он живёт.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div className="wrap contact-grid">
            <div>
              <h2 id="contact-title">Заявка</h2>
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
                <textarea ref={taskRef} name="task" required maxLength={2000} rows={5} />
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
          <a href={`mailto:${STUDIO_MAIL}`}>{STUDIO_MAIL}</a>
        </div>
      </footer>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
