import { config } from '../config.js';
import { request } from '../api/http.js';
const key='safety-admin-demo-session';
export const auth = {
  async me() { return config.mock ? (sessionStorage.getItem(key) ? {name:'샘플 관리자'} : null) : request('/auth/me'); },
  async login(email,password) {
    if(config.mock) { sessionStorage.setItem(key,'true'); return {name:'샘플 관리자'}; }
    return request('/auth/login',{method:'POST',body:{email,password}});
  },
  async logout() { if(config.mock) sessionStorage.removeItem(key); else await request('/auth/logout',{method:'POST'}); }
};
