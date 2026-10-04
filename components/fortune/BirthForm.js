"use client";

import { useEffect, useState } from "react";
import styles from "./fortune.module.css";
import { useBirth, loadRemembered, setBirth, forgetBirth } from "@/lib/fortune/birthStore";
import { birthLabel } from "./parts";
import BirthFields from "./BirthFields";

const EMPTY = { calendar: "solar", year: "1995", month: "", day: "", leap: false, hour: "", minute: "0" };

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

/**
 * 운세 코너 공통 생년월일 입력.
 * 이미 입력한 생년월일이 있으면(같은 코너의 다른 페이지에서 넣었거나 이 기기에 기억한 경우)
 * 입력창 대신 한 줄 요약과 "바꾸기" 버튼을 보여 줍니다.
 */
export default function BirthForm({ submitLabel, onSubmitted, timeHelp }) {
  const birth = useBirth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => loadRemembered(), []);

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  function startEdit() {
    setForm(toForm(birth.input));
    setRemember(birth.remembered);
    setEditing(true);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.month || !form.day) {
      setError("태어난 달과 날을 골라 주세요.");
      return;
    }
    const input = {
      calendar: form.calendar,
      year: Number(form.year),
      month: Number(form.month),
      day: Number(form.day),
      leap: form.calendar === "lunar" && form.leap,
      hour: form.hour === "" ? null : Number(form.hour),
      minute: form.hour === "" ? null : Number(form.minute),
    };
    const r = setBirth(input, remember);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setEditing(false);
    onSubmitted?.(input, remember);
  }

  if (!birth.loaded) {
    return <div className={styles.formPlaceholder} aria-hidden="true" />;
  }

  if (birth.saju && !editing) {
    return (
      <div className={styles.birthBar}>
        <div>
          <span className={styles.birthBarLabel}>내 생년월일</span>
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
        <button type="button" className={styles.ghostSm} onClick={startEdit}>
          바꾸기
        </button>
      </div>
    );
  }

  return (
    <form id="fortune-form" className={styles.form} onSubmit={submit} noValidate>
      <BirthFields form={form} set={set} timeHelp={timeHelp} />

      <label className={styles.check}>
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <span>
          이 기기에 기억하기
          <small className={styles.checkHelp}>
            다음에 오면 바로 결과를 보여 드려요. 이 브라우저에만 저장되고 서버로는 보내지 않아요.
          </small>
        </span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button type="submit" className={styles.cta}>
        {submitLabel}
      </button>
      {editing && (
        <button type="button" className={styles.textBtnBlock} onClick={() => setEditing(false)}>
          취소
        </button>
      )}
      <p className={styles.formNote}>입력한 생년월일은 서버로 보내지 않고 이 화면 안에서만 계산해요.</p>
    </form>
  );
}
