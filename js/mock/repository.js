import { seed } from './data.js';
import { filterEvents, proximityStatus, restrictedDwellMinutes, transition } from '../domain.js';
const key = 'safety-admin-demo-v1';
export function createMockRepository(storage) {
  function read() {
    const saved = storage.getItem(key);
    if (!saved) return seed();
    try {
      const data=JSON.parse(saved);
      if (!Array.isArray(data.workers)||!Array.isArray(data.events)) throw Error();
      let changed=false;
      const defaults=seed();
      if (!data.events.some(e=>e.id==='event-manual-demo')) { data.events.push(defaults.events.find(e=>e.id==='event-manual-demo')); changed=true; }
      for (const id of ['worker-001','worker-002','worker-003']) {
        const worker=data.workers.find(w=>w.id===id), example=defaults.workers.find(w=>w.id===id);
        if (!worker) continue;
        for (const field of ['safetyCheck','proximity','vitalsHistory']) if (worker[field]===undefined && example[field]!==undefined) {
          if(field==='vitalsHistory' && worker.vitals?.measuredAt) {
            const shift=Date.parse(worker.vitals.measuredAt)-Date.parse(example.vitals.measuredAt);
            worker[field]=example[field].map(point=>({...point,at:new Date(Date.parse(point.at)+shift).toISOString()}));
          } else worker[field]=example[field];
          changed=true;
        }
        if(worker.proximity&&example.proximity) for(const field of ['restrictedAreaId','insideRestricted','insideSince','warningSentAt']) if(worker.proximity[field]===undefined) {worker.proximity[field]=example.proximity[field];changed=true;}
      }
      if (!data.weather) {data.weather=defaults.weather;changed=true;}
      if (!Array.isArray(data.weatherNotices)) {data.weatherNotices=[];changed=true;}
      if (!Array.isArray(data.workerWarnings)) {data.workerWarnings=[];changed=true;}
      if (!Array.isArray(data.workerMessages)) {data.workerMessages=[];changed=true;}
      for (const worker of data.workers) {
        const check=worker.safetyCheck;
        if(check?.status==='CONFIRMED' && check.nextRequestAt && Date.parse(check.nextRequestAt)<=Date.now()) {
          const now=Date.now();check.status='PENDING';check.requestedAt=new Date(now).toISOString();check.dueAt=new Date(now+3*60000).toISOString();check.nextRequestAt=null;changed=true;
        }
        if (check?.status!=='PENDING' || !check.dueAt || Date.parse(check.dueAt)>Date.now()) continue;
        check.status='SOS_SENT';
        const id=`sos-${worker.id}-${Date.parse(check.dueAt)}`;
        if (!data.events.some(e=>e.id===id)) data.events.push({id,workerId:worker.id,workerName:worker.name,type:'AUTO_SOS',severity:'CRITICAL',status:'NEW',message:'NFC 안전확인 미응답으로 자동 SOS가 생성되었습니다.',zone:worker.zone,vitals:worker.vitals,occurredAt:new Date().toISOString(),receivedAt:new Date().toISOString(),acknowledgedAt:null,resolvedAt:null,note:''});
        changed=true;
      }
      for (const worker of data.workers) {
        const proximity=worker.proximity;
        if(proximityStatus(proximity)!=='DANGER'||proximity.warningSentAt) continue;
        const now=new Date().toISOString();proximity.warningSentAt=now;
        data.workerWarnings.push({id:`warning-${worker.id}-${Date.parse(now)}`,workerId:worker.id,workerName:worker.name,restrictedAreaId:proximity.restrictedAreaId,at:now,message:'제한구역에 접근했습니다. 즉시 안전 구역으로 이동하세요.',deliveryStatus:'DEMO'});
        const existing=data.events.some(e=>e.type==='DANGER_ZONE_ENTRY'&&e.workerId===worker.id&&Date.parse(e.occurredAt)>=Date.parse(proximity.measuredAt)-60000);
        if(proximity.insideRestricted&&!existing) data.events.push({id:`restricted-${worker.id}-${Date.parse(now)}`,workerId:worker.id,workerName:worker.name,type:'DANGER_ZONE_ENTRY',severity:'HIGH',status:'NEW',message:'작업자가 제한구역에 들어갔습니다.',zone:worker.zone,vitals:worker.vitals,occurredAt:now,receivedAt:now,acknowledgedAt:null,resolvedAt:null,note:''});
        changed=true;
      }
      if(changed) write(data);
      return data;
    }
    catch { throw new Error('샘플 저장 데이터가 손상되었습니다. 로그인 화면에서 샘플 데이터를 초기화하세요.'); }
  }
  function write(data) { storage.setItem(key, JSON.stringify(data)); }
  if (!storage.getItem(key)) write(seed());
  return {
    async workers() { return read().workers; },
    async addWorker(input) {
      const name=String(input.name??'').trim();
      if(!name||name.length>50) throw new Error('작업자 이름을 확인하세요.');
      const data=read();
      const zoneId=String(input.zoneId??'');
      const zone=zoneId ? data.workers.find(w=>w.zone?.id===zoneId)?.zone : null;
      if(zoneId&&!zone) throw new Error('작업 구역을 찾을 수 없습니다.');
      const numbers=data.workers.map(w=>Number(/^worker-(\d+)$/.exec(w.id)?.[1]??0));
      const id=`worker-${String(Math.max(0,...numbers)+1).padStart(3,'0')}`;
      const worker={id,name,status:'OFFLINE',connectionStatus:'OFFLINE',zone:zone??null,vitals:{heartRate:null,spo2:null,measuredAt:null},lastSeenAt:null,devices:[]};
      data.workers.push(worker);write(data);return worker;
    },
    async worker(id) { const w=read().workers.find(w=>w.id===id); if(!w) throw new Error('작업자를 찾을 수 없습니다.'); return w; },
    async workerWarnings() {return read().workerWarnings;},
    async workerMessages() {return read().workerMessages;},
    async sendRestrictedResponse(id,input,actor='샘플 관리자') {
      const message=String(input.message??'').trim();
      if(!message||message.length>500) throw new Error('대응 메시지는 1~500자로 입력하세요.');
      const data=read(),worker=data.workers.find(w=>w.id===id);
      if(!worker) throw new Error('작업자를 찾을 수 없습니다.');
      if(proximityStatus(worker.proximity)!=='DANGER'||restrictedDwellMinutes(worker.proximity)<10) throw new Error('현재 장기 체류 기준에 해당하지 않습니다.');
      const record={id:`restricted-response-${Date.now()}`,workerId:id,workerName:worker.name,actor,message,at:new Date().toISOString(),deliveryStatus:'DEMO'};
      data.workerMessages.push(record);write(data);return record;
    },
    async requestSafetyCheck(id) {
      const data=read(),worker=data.workers.find(w=>w.id===id);
      if(!worker) throw new Error('작업자를 찾을 수 없습니다.');
      const now=Date.now();worker.safetyCheck={...(worker.safetyCheck??{}),status:'PENDING',requestedAt:new Date(now).toISOString(),dueAt:new Date(now+3*60000).toISOString(),nextRequestAt:null};
      write(data);return worker.safetyCheck;
    },
    async sendSOS(id) {
      const data=read(),worker=data.workers.find(w=>w.id===id);
      if(!worker) throw new Error('작업자를 찾을 수 없습니다.');
      const now=new Date().toISOString();
      const event={id:`admin-sos-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,workerId:id,workerName:worker.name,type:'ADMIN_SOS',severity:'CRITICAL',status:'NEW',message:'관리자가 긴급 SOS를 요청했습니다.',zone:worker.zone,vitals:worker.vitals,occurredAt:now,receivedAt:now,acknowledgedAt:null,resolvedAt:null,note:''};
      data.events.push(event);write(data);return event;
    },
    async weather() {return read().weather;},
    async weatherNotices() {return read().weatherNotices;},
    async sendWeatherNotice(input,actor='샘플 관리자') {
      const message=String(input.message??'').trim();
      if(!message||message.length>500) throw new Error('주의 메시지는 1~500자로 입력하세요.');
      const data=read();const notice={id:`weather-notice-${Date.now()}`,message,actor,createdAt:new Date().toISOString(),recipientCount:(data.admins??seed().admins).filter(a=>a.active).length};
      data.weatherNotices.push(notice);write(data);return notice;
    },
    async events(filters) { return filterEvents(read().events,filters); },
    async event(id) { const e=read().events.find(e=>e.id===id); if(!e) throw new Error('이벤트를 찾을 수 없습니다.'); return e; },
    async auditHistory() { return read().auditHistory ?? []; },
    async settings() { return read().settings ?? seed().settings; },
    async saveSettings(input) {
      const staleMinutes=Number(input.staleMinutes), offlineMinutes=Number(input.offlineMinutes);
      if (!Number.isInteger(staleMinutes)||staleMinutes<1||staleMinutes>60||!Number.isInteger(offlineMinutes)||offlineMinutes<=staleMinutes||offlineMinutes>240||!['MEDIUM','HIGH','CRITICAL'].includes(input.alertSeverity)) throw new Error('설정 값을 확인하세요. 오프라인 기준은 지연 기준보다 커야 합니다.');
      const data=read();data.settings={staleMinutes,offlineMinutes,alertSeverity:input.alertSeverity};write(data);return data.settings;
    },
    async admins() { return read().admins ?? seed().admins; },
    async addAdmin(input) {
      const name=String(input.name??'').trim(),email=String(input.email??'').trim().toLowerCase(),role=input.role;
      if (!name||name.length>50||!/^\S+@\S+\.\S+$/.test(email)||email.length>120||!['ADMIN','VIEWER'].includes(role)) throw new Error('관리자 정보를 확인하세요.');
      const data=read();data.admins ??= seed().admins;
      if(data.admins.some(a=>a.email.toLowerCase()===email)) throw new Error('이미 등록된 이메일입니다.');
      const admin={id:`admin-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name,email,role,active:true};data.admins.push(admin);write(data);return admin;
    },
    async toggleAdmin(id) {
      const data=read();data.admins ??= seed().admins;
      const admin=data.admins.find(a=>a.id===id);
      if(!admin) throw new Error('관리자를 찾을 수 없습니다.');
      if(admin.role==='SUPER_ADMIN') throw new Error('총괄 관리자는 중지할 수 없습니다.');
      admin.active=!admin.active;write(data);return admin;
    },
    async changeAdminRole(id,role) {
      if(!['ADMIN','VIEWER'].includes(role)) throw new Error('허용되지 않은 역할입니다.');
      const data=read();data.admins ??= seed().admins;
      const admin=data.admins.find(a=>a.id===id);
      if(!admin) throw new Error('관리자를 찾을 수 없습니다.');
      if(admin.role==='SUPER_ADMIN') throw new Error('총괄 관리자 역할은 변경할 수 없습니다.');
      admin.role=role;write(data);return admin;
    },
    async updateEvent(id,action,note,actor='샘플 관리자') {
      const data=read(); const index=data.events.findIndex(e=>e.id===id);
      if(index<0) throw new Error('이벤트를 찾을 수 없습니다.');
      data.events[index]=transition(data.events[index],action,note);
      const updated=data.events[index];
      data.auditHistory ??= [];
      data.auditHistory.push({eventId:id,workerName:updated.workerName,action,at:action==='acknowledge'?updated.acknowledgedAt:updated.resolvedAt,actor,note:action==='resolve'?note:''});
      write(data); return updated;
    },
    reset() { write(seed()); }
  };
}
