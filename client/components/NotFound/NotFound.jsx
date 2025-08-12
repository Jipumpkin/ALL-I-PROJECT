import styles from "./NotFound.module.css";

function NotFound() {
  return (
    <div className={styles.notFound}>
      <div className={styles.container}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>페이지를 찾을 수 없습니다</h2>
        <p className={styles.message}>
          요청하신 페이지가 존재하지 않거나 잘못된 경로입니다.
        </p>
        <a href="/" className={styles.homeButton}>
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}

export default NotFound;