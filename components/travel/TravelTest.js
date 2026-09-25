"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import Avatar from "./Avatar";
import styles from "./travel.module.css";
import { MOODS, STYLES, nameLocalLine } from "@/lib/travel/texts";
import { drawNameCards } from "@/lib/travel/recommend";
import { buildTravelCard } from "@/lib/travel/travelCard";
import { SITE } from "@/lib/site";

const STEPS = ["info", "result", "final"];
const MAX_COMPANIONS = 4;
const newPerson = (id) => ({ id, nick: "", style: "any", moods: [] });

function PersonFields({ person, idPrefix, compact, onChange, onEnter }) {
  const toggleMood = (m) =>
    onChange({
      moods: person.moods.includes(m) ? person.moods.filter((x) => x !== m) : [...person.moods, m],
    });
  return (
    <>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-nick`}>
          닉네임 또는 이름
        </label>
        <input
          id={`${idPrefix}-nick`}
          className={styles.input}
          value={person.nick}
          maxLength={12}
          placeholder={compact ? "예: 태오" : "예: 민지, 태오, 하늘"}
          onChange={(e) => onChange({ nick: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>이름 스타일</span>
        <div className={compact ? styles.styleRow : styles.styleGrid}>
          {STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={person.style === s.value}
              className={`${styles.toggle} ${compact ? styles.toggleSm : ""} ${
                person.style === s.value ? styles.toggleOn : ""
              }`}
              onClick={() => onChange({ style: s.value })}
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
              aria-pressed={person.moods.includes(m)}
              className={`${styles.mood} ${compact ? styles.moodSm : ""} ${
                person.moods.includes(m) ? styles.moodOn : ""
              }`}
              onClick={() => toggleMood(m)}
            >
              {m}
            </button>
          ))}
        </div>
        {!compact && (
          <p className={styles.helper}>
            {person.moods.length ? `선택: ${person.moods.join(", ")}` : "선택 안 해도 괜찮아요"}
          </p>
        )}
      </div>
    </>
  );
}

export default function TravelTest({ country, city }) {
  const rootRef = useRef(null);
  const nextId = useRef(1);
  const firstRender = useRef(true);
  const [step, setStep] = useState("start");
  const [people, setPeople] = useState(() => [newPerson(0)]);
  const [current, setCurrent] = useState(0);
  // 사람마다: { cards, selected, seen(이미 보여준 이름), roll(다시 뽑은 횟수), recycled }
  const [draws, setDraws] = useState([]);
  const [cardImage, setCardImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inKakao, setInKakao] = useState(false);

  useEffect(() => {
    setInKakao(/KAKAOTALK/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, current]);

  const nicks = people.map((p) => p.nick.trim());
  const infoReady = nicks.every(Boolean);
  const group = people.length > 1;

  const updatePerson = (i, patch) =>
    setPeople((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const addCompanion = () => {
    if (people.length > MAX_COMPANIONS) return;
    setPeople((prev) => [...prev, newPerson(nextId.current++)]);
  };
  const removeCompanion = (i) => setPeople((prev) => prev.filter((_, j) => j !== i));

  // i번째 사람의 이름 3개를 뽑습니다. 이미 보여준 이름과 일행이 고른 이름은 빼고 뽑아요.
  const drawFor = (i, baseDraws, fresh) => {
    const prev = fresh ? null : baseDraws[i];
    const takenByOthers = baseDraws
      .map((d, j) => (j !== i && d && d.selected !== null ? d.cards[d.selected].name_local : null))
      .filter(Boolean);
    const seen = new Set([...(prev?.seen || []), ...takenByOthers]);
    const roll = (prev?.roll || 0) + 1;
    const p = people[i];
    const result = drawNameCards({
      country,
      city,
      nick: p.nick.trim(),
      style: p.style,
      moods: p.moods,
      roll: `${p.id}-${roll}`,
      seen,
    });
    const nextSeen = new Set(result.recycled ? [] : prev?.seen || []);
    result.cards.forEach((c) => nextSeen.add(c.name_local));
    const next = [...baseDraws];
    next[i] = {
      cards: result.cards,
      selected: null,
      seen: nextSeen,
      roll,
      recycled: Boolean(prev) && result.recycled,
    };
    return next;
  };

  const submitInfo = () => {
    if (!infoReady) return;
    setDraws(drawFor(0, people.map(() => null), true));
    setCurrent(0);
    setStep("result");
    track("travel_result_viewed", {
      country: country.code,
      city: city.city_code,
      people: people.length,
    });
  };

  const selectCard = (idx) =>
    setDraws((prev) => prev.map((d, j) => (j === current ? { ...d, selected: idx } : d)));

  const goNext = () => {
    if (current < people.length - 1) {
      const n = current + 1;
      if (!draws[n]) setDraws(drawFor(n, draws, true));
      setCurrent(n);
    } else {
      setStep("final");
    }
  };

  const goBack = () => {
    if (step === "result" && current > 0) return setCurrent(current - 1);
    const i = STEPS.indexOf(step);
    setStep(i > 0 ? STEPS[i - 1] : "start");
  };

  const restart = () => {
    setPeople([newPerson(nextId.current++)]);
    setDraws([]);
    setCurrent(0);
    setStep("info");
  };

  const now = draws[current];
  const members =
    step === "final"
      ? people.map((p, i) => ({
          nick: p.nick.trim(),
          moods: p.moods,
          card: draws[i].cards[draws[i].selected],
        }))
      : [];
  const main = members[0];
  const stepIdx = STEPS.indexOf(step);
  const pageUrl = `${SITE.url}/travel/${country.code}/${city.city_code}`;
  const selectionKey = draws.map((d) => (d ? `${d.roll}:${d.selected}` : "")).join(",");

  // 결과 단계에 들어오면 저장·공유할 이미지를 미리 만들어 화면에 그대로 보여줍니다.
  useEffect(() => {
    if (step !== "final") return;
    let cancelled = false;
    setCardImage(null);
    const displayFont =
      getComputedStyle(rootRef.current).getPropertyValue("--font-gaegu").trim() || "sans-serif";
    buildTravelCard({
      members,
      country,
      city,
      phrases: country.phrases,
      urlText: pageUrl.replace(/^https?:\/\//, ""),
      displayFont,
    })
      .then((img) => !cancelled && setCardImage(img))
      .catch(() => !cancelled && setCardImage({ error: true }));
    return () => {
      cancelled = true;
    };
    // members는 step·selectionKey가 같으면 내용도 같습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectionKey]);

  const fileName = main ? `여행이름_${city.city_name}_${main.card.pronunciation_kr}.png` : "";

  const downloadImage = () => {
    const a = document.createElement("a");
    a.href = cardImage.dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onSave = () => {
    if (!cardImage?.dataUrl) return;
    downloadImage();
    track("travel_card_saved", { country: country.code, city: city.city_code });
  };

  // 카카오톡 안의 브라우저는 사진 공유를 막아서, 기기 기본 브라우저로 넘겨줍니다.
  const openExternal = () => {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(window.location.href)}`;
  };

  const onShare = async () => {
    if (!cardImage?.blob) return;
    setBusy(true);
    try {
      const file = new File([cardImage.blob], "travel-name-card.png", { type: "image/png" });
      const names = members.map((m) => `'${m.card.pronunciation_kr}'`).join(", ");
      const text = `${city.city_name} 여행 가면 ${group ? "우리" : "내"} 이름은 ${names} ✈️ 너도 받아봐!\n${pageUrl}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // 파일과 함께 공유하면 url 필드가 무시되는 앱이 많아 링크를 text 안에 넣습니다.
        await navigator.share({ files: [file], title: "여행가면 내 이름은?", text });
      } else {
        try {
          await navigator.clipboard?.writeText(pageUrl);
        } catch {}
        downloadImage();
        alert("이 브라우저는 바로 공유가 안 돼요. 링크를 복사하고 카드 이미지를 저장했어요!");
      }
      track("travel_card_shared", { country: country.code, city: city.city_code });
    } catch (e) {
      if (e.name !== "AbortError") alert("공유하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section ref={rootRef} className={styles.test} aria-label={`${city.city_name} 여행 이름 테스트`}>
      {step === "start" ? (
        <div className={styles.testStart}>
          <p className={`${styles.display} ${styles.testStartTitle}`}>
            {city.city_name}에서 내 이름은?
          </p>
          <p className={styles.lead}>
            내 분위기를 알려주면 {country.name} 감성 이름 3개를 캐릭터와 함께 추천해드려요. 같이
            가는 친구 이름도 한 번에 받을 수 있어요.
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

              <PersonFields
                person={people[0]}
                idPrefix="travel-me"
                onChange={(patch) => updatePerson(0, patch)}
                onEnter={submitInfo}
              />

              <div className={styles.companions}>
                <p className={styles.label}>
                  함께 가는 사람<span className={styles.subLabel}>선택 · 최대 {MAX_COMPANIONS}명</span>
                </p>
                {people.slice(1).map((p, k) => (
                  <div key={p.id} className={styles.companionCard}>
                    <div className={styles.companionHead}>
                      <strong>동행자 {k + 1}</strong>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeCompanion(k + 1)}
                        aria-label={`동행자 ${k + 1} 삭제`}
                      >
                        삭제
                      </button>
                    </div>
                    <PersonFields
                      person={p}
                      idPrefix={`travel-mate-${p.id}`}
                      compact
                      onChange={(patch) => updatePerson(k + 1, patch)}
                    />
                  </div>
                ))}
                {people.length <= MAX_COMPANIONS && (
                  <button type="button" className={styles.addBtn} onClick={addCompanion}>
                    + 동행자 추가
                  </button>
                )}
              </div>

              <button
                type="button"
                className={`${styles.cta} ${styles.ctaBlock}`}
                disabled={!infoReady}
                onClick={submitInfo}
              >
                {group ? `${people.length}명 이름 추천받기 ✦` : "이름 추천받기 ✦"}
              </button>
              {!infoReady && nicks[0] && (
                <p className={styles.helper} style={{ textAlign: "center" }}>
                  동행자 닉네임을 입력하거나 삭제해 주세요
                </p>
              )}
            </div>
          )}

          {step === "result" && now && (
            <div>
              {group && (
                <p className={styles.personStep}>
                  {current + 1} / {people.length}명
                </p>
              )}
              <h2 className={`${styles.display} ${styles.stepTitle}`}>
                {city.city_name}에서 {nicks[current]} 님의 이름은
              </h2>
              <p className={styles.stepLead}>마음에 드는 이름을 하나 골라보세요</p>

              <div className={styles.nameCards}>
                {now.cards.map((c, i) => {
                  const on = now.selected === i;
                  return (
                    <button
                      key={c.name_local}
                      type="button"
                      aria-pressed={on}
                      className={`${styles.nameCard} ${on ? styles.nameCardOn : ""}`}
                      onClick={() => selectCard(i)}
                    >
                      <span className={styles.nameAvatar}>
                        <Avatar avatar={c.avatar} size={64} />
                      </span>
                      <span className={styles.nameBody}>
                        <span className={styles.nameHead}>
                          <span className={styles.nameKr}>{c.pronunciation_kr}</span>
                          <span className={styles.nameLocal} lang={country.lang_code}>
                            {nameLocalLine(c)}
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
                {now.recycled && " 준비된 이름을 모두 보여드려서 처음부터 다시 섞었어요."}
              </p>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.cta} ${styles.ctaBlock}`}
                  disabled={now.selected === null}
                  onClick={goNext}
                >
                  {current < people.length - 1
                    ? `다음: ${nicks[current + 1]} 님 이름 받기`
                    : group
                      ? "모두 골랐어요, 카드 만들기"
                      : "이 이름으로 계속하기"}
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => setDraws(drawFor(current, draws, false))}
                >
                  ↻ 다른 이름 뽑기
                </button>
              </div>
            </div>
          )}

          {step === "final" && main && (
            <div>
              <h2 className={`${styles.display} ${styles.stepTitle}`} style={{ textAlign: "center" }}>
                완성된 여행 카드예요!
              </h2>
              <p className={styles.stepLead} style={{ textAlign: "center" }}>
                {group
                  ? `${members.map((m) => m.nick).join(", ")}의 ${city.city_name} 여행 이름`
                  : `${main.nick} 님의 ${city.city_name} 여행 이름`}
              </p>

              <div className={styles.cardPreview}>
                {cardImage?.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cardImage.dataUrl}
                    alt={`${members.map((m) => m.card.pronunciation_kr).join(", ")} 여행 이름 카드와 ${city.city_name} 인사말·명소·음식`}
                  />
                ) : (
                  <div className={styles.cardLoading}>
                    {cardImage?.error ? "카드를 만들지 못했어요. 다시 시도해 주세요." : "카드 만드는 중…"}
                  </div>
                )}
              </div>

              <p className={styles.finalHint}>
                인사말·명소·음식까지 담긴 카드예요. 저장해두면 여행 중에 꺼내 보기 좋아요.
              </p>

              <div className={styles.shareRow}>
                <button
                  type="button"
                  className={styles.darkBtn}
                  disabled={!cardImage?.dataUrl}
                  onClick={onSave}
                >
                  이미지 저장
                </button>
                {inKakao ? (
                  <button type="button" className={`${styles.cta} ${styles.shareBtn}`} onClick={openExternal}>
                    브라우저에서 공유
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.cta} ${styles.shareBtn}`}
                    disabled={!cardImage?.blob || busy}
                    onClick={onShare}
                  >
                    공유하기
                  </button>
                )}
              </div>
              {inKakao && (
                <p className={styles.kakaoHint}>
                  카카오톡 안에서는 사진 공유가 막혀 있어요. 이미지를 저장해서 보내거나, 다른
                  브라우저로 열어 다시 만들어 공유해 주세요.
                </p>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => {
                    setCurrent(people.length - 1);
                    setStep("result");
                  }}
                >
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
