// src/components/visits/PatientSelect.tsx
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import patientService from "@/lib/patientService";
import { Patient } from "@/lib/patientService";
import AddPatientModal from "@/components/patients/AddPatientModal";
import { patientFormToCreate } from "@/lib/patientTransformers";

interface PatientSelectProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PatientSelect({
  value,
  onChange,
  placeholder = "Select or search patient...",
  className,
}: PatientSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchPatients = async () => {
      setLoading(true);
      try {
        const params = search.trim().length >= 2
          ? { search: search.trim(), limit: 30 }
          : { limit: 30 };
        const res = await patientService.getPatients(params);
        if (active) setPatients(res.items ?? []);
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPatients();

    return () => { active = false; };
  }, [search]);

  const selectedPatient = patients.find((p) => String(p.id) === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              !value && "text-muted-foreground",
              className
            )}
          >
            <span className="truncate">
              {selectedPatient ? selectedPatient.full_name : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by name or phone..."
              value={search}
              onValueChange={setSearch}
              className="h-9"
            />
            <CommandList className="max-h-72">
              <CommandEmpty>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  "No patients found"
                )}
              </CommandEmpty>

              <CommandGroup>
                {patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={String(patient.id)}
                    onSelect={() => {
                      onChange(String(patient.id));
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === String(patient.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{patient.full_name}</span>
                      {patient.phone && (
                        <span className="text-xs text-muted-foreground">
                          {patient.phone}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  setAddModalOpen(true);
                }}
                className="border-t py-3 text-primary hover:text-primary/90 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new patient
              </CommandItem>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AddPatientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onAdd={async (formData) => {
          const payload = patientFormToCreate(formData);
          return await patientService.createPatient(payload);
        }}
        onCreated={(newPatient) => {
          setPatients((prev) => [newPatient, ...prev]);
          onChange(String(newPatient.id));
          setSearch(newPatient.full_name);
        }}
      />
    </>
  );
}