from django.urls import path
from .views import  save_notes,patient_list,clinic_list ,doctor_list

urlpatterns = [
   # path("speech-to-text/", speech_to_text, name="speech_to_text"),
    path("save-notes/", save_notes, name="save_notes"),
    path('patients/', patient_list, name='patient_list'),
    path ('clinics/',clinic_list,name='clinic_list'),
    path ('doctors/',doctor_list,name='doctor_list'),
]
