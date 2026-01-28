import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { parsePatientCSV, parseVisitCSV, CSVParseResult } from '@/utils/csvParser';
import { Patient, Visit } from '@/types/hospital';
import { toast } from 'sonner';
import { PatientAPI, VisitAPI } from '@/config/api';

type UploadType = 'patients' | 'visits';

export default function AdminCSVUpload() {
  const { state, addPatients, addVisits } = useHospital();

  const [uploadType, setUploadType] = useState<UploadType>('patients');
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<CSVParseResult<Patient | Visit> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Helper to split large CSV uploads into smaller chunks
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const text = await file.text();

      if (uploadType === 'patients') {
        const parseResult = parsePatientCSV(
          text,
          state.patients.map((p) => p.patient_id)
        );

        setResult(parseResult);

        if (parseResult.valid.length > 0) {
          const patientChunks = chunkArray(parseResult.valid, 500);

          for (const chunk of patientChunks) {
            await PatientAPI.createBulk(chunk);

            // ✅ THIS updates UI immediately
            console.log('CSV patients added:', chunk);
            addPatients(chunk as Patient[]);
          }
        }
      } else {
        const parseResult = parseVisitCSV(
          text,
          state.visits.map((v) => v.visit_id),
          state.patients.map((p) => p.patient_id),
          state.doctors
        );

        setResult(parseResult);

        const visitChunks = chunkArray(parseResult.valid, 500);

        for (const chunk of visitChunks) {
          await VisitAPI.createBulk(chunk);
        }

        // ✅ THIS updates UI immediately
        console.log('CSV visits:', parseResult.valid);
        addVisits(parseResult.valid as Visit[]);
      }

      toast.success('CSV processed successfully');
    } catch (error) {
      toast.error('Failed to process CSV file');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CSV Upload</h1>
        <p className="text-muted-foreground mt-1">Import data from CSV files</p>
      </div>

      <div className="card-healthcare p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setUploadType('patients');
              setResult(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              uploadType === 'patients'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Patients CSV
          </button>

          <button
            onClick={() => {
              setUploadType('visits');
              setResult(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              uploadType === 'visits'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Visits CSV
          </button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />

          <div className="flex flex-col items-center">
            <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>

            <p className="text-lg font-medium text-foreground mb-2">
              {isProcessing ? 'Processing...' : 'Drop your CSV file here'}
            </p>

            <p className="text-sm text-muted-foreground">or click to browse files</p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-secondary/50">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Required Columns for {uploadType === 'patients' ? 'Patients' : 'Visits'} CSV
          </h3>

          <div className="text-sm text-muted-foreground">
            {uploadType === 'patients' ? (
              <code className="text-xs">
                patient_id, full_name, age, gender, blood_group, phone_number, email, emergency_contact,
                hospital_location, bmi, smoker_status, alcohol_use, chronic_conditions, registration_date,
                insurance_type
              </code>
            ) : (
              <code className="text-xs">
                visit_id, patient_id, doctor_id, visit_date, severity_score, visit_type, length_of_stay,
                lab_result_glucose, lab_result_bp, previous_visit_gap_days, readmitted_within_30_days,
                visit_cost
              </code>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="card-healthcare p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upload Summary</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-foreground">{result.summary.total}</p>
              <p className="text-sm text-muted-foreground">Total Rows</p>
            </div>

            <div className="p-4 rounded-lg bg-success/10 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-2xl font-bold text-success">{result.summary.valid}</p>
              </div>
              <p className="text-sm text-muted-foreground">Valid & Imported</p>
            </div>

            <div className="p-4 rounded-lg bg-destructive/10 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-destructive" />
                <p className="text-2xl font-bold text-destructive">{result.summary.invalid}</p>
              </div>
              <p className="text-sm text-muted-foreground">Invalid & Rejected</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Error Details
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <p className="text-sm">
                      <span className="font-medium text-destructive">Row {error.row}:</span>{' '}
                      <span className="text-foreground">{error.message}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
