import { FormEvent, useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import { REELS, SITES, STUDIO_CITY, STUDIO_MAIL, STUDIO_NAME, WIDES, type Piece } from "./site"

const LINKS = [
  { href: "#video", label: "Съёмка" },
  { href: "#sites", label: "Сайты" },
]

export function App() {
  const [open, setOpen] = useState(false)
  const [letter, setLetter] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const taskRef = useRef<HTMLTextAreaElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) video.pause()
  }, [])

  function choose(piece: Piece) {
    if (taskRef.current) taskRef.current.value = `Интересует формат: ${piece.title}`
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
        <section className="hero" aria-label="Шоурил">
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            poster="/showreel.jpg"
          >
            <source src="/showreel.mp4" type="video/mp4" />
          </video>
          <div className="hero-shade" />
          <div className="hero-center">
            <Logo />
            <p className="hero-line">Видео и сайты</p>
          </div>
          <p className="hero-note">Шоурил</p>
        </section>

        <section className="block" id="video" aria-labelledby="video-title">
          <div className="wrap">
            <h2 id="video-title">Видеосъёмка</h2>
            <p className="lede">
              Репортаж и реклама с места. Вертикальный рилс для ленты и горизонтальный ролик для сайта и большого экрана.
            </p>
            <h3 className="subhead">Рилсы</h3>
            <div className="reel-grid">
              {REELS.map((piece) => (
                <PieceCard key={piece.id} piece={piece} shape="reel" tag="Рилс" onChoose={choose} />
              ))}
            </div>
            <h3 className="subhead">Горизонтальные</h3>
            <div className="wide-grid">
              {WIDES.map((piece) => (
                <PieceCard key={piece.id} piece={piece} shape="wide" tag="16:9" onChoose={choose} />
              ))}
            </div>
          </div>
        </section>

        <section className="block" id="sites" aria-labelledby="sites-title">
          <div className="wrap">
            <h2 id="sites-title">Разработка сайтов</h2>
            <p className="lede">Собираем страницу под снятый кадр. Каркас, текст и вёрстка. Сайт открывается сразу.</p>
            <div className="wide-grid site-grid">
              {SITES.map((piece) => (
                <PieceCard key={piece.id} piece={piece} shape="wide" tag="Сайт" onChoose={choose} />
              ))}
            </div>
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

function PieceCard({
  piece,
  shape,
  tag,
  onChoose,
}: {
  piece: Piece
  shape: "reel" | "wide"
  tag: string
  onChoose: (piece: Piece) => void
}) {
  return (
    <article className="piece">
      <a
        className={`work work-${shape}`}
        href="#contact"
        onClick={(event) => {
          event.preventDefault()
          onChoose(piece)
        }}
      >
        <span className={`still still-${piece.still}`} aria-hidden="true" />
        <span className="work-shade" aria-hidden="true" />
        <span className="work-bottom">
          <span>
            <span className="work-name">{piece.title}</span>
            <span className="work-time">{piece.time}</span>
          </span>
          <span className="work-tag">{tag}</span>
        </span>
      </a>
      <p className="piece-text">{piece.text}</p>
    </article>
  )
}

function Logo() {
  return (
    <svg className="mark" viewBox="0 0 360 148" role="img" aria-label="Рама">
      <rect x="1.5" y="1.5" width="357" height="145" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="12" y="12" width="336" height="124" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.55" />
      <rect x="170" width="20" height="3" fill="#8ad34e" />
      <text fill="currentColor" fontFamily="Manrope, sans-serif" fontSize="52" fontWeight="600">
        <tspan x="108" y="90" textAnchor="middle">
          Р
        </tspan>
        <tspan x="156" y="90" textAnchor="middle">
          А
        </tspan>
        <tspan x="204" y="90" textAnchor="middle">
          М
        </tspan>
        <tspan x="252" y="90" textAnchor="middle">
          А
        </tspan>
      </text>
    </svg>
  )
}
