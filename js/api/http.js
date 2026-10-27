import { config } from '../config.js';
export class ApiError extends Error { constructor(message,status) { super(message); this.status=status; } }
export async function request(path, {method='GET',body} = {}) {
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),config.timeoutMs);
  try {
    const response=await fetch(`${config.apiBaseUrl}${path}`, {method,credentials:'include',signal:controller.signal,headers:body ? {'Content-Type':'application/json'} : {}, ...(body ? {body:JSON.stringify(body)} : {})});
    if(response.status===401) window.dispatchEvent(new Event('auth-expired'));
    const payload=response.status===204 ? null : await response.json();
    if(!response.ok || payload?.error) throw new ApiError(payload?.error?.message || `요청 실패 (${response.status})`,response.status);
    return payload?.data ?? null;
  } catch(error) {
    if(error.name==='AbortError') throw new Error('응답 시간이 초과되었습니다. 다시 시도하세요.');
    throw error;
  } finally { clearTimeout(timer); }
}
