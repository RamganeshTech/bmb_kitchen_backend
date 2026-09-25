import { Router } from 'express';
import * as printerController from '../../controllers/printer_controllers/printer.controller.js';
import { multiAuthRole } from '../../middleware/auth.middleware.js';


const printerRoutes = Router({ mergeParams: true });

// ── CREATE ──────────────────────────────────────────────────────────

// POST /api/printer/v1/:organizationId
printerRoutes.post(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto'), // printer setup is a management/technical task, not staff-facing
  printerController.createPrinter
);

// ── LIST ──────────────────────────────────────────────────────────────

// GET /api/printer/v1/:organizationId?outletId=...
printerRoutes.get(
  '/v1/:organizationId',
  multiAuthRole('owner', 'admin', 'cto', 'staff'), // staff may need to see which printer routes where
  printerController.listActivePrinters
);

// GET /api/printer/v1/:organizationId/inactive?outletId=...
printerRoutes.get(
  '/v1/:organizationId/inactive',
  multiAuthRole('owner', 'admin', 'cto'),
  printerController.listInactivePrinters
);

// ── GET BY ID ───────────────────────────────────────────────────────

// GET /api/printer/v1/:organizationId/:id
printerRoutes.get(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto', 'staff'),
  printerController.getPrinter
);

// ── UPDATE ──────────────────────────────────────────────────────────

// PATCH /api/printer/v1/:organizationId/:id
printerRoutes.patch(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  printerController.updatePrinter
);

// ── SOFT DELETE / RESTORE / HARD DELETE ──────────────────────────────

// PATCH /api/printer/v1/:organizationId/:id/deactivate
printerRoutes.patch(
  '/v1/:organizationId/:id/deactivate',
  multiAuthRole('owner', 'admin', 'cto'),
  printerController.softDeletePrinter
);

// PATCH /api/printer/v1/:organizationId/:id/restore
printerRoutes.patch(
  '/v1/:organizationId/:id/restore',
  multiAuthRole('owner', 'admin', 'cto'),
  printerController.restorePrinter
);

// DELETE /api/printer/v1/:organizationId/:id
printerRoutes.delete(
  '/v1/:organizationId/:id',
  multiAuthRole('owner', 'admin', 'cto'),
  printerController.hardDeletePrinter
);

export default printerRoutes;