import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import {
  Patient,
  Doctor,
  Visit,
  Prescription,
  User,
  AuthState,
  DEMO_CREDENTIALS,
  SeverityChange,
} from "@/types/hospital";
import { toast } from "sonner";
import {
  PatientAPI,
  DoctorAPI,
  VisitAPI,
  PrescriptionAPI,
} from "@/config/api";
import { API_BASE_URL } from "../config/api";

/* =======================
   STATE & TYPES
======================= */

interface HospitalState {
  patients: Patient[];
  doctors: Doctor[];
  visits: Visit[];
  prescriptions: Prescription[];
  auth: AuthState;
}

type HospitalAction =
  | { type: "SET_PATIENTS"; payload: Patient[] }
  | { type: "SET_DOCTORS"; payload: Doctor[] }
  | { type: "SET_VISITS"; payload: Visit[] }
  | { type: "SET_PRESCRIPTIONS"; payload: Prescription[] }
  | { type: "ADD_PATIENT"; payload: Patient }
  | { type: "ADD_PATIENTS"; payload: Patient[] }
  | { type: "UPDATE_PATIENT"; payload: Patient }
  | { type: "DELETE_PATIENT"; payload: string }
  | { type: "ADD_DOCTOR"; payload: Doctor }
  | { type: "ADD_DOCTORS"; payload: Doctor[] }
  | { type: "DELETE_DOCTOR"; payload: string }
  | { type: "ADD_VISIT"; payload: Visit }
  | { type: "ADD_VISITS"; payload: Visit[] }
  | { type: "UPDATE_VISIT"; payload: Visit }
  | { type: "DELETE_VISIT"; payload: string }
  | { type: "ADD_PRESCRIPTION"; payload: Prescription }
  | { type: "ADD_PRESCRIPTIONS"; payload: Prescription[] }
  | { type: "DELETE_PRESCRIPTION"; payload: string }
  | { type: "LOGIN"; payload: User }
  | { type: "LOGOUT" };

const initialState: HospitalState = {
  patients: [],
  doctors: [],
  visits: [],
  prescriptions: [],
  auth: { user: null, isAuthenticated: false },
};

/* =======================
   REDUCER
======================= */

function hospitalReducer(
  state: HospitalState,
  action: HospitalAction
): HospitalState {
  switch (action.type) {
    case "SET_PATIENTS":
      return { ...state, patients: action.payload };

    case "SET_DOCTORS":
      return { ...state, doctors: action.payload };

    case "SET_VISITS":
      return { ...state, visits: action.payload };

    case "SET_PRESCRIPTIONS":
      return { ...state, prescriptions: action.payload };

    case "ADD_PATIENT":
      return { ...state, patients: [...state.patients, action.payload] };

    case "ADD_PATIENTS":
      return { ...state, patients: [...state.patients, ...action.payload] };

    case "UPDATE_PATIENT":
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.patient_id === action.payload.patient_id ? action.payload : p
        ),
      };

    case "DELETE_PATIENT":
      return {
        ...state,
        patients: state.patients.filter((p) => p.patient_id !== action.payload),
      };

    case "ADD_DOCTOR":
      return { ...state, doctors: [...state.doctors, action.payload] };

    case "ADD_DOCTORS":
      return { ...state, doctors: [...state.doctors, ...action.payload] };

    case "DELETE_DOCTOR":
      return {
        ...state,
        doctors: state.doctors.filter((d) => d.doctor_id !== action.payload),
      };

    case "ADD_VISIT":
      return { ...state, visits: [...state.visits, action.payload] };

    case "ADD_VISITS":
      return { ...state, visits: [...state.visits, ...action.payload] };

    case "UPDATE_VISIT":
      return {
        ...state,
        visits: state.visits.map((v) =>
          v.visit_id === action.payload.visit_id ? action.payload : v
        ),
      };

    case "DELETE_VISIT":
      return {
        ...state,
        visits: state.visits.filter((v) => v.visit_id !== action.payload),
      };

    case "ADD_PRESCRIPTION":
      return {
        ...state,
        prescriptions: [...state.prescriptions, action.payload],
      };

    case "ADD_PRESCRIPTIONS":
      return {
        ...state,
        prescriptions: [...state.prescriptions, ...action.payload],
      };

    case "DELETE_PRESCRIPTION":
      return {
        ...state,
        prescriptions: state.prescriptions.filter(
          (p) => p.prescription_id !== action.payload
        ),
      };

    case "LOGIN":
      return {
        ...state,
        auth: { user: action.payload, isAuthenticated: true },
      };

    case "LOGOUT":
      return { ...state, auth: { user: null, isAuthenticated: false } };

    default:
      return state;
  }
}

