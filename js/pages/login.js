export function loginPage(mock) {
  return `<section class="login"><h1>관리자 로그인</h1>${mock?'<p>실제 인증과 현장 데이터는 연결되지 않았습니다.</p>':'<p>관리자 계정으로 로그인하세요.</p>'}<form id="login-form">${mock?'':'<label>이메일<input name="email" type="email" autocomplete="username" required></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label>'}<button>${mock?'샘플 관리자 입장':'로그인'}</button></form>${mock?'<button id="reset-demo">샘플 데이터 초기화</button>':''}</section>`;
}
