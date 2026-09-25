import SupportTicketModel, { TicketCategory, TicketPriority } from '../../models/supportTicket_model/supportTicket.model.js';
import { ApiError } from '../../utils/apiError.js';

interface CreateTicketInput {
  outletId: string;
  subject: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  details?: string;
}

const STATUS_CYCLE: Record<string, string> = {
  Open: 'In progress',
  'In progress': 'Closed',
  Closed: 'Open',
};

export const createTicket = async (
  organizationId: string,
  userId: string,
  payload: CreateTicketInput
) => {
  const { outletId, subject, category, priority, details } = payload;

  if (!outletId || !subject?.trim()) {
    throw new ApiError(400, 'outletId and subject are required');
  }

  const ticket = await SupportTicketModel.create({
    organizationId,
    outletId,
    subject: subject.trim(),
    category,
    priority,
    details,
    raisedBy: userId,
    createdBy: userId,
  });

  return ticket;
};

export const getTicketById = async (organizationId: string, id: string) => {
  const ticket = await SupportTicketModel.findOne({ _id: id, organizationId })
    .populate('outletId', 'name code')
    .populate('raisedBy', 'name');
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  return ticket;
};

export const listActiveTickets = async (
  organizationId: string,
  filters: { outletId?: string; status?: string; category?: string; priority?: string }
) => {
  const query: Record<string, any> = { organizationId, isActive: true };
  if (filters.outletId) query.outletId = filters.outletId;
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;

  return SupportTicketModel.find(query)
    .populate('outletId', 'name code')
    .populate('raisedBy', 'name')
    .sort({ createdAt: -1 });
};

export const listInactiveTickets = async (organizationId: string) => {
  return SupportTicketModel.find({ organizationId, isActive: false })
    .populate('outletId', 'name code')
    .populate('raisedBy', 'name')
    .sort({ createdAt: -1 });
};

// Mirrors the HTML's cycleTicket: Open → In progress → Closed → Open
export const advanceTicketStatus = async (organizationId: string, userId: string, id: string) => {
  const ticket = await SupportTicketModel.findOne({ _id: id, organizationId, isActive: true });
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  ticket.status = STATUS_CYCLE[ticket.status] as typeof ticket.status;
  ticket.updatedBy = userId as any;
  await ticket.save();

  return ticket;
};

export const softDeleteTicket = async (organizationId: string, userId: string, id: string) => {
  const ticket = await SupportTicketModel.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive: false, updatedBy: userId },
    { new: true }
  );
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  return ticket;
};

export const restoreTicket = async (organizationId: string, userId: string, id: string) => {
  const ticket = await SupportTicketModel.findOneAndUpdate(
    { _id: id, organizationId },
    { isActive: true, updatedBy: userId },
    { new: true }
  );
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  return ticket;
};

export const hardDeleteTicket = async (organizationId: string, id: string) => {
  const ticket = await SupportTicketModel.findOneAndDelete({ _id: id, organizationId });
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  return ticket;
};