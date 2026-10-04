"use client";

import styles from "./fortune.module.css";
import { MIN_YEAR, MAX_YEAR } from "@/lib/fortune/saju";
import { range } from "./parts";

/**
 * 생년월일(양력·음력)+태어난 시간 입력 필드 묶음. BirthForm(나)과 PartnerFields(상대방)에서
 * 함께 씁니다. 바깥에서 form 상태와 set 함수만 넘겨 주면 돼요.
 */
export default function BirthFields({ form, set, dateLegend = "생년월일", timeLegend = "태어난 시간", timeHelp }) {
  const daysInMonth = form.calendar === "lunar" ? 30 : 31;

  return (
    <>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{dateLegend}</legend>
        <div className={styles.segment} role="radiogroup" aria-label="양력·음력 선택">
          {[
            ["solar", "양력"],
            ["lunar", "음력"],
          ].map(([v, label]) => (
            <label key={v} className={`${styles.segmentItem} ${form.calendar === v ? styles.segmentOn : ""}`}>
              <input type="radio" name="calendar" value={v} checked={form.calendar === v} onChange={set("calendar")} />
              {label}
            </label>
          ))}
        </div>
        <div className={styles.row3}>
          <label className={styles.selectWrap}>
            <span className={styles.srOnly}>태어난 해</span>
            <select className={styles.select} value={form.year} onChange={set("year")}>
              {range(MIN_YEAR, MAX_YEAR)
                .reverse()
                .map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
            </select>
          </label>
          <label className={styles.selectWrap}>
            <span className={styles.srOnly}>태어난 달</span>
            <select className={styles.select} value={form.month} onChange={set("month")}>
              <option value="">월</option>
              {range(1, 12).map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </label>
          <label className={styles.selectWrap}>
            <span className={styles.srOnly}>태어난 날</span>
            <select className={styles.select} value={form.day} onChange={set("day")}>
              <option value="">일</option>
              {range(1, daysInMonth).map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
          </label>
        </div>
        {form.calendar === "lunar" && (
          <label className={styles.check}>
            <input type="checkbox" checked={form.leap} onChange={set("leap")} />
            윤달이에요
          </label>
        )}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>
          {timeLegend} <span className={styles.optional}>(모르면 그대로 두세요)</span>
        </legend>
        <div className={styles.row2}>
          <label className={styles.selectWrap}>
            <span className={styles.srOnly}>태어난 시</span>
            <select className={styles.select} value={form.hour} onChange={set("hour")}>
              <option value="">시간 모름</option>
              {range(0, 23).map((h) => (
                <option key={h} value={h}>
                  {h < 12 ? "오전" : "오후"} {h % 12 === 0 ? 12 : h % 12}시 ({h}시)
                </option>
              ))}
            </select>
          </label>
          <label className={styles.selectWrap}>
            <span className={styles.srOnly}>태어난 분</span>
            <select className={styles.select} value={form.minute} onChange={set("minute")} disabled={form.hour === ""}>
              {range(0, 59).map((m) => (
                <option key={m} value={m}>
                  {m}분
                </option>
              ))}
            </select>
          </label>
        </div>
        {timeHelp && <p className={styles.timeHelp}>{timeHelp}</p>}
      </fieldset>
    </>
  );
}
