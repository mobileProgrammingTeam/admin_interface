import { labels, workerVitalStatus } from '../domain.js';
import { config } from '../config.js';
export const workerVitalBadge = (worker,metric,events=[]) => {
  const status=workerVitalStatus(worker,metric,events,config.mock);
  return status==='UNKNOWN' ? '<span class="badge">확인 불가</span>' : status==='DISCONNECTED' ? '<span class="badge OFFLINE">미연결</span>' : badge(status);
};
export const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const date = value => value && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat('ko-KR',{dateStyle:'short',timeStyle:'medium',timeZone:'Asia/Seoul'}).format(new Date(value)) : '정보 없음';
export const metric = (value,unit) => value == null ? '측정값 없음' : `${escape(value)} ${unit}`;
export const badge = value => `<span class="badge ${Object.hasOwn(labels,value)?value:''}">${escape(labels[value]??value??'정보 없음')}</span>`;
export const options = values => '<option value="">전체</option>'+values.map(v=>`<option value="${v}">${labels[v]}</option>`).join('');
export function table(headers,rows) { return rows.length ? `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '<p class="empty">표시할 데이터가 없습니다.</p>'; }
export function workersTable(workers, events = []) { return table(['작업자','상태','구역','심장박동','산소포화도','마지막 통신'],workers.map(w=>`<tr><td><a href="#workers/${encodeURIComponent(w.id)}">${escape(w.name)}</a></td><td>${badge(w.status)}</td><td>${escape(w.zone?.name??'정보 없음')}</td><td>${workerVitalBadge(w,'heartRate',events)}</td><td>${workerVitalBadge(w,'spo2',events)}</td><td>${date(w.lastSeenAt)}</td></tr>`)); }
export function eventsTable(events) { return table(['발생 시각 (한국)','작업자','유형','위험도','처리 상태','상세'],[...events].sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt)).map(e=>`<tr><td>${date(e.occurredAt)}</td><td>${escape(e.workerName??e.workerId)}</td><td>${badge(e.type)}</td><td>${badge(e.severity)}</td><td>${badge(e.status)}</td><td><button data-event="${escape(e.id)}">상세 보기</button></td></tr>`)); }
