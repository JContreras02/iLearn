from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.utils import timezone
from .forms import LoginForm, SignUpForm
from django.contrib.auth.decorators import login_required

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            user = authenticate(request, email=email, password=password)
            
            if user is not None:
                login(request, user)
                
                # Update last login time
                user.last_login = timezone.now()
                user.save()
                
                # Redirect based on user role
                if user.role == 'instructor':
                    return redirect('instructor_dashboard')
                else:
                    return redirect('student_dashboard')
            else:
                messages.error(request, 'Invalid email or password')
    else:
        form = LoginForm()
    
    return render(request, 'accounts/login.html', {'form': form})

def signup_view(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            
            messages.success(request, 'Account created successfully!')
            
            # Redirect based on user role
            if user.role == 'instructor':
                return redirect('instructor_dashboard')
            else:
                return redirect('student_dashboard')
    else:
        form = SignUpForm()
    
    return render(request, 'accounts/signup.html', {'form': form})

def logout_view(request):
    logout(request)
    messages.success(request, 'You have been logged out successfully')
    return redirect('login')

@login_required
def student_dashboard(request):
    if request.user.role != 'student':
        messages.error(request, 'Access denied. You are not a student.')
        return redirect('login')
    
    return render(request, 'student.html')

@login_required
def instructor_dashboard(request):
    if request.user.role != 'instructor':
        messages.error(request, 'Access denied. You are not an instructor.')
        return redirect('login')
    
    return render(request, 'instructor.html')