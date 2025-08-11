# 🛠️ 커밋 문서화 도구 사용 가이드

## 📋 개요
이 도구는 중요한 커밋에 대한 상세한 변경사항 문서를 자동으로 생성합니다.
팀원 간 코드 리뷰와 커뮤니케이션을 개선하기 위해 도입되었습니다.

## 🎯 언제 사용하나요?

다음과 같은 커밋에 대해 문서를 생성하세요:

### ✅ 문서화 대상 커밋
- ✨ **새로운 주요 기능 추가** (예: 인증 시스템, API 엔드포인트)
- 🔐 **보안 관련 변경사항** (예: 암호화, 권한 관리)
- 📦️ **아키텍처/구조 변경** (예: 폴더 구조, 데이터베이스 스키마)
- 🔧 **중요한 설정 변경** (예: 환경변수, 빌드 설정)
- **대규모 변경** (5개 이상 파일 수정)

### ❌ 문서화 불필요 커밋
- 🐛 단순 버그 수정
- 📝 문서 수정만
- 🎨 코드 포맷팅
- 🚀 배포 관련 작업

## 🚀 사용 방법

### 1단계: 스크립트 실행

```bash
# 프로젝트 루트에서 실행
./docs/tools/generate-commit-doc.sh <커밋해시> <기능명>

# 예시
./docs/tools/generate-commit-doc.sh 4633e17 jwt-auth-utils
```

### 2단계: 자동 생성된 문서 확인

생성 위치: \`docs/commits/YYYY-MM-DD-기능명.md\`

### 3단계: 문서 내용 보완

자동 생성된 문서에서 다음 항목들을 **반드시 수동으로 채워주세요**:

- 🎯 **목적 및 배경**: 왜 이 변경이 필요했는지
- 🔍 **주요 변경사항**: 각 파일별 구체적 변경 내용
- 🧪 **테스트 결과**: 실행한 테스트와 결과
- ⚠️ **리뷰 포인트**: 팀원들이 특히 봐야 할 부분

## 💡 사용 팁

### Windows 사용자
Git Bash나 WSL을 사용하여 스크립트를 실행하세요.

### 스크립트 실행 권한 문제 해결
```bash
# Linux/Mac/WSL
chmod +x docs/tools/generate-commit-doc.sh

# Windows (Git Bash)
git update-index --chmod=+x docs/tools/generate-commit-doc.sh
```

### 커밋 해시 찾기
```bash
# 최근 커밋들 확인
git log --oneline -5

# 특정 브랜치의 커밋들 확인
git log --oneline feature/your-branch
```

## 📁 생성되는 파일 구조

```
docs/commits/
├── 2024-01-11-jwt-auth-utils.md
├── 2024-01-12-user-management.md
└── 2024-01-13-image-upload.md
```

## 🔧 문제 해결 (Troubleshooting)

### Q: "Permission denied" 오류가 발생해요
A: 스크립트에 실행 권한을 부여하세요.
```bash
chmod +x docs/tools/generate-commit-doc.sh
```

### Q: "invalid commit hash" 오류가 발생해요
A: 커밋 해시를 다시 확인하세요.
```bash
git log --oneline -10  # 최근 10개 커밋 확인
```

### Q: Windows에서 스크립트가 실행되지 않아요
A: Git Bash를 사용하거나, WSL을 설치하여 실행하세요.

### Q: 생성된 문서를 어떻게 편집하나요?
A: 
```bash
# VS Code 사용자
code docs/commits/2024-01-11-jwt-auth-utils.md

# 다른 에디터 사용자
vim docs/commits/2024-01-11-jwt-auth-utils.md
```

## 📞 도움이 필요하면?

1. **Issue 생성**: GitHub Issues에 문제 상황을 자세히 설명
2. **팀원 문의**: Slack이나 팀 채널에서 도움 요청
3. **문서 개선**: 이 가이드에서 부족한 부분이 있다면 수정 제안

## ⚡ 빠른 참조

```bash
# 문서 생성
./docs/tools/generate-commit-doc.sh <해시> <기능명>

# 권한 부여 (최초 1회)
chmod +x docs/tools/generate-commit-doc.sh

# 최근 커밋 확인
git log --oneline -10

# 생성된 문서 편집
code docs/commits/파일명.md
```

---

💡 **꿀팁**: 중요한 작업을 완료한 후에는 즉시 문서를 생성하는 습관을 만들어보세요!