# 관리자 웹 위험 이벤트 API

관리자 웹에서 사용하는 PM 서버 응답을 기준으로 정리했다. 이벤트는 발생 내역과 관리자 처리 결과를 기록한다.

## 요청

| 기능 | 메서드와 경로 | 요청 값 |
| --- | --- | --- |
| 목록 조회 | `GET /api/admin/events` | `page`(0부터 시작), `size`, 선택 필터 `processed`, `workerId`, `eventType` |
| 상세 조회 | `GET /api/admin/events/{eventId}` | 조회할 이벤트 ID |
| 처리 완료 | `PATCH /api/admin/events/{eventId}/process` | JSON 본문 `{"adminMemo":"현장 확인 완료"}` |

목록에서 `processed=false`는 미처리, `processed=true`는 처리 완료를 조회한다. 전체 목록에서는 `processed`를 생략한다. 브라우저의 로컬 프록시에서는 위 경로 앞에 `/backend`를 붙인다. 모든 요청에는 관리자 로그인 세션이 필요하며, 처리 완료 요청에는 CSRF 토큰도 필요하다.

## 응답 형식

목록 응답에는 이벤트 배열 `items`와 페이지 정보 `page`, `size`, `totalElements`, `totalPages`가 들어간다. 결과가 없으면 `items`는 빈 배열이다. 상세 조회와 처리 완료 응답은 이벤트 객체 한 건을 반환한다.

아래는 실제 상세 응답의 구조를 바탕으로 식별 정보와 메모를 예시 값으로 바꾼 것이다.

```json
{
  "eventId": 1,
  "workerId": 2,
  "workerName": "테스트 작업자",
  "time": "2026-11-11T14:47:50.920Z",
  "receivedAt": "2026-11-11T14:48:11.502Z",
  "eventType": "FALL_DETECTED",
  "alertSender": "ANDROID_AUTO_SOS",
  "processedAt": "2026-11-12T00:47:07.848Z",
  "processedBy": 1,
  "adminMemo": "현장 확인 완료"
}
```

| 필드 | 의미 |
| --- | --- |
| `eventId`, `workerId`, `workerName` | 이벤트 식별자, 작업자 식별자, 화면에 표시할 작업자 이름 |
| `time`, `receivedAt` | 이벤트 발생 시각과 서버 수신 시각. 예시의 `Z`는 UTC를 뜻한다. |
| `eventType`, `alertSender` | 이벤트 유형과 발신 정보. `FALL_DETECTED`는 화면에 ‘낙상’으로 표시한다. |
| `processedAt`, `processedBy` | 처리 완료 시각과 처리한 관리자 ID. 미처리 상태에서는 `null`이다. |
| `adminMemo` | 관리자가 처리할 때 남긴 대응 메모 |

관리자 웹은 `processedAt`이 비어 있으면 ‘신규’, 값이 있으면 ‘처리 완료’로 표시한다. 처리 결과는 같은 `eventId`의 상세 응답과 `processed=true` 목록에서 확인할 수 있다.
