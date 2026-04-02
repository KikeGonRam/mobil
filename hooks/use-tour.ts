import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOUR_STORAGE_KEY = 'urbanblade.tour.completed';

export interface TourStep {
  stepNumber: number;
  title: string;
  description: string;
  targetRef?: React.RefObject<any>;
  delay?: number;
}

export interface TourConfig {
  isFirstTime: boolean;
  isTourActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  resetTour: () => void;
  markTourComplete: () => void;
  canShowTour: () => boolean;
}

/**
 * Hook para gestionar el tour de la aplicación
 * Persiste cuando el usuario ha completado el tour con AsyncStorage
 */
export function useTour(): TourConfig {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const hasCheckedStorage = useRef(false);

  // Cargar el estado del tour desde AsyncStorage
  useEffect(() => {
    if (hasCheckedStorage.current) return;

    void (async () => {
      try {
        const completed = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
        if (completed === 'true') {
          setIsFirstTime(false);
        }
      } catch (error) {
        console.error('Error reading tour storage:', error);
      }
      hasCheckedStorage.current = true;
    })();
  }, []);

  const startTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentStep(0);
  }, []);

  const markTourComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setIsFirstTime(false);
      setIsTourActive(false);
    } catch (error) {
      console.error('Error marking tour as complete:', error);
    }
  }, []);

  const resetTour = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TOUR_STORAGE_KEY);
      setIsFirstTime(true);
      setIsTourActive(false);
      setCurrentStep(0);
    } catch (error) {
      console.error('Error resetting tour:', error);
    }
  }, []);

  const canShowTour = useCallback((): boolean => {
    return isFirstTime;
  }, [isFirstTime]);

  return {
    isFirstTime,
    isTourActive,
    currentStep,
    totalSteps: 4,
    startTour,
    resetTour,
    markTourComplete,
    canShowTour,
  };
}
