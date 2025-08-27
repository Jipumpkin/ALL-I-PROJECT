import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Intro.module.css";
import ScrollAnimation from "../ScrollAnimation/ScrollAnimation";

// Icons
const IconShower = () => <span>🚿</span>;
const IconBowl = () => <span>🍽️</span>;
const IconScissors = () => <span>✂️</span>;
const IconPaw = () => <span>🐾</span>;

// FeatureCard component
const FeatureCard = ({ icon, title, desc, tag }) => (
  <div className={styles.featureCard}>
    <div className={styles.featureCardHead}>
      <div className={styles.featureCardIcon}>{icon}</div>
      <span className={styles.featureCardTag}>{tag}</span>
    </div>
    <div className={styles.featureCardTitle}>{title}</div>
    <div className={styles.featureCardDesc}>{desc}</div>
  </div>
);


export default function PawPawIntro() {
  const navigate = useNavigate();
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
      title: "운명의 만남",
      desc: "보호소의 유기동물을 둘러보고, 마음에 드는 아이를 선택해요.",
    },
    {
      step: 2,
      title: "우리 집에 온다면?",
      desc: "집 사진을 업로드하고, 함께 지내는 모습을 미리 상상해요.",
    },
    {
      step: 3,
      title: "입양 상담",
      desc: "매칭된 센터와 일정 잡고, 가족이 될 준비를 시작해요.",
    },
    {
      step: 4,
      title: "입양 서약서 작성 및 입양 완료",
      desc: "서약서를 작성하고 입양 절차를 완료하여 새 가족을 맞아요.",
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
              포우포우는 AI 합성 기술을 통해 유기동물과 함께하는 모습을 미리 확인할 수 있는 
              프로젝트입니다. 여러분의 집에서 새로운 가족과 함께하는 <strong>상상 속 일상</strong>을 
              만들어 보세요.
            </p>
            <div className={styles.heroCta}>
              <button 
                className={styles.btn} 
                onClick={() => window.location.href = '/animals'}
                aria-label="유기동물 목록 페이지로 이동"
              >
                유기동물 목록 보기
              </button>
              <button 
                className={`${styles.btn} ${styles.btnOutline}`} 
                onClick={() => window.location.href = '/shelter-map'}
                aria-label="내 주변 동물보호소 지도 페이지로 이동"
              >
                내 근처 센터
              </button>
            </div>
          
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <img src="images\child-puppy.png" alt="" />
              <div className={styles.heroCardFooter}>
                <span
                  className={`${styles.heroLabel} ${styles.heroLabelLight}`}
                >
                  Adopt, don't shop
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <ScrollAnimation animation="fadeInUp">
        <section
          id="features"
          className={`${styles.container} ${styles.features}`}
        >
          <div className={styles.sectionHead}>
            <h2>하루 시뮬레이션</h2>
          </div>
          <div className={styles.grid4}>
            {features.map((f, index) => (
              <ScrollAnimation key={f.title} animation="scaleIn" delay={index * 100}>
                <FeatureCard
                  icon={f.icon}
                  title={f.title}
                  desc={f.desc}
                  tag={f.tag}
                />
              </ScrollAnimation>
            ))}
          </div>
          <div className={styles.gameButtonContainer}>
            <button 
              className={styles.startGameButton}
              onClick={() => navigate('/care-game')}
            >
              <span className={styles.gameButtonIcon}>🎮</span>
              <span className={styles.gameButtonText}>
                <strong>케어 시뮬레이션 시작!</strong>
              </span>
              <span className={styles.gameButtonArrow}>→</span>
            </button>
          </div>
        </section>
      </ScrollAnimation>

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
              마음에 드는 아이를 찾아서 유기동물 목록 페이지에서 합성 기능을 이용해보세요. 
              현관이나 거실 사진과 함께 상상 속 가족 사진을 만들어 볼 수 있어요.
            </p>
            <div className={styles.upload}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => window.location.href = '/animals'}>
                유기동물 목록 보기
              </button>
            </div>
          </div>
          <div className={styles.mergeVisual}>
            <div className={styles.mergeCard}>
              <video 
                controls 
                autoPlay 
                muted 
                loop
                style={{width: '100%', height: 'auto', borderRadius: '16px'}}
              >
                <source src="/videos/maker-demo.mp4" type="video/mp4" />
                메이커 데모 영상
              </video>
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
              따릅니다.
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
