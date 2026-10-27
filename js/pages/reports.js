import { auditRows } from '../domain.js';
import { badge, date, escape, table } from '../components/ui.js';

export function reportsPage(events, history, filters = {}) {
  const rows = auditRows(events, history).filter(r=>(!filters.action||r.action===filters.action)&&(!filters.q||`${r.workerName} ${r.eventId} ${r.actor}`.toLowerCase().includes(filters.q.toLowerCase())));
  return `<div class="page-heading"><div><p class="eyebrow">처리 추적</p><h1>처리 기록·보고서</h1><p class="muted">이벤트 확인·해결 시각과 처리자를 조회합니다.</p></div><button id="export-report">CSV 내려받기</button></div>
    <div class="cards"><div class="card"><span>전체 이벤트</span><strong>${events.length}</strong></div><div class="card"><span>해결 완료</span><strong>${events.filter(e=>e.status==='RESOLVED').length}</strong></div><div class="card"><span>처리 기록</span><strong>${auditRows(events,history).length}</strong></div></div>
    <form id="report-filter"><label>작업자·이벤트·처리자<input name="q" value="${escape(filters.q??'')}"></label><label>처리 유형<select name="action"><option value="">전체</option><option value="acknowledge">확인</option><option value="resolve">해결</option></select></label><button>조회</button></form>
    <section class="panel"><h2>처리 이력</h2>${table(['처리 시각','이벤트 ID','작업자','처리','처리자','대응 메모'],rows.map(r=>`<tr><td>${date(r.at)}</td><td>${escape(r.eventId)}</td><td>${escape(r.workerName??'정보 없음')}</td><td>${badge(r.action==='acknowledge'?'ACKNOWLEDGED':'RESOLVED')}</td><td>${escape(r.actor??'기록 없음')}</td><td><span class="report-note" title="${escape(r.note??'')}">${escape(r.note??'')}</span></td></tr>`))}</section>
    <p class="hint">샘플 기록은 브라우저에 저장됩니다. 운영용 감사 기록은 서버에서 처리자 식별과 변경 방지를 구현해야 합니다.</p>`;
}
