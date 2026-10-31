import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../js/api/http.js';
import { workerVitalStatus } from '../js/domain.js';
import { workersTable } from '../js/components/ui.js';

const worker={id:'worker-001',name:'작업자 1',status:'DANGER',monitoringStatus:'RUNNING',connectionStatus:'ONLINE',lastSeenAt:'2026-10-31T05:20:02Z',vitals:{heartRateStatus:'NORMAL',spo2Status:'DANGER',measuredAt:'2026-10-31T05:20:00Z'}};
test('합의한 응답을 조회하여 data만 전달하고 생체신호 상태를 화면에 표시한다',async t=>{
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.ok(url.endsWith('/workers/status'));assert.equal(options.method,'GET');assert.equal(options.headers.Accept,'application/json');
    return new Response(JSON.stringify({data:[worker],error:null}));
  });
  const data=await request('/workers/status');assert.deepEqual(data,[worker]);
  assert.match(workersTable(data,[]),/badge NORMAL.*정상.*badge DANGER.*위험/);
  assert.equal(workerVitalStatus(worker,'heartRate',[{workerId:worker.id,type:'VITAL_ABNORMAL',status:'NEW'}]),'NORMAL');
  assert.equal(workerVitalStatus(worker,'spo2',[]),'DANGER');
  assert.equal(workerVitalStatus({id:'missing'},'spo2',[]),'UNKNOWN');
});
test('HTTP 실패와 error 응답의 코드 및 메시지를 전달한다',async t=>{
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({data:null,error:{code:'FORBIDDEN',message:'접근 권한 없음'}}),{status:403}));
  await assert.rejects(request('/workers/status'),e=>e.status===403&&e.code==='FORBIDDEN'&&e.message==='접근 권한 없음');
});
test('빈 목록은 성공, 잘못된 응답 구조 및 HTML 서버 오류는 실패로 처리한다',async t=>{
  const replies=[new Response(JSON.stringify({data:[],error:null})),new Response('{}'),new Response('<html>Server error</html>',{status:502}),new Response(null,{status:204})];
  t.mock.method(globalThis,'fetch',async()=>replies.shift());
  assert.deepEqual(await request('/workers/status'),[]);
  await assert.rejects(request('/workers/status'),e=>e.code==='INVALID_RESPONSE');
  await assert.rejects(request('/workers/status'),e=>e.status===502);
  assert.equal(await request('/auth/logout',{method:'POST'}),null);
});
