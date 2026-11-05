import { Bar, Phone, Stage, Text, Window } from "../kit"
import { Facade } from "./Facade"
import "./frame.css"

// Device pair, from examples/device-pair. The window is a page under
// construction; the phone is the reel of the same opening and straddles
// the window's right edge. Real words stay on the page title, the date,
// the reel name and its length. The rest of the page is bars.

export function FramePair() {
  return (
    <Stage
      width={600}
      height={440}
      compact={{ below: 560, width: 358, height: 440 }}
      greys="warm"
      fidelity="standard"
      className="fp-frame"
    >
      {(_state, _rect, layout) => (
        <>
          {layout === "wide" && (
          <Window url="pekarnia.site" urlShape="pill" className="fp-window">
            <div className="fp-page">
              <div className="fp-top">
                <Text className="fp-brand">Пекарня</Text>
              </div>
              <div className="fp-body">
                <div className="fp-copy">
                  <Text className="fp-date">12 апреля</Text>
                  <Text className="fp-hl">На Патриарших</Text>
                  <div className="fp-lines">
                    <Bar w={168} h={5} tone={2} />
                    <Bar w={112} h={5} tone={2} />
                  </div>
                </div>
                <div className="fp-photo">
                  <Facade />
                </div>
              </div>
            </div>
          </Window>
          )}

          <Phone width={layout === "compact" ? 310 : 228} frame="pro" time="9:41" wallpaper="#e4d3c0" className="fp-phone">
            <div className="fp-reel">
              <div className="fp-fill" aria-hidden="true" />
              <Facade className="fp-facade" />
              <div className="fp-cap">
                <Text className="fp-cap-name">Открытие</Text>
                <span className="fp-cap-time">
                  <span className="fp-dot" aria-hidden="true" />
                  <Text className="fp-cap-code">00:18</Text>
                </span>
              </div>
            </div>
          </Phone>
        </>
      )}
    </Stage>
  )
}
