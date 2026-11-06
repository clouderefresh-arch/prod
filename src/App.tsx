import { useEffect, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import {
  REELS,
  SITES,
  STUDIO_CITY,
  STUDIO_MAIL,
  STUDIO_NAME,
  STUDIO_PHONE,
  STUDIO_PHONE_LABEL,
  STUDIO_TELEGRAM,
  WIDES,
  type Piece,
} from "./site"

const LINKS = [
  { href: "#video", label: "Съёмка" },
  { href: "#sites", label: "Сайты" },
]

export function App() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
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
          <div className="nav-contacts">
            <a className="nav-mail" href={`mailto:${STUDIO_MAIL}`}>
              {STUDIO_MAIL}
            </a>
            <a className="nav-mail" href={`tel:${STUDIO_PHONE}`}>
              {STUDIO_PHONE_LABEL}
            </a>
            <a className="btn btn-nav" href={`https://t.me/${STUDIO_TELEGRAM}`} target="_blank" rel="noreferrer">
              Telegram
            </a>
          </div>
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
          <a className="plain" href={`mailto:${STUDIO_MAIL}`} onClick={() => setOpen(false)}>
            {STUDIO_MAIL}
          </a>
          <a className="plain" href={`tel:${STUDIO_PHONE}`} onClick={() => setOpen(false)}>
            {STUDIO_PHONE_LABEL}
          </a>
          <a className="plain" href={`https://t.me/${STUDIO_TELEGRAM}`} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            @{STUDIO_TELEGRAM}
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
            <img className="mark" src="/logo.png" alt="Рама" />
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
                <PieceCard key={piece.id} piece={piece} shape="reel" tag="Рилс" />
              ))}
            </div>
            <h3 className="subhead">Горизонтальные</h3>
            <div className="wide-grid">
              {WIDES.map((piece) => (
                <PieceCard key={piece.id} piece={piece} shape="wide" tag="16:9" />
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
                <PieceCard key={piece.id} piece={piece} shape="wide" tag="Сайт" />
              ))}
            </div>
          </div>
        </section>

        <section className="reach" id="reach" aria-labelledby="reach-title">
          <div className="wrap">
            <h2 id="reach-title">Связаться</h2>
            <div className="reach-row">
              <a href={`mailto:${STUDIO_MAIL}`}>{STUDIO_MAIL}</a>
              <a href={`tel:${STUDIO_PHONE}`}>{STUDIO_PHONE_LABEL}</a>
              <a className="btn" href={`https://t.me/${STUDIO_TELEGRAM}`} target="_blank" rel="noreferrer">
                Telegram
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-row">
          <span>
            {STUDIO_NAME}, {STUDIO_CITY}
          </span>
          <span className="footer-links">
            <a href={`mailto:${STUDIO_MAIL}`}>{STUDIO_MAIL}</a>
            <a href={`tel:${STUDIO_PHONE}`}>{STUDIO_PHONE_LABEL}</a>
            <a href={`https://t.me/${STUDIO_TELEGRAM}`} target="_blank" rel="noreferrer">
              @{STUDIO_TELEGRAM}
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}

function PieceCard({ piece, shape, tag }: { piece: Piece; shape: "reel" | "wide"; tag: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    function stop(event: Event) {
      if ((event as CustomEvent<string>).detail === piece.id) return
      const node = videoRef.current
      if (!node) return
      node.pause()
      node.controls = false
      setPlaying(false)
    }
    window.addEventListener("rama-reel", stop)
    return () => window.removeEventListener("rama-reel", stop)
  }, [piece.id])

  function play() {
    const node = videoRef.current
    if (!node) return
    window.dispatchEvent(new CustomEvent("rama-reel", { detail: piece.id }))
    setPlaying(true)
    node.controls = true
    void node.play()
  }

  return (
    <article className="piece">
      <div className={`work work-${shape}${playing ? " is-playing" : ""}`}>
        {piece.video ? (
          <video
            ref={videoRef}
            className="reel-video"
            src={`/${piece.video}`}
            poster={piece.poster ? `/${piece.poster}` : undefined}
            playsInline
            preload="metadata"
            onEnded={() => setPlaying(false)}
          />
        ) : (
          <span className={`still still-${piece.still}`} aria-hidden="true" />
        )}
        <span className="work-shade" aria-hidden="true" />
        <span className="work-bottom">
          <span>
            <span className="work-name">{piece.title}</span>
            <span className="work-time">{piece.time}</span>
          </span>
          <span className="work-tag">{tag}</span>
        </span>
        {piece.video && !playing ? (
          <button className="play-btn" type="button" onClick={play} aria-label={`Смотреть: ${piece.title}`}>
            <PlayIcon />
          </button>
        ) : null}
      </div>
      <p className="piece-text">{piece.text}</p>
    </article>
  )
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M5 3.5v11l9-5.5-9-5.5z" fill="currentColor" />
    </svg>
  )
}

