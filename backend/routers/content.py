from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(tags=["Contenido Académico"])

# --- Courses ---
@router.get("/courses", response_model=List[schemas.Course])
def get_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()

@router.post("/courses", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_course = models.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/courses/{course_id}", response_model=schemas.Course)
def get_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

# --- Modules ---
@router.get("/courses/{course_id}/modules", response_model=List[schemas.Module])
def get_course_modules(course_id: str, db: Session = Depends(get_db)):
    return db.query(models.CourseModule).filter(models.CourseModule.courseId == course_id).order_by(models.CourseModule.order).all()

# --- Lessons ---
@router.get("/modules/{module_id}/lessons", response_model=List[schemas.Lesson])
def get_module_lessons(module_id: int, db: Session = Depends(get_db)):
    return db.query(models.Lesson).filter(models.Lesson.moduleId == module_id).order_by(models.Lesson.order).all()

# --- Progress ---
@router.post("/progress/{user_id}/{lesson_id}")
def update_progress(user_id: str, lesson_id: int, progress: schemas.ProgressUpdate, db: Session = Depends(get_db)):
    db_progress = db.query(models.LessonProgress).filter(
        models.LessonProgress.user_id == user_id,
        models.LessonProgress.lesson_id == lesson_id
    ).first()
    
    if db_progress:
        db_progress.played_seconds = progress.played_seconds
        db_progress.total_seconds = progress.total_seconds
        db_progress.completed = progress.completed
        db_progress.is_unlocked = progress.is_unlocked
    else:
        db_progress = models.LessonProgress(
            user_id=user_id,
            lessonId=lesson_id,
            **progress.dict()
        )
        db.add(db_progress)
    
    db.commit()
    return {"status": "success"}

# --- Exams ---
@router.get("/exams/{exam_id}", response_model=schemas.Exam)
def get_exam(exam_id: str, db: Session = Depends(get_db)):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam
