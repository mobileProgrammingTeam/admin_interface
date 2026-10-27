import { config } from '../config.js';
// Supabase 구독은 계약 확정 후 이 함수에서 연결하고 cleanup에서 해제합니다.
// 현재는 전체 REST 재조회로 갱신합니다.
export function startRefresh(refresh) {
  let stopped=false, timer;
  async function tick() {
    if(stopped) return;
    try { await refresh(); }
    catch { /* render가 기존 화면을 유지하고 오류를 알립니다. */ }
    finally { if(!stopped) timer=setTimeout(tick,config.pollIntervalMs); }
  }
  const online=()=>{clearTimeout(timer); void tick();};
  timer=setTimeout(tick,config.pollIntervalMs);
  window.addEventListener('online',online);
  return ()=>{stopped=true;clearTimeout(timer);window.removeEventListener('online',online);};
}
