from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('signin/', views.signin, name='signin'),
    path('courses/', views.courses, name='courses'),
    path('enroll_course/', views.enroll_course, name='enroll_course'),
    path('about/', views.about, name='about'),
    path('student_dashboard/', views.student_dashboard, name='student_dashboard'),
    

]