// src/lib/patientTransformers.ts
import { PatientFormData } from "@/components/patients/AddPatientModal";
import { PatientCreate } from "@/lib/patientService";

const GENDER_MAP: Record<PatientFormData['gender'], "MALE" | "FEMALE" | "OTHER"> = {
  male: "MALE",
  female: "FEMALE",
  other: "OTHER",
};

export function patientFormToCreate(data: PatientFormData): PatientCreate {
  const nameParts = data.name.trim().split(/\s+/);
  
  return {
    first_name: nameParts[0] || '',
    last_name: nameParts.slice(1).join(' ') || nameParts[0] || '',
    email: data.email || null,
    phone: data.phone.replace(/[^\d+]/g, ''),
    date_of_birth: data.dob,
    gender: GENDER_MAP[data.gender],
    address: data.address || null,
    blood_group: data.bloodType || null,
    allergies: data.allergies || null,
    emergency_contact_name: data.emergencyContact || null,
    emergency_contact_phone: data.emergencyPhone || null,
    notes: data.notes || null,
  };
}