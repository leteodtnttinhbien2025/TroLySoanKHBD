export interface LessonPlanData {
  topic: string;
  subject: string;
  grade: string;
  duration: string;
  textbook: string;
  school?: string;
  department?: string;
  teacherName?: string;
  teachingMethod?: string[];
  cognitiveLevel?: string;
}