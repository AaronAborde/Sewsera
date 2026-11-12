import VictoriaMap from "../../components/VictoriaMap";

export default function MapTest() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Map Test</h1>
      <VictoriaMap
        items={[
          { id: "1", name: "Victoria Municipal Hall", latitude: 13.1783, longitude: 121.2733 },
        ]}
        onPick={(coords) => console.log("Na-click:", coords)}
      />
    </div>
  );
}