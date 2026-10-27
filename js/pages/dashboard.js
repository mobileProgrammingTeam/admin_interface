import { summarize, labels } from '../domain.js';
import { badge, date, escape, workersTable } from '../components/ui.js';

export function dashboard({workers,events}) {
  const s=summarize(workers,events);
  const active=events.filter(e=>e.status!=='RESOLVED').sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt));
  const urgent=active.filter(e=>['HIGH','CRITICAL'].includes(e.severity));
  const zones=[...workers.reduce((map,w)=>{const name=w.zone?.name??'미배정';map.set(name,(map.get(name)??0)+1);return map;},new Map()).entries()];
  const today=new Intl.DateTimeFormat('ko-KR',{dateStyle:'long',timeZone:'Asia/Seoul'}).format(new Date());
  const cards=[['현재 작업자',s.total,'명','work'],['미해결 이벤트',s.pending,'건','risk'],['주의·위험',s.danger,'명','check'],['오프라인',s.offline,'명','sensor']];
  return `<div class="dashboard-heading"><div><p class="eyebrow">SAFETY OVERVIEW</p><h1>실시간 안전 대시보드</h1><p class="muted">${today} · 현장 작업자와 위험 이벤트를 확인합니다.</p></div><span class="live-pill"><span class="site-dot"></span>현황</span></div>
    ${urgent.length?`<a class="priority-banner" href="#alerts"><span class="priority-icon">!</span><span><strong>확인이 필요한 높은 위험 이벤트 ${urgent.length}건</strong><small>긴급 알림·대응에서 상세 내용을 확인하세요.</small></span><span class="priority-action">위험 알림 확인 →</span></a>`:''}
    <div class="cards dashboard-cards">${cards.map(([label,n,unit,tone])=>`<div class="card stat-card"><span class="stat-icon ${tone}">${tone==='work'?'▦':tone==='risk'?'!':tone==='check'?'✓':'◉'}</span><span class="stat-label">${label}</span><strong>${n}<small>${unit}</small></strong><span class="stat-sub">${tone==='work'?`정상 근무 ${s.normal}명`:tone==='risk'?`높음·긴급 ${urgent.length}건`:tone==='check'?'상태 확인 필요':'마지막 통신 확인'}</span></div>`).join('')}</div>
    <div class="dashboard-grid"><section class="surface alert-surface"><div class="surface-head"><div><h2>실시간 위험 알림</h2><p>미해결 이벤트 ${active.length}건</p></div><a href="#alerts">전체 보기 →</a></div>${active.length?`<div class="alert-list">${active.slice(0,5).map(e=>`<button class="alert-item" data-event="${escape(e.id)}"><span class="event-icon ${escape(e.severity)}">${e.type==='FALL'?'!':e.type==='MANUAL_REPORT'?'SOS':'●'}</span><span class="alert-copy"><strong>${escape(labels[e.type]??e.type)}</strong><small>${escape(e.workerName??e.workerId)} · ${escape(e.zone?.name??'구역 정보 없음')}</small></span>${badge(e.severity)}<time>${date(e.occurredAt)}</time><span class="chevron">›</span></button>`).join('')}</div>`:'<p class="empty">현재 미해결 이벤트가 없습니다.</p>'}</section>
    <section class="surface zone-surface"><div class="surface-head"><div><h2>구역별 작업자 현황</h2><p>현재 등록된 작업 구역 기준</p></div><a href="#workers">작업자 보기 →</a></div><div class="zone-list">${zones.map(([name,count])=>`<div class="zone-row"><span class="zone-symbol">⌖</span><span>${escape(name)}</span><strong>${count}명</strong></div>`).join('')}</div><p class="zone-note">실내 위치 추적 정보는 연결되지 않았습니다.</p></section></div>
    <section class="surface worker-surface"><div class="surface-head"><div><h2>작업자 상태</h2><p>현재 안전 상태와 마지막 통신</p></div><a href="#workers">전체 작업자 보기 →</a></div>${workersTable(workers)}</section>`;
}
