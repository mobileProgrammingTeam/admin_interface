import test from 'node:test';
import assert from 'node:assert/strict';
import {vitalStatus} from '../js/domain.js';
test('생체신호별 위험은 확인 후 유지되고 해결 후 해제된다',()=>{
  const e={workerId:'w1',type:'VITAL_ABNORMAL',status:'NEW',affectedMetrics:['spo2']};
  assert.equal(vitalStatus('w1','spo2',[e]),'DANGER');
  assert.equal(vitalStatus('w1','heartRate',[e]),'NORMAL');
  assert.equal(vitalStatus('w2','spo2',[e]),'NORMAL');
  assert.equal(vitalStatus('w1','spo2',[{...e,status:'ACKNOWLEDGED'}]),'DANGER');
  assert.equal(vitalStatus('w1','spo2',[{...e,status:'RESOLVED'}]),'NORMAL');
  assert.equal(vitalStatus('w1','spo2',[{...e,status:'RESOLVED'},e]),'DANGER');
});
test('낙상·센서 수치로 생체신호 위험을 추정하지 않고 기존 이상 이벤트는 보수적으로 표시한다',()=>{
  assert.equal(vitalStatus('w1','heartRate',[{workerId:'w1',type:'FALL',status:'NEW',vitals:{heartRate:200}}]),'NORMAL');
  for(const metric of ['heartRate','spo2']) assert.equal(vitalStatus('w1',metric,[{workerId:'w1',type:'VITAL_ABNORMAL',status:'NEW'}]),'DANGER');
});
