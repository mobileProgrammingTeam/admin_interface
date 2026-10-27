import { workersTable, eventsTable, escape, badge, date, metric, options } from '../components/ui.js';
import { connectionHealth } from '../domain.js';

function vitalsChart(history) {
  const points=(history??[]).filter(p=>Number.isFinite(Number(p.heartRate))&&Number.isFinite(Number(p.spo2)));
  if(points.length<2) return '<p class="empty">생체신호 추이 데이터가 없습니다.</p>';
  const line=(key,min,max)=>points.map((p,i)=>`${32+i*536/(points.length-1)},${162-(Math.max(min,Math.min(max,Number(p[key])))-min)*120/(max-min)}`).join(' ');
  return `<div class="chart-wrap"><svg viewBox="0 0 600 190" role="img" aria-label="심박수와 혈중산소포화도 추이 그래프"><line x1="32" y1="42" x2="568" y2="42"/><line x1="32" y1="102" x2="568" y2="102"/><line x1="32" y1="162" x2="568" y2="162"/><polyline class="heart-line" points="${line('heartRate',60,150)}"/><polyline class="spo2-line" points="${line('spo2',80,100)}"/></svg><div class="chart-legend"><span class="heart-dot">심박수</span><span class="spo2-dot">혈중산소포화도</span><small>${date(points[0].at)} ~ ${date(points.at(-1).at)}</small></div></div>`;
}
export function workersPage(workers,filters) {
  const filtered=workers.filter(w=>(!filters.q || `${w.name} ${w.id}`.toLowerCase().includes(filters.q.toLowerCase())) && (!filters.status || w.status===filters.status));
  return `<h1>작업자</h1><form id="worker-filter"><label>이름 또는 ID<input name="q" value="${escape(filters.q)}"></label><label>상태<select name="status">${options(['NORMAL','WARNING','DANGER','OFFLINE'])}</select></label><button>검색</button></form>${workersTable(filtered)}`;
}
export function workerDetail(worker,events) {
  const check=worker.safetyCheck;
  const seconds=check?.dueAt?Math.max(0,Math.ceil((Date.parse(check.dueAt)-Date.now())/1000)):null;
  const remain=seconds==null?'기한 정보 없음':`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const checkLabel={PENDING:'응답 대기',CONFIRMED:'확인 완료',SOS_SENT:'자동 SOS 생성',CANCELLED:'취소'}[check?.status]??'정보 없음';
  const connection=connectionHealth(worker);
  return `<a class="back-link" href="#workers">← 작업자 목록</a><div class="worker-hero surface"><div class="worker-avatar">${escape(worker.name.slice(0,1))}</div><div class="worker-identity"><h1>${escape(worker.name)}</h1><p>${escape(worker.id)} · ${escape(worker.zone?.name??'구역 미배정')}</p><div>${badge(worker.status)} ${badge(connection)}</div></div><button class="danger-button" data-worker-sos="${escape(worker.id)}">긴급 SOS 발송</button></div>
    <div class="cards worker-metrics"><div class="card"><span>심박수</span><strong>${metric(worker.vitals?.heartRate,'bpm')}</strong><small>최근 측정 ${date(worker.vitals?.measuredAt)}</small></div><div class="card"><span>혈중산소포화도</span><strong>${metric(worker.vitals?.spo2,'%')}</strong><small>최근 측정 ${date(worker.vitals?.measuredAt)}</small></div><div class="card"><span>마지막 통신</span><strong class="metric-date">${date(worker.lastSeenAt)}</strong><small>연결 상태 ${escape({ONLINE:'온라인',STALE:'통신 지연',OFFLINE:'오프라인'}[connection])}</small></div></div>
    <div class="worker-detail-grid"><section class="surface"><div class="surface-head"><div><h2>생체신호 추이</h2><p>심박수·혈중산소포화도 측정 이력</p></div></div>${vitalsChart(worker.vitalsHistory)}</section>
    <section class="surface safety-panel"><div class="surface-head"><div><h2>안전확인 · 자동 SOS</h2><p>NFC 자가 안전확인 상태</p></div>${badge(check?.status==='SOS_SENT'?'DANGER':check?.status==='CONFIRMED'?'NORMAL':'WARNING')}</div><div class="safety-state"><strong>${checkLabel}</strong><span>${check?.status==='PENDING'?`미응답 시 ${remain} 후 자동 SOS 이벤트 생성`:'미응답 기한에 따라 SOS가 처리됩니다.'}</span></div><dl><dt>확인 주기</dt><dd>${check?.intervalMinutes?`${escape(check.intervalMinutes)}분마다`:'정보 없음'}</dd><dt>최근 NFC 확인</dt><dd>${date(check?.lastConfirmedAt)}</dd><dt>요청 시각</dt><dd>${date(check?.requestedAt)}</dd><dt>다음 요청</dt><dd>${date(check?.nextRequestAt)}</dd><dt>응답 기한</dt><dd>${date(check?.dueAt)}</dd><dt>태그 ID</dt><dd>${escape(check?.tagId??'정보 없음')}</dd></dl><button data-safety-request="${escape(worker.id)}">안전확인 재요청</button><p class="muted">실제 NFC 확인·스피커 SOS는 작업자 앱과 서버에서 수행해야 합니다.</p></section></div>
    <section class="surface worker-events"><div class="surface-head"><div><h2>위험 이벤트</h2><p>이 작업자의 이벤트 이력</p></div></div>${eventsTable(events)}</section>`;
}
