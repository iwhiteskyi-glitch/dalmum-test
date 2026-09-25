"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import Avatar from "./Avatar";
import styles from "./travel.module.css";
import { MOODS, STYLES } from "@/lib/travel/texts";
import { drawNameCards } from "@/lib/travel/recommend";

const STEPS = ["info", "result", "final"];

export default function TravelTest({ country, city }) {
  const rootRef = useRef(null);
  const [step, setStep] = useState("start");
  const [nick, setNick] = useState("");
  const [style, setStyle] = useState("any");
  const [moods, setMoods] = useState([]);
  const [roll, setRoll] = useState(0);
  const [seen, setSeen] = useState(() => new Set());
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState(null);
  const [recycled, setRecycled] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const trimmedNick = nick.trim();

  const draw = (fresh) => {
    const baseSeen = fresh ? new Set() : seen;
    const result = drawNameCards({
      country,
      city,
      nick: trimmedNick,
      style,
      moods,
      roll,
      seen: baseSeen,
    });
    const nextSeen = result.recycled ? new Set() : new Set(baseSeen);
    result.cards.forEach((c) => nextSeen.add(c.name_local));
    setSeen(nextSeen);
    setRoll((r) => r + 1);
    setCards(result.cards);
    setRecycled(!fresh && result.recycled);
    setSelected(null);
  };

  const submitInfo = () => {
    if (!trimmedNick) return;
    draw(true);
    setStep("result");
    track("travel_result_viewed", { country: country.code, city: city.city_code });
  };

  const toggleMood = (m) =>
    setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const goBack = () => {
    const i = STEPS.indexOf(step);
    setStep(i > 0 ? STEPS[i - 1] : "start");
  };

  const restart = () => {
    setNick("");
    setStyle("any");
    setMoods([]);
    setCards([]);
    setSelected(null);
    setSeen(new Set());
    setStep("info");
  };

  const chosen = selected !== null ? cards[selected] : null;
  const stepIdx = STEPS.indexOf(step);

  return (
    <section ref={rootRef} className={styles.test} aria-label={`${city.city_name} 여행 이름 테스트`}>
      {step === "start" ? (
        <div className={styles.testStart}>
          <p className={`${styles.display} ${styles.testStartTitle}`}>
            {city.city_name}에서 내 이름은?
          </p>
          <p className={styles.lead}>
            내 분위기를 알려주면 {country.name} 감성 이름 3개를 캐릭터와 함께 추천해드려요.
          </p>
          <button type="button" className={styles.cta} onClick={() => setStep("info")}>
            내 여행 이름 받기 →
          </button>
          <p className={styles.testStartNote}>사진 없이도 OK · 입력한 내용은 저장되지 않아요</p>
        </div>
      ) : (
        <>
          <div className={styles.topbar}>
            <button type="button" className={styles.backBtn} onClick={goBack} aria-label="이전 단계">
              ‹
            </button>
            <div className={styles.progress} aria-hidden="true">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`${styles.progressSeg} ${i <= stepIdx ? styles.progressOn : ""}`}
                />
              ))}
            </div>
          </div>

          {step === "info" && (
            <div>
              <h2 className={`${styles.display} ${styles.stepTitle}`}>당신은 어떤 사람인가요?</h2>
              <p className={styles.stepLead}>입력한 내용을 바탕으로 어울리는 이름을 골라드려요</p>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="travel-nick">
                  닉네임 또는 이름
                </label>
                <input
                  id="travel-nick"
                  className={styles.input}
                  value={nick}
                  maxLength={12}
                  placeholder="예: 민지, 태오, 하늘"
                  onChange={(e) => setNick(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitInfo()}
                />
              </div>

              <div className={styles.field}>
                <span className={styles.label}>이름 스타일</span>
                <div className={styles.styleGrid}>
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={style === s.value}
                      className={`${styles.toggle} ${style === s.value ? styles.toggleOn : ""}`}
                      onClick={() => setStyle(s.value)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>
                  원하는 분위기<span className={styles.subLabel}>여러 개 선택 가능</span>
                </span>
                <div className={styles.moodRow}>
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={moods.includes(m)}
                      className={`${styles.mood} ${moods.includes(m) ? styles.moodOn : ""}`}
                      onClick={() => toggleMood(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className={styles.helper}>
                  {moods.length ? `선택: ${moods.join(", ")}` : "선택 안 해도 괜찮아요"}
                </p>
              </div>

              <button
                type="button"
                className={`${styles.cta} ${styles.ctaBlock}`}
                disabled={!trimmedNick}
                onClick={submitInfo}
              >
                이름 추천받기 ✦
              </button>
            </div>
          )}

          {step === "result" && (
            <div>
              <h2 className={`${styles.display} ${styles.stepTitle}`}>
                {city.city_name}에서 {trimmedNick} 님의 이름은
              </h2>
              <p className={styles.stepLead}>마음에 드는 이름을 하나 골라보세요</p>

              <div className={styles.nameCards}>
                {cards.map((c, i) => {
                  const on = selected === i;
                  return (
                    <button
                      key={c.name_local}
                      type="button"
                      aria-pressed={on}
                      className={`${styles.nameCard} ${on ? styles.nameCardOn : ""}`}
                      onClick={() => setSelected(i)}
                    >
                      <span className={styles.nameAvatar}>
                        <Avatar avatar={c.avatar} size={64} />
                      </span>
                      <span className={styles.nameBody}>
                        <span className={styles.nameHead}>
                          <span className={styles.nameKr}>{c.pronunciation_kr}</span>
                          <span className={styles.nameLocal} lang={country.lang_code}>
                            {c.name_local !== c.romanized
                              ? `${c.name_local} · ${c.romanized}`
                              : c.romanized}
                          </span>
                        </span>
                        {c.meaning_kr && <span className={styles.nameMeaning}>{c.meaning_kr}</span>}
                        <span className={styles.nameBlurb}>{c.blurb}</span>
                        <span className={styles.titleBadge}>{c.title}</span>
                      </span>
                      <span className={`${styles.check} ${on ? styles.checkOn : ""}`} aria-hidden="true">
                        {on ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className={styles.legend}>
                초록색 글씨는 이름의 실제 뜻이고, 그 아래 설명과 칭호는 재미로 붙인 해석이에요.
                {recycled && " 준비된 이름을 모두 보여드려서 처음부터 다시 섞었어요."}
              </p>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.cta} ${styles.ctaBlock}`}
                  disabled={selected === null}
                  onClick={() => setStep("final")}
                >
                  이 이름으로 계속하기
                </button>
                <button type="button" className={styles.ghost} onClick={() => draw(false)}>
                  ↻ 다른 이름 뽑기
                </button>
              </div>
            </div>
          )}

          {step === "final" && chosen && (
            <div>
              <h2 className={`${styles.display} ${styles.stepTitle}`} style={{ textAlign: "center" }}>
                완성된 여행 카드예요!
              </h2>
              <p className={styles.stepLead} style={{ textAlign: "center" }}>
                {trimmedNick} 님의 {city.city_name} 여행 이름
              </p>

              <div className={styles.postcardFrame}>
                <div className={styles.postcardInner}>
                  <span className={styles.postcardStamp} aria-hidden="true" />
                  <p className={styles.eyebrow}>TRAVEL NAME CARD</p>
                  <Avatar avatar={chosen.avatar} size={96} title={`${chosen.pronunciation_kr} 캐릭터`} />
                  <p className={`${styles.display} ${styles.finalName}`}>{chosen.pronunciation_kr}</p>
                  <p className={styles.finalLocal} lang={country.lang_code}>
                    {chosen.name_local !== chosen.romanized
                      ? `${chosen.name_local} · ${chosen.romanized}`
                      : chosen.romanized}
                  </p>
                  {chosen.meaning_kr && <p className={styles.finalMeaning}>{chosen.meaning_kr}</p>}
                  <p className={styles.finalBlurb}>{chosen.blurb}</p>
                  <hr className={styles.divider} />
                  <div className={styles.tagRow}>
                    <span className={styles.titleBadge} style={{ marginTop: 0 }}>
                      {chosen.title}
                    </span>
                    {(moods.length ? moods : [chosen.vibe]).map((m) => (
                      <span key={m} className={styles.tag}>
                        #{m}
                      </span>
                    ))}
                  </div>
                  <p className={styles.place}>
                    📍 {city.city_name}, {country.name}
                  </p>
                </div>
              </div>

              <p className={styles.finalHint}>
                아래에서 {city.city_name} 여행 인사말·명소·음식도 확인해보세요 ↓
              </p>

              <div className={styles.actions}>
                <button type="button" className={styles.ghost} onClick={() => setStep("result")}>
                  다른 이름 고르기
                </button>
                <button type="button" className={styles.textBtn} onClick={restart}>
                  처음부터 다시 만들기
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
