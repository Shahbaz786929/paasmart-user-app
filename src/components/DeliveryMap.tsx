import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { colors } from "../theme/colors";

type DeliveryMapProps = {
  deliveryLat: number;
  deliveryLng: number;
  destinationLat: number;
  destinationLng: number;
  height: number;
};

export function DeliveryMap({ deliveryLat, deliveryLng, destinationLat, destinationLng, height }: DeliveryMapProps) {
  const midLat = (deliveryLat + destinationLat) / 2;
  const midLng = (deliveryLng + destinationLng) / 2;
  const latDelta = Math.max(Math.abs(deliveryLat - destinationLat) * 1.8, 0.01);
  const lngDelta = Math.max(Math.abs(deliveryLng - destinationLng) * 1.8, 0.01);

  return (
    <MapView
      style={{ width: "100%", height, borderRadius: 12 }}
      region={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
    >
      <Marker coordinate={{ latitude: deliveryLat, longitude: deliveryLng }} title="Delivery Partner">
        <View style={{ backgroundColor: colors.primary, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: "#fff" }}>
          <Ionicons name="bicycle" size={16} color="#fff" />
        </View>
      </Marker>
      <Marker coordinate={{ latitude: destinationLat, longitude: destinationLng }} title="You">
        <View style={{ backgroundColor: colors.error, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: "#fff" }}>
          <Ionicons name="home" size={16} color="#fff" />
        </View>
      </Marker>
    </MapView>
  );
}