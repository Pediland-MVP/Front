import { useEffect, useState } from 'react';

function useReverseScrolling() {
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight - scrollTop);
  }, [scrollTop]);
}

export default useReverseScrolling;
