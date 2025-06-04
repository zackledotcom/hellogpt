import React, { useState } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'model' | 'theme' | 'shortcuts' | 'prompts'>('model');
  const [isSaving, setIsSaving] = useState(false);
  const [currentModel, setCurrentModel] = useState('llama3');
  const [theme, setTheme] = useState('dark');
  const [temperature, setTemperature] = useState(0.7);

  const availableModels = [
    { name: 'llama3', size: '8B' },
    { name: 'llama3:70b', size: '70B' },
    { name: 'codellama', size: '7B' },
    { name: 'mistral', size: '7B' }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel glass" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
            <h2>Settings</h2>
          </div>
          <button className="settings-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'model' ? 'active' : ''}`}
            onClick={() => setActiveTab('model')}
          >
            <span>🤖</span>
            <span>Model</span>
          </button>
          <button
            className={`settings-tab ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            <span>🎨</span>
            <span>Theme</span>
          </button>
          <button
            className={`settings-tab ${activeTab === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            <span>⌨️</span>
            <span>Keys</span>
          </button>
          <button
            className={`settings-tab ${activeTab === 'prompts' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompts')}
          >
            <span>💬</span>
            <span>Prompts</span>
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'model' && (
            <div className="settings-section">
              <div className="setting-group">
                <label className="setting-label">Current Model</label>
                <select
                  value={currentModel}
                  onChange={(e) => setCurrentModel(e.target.value)}
                  className="input"
                >
                  {availableModels.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({model.size})
                    </option>
                  ))}
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="setting-range"
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Context Window</label>
                <input
                  type="number"
                  min="512"
                  max="8192"
                  step="512"
                  defaultValue="2048"
                  className="input"
                />
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="settings-section">
              <div className="setting-group">
                <label className="setting-label">Theme Mode</label>
                <div className="theme-buttons">
                  {['Light', 'Dark', 'System'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode.toLowerCase())}
                      className={`button ${theme === mode.toLowerCase() ? 'button--active' : 'button--secondary'}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-group">
                <label className="setting-label">Accent Color</label>
                <div className="color-grid">
                  {['blue', 'purple', 'green', 'red', 'yellow'].map(color => (
                    <button key={color} className={`color-button color-${color}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="settings-section">
              <div className="shortcuts-list">
                {[
                  { action: 'Send Message', key: 'Enter' },
                  { action: 'New Line', key: 'Shift + Enter' },
                  { action: 'Message History', key: 'Ctrl + ↑/↓' },
                  { action: 'Toggle Settings', key: 'Ctrl + ,' }
                ].map(shortcut => (
                  <div key={shortcut.action} className="shortcut-item">
                    <span>{shortcut.action}</span>
                    <kbd>{shortcut.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="settings-section">
              <div className="setting-group">
                <label className="setting-label">System Prompt</label>
                <textarea
                  className="input setting-textarea"
                  placeholder="Enter system prompt..."
                />
              </div>

              <div className="setting-group">
                <label className="setting-label">Saved Prompts</label>
                <div className="prompt-list">
                  {['Default Assistant', 'Code Expert', 'Creative Writer'].map(prompt => (
                    <button key={prompt} className="button button--secondary prompt-button">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="button" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="loading-spinner" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17,21 17,13 7,13 7,21"/>
                  <polyline points="7,3 7,8 15,8"/>
                </svg>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};