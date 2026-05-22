import { z } from 'zod';

export const ROLE_VALUES = ['agency', 'business', 'team', 'other'];
export const ACTIVITY_VALUES = ['services', 'ecommerce', 'saas', 'other'];
export const REASON_VALUES = ['time', 'performance', 'quality', 'other'];
export const TEAM_SIZE_VALUES = ['solo', 'small', 'medium', 'large'];
export const SOURCE_VALUES = ['friend', 'ad', 'google', 'fbGroup', 'other'];

const requiredChoice = (values) =>
  z.enum(values, { required_error: 'יש לבחור אפשרות', invalid_type_error: 'יש לבחור אפשרות' });

const optionalDetails = z.string().trim().max(200).optional();

export const stepSchemas = {
  1: z.object({ role: requiredChoice(ROLE_VALUES), roleOther: optionalDetails }),
  2: z.object({ activityType: requiredChoice(ACTIVITY_VALUES), activityTypeOther: optionalDetails }),
  3: z.object({ reason: requiredChoice(REASON_VALUES), reasonOther: optionalDetails }),
  4: z.object({ teamSize: requiredChoice(TEAM_SIZE_VALUES) }),
  5: z.object({ source: requiredChoice(SOURCE_VALUES), sourceOther: optionalDetails }),
};

export const onboardingStateSchema = z.object({
  step: z.number().int().min(1).max(5),
  answers: z.record(z.unknown()),
  completed: z.boolean(),
  completedAt: z.string().nullable().optional(),
});

export const isStepComplete = (choice, details) => {
  if (!choice) return false;
  if (choice !== 'other') return true;
  return Boolean(details && details.trim().length > 0);
};
