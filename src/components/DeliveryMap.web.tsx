import { useEffect, useState, type ComponentType } from "react";

type DeliveryMapProps = {
  deliveryLat: number;
  deliveryLng: number;
  destinationLat: number;
  destinationLng: number;
  height: number;
};

export function DeliveryMap(props: DeliveryMapProps) {
  const [Client, setClient] = useState<ComponentType<DeliveryMapProps> | null>(null);

  useEffect(() => {
    // leaflet sirf browser me load karo — server-side render (SSR) ke waqt
    // "window is not defined" crash isi wajah se aata tha
    let mounted = true;
    import("./DeliveryMapClient.web").then((mod) => {
      if (mounted) setClient(() => mod.DeliveryMapClient);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!Client) return null; // server pe ya load hone tak kuch mat dikhao

  const MapClient = Client;
  return <MapClient {...props} />;
}