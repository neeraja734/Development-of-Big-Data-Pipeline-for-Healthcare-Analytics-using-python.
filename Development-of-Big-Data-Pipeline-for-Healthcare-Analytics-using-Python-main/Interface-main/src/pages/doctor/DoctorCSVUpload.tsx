import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useHospital } from '@/context/HospitalContext';
import { parsePrescriptionCSV, CSVParseResult } from '@/utils/csvParser';
import { Prescription } from '@/types/hospital';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
export default function DoctorCSVUpload() {
  const { state, addPrescriptions, getVisitsByDoctor } = useHospital();
  const { user } = state.auth;
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<CSVParseResult<Prescription> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doctorId = user?.doctor_id || '';
  const doctorVisits = useMemo(() => 
    getVisitsByDoctor(doctorId), 
    [getVisitsByDoctor, doctorId]
  );
  const doctorVisitIds = doctorVisits.map(v => v.visit_id);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const text = await file.text();
      
      const parseResult = parsePrescriptionCSV(
        text,
        state.prescriptions.map(p => p.prescription_id),
        state.visits.map(v => v.visit_id),
        doctorId,
        doctorVisitIds
      );
      setResult(parseResult);
      
      // if (parseResult.valid.length > 0) {
      //   addPrescriptions(parseResult.valid);
      // }

      if (parseResult.valid.length > 0) {
  // 1️⃣ Save to MongoDB
  await fetch(`${API_BASE_URL}/api/prescriptions/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parseResult.valid),
  });

  // 2️⃣ Update UI immediately
  addPrescriptions(parseResult.valid);
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
        <p className="text-muted-foreground mt-1">Import prescriptions from CSV file</p>
      </div>

      <div className="card-healthcare p-6">
        <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground">
            <strong>Note:</strong> You can only upload prescriptions for your own visits. 
            The CSV must contain your doctor_id ({doctorId}) and valid visit_ids from your visits.
          </p>
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
              {isProcessing ? 'Processing...' : 'Drop your prescriptions CSV here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-secondary/50">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Required Columns for Prescriptions CSV
          </h3>
          <code className="text-xs text-muted-foreground">
            prescription_id, visit_id, patient_id, doctor_id, diagnosis_id, diagnosis_description, drug_name, drug_category, dosage, quantity, days_supply, prescribed_date, cost
          </code>
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
                  <div key={idx} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
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
