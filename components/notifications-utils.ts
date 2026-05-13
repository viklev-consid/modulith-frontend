import { formatDistanceToNowStrict } from "date-fns";

export function notificationCategoryLabel(category: number) {
  return (
    {
      0: "Product",
      1: "Collaboration",
      2: "System",
      3: "Account",
      4: "Security",
    }[category] ?? "Notification"
  );
}

export function notificationTime(value: string) {
  return `${formatDistanceToNowStrict(new Date(value))} ago`;
}

export function safeNotificationHref(href: string | null | undefined) {
  if (!href || typeof window === "undefined") {
    return null;
  }

  try {
    const url = new URL(href, window.location.origin);

    if (url.origin !== window.location.origin) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function notificationQueryKeyPrefix() {
  return {
    predicate: (query: { queryKey: unknown }) => {
      const [params] = query.queryKey as Array<{ _id?: string }>;
      return params?._id === "listMyNotifications";
    },
  };
}

export function unreadCountQueryKeyPrefix() {
  return {
    predicate: (query: { queryKey: unknown }) => {
      const [params] = query.queryKey as Array<{ _id?: string }>;
      return params?._id === "getUnreadNotificationCount";
    },
  };
}
