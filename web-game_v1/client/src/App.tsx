import { Provider } from 'react-redux';
import { store } from './store/store';
import { useSocket } from './hooks/useSocket';
import GameContainer from './components/GameContainer';
import './App.css';

function AppContent() {
  // Socket接続を最上位で初期化
  useSocket();
  
  return (
    <div className="App">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Market Disruption</h1>
        <p className="text-gray-300">転売ヤーをテーマにしたボードゲーム</p>
      </header>
      <main className="min-h-screen bg-gray-100">
        <GameContainer />
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App
