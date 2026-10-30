"use client";

import { useEffect, useState } from "react";
import styles from "@/components/fortune/fortune.module.css";
import { calcSaju } from "@/lib/fortune/saju";
import { useBirth, loadRemembered, setBirth, forgetBirth } from "@/lib/fortune/birthStore";
import { birthLabel } from "@/components/fortune/parts";
import BirthFields from "@/components/fortune/BirthFields";

const TIME_HELP = "시간을 넣으면 오행을 여덟 글자로 세어서 오행 비교와 '서로 채워 주는 기운', 점수에 반영돼요.";
const EMPTY = { calendar: "solar", year: "1995", month: "", day: "", leap: false, hour: "", minute: "0" };
// 고른 관계의 풀이를 결과 맨 앞에 크게 보여 줘요. 성별은 묻지 않아요(어떤 두 사람이든 같은 풀이).
export const RELATION_LABELS = [
  ["love", "연인·썸"],
  ["friend", "친구"],
  ["family", "가족"],
  ["work", "일로 만난 사이"],
  ["all", "전부 보기"],
];

function toForm(input) {
  if (!input) return EMPTY;
  return {
    calendar: input.calendar,
    year: String(input.year),
    month: String(input.month),
    day: String(input.day),
    leap: Boolean(input.leap),
    hour: input.hour == null ? "" : String(input.hour),
    minute: String(input.minute ?? 0),
  };
}

function toInput(form) {
  return {
    calendar: form.calendar,
    year: Number(form.year),
    month: Number(form.month),
    day: Number(form.day),
    leap: form.calendar === "lunar" && form.leap,
    hour: form.hour === "" ? null : Number(form.hour),
    minute: form.hour === "" ? null : Number(form.minute),
  };
}

/**
 * 궁합 입력 — 나의 정보(이 기기에 저장된 값이 있으면 불러오고, 기억하기도 가능)와
 * 상대방의 정보(이 페이지에서만 쓰고 저장하지 않음, 매번 새로 입력)를 함께 받고, 어떤 사이인지 고르게 합니다.
 */
export default function GunghapForm({ onSubmitted }) {
  const birth = useBirth();
  const [meEditing, setMeEditing] = useState(false);
  const [meForm, setMeForm] = useState(EMPTY);
  const [rememberMe, setRememberMe] = useState(false);
  const [partnerForm, setPartnerForm] = useState(EMPTY);
  const [relation, setRelation] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => loadRemembered(), []);

  const setMe = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setMeForm((f) => ({ ...f, [k]: v }));
    setError("");
  };
  const setPartner = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setPartnerForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  function startEditMe() {
    setMeForm(toForm(birth.input));
    setRememberMe(birth.remembered);
    setMeEditing(true);
  }

  function submit(e) {
    e.preventDefault();

    let meSaju = birth.saju && !meEditing ? birth.saju : null;
    if (!meSaju) {
      if (!meForm.month || !meForm.day) {
        setError("나의 태어난 달과 날을 골라 주세요.");
        return;
      }
      const r = setBirth(toInput(meForm), rememberMe);
      if (!r.ok) {
        setError(`나의 정보: ${r.error}`);
        return;
      }
      meSaju = r;
      setMeEditing(false);
    }
    if (!partnerForm.month || !partnerForm.day) {
      setError("상대방의 태어난 달과 날을 골라 주세요.");
      return;
    }
    const partnerSaju = calcSaju(toInput(partnerForm));
    if (!partnerSaju.ok) {
      setError(`상대방 정보: ${partnerSaju.error}`);
      return;
    }
    onSubmitted(meSaju, partnerSaju, relation);
  }

  if (!birth.loaded) {
    return <div className={styles.formPlaceholder} aria-hidden="true" />;
  }

  return (
    <form id="gunghap-form" className={styles.form} onSubmit={submit} noValidate>
      {birth.saju && !meEditing ? (
        <div className={styles.birthBar}>
          <div>
            <span className={styles.birthBarLabel}>나의 생년월일</span>
            <strong>{birthLabel(birth.saju)}</strong>
            {birth.remembered && (
              <span className={styles.birthBarSaved}>
                이 기기에 기억 중 ·{" "}
                <button type="button" className={styles.textBtn} onClick={forgetBirth}>
                  기억 지우기
                </button>
              </span>
            )}
          </div>
          <button type="button" className={styles.ghostSm} onClick={startEditMe}>
            바꾸기
          </button>
        </div>
      ) : (
        <>
          <BirthFields form={meForm} set={setMe} dateLegend="나의 생년월일" timeLegend="나의 태어난 시간" timeHelp={TIME_HELP} />
          <label className={styles.check}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span>
              내 정보만 이 기기에 기억하기
              <small className={styles.checkHelp}>
                상대방 정보는 저장하지 않아요. 내 정보만 선택하면 이 브라우저에 남아요.
              </small>
            </span>
          </label>
          {birth.saju && (
            <button type="button" className={styles.textBtnBlock} onClick={() => setMeEditing(false)}>
              취소
            </button>
          )}
        </>
      )}

      <p className={styles.sectionDivider}>상대방 정보</p>
      <BirthFields form={partnerForm} set={setPartner} dateLegend="상대방의 생년월일" timeLegend="상대방의 태어난 시간" timeHelp={TIME_HELP} />

      <div className={styles.fieldset}>
        <p className={styles.legend}>두 사람은 어떤 사이인가요?</p>
        <div className={styles.areaChecks} role="radiogroup" aria-label="두 사람의 관계">
          {RELATION_LABELS.map(([key, label]) => (
            <label key={key} className={`${styles.areaCheck} ${relation === key ? styles.areaCheckOn : ""}`}>
              <input type="radio" name="gunghap-relation" checked={relation === key} onChange={() => setRelation(key)} />
              {label}
            </label>
          ))}
        </div>
        <p className={styles.checkHelp} style={{ marginTop: 6 }}>
          고른 사이의 풀이를 맨 앞에 보여 드려요. 다른 사이의 풀이도 결과 아래에서 펼쳐 볼 수 있어요.
        </p>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className={styles.cta}>
        궁합 보기
      </button>
      <p className={styles.formNote}>
        입력한 정보는 서버로 보내지 않고 이 화면 안에서만 계산해요. 상대방 정보는 기억하지 않고
        창을 닫으면 사라져요.
      </p>
    </form>
  );
}
