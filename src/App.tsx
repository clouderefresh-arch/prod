import { useEffect, useRef, useState } from "react"
import {
  REELS,
  SITES,
  STUDIO_CITY,
  STUDIO_MAIL,
  STUDIO_NAME,
  STUDIO_TELEGRAM,
  WIDES,
  type Piece,
} from "./site"

export function App() {
  const [extraReels, setExtraReels] = useState<Piece[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) video.pause()
  }, [])

  useEffect(() => {
    fetch("/reels.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((items: { id?: string; title?: string; time?: string; file?: string; poster?: string }[]) => {
        if (!Array.isArray(items)) return
        const known = new Set(REELS.map((piece) => piece.video))
        setExtraReels(
          items
            .filter((item) => item.file && !known.has(item.file))
            .map((item) => ({
              id: item.id || item.file || "reel",
              title: item.title || item.file || "Рилс",
              time: item.time || "",
              text: "",
              still: "open",
              video: item.file,
              poster: item.poster,
            })),
        )
      })
      .catch(() => {})
  }, [])

  return (
    <div className="page" id="top">
      <header className="nav-bar">
        <div className="wrap nav">
          <div className="nav-contacts">
            <a className="nav-mail" href={`mailto:${STUDIO_MAIL}`}>
              {STUDIO_MAIL}
            </a>
            <CallButton />
            <a className="btn btn-nav" href={`https://t.me/${STUDIO_TELEGRAM}`} target="_blank" rel="noreferrer">
              Связаться
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" aria-label="Рама">
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
            <p className="hero-line">Разработка сайтов, видеопроизводство и создание визуального контента для брендов и компаний.</p>
          </div>
        </section>

        <section className="block" id="video" aria-labelledby="video-title">
          <div className="wrap">
            <h2 id="video-title">Видеосъёмка</h2>
            <p className="lede">
              Снимаем рекламные ролики, репортажи и вертикальные Reels для социальных сетей — от идеи и съёмки до готового монтажа.
            </p>
            <h3 className="subhead">Вертикальные</h3>
            <div className="reel-grid">
              {[...REELS, ...extraReels].map((piece) => (
                <PieceCard key={piece.id} piece={piece} shape="reel" tag="Рилс" />
              ))}
            </div>
            <h3 className="subhead">Горизонтальные</h3>
            <p className="lede">Создаём видео, которые передают атмосферу, эмоции и характер бренда.</p>
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
              <CallButton />
              <a className="btn btn-nav" href={`https://t.me/${STUDIO_TELEGRAM}`} target="_blank" rel="noreferrer">
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
            <CallButton />
            <a href={`https://t.me/${STUDIO_TELEGRAM}`} target="_blank" rel="noreferrer">
              @{STUDIO_TELEGRAM}
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}

function CallButton() {
  const [shown, setShown] = useState(false)
  if (!shown) {
    return (
      <button type="button" className="btn btn-nav" onClick={() => setShown(true)}>
        Позвонить
      </button>
    )
  }
  const parts = ["952", "019", "38", "41"]
  return (
    <a className="nav-mail" href={`tel:+7${parts.join("")}`}>
      {`+7 ${parts[0]} ${parts[1]}-${parts[2]}-${parts[3]}`}
    </a>
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
        ) : piece.poster ? (
          <img className="site-shot" src={`/${piece.poster}`} alt={piece.title} />
        ) : (
          <span className={`still still-${piece.still}`} aria-hidden="true" />
        )}
        <span className="work-shade" aria-hidden="true" />
        <span className="work-bottom">
          <span>
            {piece.video ? null : <span className="work-name">{piece.title}</span>}
            <span className="work-time">{piece.time}</span>
          </span>
          {shape === "wide" && piece.video ? null : <span className="work-tag">{tag}</span>}
        </span>
        {piece.video && !playing ? (
          <button className="play-btn" type="button" onClick={play} aria-label={`Смотреть: ${piece.title}`}>
            <PlayIcon />
          </button>
        ) : null}
      </div>
      {shape !== "reel" && piece.text ? <p className="piece-text">{piece.text}</p> : null}
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

