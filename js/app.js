import { config } from './config.js';
import { api } from './api/index.js';
import { auth } from './services/auth.js';
import { startRefresh } from './services/realtime.js';
import { escape } from './components/ui.js';
import { dashboard } from './pages/dashboard.js';
import { workersPage, workerDetail } from './pages/workers.js';
import { eventsPage, eventDetail } from './pages/events.js';
import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { alertsPage } from './pages/alerts.js';
import { connectivityPage } from './pages/connectivity.js';
import { reportsPage } from './pages/reports.js';
import { settingsPage } from './pages/settings.js';
import { adminsPage } from './pages/admins.js';
import { zonesPage, zoneDetail } from './pages/zones.js';
import { weatherPage } from './pages/weather.js';
import { auditRows } from './domain.js';
const app=document.querySelector('#app'), notice=document.querySelector('#notice'), dialog=document.querySelector('#detail');
let user=null, stopRefresh=()=>{}, generation=0, eventFilters={}, workerFilters={}, reportFilters={}, modalVersion=0;
function message(text) { notice.textContent=text; }
function loggedOut() {
  user=null;generation++;modalVersion++;stopRefresh();dialog.close();
  document.querySelector('#shell').classList.add('logged-out');document.querySelector('#sidebar').hidden=true;
  document.querySelector('#nav').hidden=true;document.querySelector('#header-actions').hidden=true;document.querySelector('#logout').hidden=true;
  app.innerHTML=loginPage(config.mock);app.setAttribute('aria-busy','false');
}
async function render({quiet=false}={}) {
  if(!user) return;
  const version=++generation;
  const route=location.hash.slice(1)||'dashboard';
  if(!quiet) {app.setAttribute('aria-busy','true');app.innerHTML='<p>불러오는 중…</p>';}
  try {
    let html;
    if(route==='dashboard') {
      const [workers,events]=await Promise.all([api.workers(),api.events()]);html=dashboard({workers,events});
    } else if(route==='alerts') {
      const [workers,events,settings]=await Promise.all([api.workers(),api.events(),api.settings()]);html=alertsPage(events,workers,settings);
    } else if(route==='connectivity') {
      const [workers,events,settings]=await Promise.all([api.workers(),api.events(),api.settings()]);html=connectivityPage(workers,events,settings);
    } else if(route==='reports') {
      const [events,history]=await Promise.all([api.events(),api.auditHistory()]);html=reportsPage(events,history,reportFilters);
    } else if(route==='settings') html=settingsPage(await api.settings());
    else if(route==='admins') {const [admins,workers]=await Promise.all([api.admins(),api.workers()]);html=adminsPage(admins,workers);}
    else if(route==='zones') {const [workers,warnings,messages]=await Promise.all([api.workers(),api.workerWarnings(),api.workerMessages()]);html=zonesPage(workers,warnings,messages);}
    else if(route.startsWith('zones/')) html=zoneDetail(await api.workers(),decodeURIComponent(route.slice(6)));
    else if(route==='weather') {const [weather,notices]=await Promise.all([api.weather(),api.weatherNotices()]);html=weatherPage(weather,notices);}
    else if(route==='workers') {const [workers,events]=await Promise.all([api.workers(),api.events()]);html=workersPage(workers,workerFilters,events);}
    else if(route.startsWith('workers/')) {
      const id=decodeURIComponent(route.slice(8));const [w,events]=await Promise.all([api.worker(id),api.events({workerId:id})]);html=workerDetail(w,events);
    } else if(route==='events') html=eventsPage(await api.events(eventFilters));
    else html='<h1>페이지를 찾을 수 없습니다.</h1><a href="#dashboard">대시보드로 이동</a>';
    if(version!==generation || !user) return;
    // 갱신 중 입력 중인 검색어와 포커스를 보존합니다.
    if(quiet && app.contains(document.activeElement) && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    app.innerHTML=html;
    const filters=route==='events'?eventFilters:route==='reports'?reportFilters:workerFilters;
    for(const [name,value] of Object.entries(filters)) { const input=app.querySelector(`[name="${name}"]`);if(input) input.value=value; }
    document.querySelectorAll('nav a, #header-actions a').forEach(a=>{if(a.hash.slice(1)===route.split('/')[0])a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  } catch(error) {
    if(version!==generation || !user) return;
    if(!quiet) app.innerHTML=`<p class="error">${escape(error.message)}</p><button id="retry">다시 시도</button>`;
    else message(`갱신 실패: ${error.message} (기존 데이터 표시 중)`);
    throw error;
  } finally { if(version===generation) app.setAttribute('aria-busy','false'); }
}
async function enter() {
  document.querySelector('#shell').classList.remove('logged-out');document.querySelector('#sidebar').hidden=false;
  document.querySelector('#nav').hidden=false;document.querySelector('#header-actions').hidden=false;document.querySelector('#logout').hidden=false;
  stopRefresh();stopRefresh=startRefresh(()=>render({quiet:true}));
  await render().catch(()=>{});
}
async function showEvent(id) {
  const version=++modalVersion;
  try {const e=await api.event(id);if(version!==modalVersion||!user)return;document.querySelector('#detail-body').innerHTML=eventDetail(e);if(!dialog.open)dialog.showModal();}
  catch(error){message(error.message);}
}
document.querySelector('#close-detail').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{modalVersion++;});
document.querySelector('#logout').addEventListener('click',async()=>{try{await auth.logout();loggedOut();message('로그아웃했습니다.');}catch(e){message(e.message);}});
window.addEventListener('auth-expired',()=>{loggedOut();message('인증이 만료되었습니다. 다시 로그인하세요.');});
window.addEventListener('hashchange',()=>{dialog.close();void render().catch(()=>{});});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.event)void showEvent(button.dataset.event);
  if(button.id==='open-register' && !user) {app.innerHTML=registerPage(config.mock);message('');app.querySelector('input')?.focus();}
  if(button.id==='back-login' && !user) {app.innerHTML=loginPage(config.mock);message('');app.querySelector('button')?.focus();}
  if(button.id==='retry')void render().catch(()=>{});
  if(button.id==='reset-demo') {try{api.reset();message('샘플 데이터를 초기화했습니다.');}catch(e){message(e.message);}}
  if(button.id==='export-report') void exportReport();
  if(button.dataset.adminToggle) void api.toggleAdmin(button.dataset.adminToggle).then(()=>render()).then(()=>message('관리자 상태를 변경했습니다.')).catch(e=>message(e.message));
  if(button.dataset.safetyRequest) void api.requestSafetyCheck(button.dataset.safetyRequest).then(()=>render()).then(()=>message('안전확인을 다시 요청했습니다.')).catch(e=>message(e.message));
  if(button.dataset.workerSos) void (async()=>{try {if(!window.confirm('이 작업자에 대한 긴급 SOS 이벤트를 생성하시겠습니까?'))return;await api.sendSOS(button.dataset.workerSos);await render();message('긴급 SOS 이벤트를 생성했습니다.');}catch(e){message(e.message);}})();
});
async function exportReport() {
  try {
    const [events,history]=await Promise.all([api.events(),api.auditHistory()]);
    const rows=auditRows(events,history).filter(r=>(!reportFilters.action||r.action===reportFilters.action)&&(!reportFilters.q||`${r.workerName} ${r.eventId} ${r.actor}`.toLowerCase().includes(reportFilters.q.toLowerCase())));
    const quote=value=>{const safe=String(value??'').replace(/^[\s\u0000-\u001f]*[=+\-@]/,match=>`'${match}`);return `"${safe.replaceAll('"','""')}"`;};
    const csv='\uFEFF'+[['처리 시각','이벤트 ID','작업자','처리','처리자','대응 메모'],...rows.map(r=>[r.at,r.eventId,r.workerName,r.action==='acknowledge'?'확인':'해결',r.actor,r.note])].map(row=>row.map(quote).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='safety-event-report.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  } catch(error) {message(error.message);}
}
document.addEventListener('submit',async event=>{
  const form=event.target;if(!['login-form','register-form','worker-filter','event-filter','report-filter','event-action','settings-form','admin-form','worker-create-form','weather-notice-form'].includes(form.id)&&!form.classList.contains('admin-role-form')&&!form.classList.contains('restricted-response-form'))return;
  event.preventDefault();const fields=Object.fromEntries(new FormData(form));const button=event.submitter;
  if(button)button.disabled=true;message('');
  try {
    if(form.id==='login-form'){user=await auth.login(fields.email,fields.password);await enter();}
    if(form.id==='register-form'){
      if(!config.mock) throw new Error('계정 생성 서버가 아직 연결되지 않았습니다.');
      if(fields.password.length<8) throw new Error('비밀번호는 8자 이상 입력하세요.');
      if(fields.password!==fields.passwordConfirm) throw new Error('비밀번호가 일치하지 않습니다.');
      await api.addWorker({name:fields.name,email:fields.email});
      form.reset();app.innerHTML=loginPage(config.mock);
      message('시연용 작업자 정보를 등록했습니다. 실제 로그인 계정은 생성되지 않았습니다. 샘플 관리자 입장 후 작업자 목록에서 확인하세요.');
    }
    if(form.id==='worker-filter'){workerFilters=fields;await render();}
    if(form.id==='event-filter'){eventFilters=fields;await render();}
    if(form.id==='report-filter'){reportFilters=fields;await render();}
    if(form.id==='settings-form'){await api.saveSettings(fields);await render();message('설정을 저장했습니다.');}
    if(form.id==='admin-form'){await api.addAdmin(fields);await render();message('관리자를 추가했습니다.');}
    if(form.id==='worker-create-form'){await api.addWorker(fields);await render();message('작업자를 추가했습니다.');}
    if(form.id==='weather-notice-form'){await api.sendWeatherNotice(fields,user?.name??'관리자');await render();message('주의 메시지를 기록했습니다.');}
    if(form.classList.contains('restricted-response-form')){await api.sendRestrictedResponse(form.dataset.id,fields,user?.name??'관리자');await render();message('제한구역 대응 메시지를 기록했습니다.');}
    if(form.classList.contains('admin-role-form')){await api.changeAdminRole(form.dataset.id,fields.role);await render();message('관리자 역할을 변경했습니다.');}
    if(form.id==='event-action'){
      await api.updateEvent(form.dataset.id,button.value,fields.note??'',user?.name??'기록 없음');
      message('처리 상태를 저장했습니다.');await showEvent(form.dataset.id);await render({quiet:true});
    }
  }catch(error){message(error.message);}finally{if(button)button.disabled=false;}
});
try {user=await auth.me();if(user)await enter();else loggedOut();}catch(error){loggedOut();message(error.message);}
