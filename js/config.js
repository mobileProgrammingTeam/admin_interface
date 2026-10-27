// 백엔드 계약 확정 후 mock을 false로 바꾸고 주소를 지정합니다.
export const config = Object.freeze({ mock: true, apiBaseUrl: 'http://localhost:8000/api', pollIntervalMs: 15000, timeoutMs: 10000 });
