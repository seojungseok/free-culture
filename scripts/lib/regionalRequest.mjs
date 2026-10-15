import { XMLParser } from 'fast-xml-parser';
const parser = new XMLParser({ ignoreAttributes: false });
export class RegionalApiError extends Error {
  constructor(code, transient = false) {
    super(`지역 API ${code}`); this.code = code; this.transient = transient;
  }
}
export function validateRegionalResponse(json) {
  const serviceError = json?.OpenAPI_ServiceResponse?.cmmMsgHeader || json?.OpenAPIServiceResponse?.cmmMsgHeader;
  const header = serviceError || json?.response?.header || json?.rfcOpenApi?.header || json?.getFestivalKr?.header || json?.getFestivalStatus?.header;
  const code = header?.resultCode ?? header?.returnReasonCode;
  if (code !== undefined && !['00','0000','0'].includes(String(code))) {
    const safe = /^\d{1,4}$/.test(String(code)) ? String(code).padStart(2,'0') : 'unknown';
    throw new RegionalApiError(safe, ['01','02','04','05','99'].includes(safe));
  }
  if (!header || typeof json !== 'object') throw new RegionalApiError('schema');
  return json;
}
export async function regionalRequest(url, { fetchImpl = fetch, pause = ms => new Promise(r=>setTimeout(r,ms)), onAttempt = ()=>{} } = {}) {
  for (let attempt=0;attempt<3;attempt++) {
    try {
      onAttempt();
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new RegionalApiError(`HTTP_${response.status}`, [408,500,502,503,504].includes(response.status));
      const text = await response.text();
      let json;
      try { json = text.trimStart().startsWith('<') ? parser.parse(text) : JSON.parse(text); }
      catch { throw new RegionalApiError('schema'); }
      return validateRegionalResponse(json);
    } catch (error) {
      const transient = error instanceof RegionalApiError ? error.transient
        : ['TimeoutError','AbortError'].includes(error?.name) || ['ETIMEDOUT','ECONNRESET','EAI_AGAIN','UND_ERR_CONNECT_TIMEOUT','UND_ERR_SOCKET'].includes(error?.cause?.code);
      // Never propagate a fetch URL, response body or key through an error.
      const safe = error instanceof RegionalApiError ? error : new RegionalApiError(transient?'temporary_network':'network',transient);
      if (!transient || attempt===2) throw safe;
      await pause(2000 * (attempt+1));
    }
  }
}
export function regionalRefreshStatus(results, previous, nowMs=Date.now()) {
  const failed=results.filter(r=>!r.success);
  if (!failed.length) return 'success';
  // Retry on the next daily run only while the last confirmed snapshot is recent.
  // Authentication/schema errors and outages over 72 hours still require attention.
  return failed.every(r=>r.transient && Number.isFinite(Date.parse(previous[r.name]?.checkedAt))
    && nowMs-Date.parse(previous[r.name].checkedAt)>=0
    && nowMs-Date.parse(previous[r.name].checkedAt)<72*3600000) ? 'deferred' : 'failure';
}
