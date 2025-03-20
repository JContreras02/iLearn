# Create this in a file like accounts/pipeline.py

from django.utils import timezone

def update_user_data(backend, user, response, *args, **kwargs):
    """
    Custom pipeline function to update user data after social authentication.
    This ensures role is preserved and login timestamps are updated.
    """
    if not user:
        return
    
    # Update last login timestamp
    user.last_login = timezone.now()
    
    # For new users, set default role to student
    if kwargs.get('is_new', False):
        user.role = 'student'
    
    user.save()
    
    return {
        'user': user,
        'is_new': kwargs.get('is_new', False)
    }