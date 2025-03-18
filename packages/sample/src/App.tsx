import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function Button({ onClick }: { onClick?: () => void }) {
  const styles = css`
    .button {
      padding: 8px 16px;
      border-radius: 4px;
      background-color: #646cff;
      color: white;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #747bff;
    }
  `;

  return (
    <button className={styles.button} onClick={onClick}>
      Click me
    </button>
  );
}

function Card() {
  const styles = css`
    .card {
      padding: 2em;
      border-radius: 8px;
      background: #1a1a1a;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .card p {
      margin: 0.5em 0;
    }
  `;

  return (
    <div className={styles.card}>
      <p>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
  );
}

function App() {
  const [count, setCount] = useState(0);
  const styles = css`
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
      transition: filter 300ms;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.react:hover {
      filter: drop-shadow(0 0 2em #61dafbaa);
    }
    .read-the-docs {
      color: #888;
    }
  `;

  return (
    <div className={styles.container}>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className={styles.logo} alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className={`${styles.logo} ${styles.react}`}
            alt="React logo"
          />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div>
        <Button onClick={() => setCount((c) => c + 1)} />
        <p>count is {count}</p>
      </div>
      <Card />
      <p className={styles["read-the-docs"]}>
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
