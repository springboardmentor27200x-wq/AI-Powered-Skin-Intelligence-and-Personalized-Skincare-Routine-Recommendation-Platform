export async function registerNotificationServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers are not supported.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js"
    );

    console.log("Notification service worker registered.");

    return registration;
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Browser notifications are not supported.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  const permission = await Notification.requestPermission();

  return permission === "granted";
}

export async function showBrowserNotification(title, message) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const registration =
    await navigator.serviceWorker.getRegistration();

  if (!registration) {
    console.log("Notification service worker not registered.");
    return;
  }

  registration.showNotification(title, {
    body: message,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
}