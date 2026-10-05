import { Types } from 'mongoose';
import { ApiError } from '../../utils/apiError.js';
import NotificationModel, { NotificationEventKey } from '../../models/notification_model/notification.model.js';

interface CreateNotificationInput {
  outletId?: string | null;
  eventKey: NotificationEventKey;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

/**
 * Internal helper — used by other modules (low stock, day closing, order
 * ready, new online order) to raise a notification. Not exposed via a
 * controller/route: notifications are system-generated as a side effect of
 * other actions, not created directly by a client request.
 */
export const createNotification = async (
  organizationId: string,
  userId: string | null,
  payload: CreateNotificationInput
) => {
  const { outletId, eventKey, title, message, relatedEntityType, relatedEntityId } = payload;

  const notification = await NotificationModel.create({
    organizationId,
    outletId: outletId || null,
    eventKey,
    title,
    message,
    relatedEntityType: relatedEntityType || null,
    relatedEntityId: relatedEntityId || null,
    createdBy: userId,
  });

  return notification;
};

// ── GET ALL NOTIFICATIONS FOR AN OUTLET ─────────────────────────────
export const listNotificationsByOutlet = async (
  organizationId: string,
  outletId: string,
  userId: string,
  unreadOnly = false
) => {
  const query: Record<string, any> = {
    organizationId,
    // org-wide notifications (outletId: null) always show alongside this outlet's own
    $or: [{ outletId }, { outletId: null }],
  };

  if (unreadOnly) {
    query.readBy = { $ne: new Types.ObjectId(userId) };
  }

  const notifications = await NotificationModel.find(query).sort({ createdAt: -1 }).lean();

  // attach a per-user isRead flag without exposing the whole readBy array to the client
  return notifications.map((n) => ({
    ...n,
    isRead: n.readBy.some((id) => id.toString() === userId),
    readBy: undefined,
  }));
};


export interface ListNotificationFilters {
  outletId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedNotificationsResult {
  items: Array<{
    _id: Types.ObjectId;
    organizationId: Types.ObjectId;
    outletId: Types.ObjectId | null;
    eventKey: string;
    title: string;
    message: string;
    relatedEntityType: string | null;
    relatedEntityId: Types.ObjectId | null;
    createdBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const listAllNotifications = async (
  organizationId: string,
  userId: string,
  filters: ListNotificationFilters = {}
): Promise<PaginatedNotificationsResult> => {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const skip = (page - 1) * limit;

  // Base query:
  // 1. Belongs to the organization
  // 2. Strict exclusion: user is NOT in the readBy array
  const query: Record<string, any> = {
    organizationId: new Types.ObjectId(organizationId),
    readBy: { $ne: new Types.ObjectId(userId) },
  };

  // Optional outlet filter: includes matching outlet notifications + org-wide ones (outletId: null)
  if (filters.outletId) {
    query.$or = [{ outletId: new Types.ObjectId(filters.outletId) }, { outletId: null }];
  }

  const [items, total] = await Promise.all([
    NotificationModel.find(query)
      .select('-readBy')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NotificationModel.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// ── GET A SINGLE NOTIFICATION ───────────────────────────────────────
export const getNotificationById = async (organizationId: string, id: string, userId: string) => {
  const notification = await NotificationModel.findOne({ _id: id, organizationId }).lean();
  if (!notification) throw new ApiError(404, 'Notification not found');

  return {
    ...notification,
    isRead: notification.readBy.some((rid) => rid.toString() === userId),
    readBy: undefined,
  };
};

// ── UNREAD COUNT FOR A SINGLE USER ──────────────────────────────────
export const getUnreadCount = async (organizationId: string, outletId: string, userId: string) => {
  const count = await NotificationModel.countDocuments({
    organizationId,
    $or: [{ outletId }, { outletId: null }],
    readBy: { $ne: new Types.ObjectId(userId) },
  });

  return { unreadCount: count };
};

// ── MARK AS READ (push userId into readBy) ──────────────────────────
export const markAsRead = async (organizationId: string, id: string, userId: string) => {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $addToSet: { readBy: userId } },
    { new: true }
  ).lean();

  if (!notification) throw new ApiError(404, 'Notification not found');

  return {
    ...notification,
    isRead: true,
    readBy: undefined,
  };
};