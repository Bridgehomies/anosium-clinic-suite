// src/components/visits/DoctorSelect.tsx
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import doctorService from "@/lib/doctorService";
import { Doctor } from "@/lib/doctorService";

/** Resolves doctor name regardless of whether API nests it under user or not */
const getDoctorName = (doctor: Doctor): string =>
  (doctor as any).user?.full_name ?? doctor.full_name ?? "";

interface DoctorSelectProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DoctorSelect({
  value,
  onChange,
  placeholder = "Select doctor...",
  className,
}: DoctorSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  // ✅ Cache the selected doctor so its name persists across fetches
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    let active = true;

    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const params = {
          limit: 50,
          is_active: true,
          search: search.trim() || undefined,
        };
        const res = await doctorService.getDoctors(params);
        if (active) {
          const items = res.items ?? [];
          setDoctors(items);

          // ✅ If we have a selected value, try to find and cache the doctor
          // from the new results (covers initial load with a pre-set value)
          if (value) {
            const found = items.find((d) => String(d.id) === value);
            if (found) setSelectedDoctor(found);
          }
        }
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDoctors();

    return () => { active = false; };
  }, [search]);

  // ✅ Also fetch the specific doctor by ID if value changes and we don't have them cached
  useEffect(() => {
    if (!value) {
      setSelectedDoctor(null);
      return;
    }

    // Already cached and matches current value — no need to fetch
    if (selectedDoctor && String(selectedDoctor.id) === value) return;

    // Check if the doctor is already in the current list
    const found = doctors.find((d) => String(d.id) === value);
    if (found) {
      setSelectedDoctor(found);
      return;
    }

    // Not in list — fetch by ID so the name always appears
    const fetchById = async () => {
      try {
        const doctor = await doctorService.getDoctor(Number(value));
        setSelectedDoctor(doctor ?? null);
      } catch (err) {
        console.error("Failed to load selected doctor:", err);
      }
    };

    fetchById();
  }, [value]);

  const formatDoctorLabel = (doctor: Doctor) => {
    const name = getDoctorName(doctor);
    return `Dr. ${name}${doctor.specialization ? ` - ${doctor.specialization}` : ""}`;
  };

  const displayText = value && selectedDoctor
    ? formatDoctorLabel(selectedDoctor)
    : placeholder;

  return (
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
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or specialization..."
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
                "No doctors found"
              )}
            </CommandEmpty>

            <CommandGroup>
              {doctors.map((doctor) => (
                <CommandItem
                  key={doctor.id}
                  value={String(doctor.id)}
                  onSelect={() => {
                    // ✅ Cache the selected doctor immediately on selection
                    setSelectedDoctor(doctor);
                    onChange(String(doctor.id));
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(doctor.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Dr. {getDoctorName(doctor)}</span>
                    {doctor.specialization && (
                      <span className="text-xs text-muted-foreground">
                        {doctor.specialization}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}