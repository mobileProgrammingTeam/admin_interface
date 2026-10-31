export const labels = {
  NORMAL:'정상', WARNING:'주의', DANGER:'위험', OFFLINE:'오프라인', ONLINE:'온라인',
  FALL:'낙상', DANGER_ZONE_ENTRY:'위험구역 진입', VITAL_ABNORMAL:'생체신호 이상', MANUAL_REPORT:'직접 위험 신고', AUTO_SOS:'자동 SOS', ADMIN_SOS:'관리자 SOS',
  LOW:'낮음', MEDIUM:'보통', HIGH:'높음', CRITICAL:'긴급', NEW:'신규', REQUEST:'요청', ACKNOWLEDGED:'확인', RESOLVED:'해결', STALE:'통신 지연',
  SUPER_ADMIN:'총괄 관리자', ADMIN:'관리자', VIEWER:'조회 전용'
};
// NORMAL means no unresolved alert, not a clinical measurement.
// Legacy events without affectedMetrics conservatively flag both metrics.
export function vitalStatus(workerId, metric, events = []) {
  return events.some(e => e.workerId === workerId && e.type === 'VITAL_ABNORMAL'
    && e.status !== 'RESOLVED'
    && (!Array.isArray(e.affectedMetrics) || e.affectedMetrics.includes(metric))) ? 'DANGER' : 'NORMAL';
}
export function workerVitalStatus(worker, metric, events = [], allowMockFallback = false) {
  const key=`${metric}Status`;
  if(Object.hasOwn(worker.vitals??{},key)) {
    const value=worker.vitals[key];
    return ['NORMAL','DANGER','UNKNOWN','DISCONNECTED'].includes(value) ? value : 'UNKNOWN';
  }
  return allowMockFallback ? vitalStatus(worker.id,metric,events) : 'UNKNOWN';
}
export function transition(event, action, note = '') {
  const allowed = action === 'acknowledge' ? ['NEW','REQUEST'] : action === 'resolve' ? ['ACKNOWLEDGED'] : [];
  if (!allowed.includes(event.status)) throw new Error('처리 상태가 변경되었습니다. 새로고침 후 다시 확인하세요.');
  return { ...event, status:action === 'acknowledge' ? 'ACKNOWLEDGED' : 'RESOLVED', [action === 'acknowledge' ? 'acknowledgedAt' : 'resolvedAt']:new Date().toISOString(), ...(action === 'resolve' ? {note} : {}) };
}
export function filterEvents(events, filters = {}) {
  return events.filter(e => (!filters.status || e.status === filters.status) && (!filters.type || e.type === filters.type) && (!filters.workerId || e.workerId === filters.workerId));
}
export function summarize(workers, events) {
  return { total:workers.length, normal:workers.filter(w=>w.status==='NORMAL').length, danger:workers.filter(w=>['DANGER','WARNING'].includes(w.status)).length, offline:workers.filter(w=>w.connectionStatus==='OFFLINE').length, pending:events.filter(e=>e.status!=='RESOLVED').length };
}
export function connectionHealth(worker, now = Date.now(), settings = {}) {
  const last = Date.parse(worker.lastSeenAt);
  const age = Number.isFinite(last) ? Math.max(0, now-last) : Infinity;
  if (worker.connectionStatus === 'OFFLINE' || age >= (settings.offlineMinutes??15)*60*1000) return 'OFFLINE';
  if (age >= (settings.staleMinutes??5)*60*1000) return 'STALE';
  return 'ONLINE';
}
export function auditRows(events, history = []) {
  const fallback = events.flatMap(e => [
    e.acknowledgedAt && {eventId:e.id,workerName:e.workerName,action:'acknowledge',at:e.acknowledgedAt,actor:e.acknowledgedBy?.name ?? '기록 없음',note:''},
    e.resolvedAt && {eventId:e.id,workerName:e.workerName,action:'resolve',at:e.resolvedAt,actor:e.resolvedBy?.name ?? '기록 없음',note:e.note ?? ''}
  ].filter(Boolean));
  const keys = new Set(history.map(r=>`${r.eventId}:${r.action}`));
  const rows = [...history,...fallback.filter(r=>!keys.has(`${r.eventId}:${r.action}`))];
  return [...rows].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
}
export function proximityStatus(proximity, now = Date.now()) {
  if (!proximity || !Number.isFinite(Number(proximity.distanceMeters)) || !Number.isFinite(Number(proximity.thresholdMeters))) return 'UNKNOWN';
  if(proximity.measuredAt && (!Number.isFinite(Date.parse(proximity.measuredAt)) || now-Date.parse(proximity.measuredAt)>5*60000)) return 'UNKNOWN';
  return Number(proximity.distanceMeters) <= Number(proximity.thresholdMeters) ? 'DANGER' : 'NORMAL';
}
export function restrictedDwellMinutes(proximity, now = Date.now()) {
  if (!proximity?.insideRestricted || !proximity.insideSince || !Number.isFinite(Date.parse(proximity.insideSince))) return 0;
  return Math.max(0,Math.floor((now-Date.parse(proximity.insideSince))/60000));
}
