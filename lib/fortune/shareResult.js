/**
 * 운세·궁합 결과 공유.
 * 사진(결과 카드)을 보낼 수 있는 기기면 사진 + 짧은 글을 보내고, 사진 공유가 안 되면 긴 글을,
 * 공유 창 자체가 없으면 글을 복사합니다.
 *
 * 사진과 함께 보내면 글(링크)은 버리고 사진만 전달하는 앱이 많아서(카카오톡 등), 사진으로
 * 공유한 뒤에는 링크를 한 번 더 복사해 둬서 대화창에 바로 붙여넣을 수 있게 합니다. 카드
 * 그림 아래쪽에도 주소를 적어 두기 때문에, 사진만 전달돼도 받은 사람이 주소를 알 수 있어요.
 */

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** 반환: { mode: "files" | "text" | "copied", linkCopied } · 공유 창을 닫으면 AbortError를 던집니다. */
export async function shareResult({ blob, fileName, title, shortText, fullText, url }) {
  const files = blob ? [new File([blob], fileName, { type: "image/png" })] : null;
  if (files && navigator.canShare?.({ files })) {
    await navigator.share({ files, title, text: `${shortText}\n${url}` });
    return { mode: "files", linkCopied: await copyText(url) };
  }
  if (navigator.share) {
    await navigator.share({ title, text: `${fullText}\n\n${url}` });
    return { mode: "text", linkCopied: false };
  }
  if (!(await copyText(`${fullText}\n\n${url}`))) throw new Error("clipboard-unavailable");
  return { mode: "copied", linkCopied: true };
}
