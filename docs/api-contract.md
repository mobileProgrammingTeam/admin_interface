# 백엔드 협의용 임시 API 계약

## 2026년 10월 30일 UI 변경

- 심장박동·산소포화도 수치와 그래프 대신 이벤트 기반 정상/위험을 표시합니다. `VITAL_ABNORMAL`에 `affectedMetrics: ["heartRate"]`, `["spo2"]` 또는 두 값을 추가하여 대상을 구분합니다. 기존 이벤트에서 해당 필드가 없으면 두 항목 모두 위험으로 표시합니다.
- 해당 작업자의 미해결 이상 이벤트가 하나라도 있으면 위험입니다. ACKNOWLEDGED는 위험을 유지하며 모든 해당 이벤트가 RESOLVED가 되면 정상입니다. 정상은 미해결 이벤트가 없다는 뜻이며 실제 생체 상태의 정상 판정이나 통신 연결을 보증하지 않습니다. 마지막 통신 정보는 별도로 표시합니다. 서버는 현재 미해결 이벤트를 누락 없이 반환해야 합니다.
- 로그인 화면의 작업자 계정 생성은 현재 시연용입니다. 이름·이메일을 작업자 목록에 등록하며 비밀번호는 검증 후 폐기합니다. 작업자는 구역 미배정·오프라인 상태로 추가되며 관리자 권한은 부여하지 않습니다. 실제 인증 계정이나 로그인 권한을 생성하지 않습니다. 실제 모드에서는 제출을 비활성화하며 작업자 가입 API 확정 후 연결해야 합니다.
- 긴급 알림·대응 표에서만 위험도 열을 제거합니다. 데이터의 severity 및 다른 화면의 위험도 기능은 유지합니다.

설계 대화의 제안을 실행 가능한 골격으로 옮긴 임시 명세입니다. 팀에서 확정된 명세가 아닙니다.

- 기본 주소: `http://localhost:8000/api`
- 정상 응답: `{ "data": <객체 또는 배열>, "error": null }`
- 오류 응답: `{ "data": null, "error": { "code": "...", "message": "..." } }` + 적절한 HTTP 오류 코드
- 날짜: UTC ISO 8601. 누락 값은 null. 목록은 빈 경우 [] 반환.
- 현재 실제 API 어댑터는 HttpOnly 세션 쿠키와 credentials: include를 가정합니다. CORS는 프런트 origin을 명시하고 credentials를 허용해야 합니다. 운영 시 쿠키 SameSite/Secure 및 CSRF 방어는 서버와 협의해야 합니다. Supabase JWT 방식으로 확정되면 어댑터를 변경합니다.

| 메서드 | 경로 | data / 요청 |
| --- | --- | --- |
| POST | /auth/login | 요청 {email,password}, 응답 {id,name} |
| GET | /auth/me | {id,name}, 미인증 시 401 |
| POST | /auth/logout | 세션 무효화, 204 |
| GET | /workers/status | Worker[] (현재 전체 목록) |
| POST | /workers | 요청 {name,zoneId}; 새 작업자 등록 (신규 협의 필요) |
| GET | /workers/{id} | Worker |
| GET | /restricted-areas/warnings | 자동 경고 기록 배열 (신규 협의 필요) |
| GET | /restricted-areas/responses | 관리자 제한구역 대응 메시지 배열 (신규 협의 필요) |
| POST | /workers/{id}/restricted-response | 요청 {message}; 서버가 체류 기준·권한을 검증하고 작업자 기기에 전송 (신규 협의 필요) |
| POST | /workers/{id}/safety-check | NFC 안전확인 재요청. 요청 시각·기한·응답 상태를 서버에서 관리 (신규 협의 필요) |
| POST | /workers/{id}/sos | 관리자 긴급 SOS 요청. 서버에서 발송·중복 방지·감사 기록 수행 (신규 협의 필요) |
| GET | /weather/current | 현장 날씨와 관측 시각·출처 (신규 협의 필요) |
| GET / POST | /weather/notices | 관리자 주의 메시지 목록 / 발송 요청 {message} (신규 협의 필요) |
| GET | /events | SafetyEvent[]; status,type,workerId 필터 |
| GET | /events/{id} | SafetyEvent |
| PATCH | /events/{id}/acknowledge | 요청 {}, 응답 SafetyEvent |
| PATCH | /events/{id}/resolve | 요청 {note}, 응답 SafetyEvent |
| GET | /audit/events | 처리 기록 배열: {eventId,workerName,action,at,actor,note}[] (신규 협의 필요) |
| GET / PATCH | /settings | {staleMinutes,offlineMinutes,alertSeverity} (신규 협의 필요) |
| GET / POST | /admins | 관리자 목록 / {name,email,role} 추가 (신규 협의 필요) |
| PATCH | /admins/{id}/toggle | 관리자 활성 상태 변경 (신규 협의 필요) |
| PATCH | /admins/{id}/role | 요청 {role} (신규 협의 필요) |

