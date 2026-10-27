import { connectionHealth } from '../domain.js';
import { badge, date, escape, table } from '../components/ui.js';

function deviceSummary(worker, settings) {
  if (!Array.isArray(worker.devices) || !worker.devices.length) return '기기 정보 없음';
  return worker.devices.map(device=>`${escape(device.type)} ${badge(connectionHealth({connectionStatus:'ONLINE',lastSeenAt:device.lastSeenAt},Date.now(),settings))}`).join('<br>');
}

export function connectivityPage(workers, events, settings = {}) {
  const rows = workers.map(w=>({...w,health:connectionHealth(w,Date.now(),settings)}));
  const offline = rows.filter(w=>w.health==='OFFLINE').length;
  const stale = rows.filter(w=>w.health==='STALE').length;
  const pending = new Set(events.filter(e=>e.status!=='RESOLVED').map(e=>e.workerId));
  rows.sort((a,b)=>(a.health==='OFFLINE'?0:a.health==='STALE'?1:2)-(b.health==='OFFLINE'?0:b.health==='STALE'?1:2));
  return `<div class="page-heading"><div><p class="eyebrow">연결 점검</p><h1>기기·통신 상태</h1><p class="muted">작업자와 연결 기기의 마지막 통신을 함께 봅니다. 연결 끊김만으로 사고를 판정하지 않습니다.</p></div></div>
    <div class="cards"><div class="card"><span>온라인</span><strong>${rows.length-offline-stale}</strong></div><div class="card"><span>통신 지연</span><strong>${stale}</strong></div><div class="card"><span>오프라인</span><strong>${offline}</strong></div></div>
    <section class="panel"><h2>작업자별 연결 상태</h2>${table(['작업자','통신 상태','연결 기기','마지막 통신','마지막 측정','미해결 이벤트','상세'],rows.map(w=>`<tr><td>${escape(w.name)}</td><td>${badge(w.health)}</td><td>${deviceSummary(w,settings)}</td><td>${date(w.lastSeenAt)}</td><td>${date(w.vitals?.measuredAt)}</td><td>${pending.has(w.id)?'<span class="badge NEW">있음</span>':'없음'}</td><td><a href="#workers/${encodeURIComponent(w.id)}">작업자 보기</a></td></tr>`))}</section>
    <p class="hint">현재 기준: 마지막 통신 ${settings.staleMinutes??5}분 이상이면 지연, ${settings.offlineMinutes??15}분 이상이면 오프라인입니다. 실제 기기별 상태를 표시하려면 API에 기기 종류와 마지막 통신 시각이 필요합니다.</p>`;
}
