import { useState } from "react";
import instagram from "../assets/instagram.png";

function TermsPage({ onGoToLoading }) {
  const [activo, setActivo] = useState(false);

  const handleClick = (event) => {
    if (event.pointerType === "mouse" || event.pointerType === "touch") {
      setActivo((previous) => !previous);
      onGoToLoading(event);
    }
  };

  return (
    <section className="section terms-page">
      <div className="terms-page-content">
        <div className="terms-page-copy"></div>
        <div className="intagram-button-container">
          <button
            className={`instagram-button ${activo ? "activo" : ""}`}
            onPointerUp={handleClick}
          >
            <img
              src={instagram}
              className={`icon ${activo ? "activo-img" : ""}`}
            />
            INSTAGRAM
          </button>
        </div>
      </div>
    </section>
  );
}

export default TermsPage;
