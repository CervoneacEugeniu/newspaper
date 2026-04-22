import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <h1 className="not-found-code">404</h1>
      <p className="not-found-title">Page Not Found</p>
      <p className="not-found-sub">This headline doesn't exist — even in fake news.</p>
      <button className="scrape-btn" onClick={() => navigate('/')}>
        Back to Feed
      </button>
    </div>
  );
};
