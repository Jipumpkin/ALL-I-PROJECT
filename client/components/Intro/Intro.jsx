import React from "react";
import styles from "./Intro.module.css";

// 간단한 인라인 SVG 아이콘들 (외부 라이브러리 의존 제거)
const IconShower = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden className={styles.icon} {...props}>
    <path
      d="M7 3a5 5 0 0 1 5 5v2h2a4 4 0 1 1 0 8H8a4 4 0 1 1 0-8h2V8A3 3 0 0 0 7 5H5V3h2zM8 14a2 2 0 1 0 0 4h6a2 2 0 1 0 0-4H8z"
      fill="currentColor"
    />
  </svg>
);
const IconBowl = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden className={styles.icon} {...props}>
    <path
      d="M4 10h16a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6zm2 8h12v2H6z"
      fill="currentColor"
    />
  </svg>
);
const IconScissors = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden className={styles.icon} {...props}>
    <path
      d="M9 5a3 3 0 1 1-2.83 2H6L17 18a3 3 0 1 1-1.41 1.41L10.59 14 8 16.59A3 3 0 1 1 6.59 15L9 12.59 5.41 9A3 3 0 1 1 9 5z"
      fill="currentColor"
    />
  </svg>
);
const IconPaw = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden className={styles.icon} {...props}>
    <path
      d="M12 12c3 0 6 2 6 5 0 1.66-1.79 3-4 3H10c-2.21 0-4-1.34-4-3 0-3 3-5 6-5zm-5-1a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm10 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM9 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
      fill="currentColor"
    />
  </svg>
);

const FeatureCard = ({ icon, title, desc, tag }) => (
  <button className={styles.featureCard} type="button" aria-label={title}>
    <div className={styles.featureCardHead}>
      <span className={styles.featureCardIcon}>{icon}</span>
      <span className={styles.featureCardTag}>{tag}</span>
    </div>
    <div className={styles.featureCardBody}>
      <div className={styles.featureCardTitle}>{title}</div>
      <div className={styles.featureCardDesc}>{desc}</div>
    </div>
  </button>
);

