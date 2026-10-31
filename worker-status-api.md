# 작업자 현재 상태 API 응답 형식 제안

관리자 웹에서 작업자 현재 상태를 표시하기 위해 아래 형식으로 응답을 요청합니다.
회의 전 초안입니다. 아래 상태값과 생체신호 OR 판정 규칙을 제안하며, API 경로, 인증 방식, 미수신 상태 및 갱신 규칙은 팀과 협의가 필요합니다.

## 응답 예시

```json
{
  "data": [
    {
      "id": "worker-001",
      "name": "작업자 1",
      "status": "DANGER",
      "monitoringStatus": "RUNNING",
      "connectionStatus": "ONLINE",
      "lastSeenAt": "2026-10-31T05:20:02Z",
      "vitals": {
        "heartRateStatus": "NORMAL",
        "spo2Status": "DANGER",
        "measuredAt": "2026-10-31T05:20:00Z"
      }
    }
  ],
  "error": null
}
```

## 필드 설명

| 필드 | 의미 | 사용 위치 |
| --- | --- | --- |
| id | 작업자 고유 식별자 | 데이터 구분용 |
| name | 작업자 이름 | 작업자가 표시되는 화면 |
| status | 작업자의 전체 안전 상태 | 대시보드 |
| monitoringStatus | 모니터링 실행 여부 | 작업자 |
| connectionStatus | 앱과 서버의 통신 상태 | 긴급 알림·대응 |
| lastSeenAt | 서버가 마지막으로 앱의 통신을 확인한 시각 | 작업자 |
| vitals.heartRateStatus | 이벤트에 따른 심장박동 정상·위험 상태 | 대시보드 |
| vitals.spo2Status | 이벤트에 따른 산소포화도 정상·위험 상태 | 대시보드 |
| vitals.measuredAt | 생체신호 상태의 기준이 된 측정 시각 | 작업자 |
| data | 작업자 목록. 등록된 작업자가 없으면 빈 배열 | 응답 데이터 |
| error | 성공 시 null, 실패 시 오류 정보 | 오류 안내 |

## 데이터 타입과 상태값

상태값은 대문자 문자열로 전달합니다. 예시 값만 전달하는 것이 아니라 각 필드의 허용 값과 의미를 아래와 같이 맞춥니다.

| 필드 | 타입 | 기본 허용 값 또는 형식 |
| --- | --- | --- |
| id | string | 작업자 고유 식별자. 이름이 같아도 ID로 구분 |
| name | string | 화면에 표시할 작업자 이름 |
| status | string (enum) | NORMAL: 정상 / DANGER: 위험 |
| monitoringStatus | string (enum) | RUNNING: 모니터링 실행 중 / STOPPED: 모니터링 종료 |
| connectionStatus | string (enum) | ONLINE: 앱과 서버 통신 연결 / OFFLINE: 통신 끊김 |
| vitals.heartRateStatus | string (enum) | NORMAL: 심장박동 정상 / DANGER: 심장박동 위험 |
| vitals.spo2Status | string (enum) | NORMAL: 산소포화도 정상 / DANGER: 산소포화도 위험 |
| lastSeenAt | string 또는 null | UTC ISO 8601 날짜·시간. 통신 기록이 없으면 null |
| vitals.measuredAt | string 또는 null | UTC ISO 8601 날짜·시간. 측정 기록이 없으면 null |
| data | array 또는 null | 성공 시 작업자 목록, 작업자가 없으면 [], 실패 시 null |
| error | object 또는 null | 성공 시 null, 실패 시 { "code": "오류 코드", "message": "오류 설명" } |

monitoringStatus, connectionStatus는 생체신호 위험 여부와 별개입니다. RUNNING이나 ONLINE이라고 해서 status가 NORMAL인 것은 아닙니다. STOPPED나 OFFLINE을 생체신호 정상으로 해석하지 않습니다.

### 미확인 상태는 별도 협의

위의 정상/위험 두 값은 상태를 판단할 수 있는 유효한 데이터가 있을 때의 기본 값입니다. 최초 미측정, 미수신, 오래된 측정값을 임의로 NORMAL로 채우면 안 됩니다.

status, heartRateStatus, spo2Status에 UNKNOWN(확인 불가)을 추가하는 방안을 회의에서 결정합니다. 현재 UNKNOWN은 확정된 허용 값이 아닙니다. 미확인 상태 표현과 오래된 데이터의 기준을 확정한 뒤 실제 연동합니다.

## 생체신호 OR 판정 규칙

심장박동과 산소포화도 중 하나라도 DANGER이면 작업자의 status는 DANGER입니다.

```text
heartRateStatus == "DANGER" OR spo2Status == "DANGER"
→ status = "DANGER"
```

| heartRateStatus | spo2Status | 생체신호 기준의 status |
| --- | --- | --- |
| NORMAL | NORMAL | NORMAL |
| NORMAL | DANGER | DANGER |
| DANGER | NORMAL | DANGER |
| DANGER | DANGER | DANGER |

위 표는 두 생체신호의 상태가 모두 유효하게 판단된 경우에 적용합니다. 두 값 모두 DANGER가 아니더라도 미확인 값이 포함되면 NORMAL이라고 추정하지 않습니다.

예를 들어 응답 예시에서는 심장박동은 NORMAL이지만 산소포화도가 DANGER이므로 status도 DANGER입니다.

- 앱에서 전달한 생체신호 판정 결과를 바탕으로 서버가 일관된 현재 상태를 응답합니다. 웹은 해당 상태를 표시하며 원시 측정값으로 의료적 위험을 다시 판정하지 않습니다.
- 하나라도 위험이면 다른 항목이 정상으로 복귀해도 전체 status는 DANGER를 유지합니다.
- 생체신호 기준으로 NORMAL로 복귀하려면 두 항목 모두 유효한 NORMAL 상태여야 합니다. 관리자 알림 확인·해결 처리만으로 생체신호 상태를 NORMAL로 바꾸지 않습니다.
- status는 전체 안전 상태이므로 낙상·위험구역 접근 등 다른 위험이 존재하는 경우까지 두 생체신호만으로 NORMAL이라고 확정하지 않습니다. 다른 위험의 반영 및 해제 규칙은 별도로 협의합니다. 위 OR 조건은 하나라도 위험하면 반드시 DANGER가 된다는 조건입니다.
- 두 생체신호 상태와 status는 같은 응답에서 서로 모순되지 않게 전달합니다. Realtime 갱신에도 같은 규칙을 적용합니다.

## 협의 사항

- 각 상태 필드의 가능한 값과 판정 기준
- 생체신호 위험 발생 및 정상 복귀 전달 방식(심장박동 정확한 기준이 존재해야함)
- 미연결·미수신·오래된 데이터를 정상과 구분하는 방법
- 심장박동과 산소포화도의 측정 시각을 분리할지 여부(현재는 event값만으로 테스트)
- watchConnectionStatus 추가 여부(추후에 의논)
- 실제 API 경로, 인증 방식 및 Realtime 전달 형식
