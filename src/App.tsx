import { useState } from 'react';
import MovementScreen from './screens/MovementScreen';
import FamilyScreen from './screens/FamilyScreen';
import BathroomScreen from './screens/BathroomScreen';
import DebugPanel from './components/DebugPanel';
import './App.css';

const screens = ['movement', 'family', 'bathroom'] as const;
type Screen = (typeof screens)[number];

const screenComponents: Record<Screen, React.FC> = {
  movement: MovementScreen,
  family: FamilyScreen,
  bathroom: BathroomScreen,
};

export default function App() {
  const [current, setCurrent] = useState<Screen>('movement');

  const currentIndex = screens.indexOf(current);
  const CurrentScreen = screenComponents[current];

  const goNext = () => {
    if (currentIndex < screens.length - 1) {
      setCurrent(screens[currentIndex + 1]);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrent(screens[currentIndex - 1]);
    }
  };

  return (
    <div className="app">
      <DebugPanel />
      <div className="screen-container">
        <CurrentScreen />
      </div>
      <nav className="nav">
        {currentIndex > 0 && (
          <button className="nav-btn" onClick={goPrev}>
            &#9664;
          </button>
        )}
        {currentIndex < screens.length - 1 && (
          <button className="nav-btn" onClick={goNext}>
            &#9654;
          </button>
        )}
      </nav>
    </div>
  );
}
