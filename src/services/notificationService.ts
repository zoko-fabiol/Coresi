import { AppNotification } from '../types/advancedModules';
import { DataService } from './dataService';

export class NotificationService {
  /**
   * Dispatches a unified internal notification and optionally triggers OneSignal web push
   */
  public static async notify(params: {
    type: AppNotification['type'];
    title: string;
    message: string;
    recipientRole?: AppNotification['recipientRole'];
    recipientUserId?: string;
    priority?: AppNotification['priority'];
    entityType?: string;
    entityId?: string;
    projectId?: string;
    siteId?: string;
    deepLink?: string;
  }): Promise<AppNotification> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const notif: AppNotification = {
      id,
      type: params.type,
      title: params.title,
      message: params.message,
      recipientRole: params.recipientRole || 'all',
      recipientUserId: params.recipientUserId,
      priority: params.priority || 'medium',
      read: false,
      entityType: params.entityType,
      entityId: params.entityId,
      projectId: params.projectId,
      siteId: params.siteId,
      deepLink: params.deepLink,
      createdAt: now,
    };

    // 1. Save in Firestore & local state
    await DataService.saveNotification(notif);

    // 2. Client-side browser push notification if permitted
    this.sendBrowserPushNotification(notif.title, notif.message);

    return notif;
  }

  /**
   * Triggers native Web Push if supported and granted
   */
  private static sendBrowserPushNotification(title: string, body: string): void {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.warn('Browser push notification error:', e);
    }
  }

  /**
   * Request browser push permission
   */
  public static async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
}
