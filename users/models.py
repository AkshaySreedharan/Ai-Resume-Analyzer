from django.db import models
from django.contrib.auth.models import User

class Student(models.Model):
    name = models.CharField(max_length=100)
    cgpa = models.FloatField()
        
    def __str__(self):
        return self.name
# Create your models here.
