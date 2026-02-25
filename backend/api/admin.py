from django.contrib import admin
from .models import ConsultationNote, Patient, Clinic, Doctor


@admin.register(ConsultationNote)
class ConsultationNoteAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "patient", "doctor", "clinic", "created_at")
    list_filter = ("created_at", "patient", "clinic", "doctor")
    search_fields = ("email", "patient__patient_name", "clinic__clinic_name", "doctor__doctor_name", "notes")
    readonly_fields = ("created_at",)
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('patient', 'clinic', 'doctor')


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("id", "patient_name")
    search_fields = ("patient_name",)


@admin.register(Clinic)
class ClinicAdmin(admin.ModelAdmin):
    list_display = ("id", "clinic_name")
    search_fields = ("clinic_name",)


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("id", "doctor_name")
    search_fields = ("doctor_name",)