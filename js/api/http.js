import { config } from '../config.js'; //config.js에 있는 설정 가져옴
export class ApiError extends Error {
  constructor(message,status,code=null) { super(message); this.name='ApiError'; this.status=status; this.code=code; }
}
export async function request(path, {method='GET',body} = {}) 
{
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),config.timeoutMs); 
  try {
    const response=await fetch(`${config.apiBaseUrl}${path}`, {method,credentials:'include',signal:controller.signal,headers:{Accept:'application/json',...(body!==undefined ? {'Content-Type':'application/json'} : {})}, ...(body!==undefined ? {body:JSON.stringify(body)} : {})});
    if(response.status===401 && typeof window!=='undefined') window.dispatchEvent(new Event('auth-expired'));
    if(response.status===204) return null;
    let payload;
    try { payload=await response.json(); }
    catch(error) {
      if(error.name==='AbortError') throw error;
      throw new ApiError(response.ok ? '서버 응답이 JSON 형식이 아닙니다.' : `요청 실패 (${response.status})`,response.status,'INVALID_JSON');
    }
    if(!response.ok || payload?.error!=null) {
      const detail=typeof payload?.error==='string' ? payload.error : payload?.error?.message;
      throw new ApiError(detail || `요청 실패 (${response.status})`,response.status,payload?.error?.code??null);
    }
    // 화면에는 전체 응답이 아니라 data 안의 객체 또는 목록을 전달합니다.
    if(!payload || typeof payload!=='object' || Array.isArray(payload)
      || !Object.hasOwn(payload,'data') || !Object.hasOwn(payload,'error')) {
      throw new ApiError('서버 응답에 data와 error 필드가 필요합니다.',response.status,'INVALID_RESPONSE');
    }
    return payload.data;
  } catch(error) {
    if(error.name==='AbortError') throw new Error('응답 시간이 초과되었습니다. 다시 시도하세요.');
    throw error;
  } finally { clearTimeout(timer); }
}


//7번째 줄 : 현재 인증 코드는 쿠키 방식 가정. / 서버가 토큰 방식 사용 시 이 부분을 맞춰야 함.

// 401: 인증이 필요하거나 만료됐다는 뜻입니다. 앱에 auth-expired 이벤트를 알려 기존 로그인 처리 코드가 반응하게 합니다.
// 204: 요청은 성공했지만 응답 본문이 없다는 뜻입니다. JSON을 읽지 않고 끝냅니다.

// auth-expired는 웹 내부 알림

// 13번째 줄 : 서버가 보낸 JSON을 JavaScript 객체로 읽습니다.
// 서버가 JSON 대신 HTML 오류 페이지 등을 보내면 별도의 오류로 처리합니다.


//16번째 줄 : ApiError는 이때 오류 메시지뿐 아니라 HTTP 상태 코드와 서버 오류 코드도 함께 보관하는 오류 객체입니다.

// 18번째 줄 : !response.ok: HTTP 응답이 성공 범위인 200~299가 아닌 경우
// payload?.error != null: JSON에 오류 정보가 들어 있는 경우

// 27번째 줄 : return payload.data -> 서버는 
//{
  //data: [작업자1, 작업자2],
  //error: null
//}
// 이런식으로 주지면 받는 결과는 [작업자1, 작업자2] -> 그래서 그냥 workers[0].name 이런식으로 사용


// 최종 : worker.vitals.heartRateStatus -> 다른 곳에서 웹 화면으로 띄움.