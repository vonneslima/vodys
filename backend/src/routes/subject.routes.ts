import { Router } from 'express';
import {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { createSubjectSchema, updateSubjectSchema } from '../schemas/subject.schema';

const router = Router();

router.use(authenticate);

router.get('/', getSubjects);
router.get('/:id', getSubject);
router.post('/', validate(createSubjectSchema), createSubject);
router.patch('/:id', validate(updateSubjectSchema), updateSubject);
router.delete('/:id', deleteSubject);

export default router;
