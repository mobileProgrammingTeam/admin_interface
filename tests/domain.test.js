import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockRepository } from '../js/mock/repository.js';
import { auditRows, connectionHealth, filterEvents, proximityStatus, summarize, transition } from '../js/domain.js';
import { escape, metric } from '../js/components/ui.js';
import { workerDetail } from '../js/pages/workers.js';
import { zonesPage } from '../js/pages/zones.js';
import { weatherPage } from '../js/pages/weather.js';
function storage(){const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
test('확인 및 해결 결과가 저장소 재생성 후에도 유지된다',async()=>{
  const s=storage();let api=createMockRepository(s);
  await assert.rejects(api.updateEvent('event-001','resolve',''),/상태/);
  await api.updateEvent('event-001','acknowledge');
  api=createMockRepository(s);assert.equal((await api.event('event-001')).status,'ACKNOWLEDGED');
  await api.updateEvent('event-001','resolve','현장 확인 완료');
  const result=await createMockRepository(s).event('event-001');assert.equal(result.status,'RESOLVED');assert.equal(result.note,'현장 확인 완료');assert.ok(result.resolvedAt);
  await assert.rejects(api.updateEvent('event-001','acknowledge'),/상태/);
});
test('필터와 요약이 변경 상태 및 빈 목록을 반영한다',async()=>{
  const api=createMockRepository(storage());const workers=await api.workers();const events=await api.events();
  assert.equal(summarize(workers,events).pending,3);
  assert.equal(filterEvents(events,{workerId:'worker-001',status:'NEW'}).length,1);
  assert.equal(filterEvents(events,{type:'UNKNOWN'}).length,0);
  assert.equal(summarize([],[]).pending,0);
});
test('알 수 없는 동작 거부, 외부 문자열 escape, null 측정값 구별',()=>{
  assert.throws(()=>transition({status:'NEW'},'invalid'));
  assert.equal(escape('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
  assert.equal(metric(null,'bpm'),'측정값 없음');assert.equal(metric(0,'bpm'),'0 bpm');
});
test('통신 상태는 마지막 통신 시각으로 분류하고 처리 이력은 재접속 후 유지된다',async()=>{
  const now=Date.now();
  assert.equal(connectionHealth({connectionStatus:'ONLINE',lastSeenAt:new Date(now-6*60_000).toISOString()},now),'STALE');
  assert.equal(connectionHealth({connectionStatus:'ONLINE',lastSeenAt:new Date(now-16*60_000).toISOString()},now),'OFFLINE');
  const s=storage();let api=createMockRepository(s);
  await api.updateEvent('event-001','acknowledge','','테스트 관리자');
  api=createMockRepository(s);
  const rows=auditRows(await api.events(),await api.auditHistory());
  assert.ok(rows.some(r=>r.eventId==='event-001'&&r.action==='acknowledge'&&r.actor==='테스트 관리자'));
});
test('직접 위험 신고는 요청으로 접수되어 확인 후 해결된다',async()=>{
  const api=createMockRepository(storage());
  const request=await api.event('event-manual-demo');
  assert.equal(request.type,'MANUAL_REPORT');assert.equal(request.status,'REQUEST');
  assert.equal((await api.updateEvent(request.id,'acknowledge')).status,'ACKNOWLEDGED');
  assert.equal((await api.updateEvent(request.id,'resolve','현장 확인')).status,'RESOLVED');
});
test('설정과 관리자 변경이 저장되며 잘못된 설정을 거부한다',async()=>{
  const s=storage();let api=createMockRepository(s);
  await assert.rejects(api.saveSettings({staleMinutes:'10',offlineMinutes:'5',alertSeverity:'HIGH'}));
  await api.saveSettings({staleMinutes:'8',offlineMinutes:'20',alertSeverity:'MEDIUM'});
  const admin=await api.addAdmin({name:'운영자',email:'operator@example.invalid',role:'ADMIN'});
  await api.changeAdminRole(admin.id,'VIEWER');await api.toggleAdmin(admin.id);
  api=createMockRepository(s);
  assert.equal((await api.settings()).staleMinutes,8);
  assert.equal((await api.admins()).find(a=>a.id===admin.id).active,false);
  assert.equal((await api.admins()).find(a=>a.id===admin.id).role,'VIEWER');
});
test('관리자 화면에서 추가한 작업자는 오프라인으로 저장되고 목록에 남는다',async()=>{
  const s=storage();let api=createMockRepository(s);
  const worker=await api.addWorker({name:'새 작업자',zoneId:'zone-a'});
  assert.equal(worker.status,'OFFLINE');assert.equal(worker.zone.name,'A 작업구역');
  api=createMockRepository(s);
  assert.equal((await api.workers()).find(w=>w.id===worker.id).name,'새 작업자');
  await assert.rejects(api.addWorker({name:'다른 작업자',zoneId:'missing'}),/구역/);
});
test('NFC 미응답은 자동 SOS 이벤트를 한 번만 생성한다',async()=>{
  const s=storage();let api=createMockRepository(s);
  const data=JSON.parse(s.getItem('safety-admin-demo-v1'));
  data.workers[0].safetyCheck.dueAt=new Date(Date.now()-1000).toISOString();
  s.setItem('safety-admin-demo-v1',JSON.stringify(data));
  assert.equal((await api.worker('worker-001')).safetyCheck.status,'SOS_SENT');
  assert.equal((await api.events({type:'AUTO_SOS'})).length,1);
  api=createMockRepository(s);
  assert.equal((await api.events({type:'AUTO_SOS'})).length,1);
});
test('NFC 주기가 지나면 새 안전확인을 요청 대기로 전환한다',async()=>{
  const s=storage();const api=createMockRepository(s);
  const data=JSON.parse(s.getItem('safety-admin-demo-v1'));
  data.workers[1].safetyCheck.nextRequestAt=new Date(Date.now()-1000).toISOString();
  s.setItem('safety-admin-demo-v1',JSON.stringify(data));
  const check=(await api.worker('worker-002')).safetyCheck;
  assert.equal(check.status,'PENDING');assert.ok(Date.parse(check.dueAt)>Date.now());
});
test('접근 거리, SOS, 날씨 메시지와 새 화면 데이터가 연결된다',async()=>{
  const api=createMockRepository(storage());
  const worker=await api.worker('worker-003');
  assert.equal(proximityStatus(worker.proximity),'DANGER');
  assert.doesNotMatch(workerDetail(worker,[]),/위험 구역 접근 감지/);
  assert.match(zonesPage(await api.workers(),await api.workerWarnings(),[]),/제한구역 접근 감지/);
  assert.match(zonesPage(await api.workers()),/작업자 2명/);
  assert.match(weatherPage(await api.weather(),[]),/현재 날씨/);
  await api.sendSOS(worker.id);
  assert.equal((await api.events({type:'ADMIN_SOS'})).length,1);
  await api.sendWeatherNotice({message:'고온 주의'},'테스트 관리자');
  assert.equal((await api.weatherNotices())[0].message,'고온 주의');
});
test('제한구역 접근은 자동 경고를 한 번 기록하고 장기 체류 때 관리자 대응을 받는다',async()=>{
  const s=storage();let api=createMockRepository(s);
  const warnings=await api.workerWarnings();
  assert.equal(warnings.filter(w=>w.workerId==='worker-003').length,1);
  assert.equal((await api.events({type:'DANGER_ZONE_ENTRY'})).length,1);
  api=createMockRepository(s);
  assert.equal((await api.workerWarnings()).filter(w=>w.workerId==='worker-003').length,1);
  const response=await api.sendRestrictedResponse('worker-003',{message:'즉시 안전 구역으로 이동하세요.'},'현장 관리자');
  assert.equal(response.workerId,'worker-003');
  assert.equal((await api.workerMessages()).length,1);
  await assert.rejects(api.sendRestrictedResponse('worker-002',{message:'이동하세요.'}),/장기 체류/);
});
