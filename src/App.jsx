import { useEffect, useRef, useState } from "react";
import LoadingPage from "./components/LoadingPage";
import MainPage from "./components/MainPage";
import TermsPage from "./components/TermsPage";
import { claimDiscount } from "./js/claimDiscount";

function App() {
  const [code, setCode] = useState(null);
  const [price, setPrice] = useState(null);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [translateY, setTranslateY] = useState(100);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [showMain, setShowMain] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [goToLoading, setGoToLoading] = useState(false);
  const sectionsRef = useRef(null);

  const scrollToY = (vh) => setTranslateY(vh);

  useEffect(() => {
    const handleAssetsLoaded = () => {
      setAssetsLoaded(true);
    };

    if (document.readyState === "complete") {
      handleAssetsLoaded();
      return undefined;
    }

    window.addEventListener("load", handleAssetsLoaded);
    return () => window.removeEventListener("load", handleAssetsLoaded);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCode = async () => {
      const result = await claimDiscount();

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setHasError(true);
        setMessage(result.error);
        return;
      }

      setCode(result.code);
      setPrice(result.price);
      setMessage("");
      setDataLoaded(true);
    };

    fetchCode();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasError && dataLoaded && assetsLoaded && initialLoad) {
      const timeoutId = window.setTimeout(() => {
        scrollToY(0);
        setInitialLoad(false);
      }, 100);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [assetsLoaded, dataLoaded, hasError, initialLoad]);

  useEffect(() => {
    const handleTransitionEnd = () => {
      if (translateY === 220 && goToLoading) {
        setShowMain(false);
        setShowTerms(false);
        setTranslateY(200);
        setGoToLoading(false);
      }

      if (translateY === 0 && !initialLoad) {
        setShowTerms(true);
        setShowLoading(false);
      }
    };

    const node = sectionsRef.current;
    node?.addEventListener("transitionend", handleTransitionEnd);

    return () => node?.removeEventListener("transitionend", handleTransitionEnd);
  }, [goToLoading, initialLoad, translateY]);

  const handleMainClick = () => {
    if (translateY === 78) {
      scrollToY(0);
    }
  };

  const handleTransitionToLoading = () => {
    setShowLoading(true);
    setGoToLoading(true);

    window.setTimeout(() => {
      scrollToY(200);
    }, 600);

    window.setTimeout(() => {
      window.location.href = "https://www.instagram.com/shaffers.co/";
    }, 1500);
  };

  return (
    <div className="app">
      <div
        className="sections"
        ref={sectionsRef}
        style={{ transform: `translateY(-${translateY}svh)` }}
      >
        {showMain && (
          <MainPage
            onClick={handleMainClick}
            onScroll={() => scrollToY(78)}
            code={code}
            price={price}
          />
        )}
        {showTerms && <TermsPage onGoToLoading={handleTransitionToLoading} />}
        {showLoading && <LoadingPage message={hasError ? message : ""} />}
      </div>
    </div>
  );
}

export default App;
