import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import type { RootState, AppDispatch } from '../store';
import { initializeSettings } from '../store/slices/settingsSlice';

export function App() {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings);

  useEffect(() => {
    // 앱 시작 시 설정 초기화
    if (!settings.isLoaded) {
      dispatch(initializeSettings());
    }
  }, [dispatch, settings.isLoaded]);

  return <RouterProvider router={router} />;
}


