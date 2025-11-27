import express from 'express';
import {
    submitDraftForApproval,
    getDraft,
    cancelDraft,
    getDraftStatus,
    getPendingDrafts,
    approveDraft,
    rejectDraft
} from '../controllers/draftController.js';

const draftRouter = express.Router();

// Get all pending drafts (Admin)
draftRouter.get('/pending', getPendingDrafts);

// Submit draft for approval
draftRouter.post('/:courseId/submit', submitDraftForApproval);

// Approve draft (Admin)
draftRouter.post('/:courseId/approve', approveDraft);

// Reject draft (Admin)
draftRouter.post('/:courseId/reject', rejectDraft);

// Get draft status
draftRouter.get('/:courseId/status', getDraftStatus);

// Get draft
draftRouter.get('/:courseId', getDraft);

// Cancel/Delete draft
draftRouter.delete('/:courseId', cancelDraft);

export default draftRouter;
