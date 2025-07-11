import "./UI.css";

type UIProps = {
  coalCollected: number;
};

export default function UI({ coalCollected }: UIProps) {
  return (
    <div className="UI">
      <div>Coal Collected: {coalCollected}</div>
    </div>
  );
}
