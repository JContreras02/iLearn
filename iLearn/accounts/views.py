from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .forms import SignUpForm
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db import models
from django.contrib.auth.models import User
from .models import Course, Enrollment


@csrf_exempt
@login_required
def enroll_course(request):
    if request.method == 'POST':
        try:
            course_name = request.POST.get('course_name')
            course = Course.objects.get(title=course_name)
            Enrollment.objects.create(user=request.user, course=course)
            return JsonResponse({
                'success': True,
                'message': f'Successfully enrolled in: {course_name}',
            })
        except Course.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Course not found.',
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e),
            }, status=400)
    return JsonResponse({
        'success': False,
        'message': 'Invalid request method.',
    }, status=405)





def signup(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            if user.role == 'student':
                return redirect('student_dashboard')
            else:
                return redirect('instructor_dashboard')
    else:
        form = SignUpForm()
    return render(request, 'accounts/signup.html', {'form': form})

def signin(request):
    if request.method == 'POST':
        email = request.POST['email']
        password = request.POST['password']
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            if user.role == 'student':
                return redirect('student_dashboard')
            else:
                return redirect('instructor_dashboard')
        else:
            messages.error(request, 'Invalid email or password.')
    return render(request, 'accounts/signin.html')
def signin(request):
    if request.user.is_authenticated:
            if request.user.role == 'student':
                return redirect('student_dashboard')
            else:
                return redirect('instructor_dashboard')
    return render(request, 'accounts/signin.html')

def courses(request):
    # Example: Fetch courses from the database or a hardcoded list
    courses_list = [
        {
            "title": "Complete Web Development Bootcamp",
            "category": "Web Development",
            "description": "Learn web development from scratch with HTML, CSS, JavaScript, React, and Node.js.",
            "rating": 4.8,
            "reviews": 2100,
            "price": 89.99,
            "image": "https://via.placeholder.com/400x200",
        },
        {
            "title": "Python for Data Analysis",
            "category": "Data Science",
            "description": "Master data analysis with Python, Pandas, NumPy, and Matplotlib.",
            "rating": 4.9,
            "reviews": 1800,
            "price": 79.99,
            "image": "https://via.placeholder.com/400x200",
        },
        {
            "title": "UI/UX Design Fundamentals",
            "category": "Design",
            "description": "Learn the principles of user interface and user experience design.",
            "rating": 4.7,
            "reviews": 1500,
            "price": 69.99,
            "image": "https://via.placeholder.com/400x200",
        },
    ]
    return render(request, 'accounts/course.html', {'courses': courses_list})



@login_required
def student_dashboard(request):
    # Fetch the courses the user is enrolled in
    enrollments = Enrollment.objects.filter(user=request.user)
    return render(request, 'accounts/student_dashboard.html', {'enrollments': enrollments})


def home(request):
    return render(request, 'accounts/home.html')

def signup(request):
    return render(request, 'accounts/signup.html')

def signin(request):
    return render(request, 'accounts/signin.html')

def courses(request):
    return render(request, 'accounts/courses.html')

def about(request):
    return render(request, 'accounts/about.html')

