import { Request, Response } from 'express';
import { subjectService } from '../services/subject.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import type { CreateSubjectInput, UpdateSubjectInput } from '../schemas/subject.schema';

export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  const subjects = await subjectService.findAll(req.user!.id);
  sendSuccess(res, subjects);
};

export const getSubject = async (req: Request, res: Response): Promise<void> => {
  const subject = await subjectService.findById(req.params.id, req.user!.id);
  sendSuccess(res, subject);
};

export const createSubject = async (
  req: Request<{}, {}, CreateSubjectInput>,
  res: Response
): Promise<void> => {
  const subject = await subjectService.create(req.user!.id, req.body);
  sendCreated(res, subject, 'Subject created');
};

export const updateSubject = async (
  req: Request<{ id: string }, {}, UpdateSubjectInput>,
  res: Response
): Promise<void> => {
  const subject = await subjectService.update(req.params.id, req.user!.id, req.body);
  sendSuccess(res, subject, { message: 'Subject updated' });
};

export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
  await subjectService.delete(req.params.id, req.user!.id);
  sendNoContent(res);
};
