# 작업자 현재 상태: 서버 응답 기준

2026-11-10 확인. 기존 제안서는 `worker-status-api-proposal.md`에 보존했습니다.
서버 master의 AdminUiModels.WorkerStatus 및 AdminDomainApiController 기준입니다.

## 요청

`GET /api/admin/workers/status?page=0&size=20`

한 명의 상태: `GET /api/admin/workers/{workerId}/status`

`GET /api/admin/workers`는 이름·성별·나이·계정 활성 여부를 제공하는 별도 기본정보 API입니다.
관리자 로그인 세션이 필요합니다. 쓰기 요청에는 CSRF 토큰도 필요합니다.

## 응답 예시

아래는 작업자 한 명으로 줄인 구조 설명용 예시입니다.

```json
{
  "items": [
    {
      "workerId": 101,
      "workerName": "김민준",
      "status": "DANGER",
      "monitoringStatus": "RUNNING",
      "connectionStatus": "ONLINE",
      "connectionHealth": "ONLINE",
      "zoneName": "A 작업구역",
      "lastSeenAt": "2026-11-01T23:58:00Z",
      "heartRateStatus": "DANGER",
      "spo2Status": "NORMAL",
      "measuredAt": "2026-11-01T23:57:00Z",
      "devices": [
        {"type": "휴대폰", "lastSeenAt": "2026-11-01T23:58:00Z"},
        {"type": "워치", "lastSeenAt": "2026-11-01T23:57:00Z"}
      ],
      "safetyCheck": {
        "status": "PENDING",
        "tagId": "NFC-A-12",
        "intervalMinutes": 30,
        "requestedAt": "2026-11-01T23:57:00Z",
        "dueAt": "2026-11-02T00:00:00Z",
        "lastConfirmedAt": null,
        "nextRequestAt": null
      },
      "proximity": null
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

## 웹에서 읽는 방식

서버 JSON은 그대로 받되, `js/api/server-adapter.js`에서 기존 화면용 객체로 변환합니다.

| 서버 필드 | 화면 내부 필드 | 의미 |
| --- | --- | --- |
| items | 작업자 배열 | totalPages까지 조회한 목록 |
| workerId (숫자) | id (문자열) | 작업자 식별자 |
| workerName | name | 이름 |
| status | status | 전체 안전 상태 |
| monitoringStatus | monitoringStatus | 모니터링 상태 |
| connectionStatus | connectionStatus | 앱 연결 상태 |
| connectionHealth | connectionHealth | 서버가 제공한 연결 상태 판정 |
| zoneName | zone.name | 작업구역 이름 |
| lastSeenAt | lastSeenAt | 마지막 앱 통신 시각 |
| heartRateStatus | vitals.heartRateStatus | 심장박동 상태 |
| spo2Status | vitals.spo2Status | 산소포화도 상태 |
| measuredAt | vitals.measuredAt | 생체 상태 기준 시각 |
| devices | devices | 기기별 마지막 통신 시각 |
| safetyCheck | safetyCheck | 안전확인 상태·시각 |
| proximity | proximity | 접근·제한구역 상태 |

서버에 구역 ID가 없으므로 기존 구역 화면의 그룹화 키에는 zoneName을 사용합니다. 이는 서버의 실제 zone ID가 아니며, 구역 이름 중복 시 별도 ID 협의가 필요합니다.

proximity가 있으면 beaconId, restrictedAreaId, distanceMeters, thresholdMeters, measuredAt, insideRestricted, insideSince, status, dwellMinutes를 포함합니다.
watchConnectionStatus는 없습니다. devices의 워치 통신 시각을 어떻게 상태로 판단할지는 별도 협의합니다.

## 현재 예시에서 관찰되는 상태값

| 필드 | 값 |
| --- | --- |
| status | NORMAL, DANGER, WARNING, OFFLINE |
| monitoringStatus | RUNNING, STOPPED |
| connectionStatus | ONLINE, OFFLINE |
| connectionHealth | ONLINE, STALE, OFFLINE |
| heartRateStatus / spo2Status | NORMAL, DANGER, UNKNOWN |
| safetyCheck.status | PENDING, CONFIRMED, UNKNOWN |

서버 DTO는 이 필드들을 문자열로 정의합니다. 위 목록은 예시에서 확인한 값이며 최종 enum 계약이 아닙니다.
생체신호 UNKNOWN·누락·미지원 값은 확인 불가로 표시하며 NORMAL로 바꾸지 않습니다.
웹은 서버의 status를 그대로 표시합니다. 생체신호 OR 판정, 낙상·접근 위험 우선순위, 정상 복귀 및 오래된 데이터 기준은 서버 담당자와 협의합니다.

## 오류

성공 응답에 data/error 봉투는 없습니다. HTTP 오류 시 별도 `{ "code": "오류 코드", "message": "오류 설명" }` 객체를 받습니다.
HTTP 상태 코드로 성공·실패를 구분하고 빈 items는 정상적인 빈 목록으로 처리합니다.

## 현재 연동 범위

- 수신 형식과 화면 변환 코드만 수정했습니다. config.mock은 true로 유지됩니다.
- config.apiBaseUrl은 `/api`까지 지정하며 adapter가 `/admin`을 붙입니다.
- 서버 주소 전환·로그인·CSRF·CORS·실시간 갱신 연결은 별도 작업입니다. mock만 false로 바꿔서는 인증 연결이 완성되지 않습니다.
- 현재 서버 상태 API는 고정 예시 데이터입니다. 실제 센서 데이터 수신은 서버 측 구현 대상입니다.
- 현재 상세 상태 API는 요청 ID에 첫 번째 예시 작업자 정보를 붙여 반환합니다. 따라서 다른 작업자 상세의 이름·상태 일치는 서버 수정 후 검증해야 합니다.

## 관련 코드

- 서버: https://github.com/mobileProgrammingTeam/server/blob/master/src/main/java/org/example/workersafety_server/dto/AdminUiModels.java
- 웹: js/api/http.js (JSON 수신), js/api/server-adapter.js (필드·목록 변환)
- 이벤트 등 다른 응답 대응: server-api-mapping.md
