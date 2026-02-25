from django.db import models


class Patient(models.Model):
    patient_name = models.CharField(max_length=100)

    def __str__(self):
        return self.patient_name


class Clinic(models.Model):
    clinic_name = models.CharField(max_length=100)

    def __str__(self):
        return self.clinic_name


class Doctor(models.Model):
    doctor_name = models.CharField(max_length=100)

    def __str__(self):
        return self.doctor_name


class ConsultationNote(models.Model):
    email = models.EmailField()
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.doctor.doctor_name} - {self.patient.patient_name} - {self.created_at}"

    class Meta:
        ordering = ['-created_at']