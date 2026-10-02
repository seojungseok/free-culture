import { extractAmounts } from "./price.js";

/** Classify the full fee notice; a free badge must not hide paid exceptions.
 * @param {unknown} fee
 * @returns {"free" | "paid" | "unknown"}
 */
export function classifyAdmission(fee) {
  const text = String(fee ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#\d+|#x[\da-f]+);/gi, " ")
    .replace(/\s+/g, " ").trim();
  if (!text || /^(?:0|null|undefined|정보\s*없음|미상|확인\s*필요|미기재|미제공)[.!]?$/i.test(text)) return "unknown";
  const hasFree = /무료|입장료\s*없음|관람료\s*없음|요금\s*없음|\bfree\b/i.test(text)
    || /(?:^|[^\d,])0(?:,0{3})*(?:\.0+)?\s*원/.test(text);
  const hasPaid = /유료|유상/.test(text) || extractAmounts(text).length > 0;
  if (hasFree) {
    const conditional = /일부|조건|별도|경우|상이|따라|한정|한해|한\s*함|제외|단\s*[,，:：]|특별\s*(?:기획)?전|기획\s*전|문화가\s*있는\s*날|매월|매주|매년|평일|주중|주말|공휴일|휴일|[월화수목금토일]요일|선착순|사전\s*예약|예약자|회원|장애|유공|군인|경로|어르신|노인|어린이|유아|아동|청소년|학생|다자녀|임산부|시민|도민|구민|군민|\d+\s*세|신분증|증빙|감면|할인/.test(text);
    return hasPaid || conditional ? "unknown" : "free";
  }
  return hasPaid ? "paid" : "unknown";
}