/* =======================
   CONTEXT
======================= */

interface HospitalContextType {
  state: HospitalState;

  addPatient: (patient: Patient) => void;
  addPatients: (patients: Patient[]) => void;
  updatePatient: (patient: Patient) => void;
  deletePatient: (patientId: string) => Promise<void>;
  generatePatientId: () => string;
  isPatientIdUnique: (patientId: string) => boolean;

  addDoctor: (doctor: Doctor) => void;
  addDoctors: (doctors: Doctor[]) => void;
  deleteDoctor: (doctorId: string) => Promise<void>;
  generateDoctorId: () => string;
  isDoctorUserIdUnique: (userId: string) => boolean;

  addVisit: (visit: Visit) => void;
  addVisits: (visits: Visit[]) => void;
  updateVisit: (visit: Visit) => void;
  deleteVisit: (visitId: string) => Promise<void>;
  generateVisitId: () => string;
  isVisitIdUnique: (visitId: string) => boolean;

  addPrescription: (prescription: Prescription) => void;
  addPrescriptions: (prescriptions: Prescription[]) => void;
  deletePrescription: (prescriptionId: string) => Promise<void>;
  generatePrescriptionId: () => string;

  getPatientById: (patientId: string) => Patient | undefined;
  getDoctorById: (doctorId: string) => Doctor | undefined;
  getVisitById: (visitId: string) => Visit | undefined;

  getVisitsByPatient: (patientId: string) => Visit[];
  getVisitsByDoctor: (doctorId: string) => Visit[];

  getPrescriptionsByVisit: (visitId: string) => Prescription[];

  // ✅ ADDED
  getPrescriptionsByDoctor: (doctorName: string) => Prescription[];

  getSeverityChange: (visitId: string) => SeverityChange | undefined;

  // ✅ login is now async (because doctor login uses backend)
  login: (
    userId: string,
    password: string,
    portal: "admin" | "doctor"
  ) => Promise<{ success: boolean; error?: string }>;

  logout: () => void;
}

const HospitalContext = createContext<HospitalContextType | undefined>(
  undefined
);

