import { eventsTable, options, badge, escape, date, metric } from '../components/ui.js';
import { vitalStatus } from '../domain.js';
export function eventsPage(events) {
  return `<h1>이벤트 이력</h1><form id="event-filter"><label>처리 상태<select name="status">${options(['REQUEST','NEW','ACKNOWLEDGED','RESOLVED'])}</select></label><label>유형<select name="type">${options(['AUTO_SOS','ADMIN_SOS','MANUAL_REPORT','FALL','DANGER_ZONE_ENTRY','VITAL_ABNORMAL'])}</select></label><button>조회</button></form>${eventsTable(events)}`;
}
export function eventDetail(e) {
  return `<h2>위험 이벤트 상세</h2><dl><dt>작업자</dt><dd>${escape(e.workerName??e.workerId)}</dd><dt>유형 / 위험도</dt><dd>${badge(e.type)} ${badge(e.severity)}</dd><dt>처리 상태</dt><dd>${badge(e.status)}</dd><dt>메시지</dt><dd>${escape(e.message)}</dd><dt>발생 구역</dt><dd>${escape(e.zone?.name??'정보 없음')}</dd><dt>생체신호 이벤트 상태</dt><dd>심장박동 ${badge(vitalStatus(e.workerId,'heartRate',[e]))} / 산소포화도 ${badge(vitalStatus(e.workerId,'spo2',[e]))}</dd><dt>발생 시각</dt><dd>${date(e.occurredAt)}</dd><dt>확인 시각</dt><dd>${date(e.acknowledgedAt)}</dd><dt>해결 시각</dt><dd>${date(e.resolvedAt)}</dd><dt>대응 메모</dt><dd>${escape(e.note||'없음')}</dd></dl><form id="event-action" data-id="${escape(e.id)}">${e.status==='ACKNOWLEDGED'?'<label>대응 메모<textarea name="note" maxlength="1000"></textarea></label>':''}${['NEW','REQUEST'].includes(e.status)?'<button name="action" value="acknowledge">확인 처리</button>':e.status==='ACKNOWLEDGED'?'<button name="action" value="resolve">해결 완료</button>':''}</form>`;
}
