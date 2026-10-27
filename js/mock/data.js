export function seed() {
  const now = new Date().toISOString();
  const zone = { id:'zone-a', name:'A 작업구역' };
  const workers = [
    {id:'worker-001',name:'작업자 1',status:'DANGER',connectionStatus:'ONLINE',zone,vitals:{heartRate:118,spo2:91,measuredAt:now},lastSeenAt:now},
    {id:'worker-002',name:'작업자 2',status:'NORMAL',connectionStatus:'ONLINE',zone,vitals:{heartRate:76,spo2:98,measuredAt:now},lastSeenAt:now},
    {id:'worker-003',name:'작업자 3',status:'WARNING',connectionStatus:'ONLINE',zone:{id:'zone-b',name:'B 작업구역'},vitals:{heartRate:102,spo2:96,measuredAt:now},lastSeenAt:now},
    {id:'worker-004',name:'작업자 4',status:'OFFLINE',connectionStatus:'OFFLINE',zone:null,vitals:{heartRate:null,spo2:null,measuredAt:null},lastSeenAt:new Date(Date.now()-3600000).toISOString()}
  ];
  workers[0].devices=[{type:'휴대폰',lastSeenAt:now},{type:'워치',lastSeenAt:now}];
  workers[1].devices=[{type:'휴대폰',lastSeenAt:now},{type:'워치',lastSeenAt:now}];
  workers[2].devices=[{type:'휴대폰',lastSeenAt:now},{type:'워치',lastSeenAt:new Date(Date.now()-7*60000).toISOString()}];
  workers[3].devices=[{type:'휴대폰',lastSeenAt:workers[3].lastSeenAt},{type:'워치',lastSeenAt:null}];
  workers[0].vitalsHistory=[
    {at:new Date(Date.now()-25*60000).toISOString(),heartRate:86,spo2:98},
    {at:new Date(Date.now()-20*60000).toISOString(),heartRate:92,spo2:97},
    {at:new Date(Date.now()-15*60000).toISOString(),heartRate:89,spo2:98},
    {at:new Date(Date.now()-10*60000).toISOString(),heartRate:103,spo2:96},
    {at:new Date(Date.now()-5*60000).toISOString(),heartRate:108,spo2:95},
    {at:now,heartRate:118,spo2:91}
  ];
  workers[0].safetyCheck={status:'PENDING',tagId:'NFC-A-12',intervalMinutes:30,lastConfirmedAt:null,requestedAt:now,dueAt:new Date(Date.now()+3*60000).toISOString(),nextRequestAt:null};
  workers[1].safetyCheck={status:'CONFIRMED',tagId:'NFC-A-08',intervalMinutes:30,lastConfirmedAt:now,requestedAt:now,dueAt:null,nextRequestAt:new Date(Date.now()+30*60000).toISOString()};
  workers[2].safetyCheck={status:'CONFIRMED',tagId:'NFC-B-07',intervalMinutes:30,lastConfirmedAt:now,requestedAt:now,dueAt:null,nextRequestAt:new Date(Date.now()+30*60000).toISOString()};
  workers[2].proximity={beaconId:'BEACON-B-03',zoneName:'제한구역',restrictedAreaId:'restricted-1',distanceMeters:1.6,thresholdMeters:2,measuredAt:now,insideRestricted:true,insideSince:new Date(Date.now()-12*60000).toISOString(),warningSentAt:null};
  const events = [
    {id:'event-001',workerId:'worker-001',workerName:'작업자 1',type:'FALL',severity:'CRITICAL',status:'NEW',message:'낙상 감지 샘플 이벤트',zone,vitals:{heartRate:118,spo2:91},occurredAt:now,receivedAt:now,acknowledgedAt:null,resolvedAt:null,note:''},
    {id:'event-002',workerId:'worker-003',workerName:'작업자 3',type:'DANGER_ZONE_ENTRY',severity:'HIGH',status:'ACKNOWLEDGED',message:'작업자가 제한구역에 들어갔습니다.',zone:workers[2].zone,vitals:workers[2].vitals,occurredAt:now,receivedAt:now,acknowledgedAt:now,resolvedAt:null,note:''},
    {id:'event-003',workerId:'worker-002',workerName:'작업자 2',type:'VITAL_ABNORMAL',severity:'MEDIUM',status:'RESOLVED',message:'생체신호 이상 샘플 이벤트',zone,vitals:{heartRate:110,spo2:94},occurredAt:now,receivedAt:now,acknowledgedAt:now,resolvedAt:now,note:'데모 처리 내역'},
    {id:'event-manual-demo',workerId:'worker-002',workerName:'작업자 2',type:'MANUAL_REPORT',severity:'HIGH',status:'REQUEST',message:'작업자가 직접 위험을 신고했습니다. 현장 확인이 필요합니다.',zone,vitals:null,occurredAt:now,receivedAt:now,acknowledgedAt:null,resolvedAt:null,note:''}
  ];
  return {workers, events, workerWarnings:[], workerMessages:[], settings:{staleMinutes:5,offlineMinutes:15,alertSeverity:'HIGH'}, admins:[{id:'admin-001',name:'샘플 관리자',email:'demo@example.invalid',role:'SUPER_ADMIN',active:true}], weather:{siteName:'현장 지역 미설정',temperatureC:33,humidityPercent:68,condition:'더위',measuredAt:now,source:'DEMO'}, weatherNotices:[]};
}
