self.addEventListener("install", () => {
  console.log("Notification service worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "AI Skin Intelligence",
    message: "You have a new notification.",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.message = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    })
  );
});