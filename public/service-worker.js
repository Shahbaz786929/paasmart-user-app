self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "Paasmart", body: event.data.text() };
  }

  const title = payload.title || "Paasmart";
  const options = {
    body: payload.body || "",
    icon: "/assets/images/icon.png",
    badge: "/assets/images/icon.png",
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = "/notifications";

  if ((data.type === "ORDER_UPDATE" || data.type === "RETURN_REQUEST" || data.type === "CHAT_MESSAGE") && data.referenceId) {
    url = `/order/${data.referenceId}`;
  } else if (data.type === "WALLET") {
    url = "/wallet";
  } else if (data.type === "WISHLIST" && data.referenceId) {
    url = `/product/${data.referenceId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});