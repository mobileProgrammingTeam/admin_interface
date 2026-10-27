import { escape } from '../components/ui.js';

export function settingsPage(settings) {
  return `<div class="page-heading"><div><p class="eyebrow">운영 설정</p><h1>설정</h1><p class="muted">알림 우선순위와 통신 이상 표시 기준을 관리합니다.</p></div></div>
    <section class="panel settings-panel"><h2>모니터링 기준</h2><form id="settings-form">
      <label>우선 알림 위험도<select name="alertSeverity"><option value="MEDIUM" ${settings.alertSeverity==='MEDIUM'?'selected':''}>보통 이상</option><option value="HIGH" ${settings.alertSeverity==='HIGH'?'selected':''}>높음 이상</option><option value="CRITICAL" ${settings.alertSeverity==='CRITICAL'?'selected':''}>긴급만</option></select></label>
      <label>통신 지연 기준 (분)<input name="staleMinutes" type="number" min="1" max="60" required value="${escape(settings.staleMinutes)}"></label>
      <label>오프라인 기준 (분)<input name="offlineMinutes" type="number" min="2" max="240" required value="${escape(settings.offlineMinutes)}"></label>
      <button>설정 저장</button>
    </form><p class="hint">우선 알림 위험도는 관리자 화면의 강조 기준입니다. 실제 푸시 알림·위험 판단 기준은 서버와 현장 정책에서 별도로 정해야 합니다.</p></section>`;
}
