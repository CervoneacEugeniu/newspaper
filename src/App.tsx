import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FeedPage } from './pages/FeedPage';
import { ArticlePage } from './pages/ArticlePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/article/:id" element={<ArticlePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

