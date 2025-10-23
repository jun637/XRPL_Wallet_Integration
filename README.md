## XRPL Wallet Integration example

백엔드에서 `xrpl.js`로 XRPL 지갑을 생성하고, 터미널 승인과 웹 화면 조작을 조합해 결제 트랜잭션을 전송하는 과정을 보여주는 Next.js 예제입니다. Girin Wallet 데모 구조를 참고해 WalletConnect 의존성을 제거하고 내부 지갑 중심 흐름으로 재구성했습니다.

### 목적
- XRPL 개발자가 사내에서 생성한 지갑을 웹 애플리케이션과 연동할 때 필요한 최소 구현을 제공
- 최초 연결만 터미널에서 y/n 입력으로 승인하고, 이후 결제는 웹 UI에서 준비/서명하도록 하는 운영 패턴 제시
- 코드와 문서를 함께 참고해 자체 가이드라인 문서를 빠르게 작성할 수 있도록 지원

### 사전 준비
1. Node.js 18 이상
2. `yarn` (Yarn Classic 1.x)
3. 의존성 설치

```bash
yarn
```

### 환경 변수
- 기본 네트워크는 `XRPL_NETWORK=testnet` 입니다.
- `.env` 파일에 아래 값 중 하나를 설정해 환경에 맞는 네트워크를 선택하세요.

```bash
XRPL_NETWORK=testnet   # 기본값, 테스트넷
# XRPL_NETWORK=mainnet
# XRPL_NETWORK=devnet
```

네트워크 설정은 서버에서만 사용되며, `Connect Wallet` 이후 UI에 현재 네트워크와 RPC 엔드포인트가 표시됩니다.

### 실행 순서
1. 개발 서버 실행
   ```bash
   yarn dev
   ```
2. 브라우저에서 `http://localhost:3000` 접속
3. `Connect Wallet` 버튼 클릭 → 터미널에 표시되는 `Approve wallet connection? (y/n)`에 응답해 연결 승인
4. 결제 대상 주소와 금액 입력 후 `Submit` → 같은 줄에 나타나는 `Transaction Sign` 버튼으로 서명과 전송 수행

### 주요 폴더
- `app/` : Next.js App Router 페이지 및 API 라우트
- `app/api/wallet` : 터미널 승인과 XRPL 클라이언트 제출을 처리하는 API 엔드포인트
- `components/` : 버튼, 입력 필드 등 UI 컴포넌트
- `lib/server` : `Wallet.generate()` 결과와 터미널 프롬프트, 네트워크 설정 관리
- `styles/` : Tailwind CSS 글로벌 스타일 정의

### 확장 아이디어
- XRPL 노드에서 Sequence/Fee 정보를 캐싱하거나 모니터링 대시보드에 노출
- CLI 승인 단계를 사내 백오피스 UI로 대체
- Seed를 안전하게 보관하도록 저장소/KMS 연동
- Payment 외의 XRPL 메서드(TrustSet, OfferCreate 등)와 대응하는 UI/엔드포인트 추가

세부 흐름과 사용법은 `app/page.tsx`, `app/api/wallet/*`, `lib/server/*` 파일을 참고하세요.
