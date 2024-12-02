/**
 * Main Application Component
 * 
 * This is the root component of the React application.
 * It handles:
 * - Application routing
 * - Global state management
 * - Theme/layout configuration
 * 
 * The application uses Material-UI for styling and React Router
 * for navigation between different views.
 */

import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
