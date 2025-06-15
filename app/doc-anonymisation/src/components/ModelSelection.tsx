interface ModelSelectionProps {
  modelType: 'local' | 'server';
  onModelChange: (modelType: 'local' | 'server') => void;
}

function ModelSelection({ modelType, onModelChange }: ModelSelectionProps) {
  return (
    <div className="model-selection">
      <h2 style={{ textAlign: 'center' }}>Select Model</h2>
      <p>What model do you want to use?</p>
      <div className="radio-group">
        <label className="radio-label">
          <input
            type="radio"
            name="model"
            value="local"
            checked={modelType === 'local'}
            onChange={(e) => onModelChange(e.target.value as 'local' | 'server')}
          />
          <span>Local model (recommended for small tasks)</span>
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="model"
            value="server"
            checked={modelType === 'server'}
            onChange={(e) => onModelChange(e.target.value as 'local' | 'server')}
          />
          <span>Server model (for larger tasks)</span>
        </label>
      </div>
    </div>
  );
}

export default ModelSelection; 