Worker: id, name, status(NORMAL/WARNING/DANGER/OFFLINE), connectionStatus(ONLINE/OFFLINE), zone({id,name} 또는 null), vitals({heartRate,spo2,measuredAt}), lastSeenAt. 기기 상태 화면을 위해 devices:[{type,lastSeenAt}] 추가 협의 필요. 작업자 상세를 위해 vitalsHistory:[{at,heartRate,spo2}], safetyCheck:{status,tagId,lastConfirmedAt,requestedAt,dueAt} 추가 협의 필요. 현장 구역 화면을 위해 proximity:{beaconId,zoneName,restrictedAreaId,distanceMeters,thresholdMeters,measuredAt,insideRestricted,insideSince,warningSentAt} 추가 협의 필요.

SafetyEvent: id, workerId, workerName, type(FALL/DANGER_ZONE_ENTRY/VITAL_ABNORMAL/MANUAL_REPORT/AUTO_SOS/ADMIN_SOS), severity(LOW/MEDIUM/HIGH/CRITICAL), status(REQUEST/NEW/ACKNOWLEDGED/RESOLVED), message, zone, vitals({heartRate,spo2}), occurredAt, receivedAt, acknowledgedAt, resolvedAt, note. 직접 신고는 MANUAL_REPORT + REQUEST로 접수하고 REQUEST → ACKNOWLEDGED → RESOLVED로 처리합니다.

제한구역 흐름은 2단계입니다. 비콘 거리 기준 이하의 최신 측정(5분 이내)에 대해 1단계 작업자 자동 경고를 기록하고, 실제 내부 진입이면 DANGER_ZONE_ENTRY 이벤트를 생성합니다. 내부 체류 10분 이상인 최신 측정에 한해 2단계 관리자 대응 메시지를 작성합니다. 실제 거리 판정, 자동 경고 발송, 체류시간 검증과 메시지 전송은 작업자 앱·서버에서 수행해야 합니다. 현재 지도는 예시 배치도이며 실제 위치를 표시하지 않습니다.

NFC 미응답 자동 SOS의 최종 판정은 작업자 앱·서버에서 수행해야 합니다. 이 웹의 샘플 저장소는 NFC 응답 기한이 지난 것을 조회할 때 자동 SOS 이벤트를 생성하지만 외부 스피커나 알림을 보내지 않습니다. 관리자 긴급 SOS와 날씨 주의 메시지도 샘플 모드에서는 브라우저 기록만 생성합니다.

정확한 샘플은 `js/mock/data.js`에 있습니다. 원시 가속도나 BLE 신호 분석은 관리자 웹에서 수행하지 않습니다.

서버는 관리자 권한과 NEW → ACKNOWLEDGED → RESOLVED 전이를 검증합니다. 동시 처리 충돌은 409로 반환하고 화면이 다시 조회하도록 합니다. 처리 관리자 ID와 감사 기록은 서버에서 인증된 관리자 기준으로 저장해야 합니다.

Realtime은 미연결이며 현재 15초 폴링으로 전체 목록을 교체합니다. 따라서 중복 이벤트 추가 누적은 없습니다. 향후 Supabase 알림을 받으면 서버 상태를 다시 조회하고, 구독 해제·재연결·누락 복구·event.id 중복 제거를 함께 구현합니다.
