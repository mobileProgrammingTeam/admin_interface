import { config } from '../config.js';
import { request } from './http.js';
import { createMockRepository } from '../mock/repository.js';
const realApi = {
  workers:()=>request('/workers/status'),
  addWorker:body=>request('/workers',{method:'POST',body}),
  worker:id=>request(`/workers/${encodeURIComponent(id)}`),
  workerWarnings:()=>request('/restricted-areas/warnings'),
  workerMessages:()=>request('/restricted-areas/responses'),
  sendRestrictedResponse:(id,body)=>request(`/workers/${encodeURIComponent(id)}/restricted-response`,{method:'POST',body}),
  requestSafetyCheck:id=>request(`/workers/${encodeURIComponent(id)}/safety-check`,{method:'POST'}),
  sendSOS:id=>request(`/workers/${encodeURIComponent(id)}/sos`,{method:'POST'}),
  weather:()=>request('/weather/current'),
  weatherNotices:()=>request('/weather/notices'),
  sendWeatherNotice:body=>request('/weather/notices',{method:'POST',body}),
  events:(filters={})=>request(`/events?${new URLSearchParams(Object.entries(filters).filter(([,v])=>v))}`),
  event:id=>request(`/events/${encodeURIComponent(id)}`),
  auditHistory:()=>request('/audit/events'),
  settings:()=>request('/settings'),
  saveSettings:body=>request('/settings',{method:'PATCH',body}),
  admins:()=>request('/admins'),
  addAdmin:body=>request('/admins',{method:'POST',body}),
  toggleAdmin:id=>request(`/admins/${encodeURIComponent(id)}/toggle`,{method:'PATCH'}),
  changeAdminRole:(id,role)=>request(`/admins/${encodeURIComponent(id)}/role`,{method:'PATCH',body:{role}}),
  updateEvent:(id,action,note)=>request(`/events/${encodeURIComponent(id)}/${action}`,{method:'PATCH',body:action==='resolve'?{note}: {}})
};
export const api = config.mock ? createMockRepository(localStorage) : realApi;
