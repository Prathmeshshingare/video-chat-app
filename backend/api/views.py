from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import ConsultationNote, Patient, Clinic, Doctor
from .serializers import PatientSerializer, ClinicSerializer, DoctorSerializer


# 💾 Save Consultation Notes
@csrf_exempt
@api_view(["POST"])
def save_notes(request):
    email = request.data.get("email")
    notes = request.data.get("notes")
    patient_id = request.data.get("patient_id")
    clinic_id = request.data.get("clinic_id")
    doctor_id = request.data.get("doctor_id")

    if not all([email, notes, patient_id, clinic_id, doctor_id]):
        return Response(
            {"error": "All fields are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        patient = Patient.objects.get(id=patient_id)
        clinic = Clinic.objects.get(id=clinic_id)
        doctor = Doctor.objects.get(id=doctor_id)
    except Patient.DoesNotExist:
        return Response({"error": "Invalid patient id"}, status=400)
    except Clinic.DoesNotExist:
        return Response({"error": "Invalid clinic id"}, status=400)
    except Doctor.DoesNotExist:
        return Response({"error": "Invalid doctor id"}, status=400)

    ConsultationNote.objects.create(
        email=email,
        notes=notes,
        patient=patient,
        clinic=clinic,
        doctor=doctor
    )

    return Response(
        {"message": "Notes saved successfully"},
        status=status.HTTP_201_CREATED
    )


# 📋 Patient List
@api_view(["GET"])
def patient_list(request):
    patients = Patient.objects.all()
    serializer = PatientSerializer(patients, many=True)
    return Response(serializer.data)


# 📋 Clinic List
@api_view(["GET"])
def clinic_list(request):
    clinics = Clinic.objects.all()
    serializer = ClinicSerializer(clinics, many=True)
    return Response(serializer.data)


# 📋 Doctor List
@api_view(["GET"])
def doctor_list(request):
    doctors = Doctor.objects.all()
    serializer = DoctorSerializer(doctors, many=True)
    return Response(serializer.data)