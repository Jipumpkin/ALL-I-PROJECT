#!/bin/bash

# 커밋 문서 자동 생성 스크립트
# 사용법: ./generate-commit-doc.sh <커밋해시> <기능명>
# 예시: ./generate-commit-doc.sh 4633e17 jwt-auth-utils

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의 (터미널 출력용)
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 인자 체크
if [ $# -lt 2 ]; then
    print_error "사용법이 잘못되었습니다."
    echo "사용법: $0 <커밋해시> <기능명>"
    echo "예시: $0 4633e17 jwt-auth-utils"
    exit 1
fi

COMMIT_HASH=$1
FEATURE_NAME=$2

print_info "커밋 문서 생성을 시작합니다..."
print_info "커밋 해시: ${COMMIT_HASH}"
print_info "기능명: ${FEATURE_NAME}"

# Git 저장소인지 확인
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "현재 디렉토리가 Git 저장소가 아닙니다."
    exit 1
fi

# 커밋 해시 유효성 검증
if ! git cat-file -e "$COMMIT_HASH" 2>/dev/null; then
    print_error "유효하지 않은 커밋 해시입니다: ${COMMIT_HASH}"
    exit 1
fi

# Git에서 커밋 정보 추출
print_info "커밋 정보를 수집 중..."

COMMIT_MESSAGE=$(git log -1 --pretty=%s $COMMIT_HASH | head -1)
COMMIT_BODY=$(git log -1 --pretty=%b $COMMIT_HASH)
AUTHOR=$(git log -1 --pretty=%an $COMMIT_HASH)
DATE=$(git log -1 --pretty=%ad --date=short $COMMIT_HASH)
BRANCH_INFO=$(git log -1 --pretty=%D $COMMIT_HASH)

# 변경된 파일들과 통계
CHANGED_FILES=$(git show --name-only --pretty="" $COMMIT_HASH)
FILE_STATS=$(git show --stat $COMMIT_HASH | head -n -1)  # 마지막 요약 줄 제외

# 파일 상태별 분류
ADDED_FILES=$(git show --name-status --pretty="" $COMMIT_HASH | grep "^A" | cut -f2- || true)
MODIFIED_FILES=$(git show --name-status --pretty="" $COMMIT_HASH | grep "^M" | cut -f2- || true)
DELETED_FILES=$(git show --name-status --pretty="" $COMMIT_HASH | grep "^D" | cut -f2- || true)

# 문서 파일 경로
DOC_FILE="docs/commits/${DATE}-${FEATURE_NAME}.md"

print_info "문서를 생성합니다: ${DOC_FILE}"

# docs/commits 폴더가 없으면 생성
mkdir -p docs/commits

# 문서 생성
cat > "$DOC_FILE" << EOF
# ${COMMIT_MESSAGE}

## 📊 변경 요약
- **브랜치**: ${BRANCH_INFO}
- **커밋 해시**: ${COMMIT_HASH}
- **작업자**: ${AUTHOR}
- **날짜**: ${DATE}

## 🎯 목적 및 배경
${COMMIT_BODY}

## 📁 변경된 파일들

### 📈 변경 통계
\`\`\`
${FILE_STATS}
\`\`\`

### 파일 상세 변경사항
EOF

# 추가된 파일들
if [ ! -z "$ADDED_FILES" ]; then
    echo "" >> "$DOC_FILE"
    echo "#### ✨ 새로 추가된 파일" >> "$DOC_FILE"
    echo "$ADDED_FILES" | while read file; do
        echo "- \`$file\` - [설명 필요]" >> "$DOC_FILE"
    done
fi

# 수정된 파일들
if [ ! -z "$MODIFIED_FILES" ]; then
    echo "" >> "$DOC_FILE"
    echo "#### 📝 수정된 파일" >> "$DOC_FILE"
    echo "$MODIFIED_FILES" | while read file; do
        echo "- \`$file\` - [설명 필요]" >> "$DOC_FILE"
    done
fi

# 삭제된 파일들
if [ ! -z "$DELETED_FILES" ]; then
    echo "" >> "$DOC_FILE"
    echo "#### 🗑️ 삭제된 파일" >> "$DOC_FILE"
    echo "$DELETED_FILES" | while read file; do
        echo "- \`$file\` - [설명 필요]" >> "$DOC_FILE"
    done
fi

# 나머지 템플릿 내용 추가
cat >> "$DOC_FILE" << 'EOF'

## 🔍 주요 변경사항
<!-- 각 변경사항의 구체적인 설명 -->

### 새로 추가된 기능
- [TODO: 추가된 기능 설명]

### 수정된 기능
- [TODO: 수정된 기능 설명]

### 삭제된 기능
- [TODO: 삭제된 기능 설명]

## 🧪 테스트 결과
<!-- 실행한 테스트와 결과 -->
- [ ] 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] 수동 테스트 완료

## ⚠️ 리뷰 포인트
<!-- 팀원들이 특히 봐야 할 부분 -->
- [ ] 코드 품질 검토
- [ ] 보안 검토 필요 (해당 시)
- [ ] 성능 영향도 검토
- [ ] API 인터페이스 변경 확인

## 🔗 관련 링크
- 이슈: #[이슈번호]
- PR: #[PR번호]
- 커밋: [커밋 URL]

## 📝 추가 노트
<!-- 팀원들이 알아야 할 중요한 사항들 -->
- 이 문서는 자동 생성되었습니다. [TODO] 항목들을 수동으로 채워주세요.
EOF

print_success "문서가 성공적으로 생성되었습니다!"
print_info "파일 위치: ${DOC_FILE}"
print_warning "생성된 문서에서 [TODO] 항목들을 수동으로 채워주세요."

# 문서 편집을 위한 안내
if command -v code > /dev/null 2>&1; then
    echo ""
    print_info "VS Code로 문서를 열려면: code ${DOC_FILE}"
elif command -v vim > /dev/null 2>&1; then
    echo ""
    print_info "Vim으로 문서를 편집하려면: vim ${DOC_FILE}"
fi

print_success "커밋 문서 생성이 완료되었습니다! 🎉"