export default function PawPawIntro() {
  const features = [
    {
      icon: <IconShower />,
      title: "씻기기",
      desc: "입양 후 첫 목욕을 시뮬레이션하며 케어 팁을 배워요.",
      tag: "케어",
    },
    {
      icon: <IconBowl />,
      title: "밥 주기",
      desc: "사료량과 급여 주기를 가이드로 체크해요.",
      tag: "영양",
    },
    {
      icon: <IconScissors />,
      title: "미용",
      desc: "브러싱과 발바닥 케어 루틴을 연습해요.",
      tag: "그루밍",
    },
    {
      icon: <IconPaw />,
      title: "산책",
      desc: "적정 산책 시간과 사회화 체크리스트 제공.",
      tag: "일상",
    },
  ];

  const steps = [
    {
      step: 1,
      title: "아이를 발견",
      desc: "보호소의 유기동물을 둘러보고, 마음에 드는 아이를 찜해요.",
    },
    {
      step: 2,
      title: "우리 집에 온다면?",
      desc: "집 사진을 업로드하고, 함께 지내는 모습을 미리 상상해요.",
    },
    {
      step: 3,
      title: "케어 시뮬레이션",
      desc: "씻기기·밥주기·미용·산책 버튼으로 일상을 체험해요.",
    },
    {
      step: 4,
      title: "입양 상담",
      desc: "매칭된 센터와 일정 잡고, 가족이 될 준비를 시작해요.",
    },
  ];

  return (
    <div className={styles.wrap}>
      {/* Header */}
      {/* <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <div className={styles.brand}>
            <img
              src="/images/foot.png"
              alt="PawPaw 로고"
              className={styles.brandLogo}
            />
            <span className={styles.brandName}>PAWPAW</span>
            <span className={styles.badge}>Beta</span>
          </div>
          <nav className={styles.nav} aria-label="주요 항목">
            <a href="#about">소개</a>
            <a href="#features">시뮬 버튼</a>
            <a href="#how">진행 단계</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnGhost}`}>
              보호소 찾기
            </button>
            <button className={styles.btn}>입양 시작하기</button>
          </div>
        </div>
      </header> */}

      {/* Hero */}
      <section id="about" className={`${styles.container} ${styles.hero}`}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.chip}>
              포우포우는 여러분의 상상에서 시작됩니다
            </div>
            <h5 className={styles.heroTitle}>
              "이 아이가 우리 집에 온다면?" <br />입양 전, 일상을 먼저 경험해보는 공간
            </h5>
            <p className={styles.heroDesc}>
              포우포우는 보호소의 유기동물이 여러분의 집에 왔을 때의 하루를
              가상으로 체험하는 프로젝트입니다. 씻기고, 밥 주고, 미용하고,
              산책하며 <strong>현실적인 돌봄 루틴</strong>을 확인해 보세요.
            </p>
            <div className={styles.heroCta}>
              <button className={styles.btn} onClick={() => window.location.href = '/adoption-apply'}>입양 신청하기</button>
              <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => window.location.href = '/shelter-map'}>
                내 근처 센터
              </button>
            </div>
          
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <img src="/images/hoochoo1.jpeg" alt="" />
              <div className={styles.heroCardFooter}>
                <span className={styles.heroLabel}>상상 속 하루</span>
                <span
                  className={`${styles.heroLabel} ${styles.heroLabelLight}`}
                >
                  Adopt, don’t shop
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className={`${styles.container} ${styles.features}`}
      >
        <div className={styles.sectionHead}>
          <h2>하루 시뮬레이션</h2>
        </div>
        <div className={styles.grid4}>
          {features.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              desc={f.desc}
              tag={f.tag}
            />
          ))}
        </div>
        <p className={styles.note}>
          ※ 각 버튼은 실제 기능 페이지로 연결될 수 있도록 라우팅을 연결하세요.
        </p>
      </section>

      {/* Steps */}
      <section id="how" className={`${styles.container} ${styles.steps}`}>
        <h2>어떻게 진행되나요?</h2>
        <p className={styles.muted}>입양 전 과정을 한눈에 확인하세요.</p>
        <div className={styles.grid4}>
          {steps.map((s) => (
            <div key={s.step} className={styles.step}>
              <div className={styles.stepHead}>
                <span className={`${styles.badge} ${styles.badgeOutline}`}>
                  Step {s.step}
                </span>
              </div>
              <div className={styles.stepTitle}>{s.title}</div>
              <div className={styles.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Merge Demo */}
      <section className={`${styles.container} ${styles.merge}`}>
        <div className={styles.mergeGrid}>
          <div className={styles.mergeCopy}>
            <h3>우리 집에 온 모습을 미리 볼까요?</h3>
            <p>
              현관/거실 사진을 업로드하면, 보호소 아이와 함께 있는 이미지를
              합성해 드립니다. 가족이 될 준비, 상상에서 시작해요.
            </p>
            <div className={styles.upload}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => window.location.href = '/maker'}>
                합성하기
              </button>
            </div>
            <p className={styles.caption}>
              ※ 실제 합성은 백엔드/이미지 API 연동이 필요합니다. (예: OpenAI,
              Stability, Replicate 등)
            </p>
          </div>
          <div className={styles.mergeVisual}>
            <div className={styles.mergeCard}>
              <img src="" alt="메이커 영상 넣기" />
              <span className={`${styles.badge} ${styles.badgeSoft}`}>
               
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${styles.container} ${styles.faq}`}>
        <h3>자주 묻는 질문</h3>
        <div className={styles.grid2}>
          <div className={styles.faqItem}>
            <div className={styles.faqQ}>입양은 어디서 진행되나요?</div>
            <div className={styles.faqA}>
              포우포우는 매칭과 체험 가이드를 제공하며, 실제 입양은 연계된
              보호소/기관과의 절차를 통해 진행됩니다.
            </div>
          </div>
          <div className={styles.faqItem}>
            <div className={styles.faqQ}>초보 집사도 괜찮을까요?</div>
            <div className={styles.faqA}>
              네. 씻기기/밥주기/미용/산책 시뮬레이션과 체크리스트로 기본 루틴을
              익힐 수 있어요.
            </div>
          </div>
          <div className={styles.faqItem}>
            <div className={styles.faqQ}>비용은 어떻게 되나요?</div>
            <div className={styles.faqA}>
              입양비 및 예방접종 등 실비는 각 보호소 정책에 따릅니다. 포우포우
              이용은 베타 기간 동안 무료입니다.
            </div>
          </div>
          <div className={styles.faqItem}>
            <div className={styles.faqQ}>이미지 합성은 안전한가요?</div>
            <div className={styles.faqA}>
              개인정보를 제외한 이미지 메타데이터를 제거하고 안전한 저장 정책을
              따릅니다. (상세 정책 페이지 연동 권장)
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
