def assign_role(strategy, details, user=None, *args, **kwargs):
    if user:
        # Assign a default role (e.g., 'student')
        user.role = 'student'
        user.save()
    return None