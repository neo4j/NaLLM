type SwitchProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

export function Switch({ label, checked, onChange }: SwitchProps) {
  return (
    <div className="n-bg-palette-neutral-bg-default ndl-theme-light">
      <div className="ndl-form-item ndl-type-checkbox">
        <label className="ndl-form-item-label">
          <input
            role="switch"
            type="checkbox"
            checked={checked}
            onChange={onChange}
          />
          <span title="Switch label" className="ndl-form-label-text">
            {label}
          </span>
        </label>
      </div>
    </div>
  );
}
