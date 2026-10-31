import { badge, date, escape, table } from '../components/ui.js';
import { connectionHealth } from '../domain.js';

export function alertsPage(events, workers, settings = {}) {
  const active = events.filter(e=>e.status!=='RESOLVED').sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt));
  const levels=['LOW','MEDIUM','HIGH','CRITICAL'];
  const priority = active.filter(e=>levels.indexOf(e.severity)>=levels.indexOf(settings.alertSeverity??'HIGH')).length;
  const newCount = active.filter(e=>['NEW','REQUEST'].includes(e.status)).length;
  const offline = new Set(workers.filter(w=>connectionHealth(w,Date.now(),settings)!=='ONLINE').map(w=>w.id));
  return `<div class="page-heading"><div><p class="eyebrow">실시간 대응</p><h1>긴급 알림·대응</h1><p class="muted">새 이벤트를 확인하고 현장 대응 후 해결 처리합니다.</p></div><a class="text-link" href="#events">전체 이벤트 보기 →</a></div>
    <div class="cards"><div class="card"><span>신규·요청 알림</span><strong>${newCount}</strong></div><div class="card"><span>우선 알림 기준 이상</span><strong>${priority}</strong></div><div class="card"><span>대응 중</span><strong>${active.length-newCount}</strong></div></div>
    <section class="panel"><div class="toolbar"><h2>대응 대기 목록</h2><span class="muted">발생 시각순</span></div>${table(['발생 시각','작업자','위험 유형','처리 상태','통신','대응'],active.map(e=>`<tr><td>${date(e.occurredAt)}</td><td>${escape(e.workerName??e.workerId)}</td><td>${badge(e.type)}</td><td>${badge(e.status)}</td><td>${offline.has(e.workerId)?'<span class="badge OFFLINE">연결 확인 필요</span>':'<span class="badge NORMAL">온라인</span>'}</td><td><button data-event="${escape(e.id)}">${['NEW','REQUEST'].includes(e.status)?'확인·대응':'대응 이어가기'}</button></td></tr>`))}</section>
    <p class="hint">알림음·브라우저 푸시는 아직 연결되지 않았습니다. 실제 긴급 통보 방식은 서버·현장 절차와 함께 정해야 합니다.</p>`;
}
