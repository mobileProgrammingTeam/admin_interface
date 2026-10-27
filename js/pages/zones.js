import { badge, date, escape, table } from '../components/ui.js';
import { proximityStatus, restrictedDwellMinutes } from '../domain.js';

const siteMap=`<div class="site-map"><svg viewBox="0 0 940 410" role="img" aria-label="예시 현장 전체지도. A동, B동, C동, 관리동과 빨간 제한구역"><rect x="0" y="0" width="940" height="410" rx="18" fill="#ecf3f6"/><path d="M0 205H940M235 0V410M690 0V410" stroke="#d0dbe4" stroke-width="42"/><path d="M0 205H940M235 0V410M690 0V410" stroke="#f9fbfd" stroke-width="34"/><rect x="42" y="38" width="150" height="120" rx="12" fill="#fff" stroke="#cbd9e7" stroke-width="2"/><text x="117" y="103" text-anchor="middle">A동</text><rect x="295" y="35" width="235" height="125" rx="12" fill="#fff" stroke="#cbd9e7" stroke-width="2"/><text x="412" y="105" text-anchor="middle">B동</text><rect x="746" y="40" width="145" height="118" rx="12" fill="#fff" stroke="#cbd9e7" stroke-width="2"/><text x="818" y="106" text-anchor="middle">관리동</text><rect x="48" y="257" width="142" height="112" rx="12" fill="#fff" stroke="#cbd9e7" stroke-width="2"/><text x="119" y="319" text-anchor="middle">C동</text><rect x="293" y="258" width="250" height="112" rx="12" fill="#fff" stroke="#cbd9e7" stroke-width="2"/><text x="418" y="320" text-anchor="middle">자재 보관동</text><rect x="749" y="253" width="144" height="117" rx="12" fill="#ffe4e6" stroke="#ea5a62" stroke-width="3"/><text x="821" y="310" text-anchor="middle" fill="#c82f3b" font-weight="800">제한구역</text><text x="821" y="333" text-anchor="middle" fill="#d85a63" font-size="13">출입 제한</text></svg></div>`;

export function zonesPage(workers,warnings=[],messages=[]) {
  const zones=[...workers.reduce((map,worker)=>{
    const id=worker.zone?.id??'unassigned',name=worker.zone?.name??'미배정';
    if(!map.has(id)) map.set(id,{id,name,workers:[]});
    map.get(id).workers.push(worker);return map;
  },new Map()).values()];
  const near=workers.filter(w=>proximityStatus(w.proximity)==='DANGER');
  return `<div class="page-heading"><div><p class="eyebrow">SITE ZONES</p><h1>현장 구역</h1><p class="muted">등록된 작업 구역별 작업자 수와 안전 상태를 확인합니다.</p></div></div>
    <section class="surface site-overview"><div class="surface-head"><div><h2>전체지도 예시</h2><p>건물 배치와 제한구역 위치</p></div><span class="badge WARNING">예시 지도</span></div>${siteMap}<div class="map-legend"><span><i class="map-key building"></i>건물</span><span><i class="map-key restricted"></i>제한구역</span></div><p class="muted">지도는 시연용 배치도이며 작업자 실시간 위치는 표시하지 않습니다.</p></section>
    <div class="cards zone-cards">${zones.map(z=>`<a class="card zone-card" href="#zones/${encodeURIComponent(z.id)}"><span class="zone-symbol">⌖</span><strong>${escape(z.name)}</strong><span>작업자 ${z.workers.length}명</span><small>주의·위험 ${z.workers.filter(w=>['WARNING','DANGER'].includes(w.status)).length}명</small></a>`).join('')}</div>
    <section class="surface restricted-flow"><div class="surface-head"><div><h2>제한구역 접근 감지</h2><p>1단계 자동 경고 · 2단계 관리자 대응</p></div><a href="#events">이벤트 이력 보기 →</a></div>
      <div class="flow-steps"><div><strong>1단계 · 자동 경고</strong><span>비콘 측정 거리가 기준 이하가 되면 위험 이벤트와 작업자 경고를 생성합니다.</span></div><div><strong>2단계 · 관리자 대응</strong><span>제한구역 내부 체류가 10분 이상이면 관리자가 대응 메시지를 작성합니다.</span></div></div>
      ${near.length?table(['작업자','제한구역 거리','체류','1단계 경고','2단계 대응'],near.map(w=>{const p=w.proximity,dwell=restrictedDwellMinutes(p),warning=warnings.find(item=>item.workerId===w.id),latest=[...messages].reverse().find(item=>item.workerId===w.id);return `<tr><td><a href="#workers/${encodeURIComponent(w.id)}">${escape(w.name)}</a></td><td><span class="badge DANGER">${escape(p.distanceMeters)} m / 기준 ${escape(p.thresholdMeters)} m</span></td><td>${p.insideRestricted?`제한구역 내부 ${dwell}분`:'접근 중'}</td><td>${warning?`<span class="badge WARNING">자동 경고 생성</span><small class="table-note">${date(warning.at)}</small>`:'경고 대기'}</td><td>${dwell>=10?`<form class="restricted-response-form" data-id="${escape(w.id)}"><input name="message" maxlength="500" required aria-label="${escape(w.name)} 대응 메시지" placeholder="대응 메시지 입력"><button>대응 메시지 보내기</button></form>${latest?`<small class="table-note">최근 작성: ${date(latest.at)}</small>`:''}`:'체류 기준 미달'}</td></tr>`;})):'<p class="empty">현재 제한구역 접근 대상이 없습니다.</p>'}
      <p class="hint">현재 자동 경고와 관리자 메시지는 브라우저에 시연 기록만 남깁니다. 실제 작업자 기기 전송은 서버·모바일 앱 연결이 필요합니다.</p></section>
    <p class="hint">작업자에게 등록된 구역 기준입니다. 실내 측위 담당자의 데이터가 연결되면 현재 위치 기준으로 전환할 수 있습니다.</p>`;
}

export function zoneDetail(workers,id) {
  const rows=workers.filter(w=>(w.zone?.id??'unassigned')===id);
  if(!rows.length) return '<h1>구역을 찾을 수 없습니다.</h1><a href="#zones">현장 구역으로 돌아가기</a>';
  const name=rows[0].zone?.name??'미배정';
  return `<a class="back-link" href="#zones">← 현장 구역</a><div class="page-heading"><div><p class="eyebrow">ZONE DETAIL</p><h1>${escape(name)}</h1><p class="muted">등록 작업자 ${rows.length}명</p></div></div><section class="surface"><h2>구역 작업자</h2>${table(['작업자','안전 상태','통신 상태','상세'],rows.map(w=>`<tr><td>${escape(w.name)}</td><td>${badge(w.status)}</td><td>${badge(w.connectionStatus)}</td><td><a href="#workers/${encodeURIComponent(w.id)}">작업자 보기</a></td></tr>`))}</section>`;
}
