from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    # Custom user model extending Django's AbstractUser
    # email is already included in AbstractUser
    # username is already included in AbstractUser
    
    # Additional fields
    role = models.CharField(max_length=20, choices=[
        ('student', 'Student'),
        ('instructor', 'Instructor')
    ], default='student')
    
    last_login = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Set email as the USERNAME_FIELD to use email for login
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']  # Username is still required
    
    def __str__(self):
        return self.email