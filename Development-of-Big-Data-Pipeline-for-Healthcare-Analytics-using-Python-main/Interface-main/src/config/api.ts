// frontend/src/services/api.ts

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

if (!API_BASE_URL) {
  console.error("VITE_BASE_API_URL is not defined");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "API request failed");
  }

  return response.json();
}

/* =======================
   PATIENTS
======================= */

export const PatientAPI = {
  getAll: () => request("/api/patients"),

  createBulk: (data: any[]) =>
    request("/api/patients/bulk", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    request(`/api/patients/${id}`, {
      method: "DELETE"
    })
};

/* =======================
   VISITS
======================= */

export const VisitAPI = {
  getAll: () => request("/api/visits"),

  createBulk: (data: any[]) =>
    request("/api/visits/bulk", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  delete: (id: string) =>
    request(`/api/visits/${id}`, {
      method: "DELETE"
    })
};

/* =======================
   DOCTORS
======================= */

export const DoctorAPI = {
  getAll: () => request("/api/doctors"),

  delete: (id: string) =>
    request(`/api/doctors/${id}`, {
      method: "DELETE"
    })
};

/* =======================
   PRESCRIPTIONS
======================= */

export const PrescriptionAPI = {
  getAll: () => request("/api/prescriptions"),

  delete: (id: string) =>
    request(`/api/prescriptions/${id}`, {
      method: "DELETE"
    })
};
