import "./UI.css";

type Props = {
  coalCollected: number;
};

export default function UI({ coalCollected }: Props) {
  return (
    <div className="UI">
      <div>Coal Collected: {coalCollected}</div>
    </div>
  );
}
