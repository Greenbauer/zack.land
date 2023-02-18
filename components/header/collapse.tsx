type CollapseType = {
  children: JSX.Element;
  isActive: boolean;
};

export default function Collapse({ children, isActive }: CollapseType) {
  return (
    <div className={`nav-collapse ${isActive && 'active'}`}>{children}</div>
  );
}
