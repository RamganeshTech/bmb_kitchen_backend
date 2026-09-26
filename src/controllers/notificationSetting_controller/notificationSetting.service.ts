import NotificationSettingsModel from '../../models/notification_model/notificationSettings.model.js';
import { ApiError } from '../../utils/apiError.js';

interface ChannelsInput {
  whatsapp?: boolean;
  sms?: boolean;
  email?: boolean;
}

interface EventsInput {
  billShare?: boolean;
  orderReady?: boolean;
  lowStock?: boolean;
  dayClosing?: boolean;
  newOnline?: boolean;
  offerBlast?: boolean;
}

interface CreateNotificationSettingsInput {
  channels?: ChannelsInput;
  events?: EventsInput;
}

export const getNotificationSettings = async (organizationId: string) => {
  const settings = await NotificationSettingsModel.findOne({ organizationId });
  if (!settings) throw new ApiError(404, 'Notification settings not found for this organization');
  return settings;
};

export const createNotificationSettings = async (
  organizationId: string,
  userId: string,
  payload: CreateNotificationSettingsInput
) => {
  const existing = await NotificationSettingsModel.findOne({ organizationId });
  if (existing) {
    throw new ApiError(409, 'Notification settings already exist for this organization');
  }

  const settings = await NotificationSettingsModel.create({
    organizationId,
    channels: payload.channels,
    events: payload.events,
    createdBy: userId,
  });

  return settings;
};

export const updateChannel = async (
  organizationId: string,
  userId: string,
  channel: keyof ChannelsInput,
  isEnabled: boolean
) => {
  const validChannels = ['whatsapp', 'sms', 'email'];
  if (!validChannels.includes(channel)) {
    throw new ApiError(400, `channel must be one of: ${validChannels.join(', ')}`);
  }

  const settings = await NotificationSettingsModel.findOneAndUpdate(
    { organizationId },
    { [`channels.${channel}`]: isEnabled, updatedBy: userId },
    { new: true }
  );

  if (!settings) throw new ApiError(404, 'Notification settings not found for this organization');
  return settings;
};

export const updateEvent = async (
  organizationId: string,
  userId: string,
  event: keyof EventsInput,
  isEnabled: boolean
) => {
  const validEvents = [
    'billShare',
    'orderReady',
    'lowStock',
    'dayClosing',
    'newOnline',
    'offerBlast',
  ];
  if (!validEvents.includes(event)) {
    throw new ApiError(400, `event must be one of: ${validEvents.join(', ')}`);
  }

  const settings = await NotificationSettingsModel.findOneAndUpdate(
    { organizationId },
    { [`events.${event}`]: isEnabled, updatedBy: userId },
    { new: true }
  );

  if (!settings) throw new ApiError(404, 'Notification settings not found for this organization');
  return settings;
};