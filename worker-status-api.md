# 작업자 현재 상태 API 응답 형식 제안

관리자 웹에서 작업자 현재 상태를 표시하기 위해 아래 형식으로 응답을 요청합니다.
회의 전 초안이며 API 경로, 인증 방식, 상태값 및 갱신 규칙은 협의가 필요합니다.

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

## 협의 사항

- 각 상태 필드의 가능한 값과 판정 기준
- 생체신호 위험 발생 및 정상 복귀 전달 방식(심장박동 정확한 기준이 존재해야함)
- 미연결·미수신·오래된 데이터를 정상과 구분하는 방법
- 심장박동과 산소포화도의 측정 시각을 분리할지 여부(현재는 event값만으로 테스트)
- watchConnectionStatus 추가 여부(추후에 의논)
- 실제 API 경로, 인증 방식 및 Realtime 전달 형식