/* =======================
   PROVIDER
======================= */

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(hospitalReducer, initialState);

  /* ===== FETCH INITIAL DATA ===== */

  useEffect(() => {
    PatientAPI.getAll().then((data: Patient[]) =>
      dispatch({ type: "SET_PATIENTS", payload: data })
    );

    DoctorAPI.getAll().then((data: Doctor[]) =>
      dispatch({ type: "SET_DOCTORS", payload: data })
    );

    VisitAPI.getAll().then((data: Visit[]) =>
      dispatch({ type: "SET_VISITS", payload: data })
    );

    PrescriptionAPI.getAll().then((data: Prescription[]) =>
      dispatch({ type: "SET_PRESCRIPTIONS", payload: data })
    );
  }, []);

  /* ===== PATIENT FUNCTIONS ===== */

  const generatePatientId = useCallback(() => {
    const timestamp = Date.now();
    return `PAT-${timestamp}`;
  }, []);

  const isPatientIdUnique = useCallback(
    (patientId: string) => {
      return !state.patients.some((p) => p.patient_id === patientId);
    },
    [state.patients]
  );

  const addPatient = useCallback((patient: Patient) => {
    dispatch({ type: "ADD_PATIENT", payload: patient });
  }, []);

  const addPatients = useCallback((patients: Patient[]) => {
    dispatch({ type: "ADD_PATIENTS", payload: patients });
  }, []);

  const updatePatient = useCallback((patient: Patient) => {
    dispatch({ type: "UPDATE_PATIENT", payload: patient });
  }, []);

  const deletePatient = useCallback(async (patientId: string) => {
    await PatientAPI.delete(patientId);
    dispatch({ type: "DELETE_PATIENT", payload: patientId });
    toast.success("Patient deleted");
  }, []);

  /* ===== DOCTOR FUNCTIONS ===== */

  const generateDoctorId = useCallback(() => {
    const timestamp = Date.now();
    return `DOC-${timestamp}`;
  }, []);

  const isDoctorUserIdUnique = useCallback(
    (userId: string) => {
      return !state.doctors.some((d) => d.user_id === userId);
    },
    [state.doctors]
  );

  const addDoctor = useCallback((doctor: Doctor) => {
    dispatch({ type: "ADD_DOCTOR", payload: doctor });
  }, []);

  const addDoctors = useCallback((doctors: Doctor[]) => {
    dispatch({ type: "ADD_DOCTORS", payload: doctors });
  }, []);

  const deleteDoctor = useCallback(async (doctorId: string) => {
    await DoctorAPI.delete(doctorId);
    dispatch({ type: "DELETE_DOCTOR", payload: doctorId });
    toast.success("Doctor deleted");
  }, []);

  /* ===== VISIT FUNCTIONS ===== */

  const generateVisitId = useCallback(() => {
    const timestamp = Date.now();
    return `VIS-${timestamp}`;
  }, []);

  const isVisitIdUnique = useCallback(
    (visitId: string) => {
      return !state.visits.some((v) => v.visit_id === visitId);
    },
    [state.visits]
  );

  const addVisit = useCallback((visit: Visit) => {
    dispatch({ type: "ADD_VISIT", payload: visit });
  }, []);

  const addVisits = useCallback((visits: Visit[]) => {
    dispatch({ type: "ADD_VISITS", payload: visits });
  }, []);

  const updateVisit = useCallback((visit: Visit) => {
    dispatch({ type: "UPDATE_VISIT", payload: visit });
  }, []);

  const deleteVisit = useCallback(async (visitId: string) => {
    await VisitAPI.delete(visitId);
    dispatch({ type: "DELETE_VISIT", payload: visitId });
    toast.success("Visit deleted");
  }, []);

  /* ===== PRESCRIPTION FUNCTIONS ===== */

  const generatePrescriptionId = useCallback(() => {
    const timestamp = Date.now();
    return `RX-${timestamp}`;
  }, []);

  const addPrescription = useCallback((prescription: Prescription) => {
    dispatch({ type: "ADD_PRESCRIPTION", payload: prescription });
  }, []);

  const addPrescriptions = useCallback((prescriptions: Prescription[]) => {
    dispatch({ type: "ADD_PRESCRIPTIONS", payload: prescriptions });
  }, []);

  const deletePrescription = useCallback(async (prescriptionId: string) => {
    await PrescriptionAPI.delete(prescriptionId);
    dispatch({
      type: "DELETE_PRESCRIPTION",
      payload: prescriptionId,
    });
    toast.success("Prescription deleted");
  }, []);

  /* ===== GETTER FUNCTIONS ===== */

  const getPatientById = useCallback(
    (patientId: string) => {
      return state.patients.find((p) => p.patient_id === patientId);
    },
    [state.patients]
  );

  const getDoctorById = useCallback(
    (doctorId: string) => {
      return state.doctors.find((d) => d.doctor_id === doctorId);
    },
    [state.doctors]
  );

  const getVisitById = useCallback(
    (visitId: string) => {
      return state.visits.find((v) => v.visit_id === visitId);
    },
    [state.visits]
  );

  const getVisitsByPatient = useCallback(
    (patientId: string) => {
      return state.visits.filter((v) => v.patient_id === patientId);
    },
    [state.visits]
  );

  const getVisitsByDoctor = useCallback(
    (doctorName: string) => {
      return state.visits.filter((v) => v.doctor_name === doctorName);
    },
    [state.visits]
  );

  const getPrescriptionsByVisit = useCallback(
    (visitId: string) => {
      return state.prescriptions.filter((p) => p.visit_id === visitId);
    },
    [state.prescriptions]
  );

  // ✅ ADDED
  const getPrescriptionsByDoctor = useCallback(
  (doctorName: string) => {
    return state.prescriptions.filter(
      (p) => p.doctor_name?.toLowerCase() === doctorName.toLowerCase()
    );
  },
  [state.prescriptions]
);

  const getSeverityChange = useCallback(
    (visitId: string): SeverityChange | undefined => {
      const visit = state.visits.find((v) => v.visit_id === visitId);
      if (!visit) return undefined;

      const before =
        (visit as any).severity_before ??
        (visit as any).severityBefore ??
        (visit as any).initial_severity;

      const after =
        (visit as any).severity_after ??
        (visit as any).severityAfter ??
        (visit as any).final_severity;

      if (before == null || after == null) return undefined;

      return {
        visit_id: visitId,
        before,
        after,
      } as unknown as SeverityChange;
    },
    [state.visits]
  );

  /* ===== AUTH ===== */

  const login = useCallback(
    async (userId: string, password: string, portal: "admin" | "doctor") => {
      // ✅ ADMIN = Demo login
      if (
        portal === "admin" &&
        userId === DEMO_CREDENTIALS.admin.user_id &&
        password === DEMO_CREDENTIALS.admin.password
      ) {
        dispatch({
          type: "LOGIN",
          payload: { user_id: userId, role: "admin" },
        });
        return { success: true };
      }

      // ✅ DOCTOR = Real MongoDB login
      if (portal === "doctor") {
        try {
          const response = await fetch(`${API_BASE_URL}/api/doctors/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              password: password,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data?.message || "Invalid credentials",
            };
          }

          dispatch({
            type: "LOGIN",
            payload: {
              user_id: data.doctor.user_id,
              role: "doctor",
              doctor_id: data.doctor.doctor_id,
              doctor_name: data.doctor.doctor_name,
              doctor_speciality: data.doctor.doctor_speciality,
            },
          });

          return { success: true };
        } catch (err) {
          return { success: false, error: "Server error. Please try again." };
        }
      }

      return { success: false, error: "Invalid credentials" };
    },
    []
  );

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  return (
    <HospitalContext.Provider
      value={{
        state,

        addPatient,
        addPatients,
        updatePatient,
        deletePatient,
        generatePatientId,
        isPatientIdUnique,

        addDoctor,
        addDoctors,
        deleteDoctor,
        generateDoctorId,
        isDoctorUserIdUnique,

        addVisit,
        addVisits,
        updateVisit,
        deleteVisit,
        generateVisitId,
        isVisitIdUnique,

        addPrescription,
        addPrescriptions,
        deletePrescription,
        generatePrescriptionId,

        getPatientById,
        getDoctorById,
        getVisitById,
        getVisitsByPatient,
        getVisitsByDoctor,
        getPrescriptionsByVisit,
        getPrescriptionsByDoctor, // ✅ ADDED
        getSeverityChange,

        login,
        logout,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
}

/* =======================
   HOOK
======================= */

export function useHospital() {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error("useHospital must be used inside HospitalProvider");
  }
  return context;
}
